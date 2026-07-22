import type {
  CupMaterialType,
  CupSize,
  CupStyle,
  DesignArtwork,
  DesignFileSnapshot,
} from "@/types/api";

export const CUP_SIZE_LABELS: Record<CupSize, string> = {
  "350ml": "350ml",
  "500ml": "500ml",
  "700ml": "700ml",
  "1000ml": "1000ml",
};

export const CUP_SIZE_SPECS: Record<
  CupSize,
  {
    label: string;
    circumferenceWidth: number;
    printableHeight: number;
    price: number;
  }
> = {
  "350ml": {
    label: "350ml",
    circumferenceWidth: 600,
    printableHeight: 340,
    price: 1_200,
  },
  "500ml": {
    label: "500ml",
    circumferenceWidth: 680,
    printableHeight: 380,
    price: 1_500,
  },
  "700ml": {
    label: "700ml",
    circumferenceWidth: 740,
    printableHeight: 420,
    price: 1_800,
  },
  "1000ml": {
    label: "1000ml",
    circumferenceWidth: 800,
    printableHeight: 460,
    price: 2_200,
  },
};

export const CUP_STYLE_LABELS: Record<CupStyle, string> = {
  straight: "Ly thẳng",
  u_shape: "Đáy U",
  heart: "Nắp tim",
  mug: "Mug",
};

export const CUP_MATERIAL_LABELS: Record<CupMaterialType, string> = {
  clear: "Nhựa trong",
  frosted: "Nhựa mờ",
  paper: "Giấy",
  glass: "Glass",
  metal: "Metal",
};

export const DEFAULT_CUP_CONFIG = {
  size: "500ml" as CupSize,
  style: "straight" as CupStyle,
  materialType: "frosted" as CupMaterialType,
  cupColor: "#F8F4EC",
  printHeightPercent: 70,
};

export function getArtboardDimensions(
  size: CupSize,
  printHeightPercent: number,
) {
  const spec = CUP_SIZE_SPECS[size];
  const height = spec.printableHeight + 70;
  const printHeight = Math.round(
    spec.printableHeight * (printHeightPercent / 100),
  );

  return {
    width: spec.circumferenceWidth,
    height,
    printHeight,
    printArea: {
      x: 32,
      y: Math.round((height - printHeight) / 2),
      width: spec.circumferenceWidth - 64,
      height: printHeight,
    },
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function createDesignSnapshot({
  name,
  previewDataUrl,
  artwork,
}: {
  name: string;
  previewDataUrl: string;
  artwork: DesignArtwork;
}): DesignFileSnapshot {
  const designId = `design_${hashString(JSON.stringify(artwork))}`;

  return {
    snapshotVersion: 1,
    designId,
    name,
    previewDataUrl,
    artwork,
    exportedAt: new Date().toISOString(),
  };
}

export function createCustomCupProduct({
  size,
  price,
}: {
  size: CupSize;
  price: number;
}) {
  return {
    id: `custom-cup-${size.toLowerCase()}`,
    productRefId: "CUP_PRINTED",
    slug: "ly-in-theo-thiet-ke",
    name: `Ly in theo thiết kế dung tích ${size}`,
    category: "printed_cup" as const,
    price,
    b2bPrice: price,
    unit: "cái",
    stockSnapshot: 999_999,
    imageUrl: "",
    updatedAt: new Date().toISOString(),
    fulfillmentType: "CUSTOM_PRINT" as const,
  };
}
