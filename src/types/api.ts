export type CustomerType = "B2B" | "B2C";

export type FulfillmentType = "STANDARD" | "PRINTED_TEMPLATE" | "CUSTOM_PRINT";

export type CupSize = "350ml" | "500ml" | "700ml" | "1000ml";

export type CupStyle = "straight" | "u_shape" | "heart" | "mug";

export type CupMaterialType = "clear" | "frosted" | "paper" | "glass" | "metal";

export type CupDesignConfig = {
  size: CupSize;
  style: CupStyle;
  materialType: CupMaterialType;
  cupColor: string;
};

export type DesignLayerBase = {
  id: string;
  x: number;
  y: number;
  rotation?: number;
};

export type DesignTextLayer = DesignLayerBase & {
  type: "text";
  text: string;
  color: string;
  fontSize: number;
};

export type DesignImageLayer = DesignLayerBase & {
  type: "image";
  src: string;
  width: number;
  height: number;
  source: "upload" | "ai";
  prompt?: string;
};

export type DesignBrushLayer = {
  id: string;
  type: "brush";
  points: number[];
  color: string;
  size: number;
};

export type DesignArtworkLayer =
  | DesignTextLayer
  | DesignImageLayer
  | DesignBrushLayer;

export type DesignArtwork = {
  artboard: {
    width: number;
    height: number;
    printHeightPercent: number;
  };
  cup: {
    size: CupSize;
    style: CupStyle;
    materialType: CupMaterialType;
    cupColor: string;
  };
  layers: DesignArtworkLayer[];
};

export type DesignFileSnapshot = {
  snapshotVersion: 1;
  designId: string;
  name: string;
  previewDataUrl: string;
  artwork: DesignArtwork;
  exportedAt: string;
};

export type CatalogProduct = {
  id: string;
  productRefId: string;
  slug: string;
  name: string;
  category: "ingredient" | "plain_cup" | "printed_cup" | "custom_print";
  fulfillmentType?: FulfillmentType;
  price: number;
  b2bPrice: number;
  unit: string;
  stockSnapshot: number;
  imageUrl: string;
  updatedAt: string;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  productId: string;
  attributes: Record<string, string>;
  price: number;
  availableQty: number;
  fulfillmentType: FulfillmentType;
  isActive: boolean;
};

export type CartItem = {
  cartItemId: string;
  productId: string;
  productRefId?: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  fulfillmentType: FulfillmentType;
  designId?: string;
  designFile?: DesignFileSnapshot;
  selected?: boolean;
  selectedSize?: string;
  selectedMaterial?: string;
  selectedStyle?: string;
  attributes?: Record<string, string>;
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
