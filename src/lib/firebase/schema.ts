import type {
  Customer,
  Order,
  PaymentMethod,
  Product,
  Rider,
  SupportMessage,
} from "@/lib/types";

/** Firestore collection / document paths */
export const COLLECTIONS = {
  products: "products",
  orders: "orders",
  customers: "customers",
  users: "users",
  riders: "riders",
  reviews: "reviews",
  support: "supportMessages",
  deliveries: "deliveries",
  settings: "settings",
} as const;

export const SETTINGS_DOCS = {
  payments: "payments",
  restaurant: "restaurant",
  business: "business",
  home: "home",
} as const;

export type PaymentSettingsDoc = Record<PaymentMethod, boolean>;

export type BusinessSettingsDoc = {
  open: boolean;
  busyMode: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  freeDeliveryMin: number;
  hours: string;
};

export type RestaurantSettingsDoc = {
  name: string;
  address: string;
  phone: string;
  phones: string[];
  email: string;
  website: string;
  deliveryEta: string;
};

export type HomeSettingsDoc = {
  popularTodayIds: string[];
  bestSellerIds: string[];
  todaysSpecialId: string;
};

export type FirestoreProduct = Product;
export type FirestoreOrder = Order;
export type FirestoreCustomer = Customer;
export type FirestoreRider = Rider;
export type FirestoreSupport = SupportMessage;
