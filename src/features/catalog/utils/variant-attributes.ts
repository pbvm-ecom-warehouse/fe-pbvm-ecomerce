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

export function coerceVariantAttributes(input: any): Record<string, string> {
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, item) => {
      if (!item || typeof item !== "object") return acc;
      const key = item.key ?? item.name ?? item.label ?? item.code;
      const value = item.value ?? item.val ?? item.displayValue;
      if (key !== undefined && key !== null && value !== undefined && value !== null && String(value).trim()) {
        acc[String(key).trim()] = String(value).trim();
      }
      return acc;
    }, {});
  }

  if (input && typeof input === "object") {
    return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        acc[key] = String(value).trim();
      }
      return acc;
    }, {});
  }

  return {};
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
