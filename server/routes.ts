import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from 'express';
import {
  User, Product, Event, VideoPost, Announcement,
  StudentGovPosition, Club, FormSubmission, Purchase, File
} from '../shared/mongodb-schema';
import { connectWithRetry as connectDB } from './mongo-utils';
import { requireAdminAuth, handleAdminLogin, handleAdminLogout, checkAdminAuth } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { emailService } from './email-service';
import { paymentService } from './payment-service';

// Ensure upload directory exists
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for disk storage
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
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

// Create router
export const router = express.Router();

// Connect to MongoDB
connectDB().catch(console.error);

// General error handler
const handleError = (res: express.Response, error: any) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Authentication routes
  app.post("/api/admin/login", handleAdminLogin);
  app.post("/api/admin/logout", handleAdminLogout);
  app.get("/api/admin/check-auth", checkAdminAuth);

  // User routes
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

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Error creating user", error });
    }
  });

  // Product routes
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

  // Event routes
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

  // Video routes
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

  // Announcement routes
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

  // Student Government Position routes
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
      res.status(400).json({ message: "Error creating student government position", error: error.message || error });
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

  // Club routes
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
      res.status(400).json({ message: "Error creating club", error: error.message || error });
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



  // Form Submission routes
  app.get("/api/form-submissions", async (req, res) => {
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
      
      // Send email notification to admin
      try {
        // Get event details
        const event = await storage.getEvent(submission.eventId.toString());
        
        // Prepare attachments if forms are included
        const attachments = [];
        if (submission.forms && submission.forms.length > 0) {
          for (const form of submission.forms) {
            // Read file from disk if it exists
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
        
        // Prepare email data
        const emailData = {
          eventName: event?.title || 'Unknown Event',
          studentName: submission.studentName,
          email: submission.email,
          submissionDate: submission.submissionDate,
          quantity: submission.quantity || 1,
          totalAmount: submission.totalAmount || 0,
          notes: submission.notes,
          forms: submission.forms,
          ticketType: submission.ticketType
        };
        
        // Send notification to admin
        await emailService.sendFormSubmissionNotification(emailData, attachments);
        
        // Send receipt to student with the same attachments
        await emailService.sendFormSubmissionReceipt(
          submission.email,
          emailData,
          attachments
        );
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ message: "Error creating form submission", error });
    }
  });

  app.post('/api/form-submissions/upload', upload.array('forms'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Create file URLs
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
      // Get the original submission to check status change
      const originalSubmission = await storage.getFormSubmission(req.params.id);
      
      const submission = await storage.updateFormSubmission(req.params.id, req.body);
      if (!submission) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      
      // Send email if status changed from pending to approved/rejected
      console.log(`Status change check: original="${originalSubmission?.status}" new="${submission.status}"`);
      console.log(`Condition check: original pending? ${originalSubmission?.status === 'pending'}, new not pending? ${submission.status !== 'pending'}`);
      
      // Check if status changed from pending to approved or rejected
      if (originalSubmission?.status === 'pending' && (submission.status === 'approved' || submission.status === 'rejected')) {
        console.log(`Sending status update email to ${submission.email} for ${submission.status} status`);
        try {
          // Event is already populated by the storage layer
          const event = submission.eventId;
          console.log(`Using populated event: ${event?.title}`);
          
          if (submission.status === 'approved') {
            // Send approval email
            console.log('Sending approval email...');
            await emailService.sendApprovalNotification(submission.email, {
              eventName: event?.title || 'Unknown Event',
              studentName: submission.studentName,
              ticketPurchaseUrl: `https://eshsasb.org/checkout/${submission._id}`, // Placeholder checkout URL with submission ID
              quantity: submission.quantity || 1,
              totalAmount: submission.totalAmount || 0,
              ticketType: submission.ticketType
            });
            console.log('Approval email sent successfully');
          } else if (submission.status === 'rejected') {
            // Send rejection email
            console.log('Sending rejection email...');
            const reason = req.body.rejectionReason || 'Your request did not meet the requirements. Please review the guidelines and try again.';
            await emailService.sendRejectionNotification(submission.email, {
              eventName: event?.title || 'Unknown Event',
              studentName: submission.studentName,
              reason: reason,
              retryUrl: `https://eshsasb.org/activities/details/${submission.eventId}` // Link back to event details page
            });
            console.log('Rejection email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't fail the request if email fails
        }
      } else {
        console.log('No email sent - status change condition not met');
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

  // Payment routes
  app.post("/api/payment/create-intent", async (req, res) => {
    try {
      const { amount, items, customerEmail, customerName, submissionId } = req.body;

      const paymentIntent = await paymentService.createPaymentIntent({
        amount,
        metadata: {
          customerEmail,
          customerName,
          items: JSON.stringify(items),
          submissionId // For ticket purchases - used in redirect URL
        }
      });

      res.json(paymentIntent);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      res.status(500).json({ message: "Failed to create payment intent", error });
    }
  });

  app.post("/api/payment/process", async (req, res) => {
    try {
      const { paymentToken, orderId, purchaseData } = req.body;
      
      // Process the payment
      const paymentResult = await paymentService.processPayment(paymentToken, orderId);
      
      if (paymentResult.success) {
        // Create purchase record
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
        
        // Send confirmation email
        await emailService.sendPurchaseConfirmation(purchaseData.studentEmail, {
          orderNumber: purchase._id,
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

  // Clover Hosted Checkout webhook endpoint
  app.post("/api/webhooks/clover", express.raw({ type: 'application/json' }), async (req, res) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log incoming webhook details
    console.log(`\n🔔 [${timestamp}] Clover Webhook Received`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Get the signature from headers
      const signature = req.get('X-Clover-Signature') || req.get('Clover-Signature') || '';
      const payload = req.body.toString();
      
      console.log(`🔐 Signature provided: ${signature ? 'Yes' : 'No'}`);
      console.log(`📦 Payload size: ${payload.length} bytes`);
      
      // Verify webhook signature for security
      if (!paymentService.verifyWebhookSignature(payload, signature)) {
        console.error('❌ Invalid webhook signature');
        console.error(`   Expected signature format: sha256=<hash>`);
        console.error(`   Received signature: ${signature}`);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Signature verified successfully');
      
      const webhookData = JSON.parse(payload);
      console.log('📋 Webhook Data:');
      console.log(JSON.stringify(webhookData, null, 2));
      
      const { type, eventType, objectId, data } = webhookData;

      // Handle different webhook event types
      const event = type || eventType;
      const orderId = objectId || data?.orderId || data?.id;
      
      console.log(`🏷️  Event Type: ${event}`);
      console.log(`🆔 Order ID: ${orderId}`);

      if (event === 'ORDER_PAYMENT_CREATED' || event === 'PAYMENT_CREATED' || event === 'order.payment_created') {
        console.log(`\n💳 Processing payment event for order: ${orderId}`);
        
        if (orderId) {
          // Get the purchase record by Clover order ID or session ID
          console.log(`🔍 Looking up purchase record...`);
          let purchase = await storage.getPurchaseByCloverOrderId(orderId);
          let lookupMethod = 'cloverOrderId';
          
          // If not found by order ID, try session ID (webhook might use session ID)
          if (!purchase) {
            console.log(`   Not found by cloverOrderId, trying cloverSessionId...`);
            purchase = await storage.getPurchaseByCloverSessionId(orderId);
            lookupMethod = 'cloverSessionId';
          }
          
          if (purchase) {
            console.log(`✅ Purchase found via ${lookupMethod}: ${purchase._id}`);
            console.log(`   Customer: ${purchase.studentName} (${purchase.studentEmail})`);
            console.log(`   Amount: $${purchase.amount}`);
            console.log(`   Current Status: ${purchase.status}`);
            
            // Extract payment details
            const transactionId = data?.payment?.id || data?.id;
            const last4 = data?.payment?.cardTransaction?.last4 || data?.source?.last4;
            const brand = data?.payment?.cardTransaction?.cardType || data?.source?.brand || 'card';
            
            console.log(`💳 Payment Details:`);
            console.log(`   Transaction ID: ${transactionId}`);
            console.log(`   Card Last 4: ${last4}`);
            console.log(`   Card Brand: ${brand}`);
            
            // Update purchase status to paid
            await storage.updatePurchase(purchase._id, {
              status: 'paid',
              transactionId: transactionId,
              paymentDetails: {
                last4: last4,
                brand: brand
              }
            });
            
            console.log(`✅ Updated purchase status to 'paid'`);
            
            // If this purchase is for a form submission (activity ticket), update the submission
            if (purchase.formSubmissionId) {
              console.log(`🎟️  Updating form submission status for ticket purchase...`);
              await storage.updateFormSubmission(purchase.formSubmissionId, {
                status: 'paid',
                purchaseStatus: 'completed',
                paymentDate: new Date(),
                transactionId: transactionId
              });
              console.log(`✅ Form submission marked as paid`);
            }

            // Parse cart items from notes
            let items = [];
            try {
              items = JSON.parse(purchase.notes || '[]');
              console.log(`📦 Found ${items.length} items in cart`);
            } catch (e) {
              items = [{ name: purchase.productName, quantity: purchase.quantity, price: purchase.amount }];
              console.log(`⚠️  Fallback to single item: ${purchase.productName}`);
            }

            // Update product stock for each item
            console.log(`\n🏪 Updating product stock...`);
            for (const item of items) {
              if (item.productId) {
                console.log(`   Processing item: ${item.name} (ID: ${item.productId})`);
                const product = await storage.getProduct(item.productId);
                if (product) {
                  if (product.category === 'Apparel' && product.sizeStock && item.size) {
                    // Update size-specific stock
                    const oldStock = product.sizeStock.find(ss => ss.size === item.size)?.stock || 0;
                    const updatedSizeStock = product.sizeStock.map(ss => 
                      ss.size === item.size 
                        ? { ...ss, stock: Math.max(0, ss.stock - item.quantity) }
                        : ss
                    );
                    await storage.updateProduct(item.productId, { sizeStock: updatedSizeStock });
                    const newStock = updatedSizeStock.find(ss => ss.size === item.size)?.stock || 0;
                    console.log(`   📦 ${product.name} (Size ${item.size}): ${oldStock} → ${newStock}`);
                  } else {
                    // Update general stock
                    const oldStock = product.stock || 0;
                    const newStock = Math.max(0, oldStock - item.quantity);
                    await storage.updateProduct(item.productId, { stock: newStock });
                    console.log(`   📦 ${product.name}: ${oldStock} → ${newStock}`);
                  }
                } else {
                  console.warn(`   ⚠️  Product not found: ${item.productId}`);
                }
              } else {
                console.warn(`   ⚠️  Item has no productId: ${item.name}`);
              }
            }

            // Send confirmation email
            console.log(`\n📧 Sending confirmation email to ${purchase.studentEmail}...`);
            try {
              await emailService.sendPurchaseConfirmation(purchase.studentEmail, {
                orderNumber: purchase._id,
                items: items,
                total: purchase.amount,
                paymentMethod: 'card',
                last4: last4
              });
              console.log(`✅ Confirmation email sent successfully`);
            } catch (emailError) {
              console.error(`❌ Failed to send confirmation email:`, emailError);
            }

            const processingTime = Date.now() - startTime;
            console.log(`\n🎉 Payment processing completed successfully!`);
            console.log(`   Order: ${orderId}`);
            console.log(`   Purchase: ${purchase._id}`);
            console.log(`   Processing Time: ${processingTime}ms`);
          } else {
            console.warn(`⚠️  No purchase found for order ID: ${orderId}`);
            console.log(`   Searched by cloverOrderId and cloverSessionId`);
            
            // Log all pending purchases for debugging
            const pendingPurchases = await storage.getPurchases();
            const pending = pendingPurchases.filter(p => p.status === 'pending');
            console.log(`\n🔍 Debug: Found ${pending.length} pending purchases:`);
            pending.forEach(p => {
              console.log(`   - ${p._id}: cloverOrderId=${p.cloverOrderId}, cloverSessionId=${p.cloverSessionId}`);
            });
          }
        } else {
          console.warn(`⚠️  No order ID found in webhook data`);
        }
      } else {
        console.log(`ℹ️  Ignoring event type: ${event}`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`\n⏱️  Total webhook processing time: ${totalTime}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      res.status(200).json({ received: true, processedAt: new Date().toISOString(), processingTimeMs: totalTime });
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ Webhook processing failed after ${errorTime}ms:`, error);
      console.error(`   Error Type: ${error.name}`);
      console.error(`   Error Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack Trace:`, error.stack);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      res.status(500).json({ message: "Webhook processing failed", error: error.message });
    }
  });

  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching purchases", error });
    }
  });

  // Sync order statuses with Clover (limited functionality with Hosted Checkout)
  app.post("/api/purchases/sync-status", requireAdminAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      const pendingPurchases = purchases.filter(p => p.status === 'pending');
      
      if (pendingPurchases.length === 0) {
        return res.json({ message: "No pending orders to sync", updated: 0 });
      }

      // With Hosted Checkout, we can't directly query individual orders
      // Instead, we'll check if orders are older than 24 hours and likely abandoned
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let abandonedCount = 0;
      let recentCount = 0;

      for (const purchase of pendingPurchases) {
        const orderDate = new Date(purchase.date);
        if (orderDate < oneDayAgo) {
          // Mark old pending orders as potentially abandoned
          // Don't change status automatically, just log for admin review
          console.log(`⚠️ Order ${purchase._id} has been pending for over 24 hours - may be abandoned`);
          abandonedCount++;
        } else {
          recentCount++;
        }
      }

      // For Hosted Checkout, the primary way to get payment status is through webhooks
      // This endpoint mainly serves to identify potentially abandoned orders
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

  app.post("/api/purchases", async (req, res) => {
    try {
      const purchase = await storage.createPurchase(req.body);
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ message: "Error creating purchase", error });
    }
  });

  // Ticket purchase endpoint for approved activity tickets
  app.post("/api/ticket-purchase", async (req, res) => {
    try {
      const { submissionId, ...purchaseData } = req.body;
      
      // Verify submission exists and is approved
      const submission = await storage.getFormSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      if (submission.status !== 'approved') {
        return res.status(400).json({ message: "Submission is not approved for purchase" });
      }
      
      // Create purchase record
      const purchase = await storage.createPurchase({
        ...purchaseData,
        formSubmissionId: submissionId
      });
      
      // Update submission to indicate purchase is pending
      await storage.updateFormSubmission(submissionId, {
        purchaseStatus: 'pending',
        purchaseId: purchase._id
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error('Error creating ticket purchase:', error);
      res.status(400).json({ message: "Error creating ticket purchase", error });
    }
  });

  // Payment verification endpoint - called when user returns from Clover checkout
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { sessionId, checkoutId, submissionId, purchaseId } = req.body;
      const lookupId = sessionId || checkoutId;

      console.log(`\n🔍 Payment verification request:`);
      console.log(`   Session/Checkout ID: ${lookupId || 'N/A'}`);
      console.log(`   Submission ID: ${submissionId || 'N/A'}`);
      console.log(`   Purchase ID: ${purchaseId || 'N/A'}`);

      if (!lookupId && !submissionId && !purchaseId) {
        return res.status(400).json({ message: "Missing session ID, submission ID, or purchase ID" });
      }

      let purchase = null;

      // Try to find purchase by direct purchase ID first (most reliable)
      if (purchaseId) {
        purchase = await storage.getPurchase(purchaseId);
      }

      // Try to find purchase by session ID
      if (!purchase && lookupId) {
        purchase = await storage.getPurchaseByCloverSessionId(lookupId);
        if (!purchase) {
          purchase = await storage.getPurchaseByCloverOrderId(lookupId);
        }
      }

      // If not found and we have submissionId, look up by form submission
      if (!purchase && submissionId) {
        const purchases = await storage.getPurchases();
        purchase = purchases.find((p: any) => p.formSubmissionId?.toString() === submissionId);
      }

      if (!purchase) {
        console.log(`   ⚠️ No purchase found`);
        return res.status(404).json({ message: "Purchase not found" });
      }

      console.log(`   ✅ Found purchase: ${purchase._id}`);
      console.log(`   Current status: ${purchase.status}`);

      // If already paid, return success
      if (purchase.status === 'paid') {
        console.log(`   Already marked as paid`);
        return res.json({
          success: true,
          status: 'paid',
          purchase: purchase,
          message: 'Payment already verified'
        });
      }

      // Since user returned to success URL, assume payment was successful
      // (Clover only redirects to success URL on successful payment)
      console.log(`   Marking purchase as paid (user returned to success URL)`);

      // Update purchase status to paid
      await storage.updatePurchase(purchase._id, {
        status: 'paid',
        paymentVerifiedAt: new Date()
      });

      // If this is a ticket purchase, update the form submission
      if (purchase.formSubmissionId) {
        console.log(`   Updating form submission: ${purchase.formSubmissionId}`);
        await storage.updateFormSubmission(purchase.formSubmissionId, {
          status: 'paid',
          purchaseStatus: 'completed',
          paymentDate: new Date()
        });
      }

      // Parse cart items for stock update
      let items = [];
      try {
        items = JSON.parse(purchase.notes || '[]');
      } catch (e) {
        items = [{ name: purchase.productName, quantity: purchase.quantity, price: purchase.amount }];
      }

      // Update product stock for each item
      for (const item of items) {
        if (item.productId) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            if (product.category === 'Apparel' && product.sizeStock && item.size) {
              const updatedSizeStock = product.sizeStock.map((ss: any) =>
                ss.size === item.size
                  ? { ...ss, stock: Math.max(0, ss.stock - item.quantity) }
                  : ss
              );
              await storage.updateProduct(item.productId, { sizeStock: updatedSizeStock });
            } else {
              const newStock = Math.max(0, (product.stock || 0) - item.quantity);
              await storage.updateProduct(item.productId, { stock: newStock });
            }
          }
        }
      }

      // Send confirmation email
      try {
        await emailService.sendPurchaseConfirmation(purchase.studentEmail, {
          orderNumber: purchase._id,
          items: items,
          total: purchase.amount,
          paymentMethod: 'card'
        });
        console.log(`   ✅ Confirmation email sent`);
      } catch (emailError) {
        console.error(`   ⚠️ Failed to send confirmation email:`, emailError);
      }

      console.log(`   ✅ Payment verification complete`);

      res.json({
        success: true,
        status: 'paid',
        purchase: purchase,
        message: 'Payment verified successfully'
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({ message: "Payment verification failed", error });
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

  // File upload endpoints
  // Simple test endpoint to verify upload route is working
  app.get("/api/upload-test", (req, res) => {
    res.json({ message: "Upload endpoint is accessible", timestamp: new Date().toISOString() });
  });

  app.post("/api/upload", (req, res, next) => {
    console.log('Upload request headers:', req.headers);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    // Set a timeout for the upload request
    req.setTimeout(60000, () => {
      console.log('Upload request timed out');
      if (!res.headersSent) {
        res.status(408).json({ message: "Upload timed out" });
      }
    });
    
    next();
  }, requireAdminAuth, (req, res, next) => {
    console.log('Auth check passed, proceeding to multer');
    next();
  }, (req, res, next) => {
    console.log('About to call multer');
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
      console.log('Multer completed successfully');
      next();
    });
  }, async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('Body size:', JSON.stringify(req.body).length);
      
      if (!req.file) {
        console.log('No file in request');
        console.log('Request files:', req.files);
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { originalname, mimetype, size, filename, path: filePath } = req.file;
      console.log(`Processing file: ${originalname}, size: ${size}, type: ${mimetype}, saved as: ${filename}`);
      
      console.log('Saving metadata to database...');
      // Save file metadata to database (not the file data itself)
      const file = new File({
        filename,
        originalName: originalname,
        mimeType: mimetype,
        size,
        data: filePath // Store file path instead of base64 data
      });

      const savedFile = await file.save();
      console.log('File metadata saved successfully');
      
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
      res.status(500).json({ message: "Error uploading file", error: error.message });
    }
  });

  // File serving endpoint
  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check if file exists on disk
      const filePath = file.data; // data field now contains file path
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Physical file not found" });
      }
      
      // Set appropriate headers
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`
      });
      
      // Stream the file from disk
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ message: "Error serving file", error: error.message });
    }
  });

  // File deletion endpoint
  app.delete("/api/files/:id", requireAdminAuth, async (req, res) => {
    try {
      const file = await File.findByIdAndDelete(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ message: "Error deleting file", error: error.message });
    }
  });

  // Direct email test for status updates (debugging)
  app.post("/api/debug-status-email", requireAdminAuth, async (req, res) => {
    try {
      const { to, status, eventName = 'Debug Test Event', studentName = 'Debug Student' } = req.body;
      
      if (!to) {
        return res.status(400).json({ message: "Email address is required" });
      }

      console.log(`Debug: Testing ${status} email to ${to}`);

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
      res.status(500).json({ message: "Error sending debug email", error: error.message });
    }
  });

  // Email test endpoint (admin only)
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
      res.status(500).json({ message: "Error sending test email", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
