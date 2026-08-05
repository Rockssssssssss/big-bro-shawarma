export type Category = "shawarma" | "packages" | "drinks";

export type ProductTag = "popular" | "recommended" | "bestseller";

export type OrderStatus =
  | "received"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "momo" | "cash" | "card";

export type RiderStatus = "available" | "busy" | "offline";

export type SupportCategory =
  | "food-quality"
  | "delivery"
  | "bug"
  | "suggestion"
  | "other";

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  prepTime: number;
  image: string;
  images?: string[];
  category: Category;
  rating: number;
  tags: ProductTag[];
  available: boolean;
}

export interface CartLine {
  key: string;
  productId: string;
  quantity: number;
  extras: string[];
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: RiderStatus;
  deliveriesToday: number;
  rating: number;
  earnings: number;
  avatar?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  extras: string[];
}

export interface Order {
  id: string;
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark: string;
  latitude?: number;
  longitude?: number;
  date: string;
  time: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  rider?: { id: string; name: string; phone: string; eta?: string };
  reviewed?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  points: number;
  joined: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  product?: string;
  reply?: string;
}

export interface Reward {
  id: string;
  amount: number;
  points: number;
  label: string;
}

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  category: SupportCategory;
  message: string;
  date: string;
  status: "open" | "replied" | "archived";
  reply?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: "assigned" | "picked-up" | "delivered";
  items: OrderItem[];
  time: string;
}
