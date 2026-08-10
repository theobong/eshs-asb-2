import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type PurchaseDoc, type FormSubmissionDoc } from "./storage";
import express from 'express';
import { File } from '../shared/mongodb-schema';
import { connectWithRetry as connectDB } from './mongo-utils';
import { requireAdminAuth, handleAdminLogin, handleAdminLogout, checkAdminAuth } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { emailService } from './email-service';
import { paymentService } from './payment-service';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const filename = `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

connectDB().catch(console.error);

const handleError = (res: express.Response, error: unknown) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const populatedEventTitle = (eventRef: unknown): string | undefined => {
  if (eventRef && typeof eventRef === 'object' && 'title' in eventRef) {
    const { title } = eventRef as { title?: unknown };
    return typeof title === 'string' ? title : undefined;
  }
  return undefined;
};

const eventIdString = (eventRef: unknown): string | undefined => {
  if (!eventRef) {
    return undefined;
  }
  if (typeof eventRef === 'object' && '_id' in eventRef) {
    return String((eventRef as { _id: unknown })._id);
  }
  return String(eventRef);
};

interface CartItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export const SALES_TAX_RATE = 0.0875;

const roundToCents = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

class CheckoutError extends Error {}

interface RequestedItem {
  productId?: string;
  quantity?: number;
  size?: string;
}

interface PricedCart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const availableStockFor = (
  product: { category?: string; sizeStock?: { size: string; stock: number }[]; stock?: number | null },
  size?: string
): number => {
  if (product.category === 'Apparel' && product.sizeStock?.length) {
    const entry = product.sizeStock.find(ss => ss.size === size);
    return entry ? entry.stock : 0;
  }
  return product.stock || 0;
};

const priceCartFromDatabase = async (requested: unknown): Promise<PricedCart> => {
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new CheckoutError('Your cart is empty.');
  }

  const items: CartItem[] = [];

  for (const raw of requested as RequestedItem[]) {
    const productId = raw?.productId;
    if (!productId) {
      throw new CheckoutError('A cart item was missing its product id.');
    }

    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new CheckoutError('Cart quantities must be whole numbers of at least 1.');
    }

    const product = await storage.getProduct(productId);
    if (!product) {
      throw new CheckoutError('An item in your cart is no longer available.');
    }

    const size = raw?.size;
    if (product.category === 'Apparel' && product.sizeStock?.length && !size) {
      throw new CheckoutError(`Please choose a size for ${product.name}.`);
    }

    const available = availableStockFor(product, size);
    if (available < quantity) {
      throw new CheckoutError(
        available > 0
          ? `Only ${available} of ${product.name} left in stock.`
          : `${product.name} is out of stock.`
      );
    }

    items.push({
      productId: String(product._id),
      name: product.name,
      quantity,
      price: product.price,
      size
    });
  }

  const subtotal = roundToCents(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const tax = roundToCents(subtotal * SALES_TAX_RATE);
  return { items, subtotal, tax, total: roundToCents(subtotal + tax) };
};

const priceTicketFromSubmission = (submission: FormSubmissionDoc): PricedCart => {
  const quantity = submission.quantity || 1;
  const unitPrice = submission.ticketType?.price ?? (
    submission.totalAmount ? submission.totalAmount / quantity : 0
  );
  const name = submission.ticketType?.name || 'Event Ticket';
  const total = roundToCents(unitPrice * quantity);

  return {
    items: [{ name, quantity, price: roundToCents(unitPrice) }],
    subtotal: total,
    tax: 0,
    total
  };
};

interface PaymentCompletion {
  transactionId?: string;
  paymentDetails?: { last4?: string; brand?: string };
  paymentVerifiedAt?: Date;
  verificationMethod?: 'clover-webhook' | 'clover-api' | 'redirect-unverified';
}

const cartItemsForPurchase = (purchase: PurchaseDoc): CartItem[] => {
  const singleItemCart: CartItem[] = [
    { name: purchase.productName, quantity: purchase.quantity, price: purchase.amount }
  ];

  try {
    const parsed = JSON.parse(purchase.notes || '[]');
    return Array.isArray(parsed) ? parsed as CartItem[] : singleItemCart;
  } catch {
    return singleItemCart;
  }
};

const applyStockDecrementsForCart = async (items: CartItem[]): Promise<void> => {
  for (const item of items) {
    if (!item.productId) {
      console.warn(`Cart item has no productId: ${item.name}`);
      continue;
    }

    const product = await storage.getProduct(item.productId);
    if (!product) {
      console.warn(`Product not found: ${item.productId}`);
      continue;
    }

    if (product.category === 'Apparel' && product.sizeStock && item.size) {
      const sizeEntry = product.sizeStock.find(ss => ss.size === item.size);
      if (!sizeEntry) {
        console.warn(`Size ${item.size} is not stocked for product: ${product.name}`);
        continue;
      }
      const previousStock = sizeEntry.stock;
      sizeEntry.stock = Math.max(0, previousStock - item.quantity);
      await storage.updateProduct(item.productId, { sizeStock: product.sizeStock });
      console.log(`${product.name} (size ${item.size}) stock ${previousStock} -> ${sizeEntry.stock}`);
    } else {
      const previousStock = product.stock || 0;
      const newStock = Math.max(0, previousStock - item.quantity);
      await storage.updateProduct(item.productId, { stock: newStock });
      console.log(`${product.name} stock ${previousStock} -> ${newStock}`);
    }
  }
};

const completePaidPurchase = async (purchase: PurchaseDoc, completion: PaymentCompletion): Promise<void> => {
  await storage.updatePurchase(purchase._id.toString(), {
    status: 'paid',
    ...completion
  });
  console.log(`Purchase ${purchase._id} marked as paid`);

  if (purchase.formSubmissionId) {
    await storage.updateFormSubmission(purchase.formSubmissionId.toString(), {
      status: 'paid',
      purchaseStatus: 'completed',
      paymentDate: new Date(),
      transactionId: completion.transactionId
    });
    console.log(`Form submission ${purchase.formSubmissionId} marked as paid`);
  }

  const items = cartItemsForPurchase(purchase);
  await applyStockDecrementsForCart(items);

  try {
    await emailService.sendPurchaseConfirmation(purchase.studentEmail, {
      orderNumber: purchase._id.toString(),
      items,
      total: purchase.amount,
      paymentMethod: 'card',
      last4: completion.paymentDetails?.last4
    });
    console.log(`Confirmation email sent to ${purchase.studentEmail}`);
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/uploads', express.static(uploadDir));

  app.post("/api/admin/login", handleAdminLogin);
  app.post("/api/admin/logout", handleAdminLogout);
  app.get("/api/admin/check-auth", checkAdminAuth);

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  });

  app.post("/api/users", requireAdminAuth, async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Error creating user", error });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error });
    }
  });

  app.post("/api/products", requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Error creating product", error });
    }
  });

  app.put("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Error updating product", error });
    }
  });

  app.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events", error });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event", error });
    }
  });

  app.post("/api/events", requireAdminAuth, async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Error creating event", error });
    }
  });

  app.put("/api/events/:id", requireAdminAuth, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Error updating event", error });
    }
  });

  app.delete("/api/events/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting event", error });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching videos", error });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Error fetching video", error });
    }
  });

  app.post("/api/videos", requireAdminAuth, async (req, res) => {
    try {
      const video = await storage.createVideo(req.body);
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ message: "Error creating video", error });
    }
  });

  app.put("/api/videos/:id", requireAdminAuth, async (req, res) => {
    try {
      const video = await storage.updateVideo(req.params.id, req.body);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(400).json({ message: "Error updating video", error });
    }
  });

  app.delete("/api/videos/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteVideo(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting video", error });
    }
  });

  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements", error });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
    try {
      const announcement = await storage.getAnnouncement(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcement", error });
    }
  });

  app.post("/api/announcements", requireAdminAuth, async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.status(201).json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Error creating announcement", error });
    }
  });

  app.put("/api/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const announcement = await storage.updateAnnouncement(req.params.id, req.body);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Error updating announcement", error });
    }
  });

  app.delete("/api/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting announcement", error });
    }
  });

  app.get("/api/student-gov-positions", async (req, res) => {
    try {
      const positions = await storage.getStudentGovPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student government positions", error });
    }
  });

  app.get("/api/student-gov-positions/:id", async (req, res) => {
    try {
      const position = await storage.getStudentGovPosition(req.params.id);
      if (!position) {
        return res.status(404).json({ message: "Student government position not found" });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Error fetching student government position", error });
    }
  });

  app.post("/api/student-gov-positions", requireAdminAuth, async (req, res) => {
    try {
      const position = await storage.createStudentGovPosition(req.body);
      res.status(201).json(position);
    } catch (error) {
      console.error("Error creating student government position:", error);
      res.status(400).json({ message: "Error creating student government position", error: errorMessage(error) });
    }
  });

  app.put("/api/student-gov-positions/:id", requireAdminAuth, async (req, res) => {
    try {
      const position = await storage.updateStudentGovPosition(req.params.id, req.body);
      if (!position) {
        return res.status(404).json({ message: "Student government position not found" });
      }
      res.json(position);
    } catch (error) {
      res.status(400).json({ message: "Error updating student government position", error });
    }
  });

  app.delete("/api/student-gov-positions/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteStudentGovPosition(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Student government position not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting student government position", error });
    }
  });

  app.get("/api/clubs", async (req, res) => {
    try {
      const clubs = await storage.getClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clubs", error });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
      const club = await storage.getClub(req.params.id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      res.status(500).json({ message: "Error fetching club", error });
    }
  });

  app.post("/api/clubs", requireAdminAuth, async (req, res) => {
    try {
      const club = await storage.createClub(req.body);
      res.status(201).json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(400).json({ message: "Error creating club", error: errorMessage(error) });
    }
  });

  app.put("/api/clubs/:id", requireAdminAuth, async (req, res) => {
    try {
      const club = await storage.updateClub(req.params.id, req.body);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      res.status(400).json({ message: "Error updating club", error });
    }
  });

  app.delete("/api/clubs/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteClub(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting club", error });
    }
  });

  app.get("/api/form-submissions", requireAdminAuth, async (req, res) => {
    try {
      const submissions = await storage.getFormSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching form submissions", error });
    }
  });

  app.get("/api/form-submissions/:id", async (req, res) => {
    try {
      const submission = await storage.getFormSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Error fetching form submission", error });
    }
  });

  app.post("/api/form-submissions", async (req, res) => {
    try {
      const submission = await storage.createFormSubmission(req.body);

      try {
        const eventId = eventIdString(submission.eventId);
        const event = eventId ? await storage.getEvent(eventId) : null;

        const attachments = [];
        if (submission.forms && submission.forms.length > 0) {
          for (const form of submission.forms) {
            const filePath = path.join(__dirname, '..', form.fileUrl);
            if (fs.existsSync(filePath)) {
              const fileContent = fs.readFileSync(filePath);
              attachments.push({
                filename: form.fileName,
                content: fileContent,
                contentType: form.fileType
              });
            }
          }
        }

        const emailData = {
          eventName: event?.title || 'Unknown Event',
          studentName: submission.studentName,
          email: submission.email,
          submissionDate: submission.submissionDate,
          quantity: submission.quantity || 1,
          totalAmount: submission.totalAmount || 0,
          notes: submission.notes ?? undefined,
          forms: submission.forms,
          ticketType: submission.ticketType
        };

        await emailService.sendFormSubmissionNotification(emailData, attachments);

        await emailService.sendFormSubmissionReceipt(
          submission.email,
          emailData,
          attachments
        );
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }

      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ message: "Error creating form submission", error });
    }
  });

  app.post('/api/form-submissions/upload', upload.array('forms'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      const fileDetails = files.map(file => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype
      }));

      res.status(201).json(fileDetails);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/form-submissions/:id", requireAdminAuth, async (req, res) => {
    try {
      const originalSubmission = await storage.getFormSubmission(req.params.id);

      const submission = await storage.updateFormSubmission(req.params.id, req.body);
      if (!submission) {
        return res.status(404).json({ message: "Form submission not found" });
      }

      if (originalSubmission?.status === 'pending' && (submission.status === 'approved' || submission.status === 'rejected')) {
        const eventName = populatedEventTitle(submission.eventId) || 'Unknown Event';

        try {
          if (submission.status === 'approved') {
            await emailService.sendApprovalNotification(submission.email, {
              eventName,
              studentName: submission.studentName,
              ticketPurchaseUrl: `https://eshsasb.org/checkout/${submission._id}`,
              quantity: submission.quantity || 1,
              totalAmount: submission.totalAmount || 0,
              ticketType: submission.ticketType
            });
          } else {
            const reason = req.body.rejectionReason || 'Your request did not meet the requirements. Please review the guidelines and try again.';
            await emailService.sendRejectionNotification(submission.email, {
              eventName,
              studentName: submission.studentName,
              reason: reason,
              retryUrl: `https://eshsasb.org/activities/details/${eventIdString(submission.eventId) || ''}`
            });
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
        }
      }

      res.json(submission);
    } catch (error) {
      res.status(400).json({ message: "Error updating form submission", error });
    }
  });

  app.delete("/api/form-submissions/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deleteFormSubmission(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting form submission", error });
    }
  });

  app.post("/api/payment/create-intent", async (req, res) => {
    try {
      const {
        items,
        customerEmail,
        customerName,
        phone,
        submissionId,
        deliveryMethod,
        deliveryDetails
      } = req.body;

      if (!customerEmail || !customerName) {
        return res.status(400).json({ message: "Name and email are required." });
      }

      let submission: FormSubmissionDoc | null = null;
      let priced: PricedCart;

      if (submissionId) {
        submission = await storage.getFormSubmission(submissionId);
        if (!submission) {
          return res.status(404).json({ message: "Submission not found" });
        }
        if (submission.status !== 'approved') {
          return res.status(400).json({ message: "This request is not approved for purchase." });
        }
        priced = priceTicketFromSubmission(submission);
      } else {
        priced = await priceCartFromDatabase(items);
      }

      if (priced.total <= 0) {
        return res.status(400).json({ message: "This order has no payable amount." });
      }

      const purchase = await storage.createPurchase({
        studentName: customerName,
        studentEmail: customerEmail,
        phone,
        productName: priced.items.map(item => item.name).join(', '),
        quantity: priced.items.reduce((sum, item) => sum + item.quantity, 0),
        amount: priced.total,
        status: 'pending',
        paymentMethod: 'card',
        deliveryMethod: deliveryMethod === 'delivery' ? 'delivery' : 'pickup',
        deliveryDetails: deliveryMethod === 'delivery' ? deliveryDetails : undefined,
        formSubmissionId: submission ? submission._id : undefined,
        notes: JSON.stringify(priced.items)
      });

      try {
        const paymentIntent = await paymentService.createPaymentIntent({
          amount: priced.total,
          lineItems: priced.items.map(item => ({
            name: item.name,
            unitPrice: item.price,
            quantity: item.quantity
          })),
          metadata: { customerEmail, customerName, submissionId }
        });

        await storage.updatePurchase(purchase._id.toString(), {
          cloverOrderId: paymentIntent.orderId,
          cloverSessionId: paymentIntent.sessionId
        });

        if (submission) {
          await storage.updateFormSubmission(submission._id.toString(), { purchaseStatus: 'pending' });
        }

        res.json({
          purchaseId: purchase._id.toString(),
          orderId: paymentIntent.orderId,
          sessionId: paymentIntent.sessionId,
          checkoutUrl: paymentIntent.checkoutUrl,
          subtotal: priced.subtotal,
          tax: priced.tax,
          amount: priced.total,
          items: priced.items
        });
      } catch (cloverError) {
        await storage.deletePurchase(purchase._id.toString());
        throw cloverError;
      }
    } catch (error) {
      if (error instanceof CheckoutError) {
        return res.status(400).json({ message: error.message });
      }
      console.error('Failed to create payment intent:', error);
      res.status(500).json({ message: "Failed to start checkout. Please try again." });
    }
  });

  app.post("/api/payment/process", async (req, res) => {
    try {
      const { paymentToken, orderId, purchaseData } = req.body;

      const paymentResult = await paymentService.processPayment(paymentToken, orderId);

      if (paymentResult.success) {
        const purchase = await storage.createPurchase({
          ...purchaseData,
          status: 'paid',
          transactionId: paymentResult.transactionId,
          cloverOrderId: orderId,
          paymentDetails: {
            last4: paymentResult.last4,
            brand: paymentResult.paymentMethod
          }
        });

        await emailService.sendPurchaseConfirmation(purchaseData.studentEmail, {
          orderNumber: purchase._id.toString(),
          items: purchaseData.items,
          total: purchaseData.amount,
          paymentMethod: paymentResult.paymentMethod,
          last4: paymentResult.last4
        });

        res.json({ success: true, purchase, payment: paymentResult });
      } else {
        res.status(400).json({ success: false, message: "Payment failed" });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ message: "Payment processing failed", error });
    }
  });

  app.get("/api/payment/status/:orderId", async (req, res) => {
    try {
      const status = await paymentService.getPaymentStatus(req.params.orderId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get payment status", error });
    }
  });

  app.post("/api/webhooks/clover", express.raw({ type: 'application/json' }), async (req, res) => {
    const startTime = Date.now();

    try {
      const signature = req.get('X-Clover-Signature') || req.get('Clover-Signature') || '';
      const payload = req.body.toString();

      if (!paymentService.verifyWebhookSignature(payload, signature)) {
        console.error('Rejected Clover webhook with an invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const webhookData = JSON.parse(payload);
      const { type, eventType, objectId, data } = webhookData;

      const event = type || eventType;
      const orderId = objectId || data?.orderId || data?.id;

      if (event === 'ORDER_PAYMENT_CREATED' || event === 'PAYMENT_CREATED' || event === 'order.payment_created') {
        if (orderId) {
          const purchase = await storage.getPurchaseByCloverOrderId(orderId)
            || await storage.getPurchaseByCloverSessionId(orderId);

          if (purchase) {
            await completePaidPurchase(purchase, {
              transactionId: data?.payment?.id || data?.id,
              verificationMethod: 'clover-webhook',
              paymentDetails: {
                last4: data?.payment?.cardTransaction?.last4 || data?.source?.last4,
                brand: data?.payment?.cardTransaction?.cardType || data?.source?.brand || 'card'
              }
            });
          } else {
            console.warn(`No purchase found for Clover order ID: ${orderId}`);
          }
        } else {
          console.warn('Clover webhook contained no order ID');
        }
      }

      const totalTime = Date.now() - startTime;
      res.status(200).json({ received: true, processedAt: new Date().toISOString(), processingTimeMs: totalTime });
    } catch (error) {
      console.error(`Clover webhook processing failed after ${Date.now() - startTime}ms:`, error);
      res.status(500).json({ message: "Webhook processing failed", error: errorMessage(error) });
    }
  });

  app.get("/api/purchases", requireAdminAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching purchases", error });
    }
  });

  app.post("/api/purchases/sync-status", requireAdminAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      const pendingPurchases = purchases.filter(p => p.status === 'pending');

      if (pendingPurchases.length === 0) {
        return res.json({ message: "No pending orders to sync", updated: 0 });
      }

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let abandonedCount = 0;
      let recentCount = 0;

      for (const purchase of pendingPurchases) {
        const orderDate = new Date(purchase.date);
        if (orderDate < oneDayAgo) {
          console.log(`Order ${purchase._id} has been pending for over 24 hours and may be abandoned`);
          abandonedCount++;
        } else {
          recentCount++;
        }
      }

      const message = recentCount > 0
        ? `Found ${recentCount} recent pending orders (likely awaiting payment) and ${abandonedCount} orders over 24 hours old (possibly abandoned). Hosted Checkout relies on webhooks for automatic status updates.`
        : `Found ${abandonedCount} orders over 24 hours old that may be abandoned.`;

      res.json({
        message,
        pending_recent: recentCount,
        pending_old: abandonedCount,
        updated: 0,
        note: "Hosted Checkout orders are updated via webhooks. Manual status checking is limited."
      });
    } catch (error) {
      console.error('Failed to sync order statuses:', error);
      res.status(500).json({ message: "Error syncing order statuses", error });
    }
  });

  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const purchase = await storage.getPurchase(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Error fetching purchase", error });
    }
  });

  app.post("/api/purchases", requireAdminAuth, async (req, res) => {
    try {
      const purchase = await storage.createPurchase(req.body);
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ message: "Error creating purchase", error });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { sessionId, checkoutId } = req.body;
      const lookupId = sessionId || checkoutId;

      if (!lookupId) {
        return res.status(400).json({ message: "A Clover checkout session id is required." });
      }

      const purchase = await storage.getPurchaseByCloverSessionId(lookupId)
        || await storage.getPurchaseByCloverOrderId(lookupId);

      if (!purchase) {
        console.warn('Payment verification found no purchase for the supplied Clover session id');
        return res.status(404).json({ message: "Purchase not found" });
      }

      if (purchase.status === 'paid') {
        return res.json({
          success: true,
          confirmed: true,
          status: 'paid',
          purchaseId: purchase._id.toString(),
          amount: purchase.amount,
          message: 'Payment already confirmed'
        });
      }

      const verification = await paymentService.verifyOrderPayment(
        purchase.cloverOrderId || '',
        purchase.amount
      );

      if (verification.checked && !verification.paid) {
        console.warn(`Refusing to mark purchase ${purchase._id} paid: ${verification.reason}`);
        return res.status(402).json({
          success: false,
          confirmed: false,
          status: purchase.status,
          message: 'We could not confirm this payment with Clover.'
        });
      }

      if (!verification.checked) {
        console.warn(
          `Marking purchase ${purchase._id} paid without Clover confirmation (${verification.reason}). ` +
          'Recorded as unverified for admin review.'
        );
      }

      await completePaidPurchase(purchase, {
        paymentVerifiedAt: new Date(),
        verificationMethod: verification.checked ? 'clover-api' : 'redirect-unverified'
      });

      res.json({
        success: true,
        confirmed: verification.checked,
        status: 'paid',
        purchaseId: purchase._id.toString(),
        amount: purchase.amount,
        message: verification.checked
          ? 'Payment confirmed with Clover'
          : 'Payment recorded, pending confirmation'
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({ message: "Payment verification failed" });
    }
  });

  app.put("/api/purchases/:id", requireAdminAuth, async (req, res) => {
    try {
      const purchase = await storage.updatePurchase(req.params.id, req.body);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(400).json({ message: "Error updating purchase", error });
    }
  });

  app.delete("/api/purchases/:id", requireAdminAuth, async (req, res) => {
    try {
      const success = await storage.deletePurchase(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting purchase", error });
    }
  });

  app.get("/api/upload-test", (req, res) => {
    res.json({ message: "Upload endpoint is accessible", timestamp: new Date().toISOString() });
  });

  app.post("/api/upload", (req, res, next) => {
    req.setTimeout(60000, () => {
      if (!res.headersSent) {
        res.status(408).json({ message: "Upload timed out" });
      }
    });

    next();
  }, requireAdminAuth, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            message: "File too large",
            maxSize: "50MB",
            error: err.message
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            message: "Unexpected file field",
            error: err.message
          });
        }
        return res.status(400).json({
          message: "Upload error",
          error: err.message
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { originalname, mimetype, size, filename, path: filePath } = req.file;

      const file = new File({
        filename,
        originalName: originalname,
        mimeType: mimetype,
        size,
        data: filePath
      });

      const savedFile = await file.save();

      res.json({
        id: savedFile._id,
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        url: `/api/files/${savedFile._id}`,
        uploadedAt: savedFile.uploadedAt
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: "Error uploading file", error: errorMessage(error) });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await File.findById(req.params.id);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const filePath = file.data;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Physical file not found" });
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`
      });

      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ message: "Error serving file", error: errorMessage(error) });
    }
  });

  app.delete("/api/files/:id", requireAdminAuth, async (req, res) => {
    try {
      const file = await File.findByIdAndDelete(req.params.id);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ message: "Error deleting file", error: errorMessage(error) });
    }
  });

  app.post("/api/debug-status-email", requireAdminAuth, async (req, res) => {
    try {
      const { to, status, eventName = 'Debug Test Event', studentName = 'Debug Student' } = req.body;

      if (!to) {
        return res.status(400).json({ message: "Email address is required" });
      }

      if (status === 'approved') {
        await emailService.sendApprovalNotification(to, {
          eventName,
          studentName,
          ticketPurchaseUrl: 'https://eshsasb.org/checkout/debug-test',
          quantity: 1,
          totalAmount: 25.00,
          ticketType: {
            name: 'Debug Ticket',
            price: 25.00,
            description: 'Test ticket for debugging'
          }
        });
      } else if (status === 'rejected') {
        await emailService.sendRejectionNotification(to, {
          eventName,
          studentName,
          reason: 'This is a debug test rejection.',
          retryUrl: 'https://eshsasb.org/activities/details/debug-test'
        });
      } else {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      res.json({ message: `Debug ${status} email sent successfully to ${to}` });
    } catch (error) {
      console.error('Debug email test error:', error);
      res.status(500).json({ message: "Error sending debug email", error: errorMessage(error) });
    }
  });

  app.post("/api/test-email", requireAdminAuth, async (req, res) => {
    try {
      const { to, type = 'test' } = req.body;

      if (!to) {
        return res.status(400).json({ message: "Email address is required" });
      }

      switch (type) {
        case 'test':
          await emailService.sendTestEmail(to);
          break;
        case 'approval':
          await emailService.sendApprovalNotification(to, {
            eventName: 'Test Event - Winter Formal',
            studentName: 'Test Student',
            ticketPurchaseUrl: 'https://eshsasb.org/checkout/test-submission-id-123',
            quantity: 2,
            totalAmount: 50.00,
            ticketType: {
              name: 'VIP Ticket',
              price: 25.00,
              description: 'Includes dinner and VIP seating'
            }
          });
          break;
        case 'rejection':
          await emailService.sendRejectionNotification(to, {
            eventName: 'Test Event - Winter Formal',
            studentName: 'Test Student',
            reason: 'Missing required parent signature on permission form. Please ensure all forms are completely filled out and signed before resubmitting.',
            retryUrl: 'https://eshsasb.org/activities/details/test-event-id'
          });
          break;
        case 'submission':
          await emailService.sendFormSubmissionNotification({
            eventName: 'Test Event',
            studentName: 'Test Student',
            email: to,
            submissionDate: new Date(),
            quantity: 1,
            totalAmount: 10.00,
            notes: 'This is a test submission notification.',
            forms: [{ fileName: 'test-form.pdf', fileUrl: '/test', fileType: 'application/pdf' }],
            ticketType: {
              name: 'General Admission',
              price: 10.00,
              description: 'Standard event access'
            }
          });
          break;
        case 'receipt':
          await emailService.sendFormSubmissionReceipt(to, {
            eventName: 'Test Event',
            studentName: 'Test Student',
            email: to,
            submissionDate: new Date(),
            quantity: 1,
            totalAmount: 10.00,
            notes: 'This is a test receipt email.',
            forms: [{ fileName: 'test-form.pdf', fileUrl: '/test', fileType: 'application/pdf' }],
            ticketType: {
              name: 'General Admission',
              price: 10.00,
              description: 'Standard event access'
            }
          });
          break;
        default:
          return res.status(400).json({ message: "Invalid email type" });
      }

      res.json({ message: `${type} email sent successfully to ${to}` });
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ message: "Error sending test email", error: errorMessage(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
