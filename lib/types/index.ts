export enum UserRole {
  CLIENT = "CLIENT",
  PHOTOGRAPHER = "PHOTOGRAPHER",
  ORGANIZER = "ORGANIZER",
  ADMIN = "ADMIN",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PhotoStatus {
  UPLOADING = "UPLOADING",
  PROCESSING = "PROCESSING",
  AVAILABLE = "AVAILABLE",
  ARCHIVED = "ARCHIVED",
}

export enum NotificationType {
  ORDER_CONFIRMED = "ORDER_CONFIRMED",
  PHOTO_AVAILABLE = "PHOTO_AVAILABLE",
  NEW_PHOTO_MATCH = "NEW_PHOTO_MATCH",
  PHOTO_PURCHASED = "PHOTO_PURCHASED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
}

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: UserRole;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Photographer = {
  id: string;
  userId: string;
  bio?: string | null;
  portfolio?: string | null;
  profileImage?: string | null;
  rating: number;
  totalSales: number;
  totalRevenue: number;
};

export type Event = {
  id: string;
  organizerId: string;
  title: string;
  description?: string | null;
  banner?: string | null;
  location?: string | null;
  date: Date;
  sport: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Photo = {
  id: string;
  eventId: string;
  photographerId: string;
  key: string;
  thumbnailKey?: string | null;
  name: string;
  status: PhotoStatus;
  price: number;
  isPremium: boolean;
  isWatermarked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
};
