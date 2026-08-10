// API utility functions for the frontend
const API_BASE_URL = '/api';

// Generic fetch function with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Include cookies for session authentication
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses (like DELETE)
    const text = await response.text();
    if (!text) return undefined as unknown as T;
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Product API functions
export async function getProducts() {
  return fetchAPI<Product[]>('/products');
}

export async function getProduct(id: string) {
  return fetchAPI<Product>(`/products/${id}`);
}

export async function createProduct(product: Partial<Product>) {
  return fetchAPI<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>) {
  return fetchAPI<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string) {
  return fetchAPI<void>(`/products/${id}`, {
    method: 'DELETE',
  });
}

// Event API functions
export async function getEvents() {
  return fetchAPI<Event[]>('/events');
}

export async function getEvent(id: string) {
  return fetchAPI<Event>(`/events/${id}`);
}

export async function createEvent(event: Partial<Event>) {
  return fetchAPI<Event>('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateEvent(id: string, event: Partial<Event>) {
  return fetchAPI<Event>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(id: string) {
  return fetchAPI<void>(`/events/${id}`, {
    method: 'DELETE',
  });
}

// Video API functions
export async function getVideos() {
  return fetchAPI<VideoPost[]>('/videos');
}

export async function getVideo(id: string) {
  return fetchAPI<VideoPost>(`/videos/${id}`);
}

export async function createVideo(video: Partial<VideoPost>) {
  return fetchAPI<VideoPost>('/videos', {
    method: 'POST',
    body: JSON.stringify(video),
  });
}

export async function updateVideo(id: string, video: Partial<VideoPost>) {
  return fetchAPI<VideoPost>(`/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(video),
  });
}

export async function deleteVideo(id: string) {
  return fetchAPI<void>(`/videos/${id}`, {
    method: 'DELETE',
  });
}

// Announcement API functions
export async function getAnnouncements() {
  return fetchAPI<Announcement[]>('/announcements');
}

export async function getAnnouncement(id: string) {
  return fetchAPI<Announcement>(`/announcements/${id}`);
}

export async function createAnnouncement(announcement: Partial<Announcement>) {
  return fetchAPI<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcement),
  });
}

export async function updateAnnouncement(id: string, announcement: Partial<Announcement>) {
  return fetchAPI<Announcement>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(announcement),
  });
}

export async function deleteAnnouncement(id: string) {
  return fetchAPI<void>(`/announcements/${id}`, {
    method: 'DELETE',
  });
}

// Student Government API functions
export async function getStudentGovPositions() {
  return fetchAPI<StudentGovPosition[]>('/student-gov-positions');
}

export async function getStudentGovPosition(id: string) {
  return fetchAPI<StudentGovPosition>(`/student-gov-positions/${id}`);
}

export async function createStudentGovPosition(position: Partial<StudentGovPosition>) {
  return fetchAPI<StudentGovPosition>('/student-gov-positions', {
    method: 'POST',
    body: JSON.stringify(position),
  });
}

export async function updateStudentGovPosition(id: string, position: Partial<StudentGovPosition>) {
  return fetchAPI<StudentGovPosition>(`/student-gov-positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(position),
  });
}

export async function deleteStudentGovPosition(id: string) {
  return fetchAPI<void>(`/student-gov-positions/${id}`, {
    method: 'DELETE',
  });
}

// Club API functions
export async function getClubs() {
  return fetchAPI<Club[]>('/clubs');
}

export async function getClub(id: string) {
  return fetchAPI<Club>(`/clubs/${id}`);
}

export async function createClub(club: Partial<Club>) {
  return fetchAPI<Club>('/clubs', {
    method: 'POST',
    body: JSON.stringify(club),
  });
}

export async function updateClub(id: string, club: Partial<Club>) {
  return fetchAPI<Club>(`/clubs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(club),
  });
}

export async function deleteClub(id: string) {
  return fetchAPI<void>(`/clubs/${id}`, {
    method: 'DELETE',
  });
}


// Form Submission API functions
export async function getFormSubmissions() {
  return fetchAPI<FormSubmission[]>('/form-submissions');
}

export async function getFormSubmission(id: string) {
  return fetchAPI<FormSubmission>(`/form-submissions/${id}`);
}

export async function createFormSubmission(submission: Partial<FormSubmission>) {
  return fetchAPI<FormSubmission>('/form-submissions', {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export async function updateFormSubmission(id: string, submission: Partial<FormSubmission>) {
  return fetchAPI<FormSubmission>(`/form-submissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(submission),
  });
}

export async function deleteFormSubmission(id: string) {
  return fetchAPI<void>(`/form-submissions/${id}`, {
    method: 'DELETE',
  });
}

// Payment API functions
export async function createPaymentIntent(data: {
  amount: number;
  items: any[];
  customerEmail: string;
  customerName: string;
  submissionId?: string; // For ticket purchases
}) {
  return fetchAPI<any>('/payment/create-intent', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function processPayment(data: {
  paymentToken: string;
  orderId: string;
  purchaseData: any;
}) {
  return fetchAPI<any>('/payment/process', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPaymentStatus(orderId: string) {
  return fetchAPI<any>(`/payment/status/${orderId}`);
}

// Purchase API functions
export async function getPurchases() {
  return fetchAPI<Purchase[]>('/purchases');
}

export async function getPurchase(id: string) {
  return fetchAPI<Purchase>(`/purchases/${id}`);
}

export async function createPurchase(purchase: Partial<Purchase>) {
  return fetchAPI<Purchase>('/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}

export async function updatePurchase(id: string, purchase: Partial<Purchase>) {
  return fetchAPI<Purchase>(`/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(purchase),
  });
}

export async function deletePurchase(id: string) {
  return fetchAPI<void>(`/purchases/${id}`, {
    method: 'DELETE',
  });
}

// Type definitions that match our MongoDB schema
export interface Product {
  _id: string;
  name: string;
  price: number;
  category: 'Apparel' | 'Accessories';
  organization: string;
  // For Apparel: sizes with individual stock amounts
  sizeStock: Array<{
    size: string;
    stock: number;
  }>;
  // For Accessories: generic stock
  stock: number;
  image: string;
  images: string[]; // Array of image URLs for multiple images
  description: string;
  createdAt: Date;
}

export interface Event {
  _id: string;
  title: string;
  category: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  ticketTypes?: Array<{
    name: string;
    description: string;
    price: number;
    maxTickets: number;
  }>;
  requiresApproval: boolean;
  image?: string;
  createdAt: Date;
  requiredForms?: {
    studentIdRequired: boolean;
    customForms: Array<{
      name: string;
      pdfUrl: string;
      required: boolean;
    }>;
  };
}

export interface VideoPost {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  date: Date;
  author: string;
  category: string;
  views: number;
  featured: boolean;
  createdAt: Date;
}

export interface Announcement {
  _id: string;
  title: string;
  date: Date;
  content: string;
  priority: 'low' | 'medium' | 'high';
  author: string;
  createdAt: Date;
}

export interface StudentGovPosition {
  _id: string;
  position: string;
  gradeLevel: string;
  bio: string;
  responsibilities: string[];
  description: string;
  currentRepresentatives: {
    name: string;
    image?: string;
    bio?: string;
    email?: string;
  }[];
  createdAt: Date;
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  contactEmail: string;
  image: string;
  memberCount: number;
  requirements: string[];
  activities: string[];
  isActive: boolean;
  createdAt: Date;
}


export interface FormSubmission {
  _id: string;
  eventId?: string;
  studentName: string;
  email: string;
  submissionDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  forms: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
  quantity: number;
  totalAmount: number;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  ticketType?: {
    name: string;
    price: number;
    description: string;
  };
}

export interface Purchase {
  _id: string;
  studentName: string;
  studentEmail: string;
  phone?: string;
  productId?: string;
  productName: string;
  quantity: number;
  size?: string;
  color?: string;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded';
  date: Date;
  paymentMethod: string;
  transactionId?: string;
  cloverOrderId?: string;
  cloverSessionId?: string;
  paymentDetails?: {
    last4?: string;
    brand?: string;
    receiptUrl?: string;
  };
  deliveryMethod?: 'pickup' | 'delivery';
  deliveryDetails?: {
    roomTeacher?: string;
  };
  notes?: string;
  fulfilledBy?: string;
  fulfilledAt?: Date;
  adminNotes?: string;
}
