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
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
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

function collectSkuCodeAttributes(variant: any, attrs: Record<string, string>) {
  const sku = String(variant?.sku || "").toUpperCase();
  const parts = sku.split("-").filter(Boolean);
  const prefix = parts[0];
  const valueForCode = (code: string | undefined) => {
    if (!code) return "";
    return attrs[String(code).toLowerCase()] || "";
  };

  if (prefix === "CUP") {
    const [styleCode, materialCode, capacityCode, colorCode] = parts.slice(1);
    const capacity = valueForCode(capacityCode);
    return {
      ...(valueForCode(styleCode) ? { style: valueForCode(styleCode) } : {}),
      ...(valueForCode(materialCode) ? { material: valueForCode(materialCode) } : {}),
      ...(capacity ? { capacity, size: capacity } : {}),
      ...(valueForCode(colorCode) ? { color: valueForCode(colorCode) } : {}),
    };
  }

  if (prefix === "MAT") {
    const codes = parts.slice(1);
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
    const codes = parts.slice(1);
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
    ...(variant?.capacity ? { capacity: variant.capacity } : {}),
    ...(variant?.size ? { size: variant.size } : {}),
    ...(variant?.weight ? { weight: variant.weight } : {}),
    ...(variant?.packaging ? { packaging: variant.packaging } : {}),
    ...(variant?.specification ? { specification: variant.specification } : {}),
    ...(variant?.style ? { style: variant.style } : {}),
    ...(variant?.material ? { material: variant.material } : {}),
    ...(variant?.origin ? { origin: variant.origin } : {}),
    ...(variant?.brand ? { brand: variant.brand } : {}),
    ...(variant?.type ? { type: variant.type } : {}),
    ...(variant?.color ? { color: variant.color } : {}),
  };
  const skuCodeAttrs = collectSkuCodeAttributes(variant, collected);

  const weight = readAttr(collected, ["weight", "trong_luong", "trọng lượng", "khoi_luong", "khối lượng"]);
  const packaging = readAttr(collected, ["packaging", "dong_goi", "đóng gói", "quy_cach", "quy cách"]);
  const origin = readAttr(collected, ["origin", "nguon_goc", "nguồn gốc", "xuat_xu", "xuất xứ"]);

  return {
    ...collected,
    ...skuCodeAttrs,
    ...(weight ? { weight } : {}),
    ...(packaging ? { packaging } : {}),
    ...(origin ? { origin } : {}),
  };
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
    if (key === "CUP_STYLE") acc.style = value;
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
  _sku: string = "",
): NormalizedVariantAttributes {
  const coercedAttrs = coerceVariantAttributes(attrs);
  return {
    capacity: readAttr(coercedAttrs, ["capacity", "size", "spec", "dung_tich", "dung tích", "volume"]),
    style: readAttr(coercedAttrs, ["style", "cup_style", "shape", "kieu_dang", "kiểu dáng", "dáng"]),
    material: readAttr(coercedAttrs, ["material", "chat_lieu", "chất liệu", "material_type", "materialType"]),
    color: readAttr(coercedAttrs, ["color", "colour", "mau_sac", "màu sắc", "mau sac", "màu", "mau", "shade"]),
  };
}
