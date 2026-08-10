import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eshs-asb';

    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Application will continue without database connection');
  }
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Apparel', 'Accessories'], required: true },
  organization: { type: String, required: true },
  sizeStock: [{
    size: { type: String, required: true },
    stock: { type: Number, default: 0 }
  }],
  stock: { type: Number, default: 0 },
  image: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  ticketTypes: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    maxTickets: { type: Number, required: true }
  }],
  requiresApproval: { type: Boolean, default: false },
  requiredForms: {
    studentIdRequired: { type: Boolean, default: false },
    customForms: [{
      name: { type: String, required: true },
      pdfUrl: { type: String, required: true },
      required: { type: Boolean, default: true }
    }]
  },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const videoPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  date: { type: Date, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const studentGovPositionSchema = new mongoose.Schema({
  position: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  bio: { type: String, required: true },
  responsibilities: [{ type: String }],
  description: { type: String, required: true },
  currentRepresentatives: [{
    name: { type: String, required: true },
    image: { type: String },
    bio: { type: String },
    email: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  contactEmail: { type: String, required: true },
  image: { type: String, required: true },
  memberCount: { type: Number, default: 0 },
  requirements: [{ type: String }],
  activities: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const formSubmissionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  forms: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true }
  }],
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, default: 0 },
  notes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  purchaseStatus: { type: String, enum: ['pending', 'completed'] },
  paymentDate: { type: Date },
  transactionId: { type: String },
  ticketType: {
    name: { type: String },
    price: { type: Number },
    description: { type: String }
  }
});

const purchaseSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String },
  color: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded'], default: 'pending' },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String },
  cloverOrderId: { type: String },
  cloverSessionId: { type: String },
  paymentVerifiedAt: { type: Date },
  verificationMethod: { type: String, enum: ['clover-webhook', 'clover-api', 'redirect-unverified'] },
  formSubmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormSubmission' },
  paymentDetails: {
    last4: { type: String },
    brand: { type: String },
    receiptUrl: { type: String }
  },
  deliveryMethod: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  deliveryDetails: {
    roomTeacher: { type: String },
    deliveredAt: { type: Date },
    pickedUpAt: { type: Date }
  },
  phone: { type: String },
  notes: { type: String },
  fulfilledBy: { type: String },
  fulfilledAt: { type: Date },
  adminNotes: { type: String }
});

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, default: 'admin' }
});

export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const Event = mongoose.model('Event', eventSchema);
export const VideoPost = mongoose.model('VideoPost', videoPostSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const StudentGovPosition = mongoose.model('StudentGovPosition', studentGovPositionSchema);
export const Club = mongoose.model('Club', clubSchema);
export const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const File = mongoose.model('File', fileSchema);

export type UserType = mongoose.InferSchemaType<typeof userSchema>;
export type ProductType = mongoose.InferSchemaType<typeof productSchema>;
export type EventType = mongoose.InferSchemaType<typeof eventSchema>;
export type VideoPostType = mongoose.InferSchemaType<typeof videoPostSchema>;
export type AnnouncementType = mongoose.InferSchemaType<typeof announcementSchema>;
export type StudentGovPositionType = mongoose.InferSchemaType<typeof studentGovPositionSchema>;
export type ClubType = mongoose.InferSchemaType<typeof clubSchema>;
export type FormSubmissionType = mongoose.InferSchemaType<typeof formSubmissionSchema>;
export type PurchaseType = mongoose.InferSchemaType<typeof purchaseSchema>;
export type FileType = mongoose.InferSchemaType<typeof fileSchema>;
