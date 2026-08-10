import type { HydratedDocument } from "mongoose";
import {
  User,
  Product,
  Event,
  VideoPost,
  Announcement,
  StudentGovPosition,
  Club,
  FormSubmission,
  Purchase,
  type UserType,
  type ProductType,
  type EventType,
  type VideoPostType,
  type AnnouncementType,
  type StudentGovPositionType,
  type ClubType,
  type FormSubmissionType,
  type PurchaseType,
  connectDB
} from "@shared/mongodb-schema";

export type UserDoc = HydratedDocument<UserType>;
export type ProductDoc = HydratedDocument<ProductType>;
export type EventDoc = HydratedDocument<EventType>;
export type VideoPostDoc = HydratedDocument<VideoPostType>;
export type AnnouncementDoc = HydratedDocument<AnnouncementType>;
export type StudentGovPositionDoc = HydratedDocument<StudentGovPositionType>;
export type ClubDoc = HydratedDocument<ClubType>;
export type FormSubmissionDoc = HydratedDocument<FormSubmissionType>;
export type PurchaseDoc = HydratedDocument<PurchaseType>;

export interface IStorage {
  getUser(id: string): Promise<UserDoc | null>;
  getUserByUsername(username: string): Promise<UserDoc | null>;
  createUser(user: Partial<UserType>): Promise<UserDoc>;

  getProducts(): Promise<ProductDoc[]>;
  getProduct(id: string): Promise<ProductDoc | null>;
  createProduct(product: Partial<ProductType>): Promise<ProductDoc>;
  updateProduct(id: string, product: Partial<ProductType>): Promise<ProductDoc | null>;
  deleteProduct(id: string): Promise<boolean>;

  getEvents(): Promise<EventDoc[]>;
  getEvent(id: string): Promise<EventDoc | null>;
  createEvent(event: Partial<EventType>): Promise<EventDoc>;
  updateEvent(id: string, event: Partial<EventType>): Promise<EventDoc | null>;
  deleteEvent(id: string): Promise<boolean>;

  getVideos(): Promise<VideoPostDoc[]>;
  getVideo(id: string): Promise<VideoPostDoc | null>;
  createVideo(video: Partial<VideoPostType>): Promise<VideoPostDoc>;
  updateVideo(id: string, video: Partial<VideoPostType>): Promise<VideoPostDoc | null>;
  deleteVideo(id: string): Promise<boolean>;

  getAnnouncements(): Promise<AnnouncementDoc[]>;
  getAnnouncement(id: string): Promise<AnnouncementDoc | null>;
  createAnnouncement(announcement: Partial<AnnouncementType>): Promise<AnnouncementDoc>;
  updateAnnouncement(id: string, announcement: Partial<AnnouncementType>): Promise<AnnouncementDoc | null>;
  deleteAnnouncement(id: string): Promise<boolean>;

  getStudentGovPositions(): Promise<StudentGovPositionDoc[]>;
  getStudentGovPosition(id: string): Promise<StudentGovPositionDoc | null>;
  createStudentGovPosition(position: Partial<StudentGovPositionType>): Promise<StudentGovPositionDoc>;
  updateStudentGovPosition(id: string, position: Partial<StudentGovPositionType>): Promise<StudentGovPositionDoc | null>;
  deleteStudentGovPosition(id: string): Promise<boolean>;

  getClubs(): Promise<ClubDoc[]>;
  getClub(id: string): Promise<ClubDoc | null>;
  createClub(club: Partial<ClubType>): Promise<ClubDoc>;
  updateClub(id: string, club: Partial<ClubType>): Promise<ClubDoc | null>;
  deleteClub(id: string): Promise<boolean>;

  getFormSubmissions(): Promise<FormSubmissionDoc[]>;
  getFormSubmission(id: string): Promise<FormSubmissionDoc | null>;
  createFormSubmission(submission: Partial<FormSubmissionType>): Promise<FormSubmissionDoc>;
  updateFormSubmission(id: string, submission: Partial<FormSubmissionType>): Promise<FormSubmissionDoc | null>;
  deleteFormSubmission(id: string): Promise<boolean>;

  getPurchases(): Promise<PurchaseDoc[]>;
  getPurchase(id: string): Promise<PurchaseDoc | null>;
  getPurchaseByCloverOrderId(cloverOrderId: string): Promise<PurchaseDoc | null>;
  getPurchaseByCloverSessionId(cloverSessionId: string): Promise<PurchaseDoc | null>;
  createPurchase(purchase: Partial<PurchaseType>): Promise<PurchaseDoc>;
  updatePurchase(id: string, purchase: Partial<PurchaseType>): Promise<PurchaseDoc | null>;
  deletePurchase(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  constructor() {
    connectDB();
  }

  async getUser(id: string): Promise<UserDoc | null> {
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<UserDoc | null> {
    return await User.findOne({ username });
  }

  async createUser(user: Partial<UserType>): Promise<UserDoc> {
    const newUser = new User(user);
    return await newUser.save();
  }

  async getProducts(): Promise<ProductDoc[]> {
    return await Product.find();
  }

  async getProduct(id: string): Promise<ProductDoc | null> {
    return await Product.findById(id);
  }

  async createProduct(product: Partial<ProductType>): Promise<ProductDoc> {
    const newProduct = new Product(product);
    return await newProduct.save();
  }

  async updateProduct(id: string, product: Partial<ProductType>): Promise<ProductDoc | null> {
    return await Product.findByIdAndUpdate(id, product, { new: true });
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return result !== null;
  }

  async getEvents(): Promise<EventDoc[]> {
    return await Event.find();
  }

  async getEvent(id: string): Promise<EventDoc | null> {
    return await Event.findById(id);
  }

  async createEvent(event: Partial<EventType>): Promise<EventDoc> {
    const newEvent = new Event(event);
    return await newEvent.save();
  }

  async updateEvent(id: string, event: Partial<EventType>): Promise<EventDoc | null> {
    return await Event.findByIdAndUpdate(id, event, { new: true });
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await Event.findByIdAndDelete(id);
    return result !== null;
  }

  async getVideos(): Promise<VideoPostDoc[]> {
    return await VideoPost.find();
  }

  async getVideo(id: string): Promise<VideoPostDoc | null> {
    return await VideoPost.findById(id);
  }

  async createVideo(video: Partial<VideoPostType>): Promise<VideoPostDoc> {
    const newVideo = new VideoPost(video);
    return await newVideo.save();
  }

  async updateVideo(id: string, video: Partial<VideoPostType>): Promise<VideoPostDoc | null> {
    return await VideoPost.findByIdAndUpdate(id, video, { new: true });
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await VideoPost.findByIdAndDelete(id);
    return result !== null;
  }

  async getAnnouncements(): Promise<AnnouncementDoc[]> {
    return await Announcement.find().sort({ date: -1 });
  }

  async getAnnouncement(id: string): Promise<AnnouncementDoc | null> {
    return await Announcement.findById(id);
  }

  async createAnnouncement(announcement: Partial<AnnouncementType>): Promise<AnnouncementDoc> {
    const newAnnouncement = new Announcement(announcement);
    return await newAnnouncement.save();
  }

  async updateAnnouncement(id: string, announcement: Partial<AnnouncementType>): Promise<AnnouncementDoc | null> {
    return await Announcement.findByIdAndUpdate(id, announcement, { new: true });
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await Announcement.findByIdAndDelete(id);
    return result !== null;
  }

  async getStudentGovPositions(): Promise<StudentGovPositionDoc[]> {
    return await StudentGovPosition.find();
  }

  async getStudentGovPosition(id: string): Promise<StudentGovPositionDoc | null> {
    return await StudentGovPosition.findById(id);
  }

  async createStudentGovPosition(position: Partial<StudentGovPositionType>): Promise<StudentGovPositionDoc> {
    const newPosition = new StudentGovPosition(position);
    return await newPosition.save();
  }

  async updateStudentGovPosition(id: string, position: Partial<StudentGovPositionType>): Promise<StudentGovPositionDoc | null> {
    return await StudentGovPosition.findByIdAndUpdate(id, position, { new: true });
  }

  async deleteStudentGovPosition(id: string): Promise<boolean> {
    const result = await StudentGovPosition.findByIdAndDelete(id);
    return result !== null;
  }

  async getClubs(): Promise<ClubDoc[]> {
    return await Club.find({ isActive: true });
  }

  async getClub(id: string): Promise<ClubDoc | null> {
    return await Club.findById(id);
  }

  async createClub(club: Partial<ClubType>): Promise<ClubDoc> {
    const newClub = new Club(club);
    return await newClub.save();
  }

  async updateClub(id: string, club: Partial<ClubType>): Promise<ClubDoc | null> {
    return await Club.findByIdAndUpdate(id, club, { new: true });
  }

  async deleteClub(id: string): Promise<boolean> {
    const result = await Club.findByIdAndDelete(id);
    return result !== null;
  }

  async getFormSubmissions(): Promise<FormSubmissionDoc[]> {
    return await FormSubmission.find().populate('eventId');
  }

  async getFormSubmission(id: string): Promise<FormSubmissionDoc | null> {
    return await FormSubmission.findById(id).populate('eventId');
  }

  async createFormSubmission(submission: Partial<FormSubmissionType>): Promise<FormSubmissionDoc> {
    const newSubmission = new FormSubmission(submission);
    return await newSubmission.save();
  }

  async updateFormSubmission(id: string, submission: Partial<FormSubmissionType>): Promise<FormSubmissionDoc | null> {
    return await FormSubmission.findByIdAndUpdate(id, submission, { new: true }).populate('eventId');
  }

  async deleteFormSubmission(id: string): Promise<boolean> {
    const result = await FormSubmission.findByIdAndDelete(id);
    return result !== null;
  }

  async getPurchases(): Promise<PurchaseDoc[]> {
    return await Purchase.find().populate('productId');
  }

  async getPurchase(id: string): Promise<PurchaseDoc | null> {
    return await Purchase.findById(id).populate('productId');
  }

  async getPurchaseByCloverOrderId(cloverOrderId: string): Promise<PurchaseDoc | null> {
    return await Purchase.findOne({ cloverOrderId }).populate('productId');
  }

  async getPurchaseByCloverSessionId(cloverSessionId: string): Promise<PurchaseDoc | null> {
    return await Purchase.findOne({ cloverSessionId }).populate('productId');
  }

  async createPurchase(purchase: Partial<PurchaseType>): Promise<PurchaseDoc> {
    const newPurchase = new Purchase(purchase);
    return await newPurchase.save();
  }

  async updatePurchase(id: string, purchase: Partial<PurchaseType>): Promise<PurchaseDoc | null> {
    return await Purchase.findByIdAndUpdate(id, purchase, { new: true }).populate('productId');
  }

  async deletePurchase(id: string): Promise<boolean> {
    const result = await Purchase.findByIdAndDelete(id);
    return result !== null;
  }
}

export const storage = new MongoStorage();
