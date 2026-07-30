import type { CupMaterialType, CupSize, CupStyle } from "@/types/api";
import {
  CUP_MATERIAL_LABELS,
  CUP_SIZE_LABELS,
  CUP_STYLE_LABELS,
} from "@/features/cup-designer/utils/artwork";
import { coerceVariantAttributes } from "@/features/catalog/utils/variant-attributes";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function getItemKind(item: any): "cup" | "ingredient" | "packaging" | "generic" {
  const source = normalizeText(
    [item.name, item.slug, item.sku, item.productRefId, item.category, item.categoryName]
      .filter(Boolean)
      .join(" "),
  );

  if (source.includes("bao bi") || source.includes("packaging") || source.includes("hop") || source.includes("tui") || source.includes("nap")) {
    return "packaging";
  }
  if (source.includes("nguyen lieu") || source.includes("ingredient") || source.includes("tra") || source.includes("sua") || source.includes("bot") || source.includes("siro") || source.includes("topping")) {
    return "ingredient";
  }
  if (source.includes("ly") || source.includes("cup") || item.isPrintItem || item.fulfillmentType === "CUSTOM_PRINT") {
    return "cup";
  }
  return "generic";
}

function prettifyAttributeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function labelFor(key: string, kind: ReturnType<typeof getItemKind>) {
  const normalizedKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
  const common: Record<string, string> = {
    color: "Màu sắc",
    mau: "Màu sắc",
    mausac: "Màu sắc",
    brand: "Thương hiệu",
    thuonghieu: "Thương hiệu",
    origin: "Xuất xứ",
    xuatxu: "Xuất xứ",
  };
  const cup: Record<string, string> = {
    capacity: "Dung tích",
    size: "Dung tích",
    spec: "Dung tích",
    dungtich: "Dung tích",
    material: "Chất liệu",
    chatlieu: "Chất liệu",
    style: "Kiểu dáng",
    kieudang: "Kiểu dáng",
  };
  const ingredient: Record<string, string> = {
    capacity: "Trọng lượng",
    size: "Trọng lượng",
    spec: "Trọng lượng",
    weight: "Trọng lượng",
    khoiluong: "Trọng lượng",
    flavor: "Hương vị",
    huongvi: "Hương vị",
    material: "Thành phần",
    thanhphan: "Thành phần",
  };
  const packaging: Record<string, string> = {
    capacity: "Dung tích",
    size: "Kích thước",
    spec: "Kích thước",
    kichthuoc: "Kích thước",
    material: "Chất liệu",
    chatlieu: "Chất liệu",
    style: "Kiểu dáng",
    kieudang: "Kiểu dáng",
    thickness: "Độ dày",
    doday: "Độ dày",
  };

  if (kind === "ingredient") return ingredient[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  if (kind === "packaging") return packaging[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  if (kind === "cup") return cup[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  return common[normalizedKey] || cup[normalizedKey] || ingredient[normalizedKey] || packaging[normalizedKey] || prettifyAttributeKey(key);
}

function displayValue(key: string, value: string, kind: ReturnType<typeof getItemKind>) {
  if (kind !== "cup") return value;
  const normalizedKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
  if (normalizedKey === "size" || normalizedKey === "capacity" || normalizedKey === "dungtich") {
    return CUP_SIZE_LABELS[value as CupSize] || value;
  }
  if (normalizedKey === "material" || normalizedKey === "chatlieu") {
    return CUP_MATERIAL_LABELS[value as CupMaterialType] || value;
  }
  if (normalizedKey === "style" || normalizedKey === "kieudang") {
    return CUP_STYLE_LABELS[value as CupStyle] || value;
  }
  return value;
}

function findAttrValue(attrs: Record<string, string>, keys: string[]) {
  const expected = new Set(keys.map((k) => normalizeText(k).replace(/[^a-z0-9]+/g, "")));
  for (const [key, value] of Object.entries(attrs)) {
    const normKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
    if (expected.has(normKey) && value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function getCanonicalCupAttrs(attrs: Record<string, string>) {
  return {
    capacity: findAttrValue(attrs, ["capacity", "size", "spec", "dung_tich", "dung tích", "dung tich"]),
    material: findAttrValue(attrs, ["material", "chat_lieu", "chất liệu", "chat lieu", "materialType"]),
    style: findAttrValue(attrs, ["style", "cup_style", "kieu_dang", "kiểu dáng", "kieu dang", "dáng"]),
    color: findAttrValue(attrs, ["color", "colour", "mau_sac", "màu sắc", "mau sac", "màu", "mau"]),
  };
}

function getCanonicalIngredientAttrs(attrs: Record<string, string>) {
  return {
    weight: findAttrValue(attrs, ["weight", "trong_luong", "trọng lượng", "trong luong", "khoi_luong", "khối lượng", "capacity", "size", "spec"]),
    material: findAttrValue(attrs, ["material", "chat_lieu", "chất liệu", "thanhphan", "thanh_phan", "thành phần"]),
    flavor: findAttrValue(attrs, ["flavor", "huongvi", "hương vị", "huong_vi", "flavorProfile", "org"]),
    color: findAttrValue(attrs, ["color", "colour", "mau_sac", "màu sắc", "mau sac", "màu", "mau"]),
    origin: findAttrValue(attrs, ["origin", "xuat_xu", "xuất xứ", "nguon_goc", "nguồn gốc"]),
    brand: findAttrValue(attrs, ["brand", "thuong_hieu", "thương hiệu"]),
  };
}

function getCanonicalPackagingAttrs(attrs: Record<string, string>) {
  return {
    size: findAttrValue(attrs, ["size", "capacity", "spec", "kich_thuoc", "kích thước", "kich thuoc"]),
    material: findAttrValue(attrs, ["material", "chat_lieu", "chất liệu", "chat lieu"]),
    style: findAttrValue(attrs, ["style", "kieu_dang", "kiểu dáng", "packaging"]),
    color: findAttrValue(attrs, ["color", "colour", "mau_sac", "màu sắc", "mau sac"]),
    thickness: findAttrValue(attrs, ["thickness", "do_day", "độ dày"]),
  };
}

export function CupConfigDetails({ item }: { item: any }) {
  if (!item) return null;

  let artwork = item.designFile?.artwork;
  if (!artwork && typeof item.designFile === "string") {
    try {
      const parsed = JSON.parse(item.designFile);
      artwork = parsed.artwork;
    } catch {}
  }

  const rawAttrs = {
    ...(artwork?.cup?.size ? { capacity: artwork.cup.size } : {}),
    ...(artwork?.cup?.materialType ? { material: artwork.cup.materialType } : {}),
    ...(artwork?.cup?.style ? { style: artwork.cup.style } : {}),
    ...(item.selectedSize ? { capacity: item.selectedSize } : {}),
    ...(item.selectedMaterial ? { material: item.selectedMaterial } : {}),
    ...(item.selectedStyle ? { style: item.selectedStyle } : {}),
    ...coerceVariantAttributes(item.attributes),
  };

  const kind = getItemKind(item);
  let attrs: Record<string, string>;

  if (kind === "cup") {
    attrs = getCanonicalCupAttrs(rawAttrs);
  } else if (kind === "ingredient") {
    attrs = getCanonicalIngredientAttrs(rawAttrs);
  } else if (kind === "packaging") {
    attrs = getCanonicalPackagingAttrs(rawAttrs);
  } else {
    attrs = rawAttrs;
  }

  // Deduplicate rows by normalized label and value
  const seenLabels = new Set<string>();
  const rows: { key: string; label: string; value: string }[] = [];

  for (const [key, rawValue] of Object.entries(attrs)) {
    if (rawValue === undefined || rawValue === null) continue;
    const valueStr = String(rawValue).trim();
    if (!valueStr) continue;

    const normKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
    const normVal = normalizeText(valueStr).replace(/[^a-z0-9]+/g, "");

    // Ignore keys equal to values (e.g., "1kg: 1kg") or internal SKU codes (tea, blk, org)
    if (normKey === normVal && normKey.length <= 4) continue;
    if (["tea", "blk", "org", "hrt", "pet", "pp", "clr", "wht"].includes(normKey)) continue;

    const label = labelFor(key, kind);
    const normLabel = normalizeText(label).replace(/[^a-z0-9]+/g, "");

    if (seenLabels.has(normLabel)) continue;
    seenLabels.add(normLabel);

    rows.push({
      key,
      label,
      value: displayValue(key, valueStr, kind),
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
      {rows.map((row, index) => (
        <span key={`${row.key}-${row.value}`} className="text-slate-600">
          {index > 0 ? <span className="mr-2 text-slate-300">•</span> : null}
          {row.label}: <strong className="font-bold text-[#253D4E] dark:text-zinc-200">{row.value}</strong>
        </span>
      ))}
    </div>
  );
}
