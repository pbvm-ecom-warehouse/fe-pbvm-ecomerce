export type CustomerType = "B2B" | "B2C";

export type CatalogProduct = {
  id: string;
  productRefId: string;
  slug: string;
  name: string;
  category: "ingredient" | "plain_cup" | "printed_cup";
  price: number;
  b2bPrice: number;
  unit: string;
  stockSnapshot: number;
  imageUrl: string;
  updatedAt: string;
  customConfig?: {
    isCustom: boolean;
    size: "S" | "M" | "L" | "XL";
    style: "straight" | "u_shape" | "heart" | "mug";
    materialType: string;
    cupColor: string;
    logoUrl: string | null;
    decalY: number;
    decalScale: number;
    decalRotation: number;
    promptUsed?: string;
  };
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  customConfig?: {
    isCustom: boolean;
    size: "S" | "M" | "L" | "XL";
    style: "straight" | "u_shape" | "heart" | "mug";
    materialType: string;
    cupColor: string;
    logoUrl: string | null;
    decalY: number;
    decalScale: number;
    decalRotation: number;
    promptUsed?: string;
  };
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "FULFILLING"
  | "COMPLETED"
  | "CANCELLED";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  warehouseName: string;
  createdAt: string;
};

export type ApiListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
