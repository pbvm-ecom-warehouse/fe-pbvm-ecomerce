import type { CupMaterialType, CupStyle, CupSize } from "@/types/api";
import {
  CUP_MATERIAL_LABELS,
  CUP_STYLE_LABELS,
  CUP_SIZE_LABELS,
} from "@/features/cup-designer/utils/artwork";

function parseSpecsFromText(text: string) {
  const t = (text || "").toLowerCase();

  let size = "";
  if (t.includes("1000ml") || t.includes("1000 ml") || t.includes("1l")) size = "1000ml";
  else if (t.includes("750ml") || t.includes("750 ml") || t.includes("750")) size = "750ml";
  else if (t.includes("700ml") || t.includes("700 ml") || t.includes("700")) size = "700ml";
  else if (t.includes("500ml") || t.includes("500 ml") || t.includes("500")) size = "500ml";
  else if (t.includes("350ml") || t.includes("350 ml") || t.includes("350")) size = "350ml";

  let material = "";
  if (t.includes("pet") || t.includes("nhựa trong") || t.includes("trong")) material = "clear";
  else if (t.includes("pp") || t.includes("nhựa mờ") || t.includes("mờ")) material = "frosted";
  else if (t.includes("giấy") || t.includes("paper") || t.includes("kraft")) material = "paper";
  else if (t.includes("thủy tinh") || t.includes("glass")) material = "glass";

  let style = "";
  if (t.includes("bầu") || t.includes("u-shape") || t.includes("đáy u")) style = "u_shape";
  else if (t.includes("tim")) style = "heart";
  else if (t.includes("thẳng") || t.includes("straight")) style = "straight";
  else if (t.includes("mug") || t.includes("quai")) style = "mug";

  return { size, material, style };
}

export function CupConfigDetails({ item }: { item: any }) {
  if (!item) return null;

  // Parse artwork from designFile (object or JSON string)
  let artwork = item.designFile?.artwork;
  if (!artwork && typeof item.designFile === "string") {
    try {
      const parsed = JSON.parse(item.designFile);
      artwork = parsed.artwork;
    } catch {
      // ignore
    }
  }

  const parsedFromText = parseSpecsFromText(`${item.name || ""} ${item.slug || ""} ${item.sku || ""}`);

  // Resolve Specs dynamically from data
  const rawSize =
    artwork?.cup?.size ||
    item.selectedSize ||
    item.attributes?.size ||
    item.attributes?.capacity ||
    item.attributes?.["dung tích"] ||
    parsedFromText.size ||
    (item.isPrintItem || item.fulfillmentType === "CUSTOM_PRINT" || item.name?.toLowerCase().includes("ly") ? "500ml" : "");

  const sizeLabel = rawSize ? (CUP_SIZE_LABELS[rawSize as CupSize] || rawSize) : "";

  const rawMaterial =
    artwork?.cup?.materialType ||
    item.selectedMaterial ||
    item.attributes?.material ||
    item.attributes?.["chất liệu"] ||
    parsedFromText.material ||
    (item.isPrintItem || item.fulfillmentType === "CUSTOM_PRINT" || item.name?.toLowerCase().includes("ly") ? "frosted" : "");

  const materialLabel = rawMaterial ? (CUP_MATERIAL_LABELS[rawMaterial as CupMaterialType] || rawMaterial) : "";

  const rawStyle =
    artwork?.cup?.style ||
    item.selectedStyle ||
    item.attributes?.style ||
    item.attributes?.["kiểu dáng"] ||
    parsedFromText.style ||
    (item.isPrintItem || item.fulfillmentType === "CUSTOM_PRINT" || item.name?.toLowerCase().includes("ly") ? "straight" : "");

  const styleLabel = rawStyle ? (CUP_STYLE_LABELS[rawStyle as CupStyle] || rawStyle) : "";

  const printHeightPercent = artwork?.artboard?.printHeightPercent || artwork?.printHeightPercent;

  // Check if item is a cup or has any specs
  const isCup = Boolean(
    sizeLabel ||
    materialLabel ||
    styleLabel ||
    item.isPrintItem ||
    item.fulfillmentType === "CUSTOM_PRINT" ||
    item.name?.toLowerCase().includes("ly") ||
    item.sku?.toLowerCase().includes("cup")
  );

  if (!isCup && (!item.attributes || Object.keys(item.attributes).length === 0)) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground font-medium">
      {sizeLabel && (
        <span>
          Dung tích: <strong className="font-bold text-[#253D4E] dark:text-zinc-200">{sizeLabel}</strong>
        </span>
      )}
      {sizeLabel && materialLabel && <span className="text-slate-300">•</span>}
      {materialLabel && (
        <span>
          Loại ly: <strong className="font-bold text-[#253D4E] dark:text-zinc-200">{materialLabel}</strong>
        </span>
      )}
      {(sizeLabel || materialLabel) && styleLabel && styleLabel !== "Dáng tiêu chuẩn" && <span className="text-slate-300">•</span>}
      {styleLabel && styleLabel !== "Dáng tiêu chuẩn" && (
        <span>
          Dáng: <strong className="font-bold text-[#253D4E] dark:text-zinc-200">{styleLabel}</strong>
        </span>
      )}
      {printHeightPercent && (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-primary font-bold">Vùng in {printHeightPercent}%</span>
        </>
      )}
      {item.attributes &&
        Object.entries(item.attributes)
          .filter(([k]) => !["size", "capacity", "dung tích", "material", "chất liệu", "style", "kiểu dáng"].includes(k.toLowerCase()))
          .map(([k, v]) => (
            <span key={k} className="text-slate-600">
              • {k}: <strong className="font-semibold">{String(v)}</strong>
            </span>
          ))}
    </div>
  );
}
