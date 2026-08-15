export type Category = "shawarma" | "packages" | "drinks";

export type ProductTag = "popular" | "recommended" | "bestseller";

export type OrderStatus =
  | "received"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

/** How the customer receives the order. Missing on legacy orders → treat as delivery. */
export type FulfillmentType = "delivery" | "pickup";

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
  /**
   * Delivery or pickup. Optional for backward compatibility —
   * orders without this field are treated as delivery.
   */
  fulfillmentType?: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Optional customer instructions (max ~200 chars). */
  note?: string;
  /** Loyalty voucher discount applied at checkout (after explicit redemption). */
  discount?: number;
  voucherId?: string;
  paymentMethod: PaymentMethod;
  rider?: { id: string; name: string; phone: string; eta?: string };
  /** Admin opened this order to all riders; awaiting first acceptance. */
  riderRequested?: boolean;
  /** Rider UIDs who declined (BUSY) this offer. */
  declinedBy?: string[];
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
  orderId?: string;
  customerId?: string;
  createdAt?: number;
}

export interface Reward {
  id: string;
  amount: number;
  points: number;
  label: string;
}

/** Loyalty voucher created when a customer explicitly redeems a reward. */
export interface CustomerVoucher {
  id: string;
  rewardId: string;
  amount: number;
  label: string;
  pointsCost: number;
  redeemedAt: number;
  expiresAt: number;
  status: "available" | "used" | "expired";
  usedAt?: number;
  usedOrderId?: string;
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
  updatedAt?: number;
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
