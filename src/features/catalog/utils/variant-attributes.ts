export type NormalizedVariantAttributes = {
  capacity: string;
  style: string;
  material: string;
  color: string;
};

export type VariantAttributeRow = {
  label: string;
  value: string;
};

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function readAttr(attrs: Record<string, any>, keys: string[]) {
  const expectedKeys = new Set(keys.map(normalizeToken));
  for (const [rawKey, rawValue] of Object.entries(attrs || {})) {
    if (!expectedKeys.has(normalizeToken(String(rawKey)))) continue;
    if (rawValue !== undefined && rawValue !== null && String(rawValue).trim()) {
      return String(rawValue).trim();
    }
  }
  return "";
}

function stringifyAttributeValue(value: any) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    const nested =
      value.value ??
      value.val ??
      value.displayValue ??
      value.label ??
      value.name ??
      value.code;
    return nested === undefined || nested === null ? "" : String(nested).trim();
  }
  return String(value).trim();
}

export function coerceVariantAttributes(input: any): Record<string, string> {
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, item) => {
      if (!item || typeof item !== "object") return acc;
      const key = item.key ?? item.name ?? item.label ?? item.code;
      const value = stringifyAttributeValue(item.value ?? item.val ?? item.displayValue);
      if (key !== undefined && key !== null && value) {
        acc[String(key).trim()] = value;
      }
      return acc;
    }, {});
  }

  if (input && typeof input === "object") {
    return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
      const textValue = stringifyAttributeValue(value);
      if (textValue) {
        acc[key] = textValue;
      }
      return acc;
    }, {});
  }

  return {};
}

function inferAttributesFromSkuAndText(
  variant: any,
  collected: Record<string, string>,
): Record<string, string> {
  const sku = String(variant?.sku || "").toUpperCase();
  const name = String(variant?.name || variant?.variantName || "").toUpperCase();
  const fullText = `${sku} ${name} ${JSON.stringify(collected)}`.toUpperCase();
  const inferred: Record<string, string> = {};

  // Infer Material
  if (!collected.material && !collected.chatlieu && !collected.chat_lieu && !collected.chất_liệu) {
    if (fullText.includes("PET")) inferred.material = "PET";
    else if (fullText.includes("PP")) inferred.material = "PP";
    else if (fullText.includes("PAPER") || fullText.includes("GIAY") || fullText.includes("GIẤY")) inferred.material = "Giấy";
    else if (fullText.includes("GLASS") || fullText.includes("THUY TINH") || fullText.includes("THỦY TINH")) inferred.material = "Thủy tinh";
    else if (fullText.includes("KRAFT")) inferred.material = "Giấy Kraft";
  }

  // Infer Style
  if (!collected.style && !collected.cupStyle && !collected.cup_style && !collected.kieudang && !collected.kieu_dang) {
    if (fullText.includes("HRT") || fullText.includes("HEART") || fullText.includes("TIM") || fullText.includes("TRÁI TIM")) {
      inferred.style = "Trái tim";
      inferred.cupStyle = "heart";
    } else if (fullText.includes("USHAPE") || fullText.includes("U_SHAPE") || fullText.includes("DAY_U") || fullText.includes("ĐÁY U") || fullText.includes("-U-")) {
      inferred.style = "Đáy U";
      inferred.cupStyle = "u_shape";
    } else if (fullText.includes("STRAIGHT") || fullText.includes("LY_THANG") || fullText.includes("TRU") || fullText.includes("THẲNG")) {
      inferred.style = "Ly thẳng";
      inferred.cupStyle = "straight";
    } else if (fullText.includes("MUG") || fullText.includes("QUAI")) {
      inferred.style = "Mug (Có quai)";
      inferred.cupStyle = "mug";
    }
  }

  // Infer Weight / Spec
  if (!collected.weight && !collected.trong_luong && !collected.khoi_luong) {
    const weightMatch = fullText.match(/(\d+)\s*(KG|G|GRAM|KILOGRAM)\b/);
    if (weightMatch) {
      const num = weightMatch[1];
      const unit = weightMatch[2] === "KG" || weightMatch[2] === "KILOGRAM" ? "kg" : "g";
      inferred.weight = `${num}${unit}`;
      inferred.spec = `${num}${unit}`;
    }
  }

  // Infer Capacity / Size ONLY for non-material products (NOT when SKU ends in G/KG weight)
  const isMaterialSku = fullText.includes("MAT-") || fullText.includes("MATERIAL") || Boolean(collected.weight || inferred.weight);
  if (!isMaterialSku && !collected.capacity && !collected.size && !collected.dungtich && !collected.dung_tich && !collected.spec) {
    const match = fullText.match(/(1000|700|500|350|250|150|120|100)\s*(ML|L)?/);
    if (match) {
      inferred.capacity = `${match[1]}ml`;
      inferred.size = `${match[1]}ml`;
    }
  }

  // Infer Color
  if (!collected.color && !collected.mau && !collected.mausac && !collected.mau_sac) {
    if (fullText.includes("WHITE") || fullText.includes("TRANG") || fullText.includes("SUA")) {
      inferred.color = "Trắng sữa";
    } else if (fullText.includes("CLEAR") || fullText.includes("TRONG")) {
      inferred.color = "Trong suốt";
    } else if (fullText.includes("BLACK") || fullText.includes("DEN") || fullText.includes("ĐEN")) {
      inferred.color = "Đen";
    }
  }

  return inferred;
}

function collectSkuCodeAttributes(variant: any, attrs: Record<string, string>) {
  const sku = String(variant?.sku || "").toUpperCase();
  const parts = sku.split("-").filter(Boolean);
  const typeIndex = parts.findIndex((p) => p === "CUP" || p === "MAT" || p === "PKG");
  const subParts = typeIndex >= 0 ? parts.slice(typeIndex) : parts;
  const prefix = subParts[0];

  const valueForCode = (code: string | undefined) => {
    if (!code) return "";
    return attrs[String(code).toLowerCase()] || "";
  };

  if (prefix === "CUP") {
    const [styleCode, materialCode, capacityCode, colorCode] = subParts.slice(1);
    const capacity = valueForCode(capacityCode);
    return {
      ...(valueForCode(styleCode) ? { style: valueForCode(styleCode) } : {}),
      ...(valueForCode(materialCode) ? { material: valueForCode(materialCode) } : {}),
      ...(capacity ? { capacity, size: capacity } : {}),
      ...(valueForCode(colorCode) ? { color: valueForCode(colorCode) } : {}),
    };
  }

  if (prefix === "MAT") {
    const codes = subParts.slice(1);
    const category = valueForCode(codes[0]);
    const type = valueForCode(codes[1]);
    const weight = valueForCode(codes[codes.length - 1]);
    const flavorValues = codes.slice(2, -1).map(valueForCode).filter(Boolean);
    return {
      ...(category ? { category } : {}),
      ...(type ? { type, material: type } : {}),
      ...(flavorValues.length > 0 ? { flavor: flavorValues.join(" / ") } : {}),
      ...(weight ? { weight, spec: weight, size: weight } : {}),
    };
  }

  if (prefix === "PKG") {
    const codes = subParts.slice(1);
    const packaging = valueForCode(codes[0]);
    const size = valueForCode(codes[1]);
    const color = valueForCode(codes[2]);
    return {
      ...(packaging ? { packaging, style: packaging } : {}),
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
    };
  }

  return {};
}

export function collectVariantAttributes(variant: any): Record<string, string> {
  const collected = {
    ...coerceVariantAttributes(variant?.attributes),
    ...coerceVariantAttributes(variant?.attributeValues),
    ...coerceVariantAttributes(variant?.variantAttributes),
    ...coerceVariantAttributes(variant?.properties),
    ...(variant?.capacity ? { capacity: String(variant.capacity) } : {}),
    ...(variant?.size ? { size: String(variant.size) } : {}),
    ...(variant?.weight ? { weight: String(variant.weight) } : {}),
    ...(variant?.packaging ? { packaging: String(variant.packaging) } : {}),
    ...(variant?.specification ? { specification: String(variant.specification) } : {}),
    ...(variant?.style ? { style: String(variant.style) } : {}),
    ...(variant?.cupStyle ? { cupStyle: String(variant.cupStyle) } : {}),
    ...(variant?.cup_style ? { cupStyle: String(variant.cup_style) } : {}),
    ...(variant?.loai ? { loai: String(variant.loai) } : {}),
    ...(variant?.material ? { material: String(variant.material) } : {}),
    ...(variant?.materialType ? { material: String(variant.materialType) } : {}),
    ...(variant?.origin ? { origin: String(variant.origin) } : {}),
    ...(variant?.brand ? { brand: String(variant.brand) } : {}),
    ...(variant?.type ? { type: String(variant.type) } : {}),
    ...(variant?.color ? { color: String(variant.color) } : {}),
  };
  const skuCodeAttrs = collectSkuCodeAttributes(variant, collected);
  const inferredAttrs = inferAttributesFromSkuAndText(variant, collected);

  const weight = readAttr(collected, ["weight", "trong_luong", "trọng lượng", "khoi_luong", "khối lượng"]);
  const packaging = readAttr(collected, ["packaging", "dong_goi", "đóng gói", "quy_cach", "quy cách"]);
  const origin = readAttr(collected, ["origin", "nguon_goc", "nguồn gốc", "xuat_xu", "xuất xứ"]);
  const cupStyle = readAttr(collected, ["cupStyle", "cup_style", "cupstyle", "style", "kieu_dang", "kiểu dáng", "dáng"]);
  const loai = readAttr(collected, ["loai", "loai_sp", "loại", "type", "material_category", "category"]);

  const skuUpper = String(variant?.sku || (collected as any).sku || "").toUpperCase();
  const nameUpper = String(variant?.name || variant?.variantName || "").toUpperCase();
  const isSugar =
    skuUpper.includes("SUGAR") ||
    skuUpper.includes("DUONG") ||
    nameUpper.includes("ĐƯỜNG") ||
    nameUpper.includes("DUONG") ||
    nameUpper.includes("SUGAR");

  const result = {
    ...inferredAttrs,
    ...collected,
    ...skuCodeAttrs,
    ...(weight ? { weight } : {}),
    ...(packaging ? { packaging } : {}),
    ...(origin ? { origin } : {}),
    ...(cupStyle ? { cupStyle, style: cupStyle } : {}),
    ...(loai ? { loai } : {}),
  };

  if (isSugar) {
    delete result.capacity;
  }

  return result;
}

export function collectWmsItemVariantAttributes(item: any): Record<string, string> {
  const attrs: any[] = Array.isArray(item?.attributes) ? item.attributes : [];
  return attrs.reduce((acc: Record<string, string>, attr: any) => {
    if (!attr || typeof attr !== "object") return acc;
    const key = String(attr.key || attr.name || "").toUpperCase();
    const value = stringifyAttributeValue(attr.value);
    if (!value) return acc;

    if (key === "CAPACITY") acc.capacity = value;
    if (key === "SIZE" || key === "SPEC") acc.size = value;
    if (key === "CUP_STYLE" || key === "CUPSTYLE" || key === "STYLE" || key === "KIEU_DANG") {
      acc.style = value;
      acc.cupStyle = value;
    }
    if (key === "LOAI" || key === "TYPE" || key === "MATERIAL_CATEGORY") {
      acc.loai = value;
      acc.type = value;
    }
    if (key === "MATERIAL" || key === "MATERIAL_TYPE") acc.material = value;
    if (key === "COLOR") acc.color = value;
    if (key === "PACKAGING_CATEGORY") {
      acc.style = value;
      acc.packaging = value;
    }
    if (key === "MATERIAL_CATEGORY") acc.type = value;
    if (key === "FLAVOR") acc.flavor = value;
    if (key === "DIAMETER") acc.diameter = value;
    if (key === "LENGTH") acc.length = value;
    if (key === "COMPATIBILITY") acc.compatibility = value;

    return acc;
  }, {});
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  capacity: "Dung tích",
  size: "Dung tích",
  style: "Kiểu dáng",
  material: "Chất liệu",
  color: "Màu sắc",
};

export function buildVariantAttributeRows(attrs: Record<string, any> = {}): VariantAttributeRow[] {
  return Object.entries(coerceVariantAttributes(attrs))
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([key, value]) => ({
      label: ATTRIBUTE_LABELS[key] || key.replace(/[_-]+/g, " "),
      value: String(value).trim(),
    }));
}

export function normalizeVariantAttributes(
  attrs: Record<string, any> = {},
  sku: string = "",
): NormalizedVariantAttributes {
  const coercedAttrs = coerceVariantAttributes(attrs);
  const skuUpper = String(sku || coercedAttrs.sku || "").toUpperCase();
  const textUpper = JSON.stringify(coercedAttrs).toUpperCase();

  const isSugar =
    skuUpper.includes("SUGAR") ||
    skuUpper.includes("DUONG") ||
    textUpper.includes("SUGAR") ||
    textUpper.includes("ĐƯỜNG") ||
    textUpper.includes("DUONG");

  let capacityVal = readAttr(coercedAttrs, ["capacity", "dung_tich", "dung tích", "volume"]);

  if (isSugar || /\d+\s*(kg|g|gram)\b/i.test(capacityVal)) {
    capacityVal = "";
  }

  return {
    capacity: capacityVal,
    style: readAttr(coercedAttrs, ["style", "cup_style", "shape", "kieu_dang", "kiểu dáng", "dáng"]),
    material: readAttr(coercedAttrs, ["material", "chat_lieu", "chất liệu", "material_type", "materialType"]),
    color: readAttr(coercedAttrs, ["color", "colour", "mau_sac", "màu sắc", "mau sac", "màu", "mau", "shade"]),
  };
}
