export type CustomerType = "B2B" | "B2C";

export type FulfillmentType = "STANDARD" | "PRINTED_TEMPLATE" | "CUSTOM_PRINT";

export type DesignArtwork = {
  text: string;
  fill: string;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};

export type DesignFileSnapshot = {
  snapshotVersion: 1;
  designId: string;
  name: string;
  url: string;
  previewDataUrl?: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  artwork: DesignArtwork;
  exportedAt: string;
};

export type Design = {
  id: string;
  name: string;
  designFile: DesignFileSnapshot;
  thumbnailUrl?: string;
  lastUsedAt?: string;
  createdAt: string;
};

export type CatalogProduct = {
  id: string;
  productRefId: string;
  slug: string;
  name: string;
  category: "ingredient" | "plain_cup" | "printed_cup";
  fulfillmentType?: FulfillmentType;
  price: number;
  b2bPrice: number;
  unit: string;
  stockSnapshot: number;
  imageUrl: string;
  updatedAt: string;
};

export type CartItem = {
  cartItemId?: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  fulfillmentType?: FulfillmentType;
  isPrintItem?: boolean;
  designId?: string;
  designFile?: DesignFileSnapshot;
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
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages?: number;
    };
  };
};
