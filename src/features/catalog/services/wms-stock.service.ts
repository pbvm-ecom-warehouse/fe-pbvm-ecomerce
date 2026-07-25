import { wmsApiClient } from "@/lib/wms-api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import { setWmsAccessToken } from "@/lib/auth-token";
import { toast } from "sonner";

export async function wmsStaffLogin(username: string, password: string): Promise<string> {
  const response = await wmsApiClient.post<
    ApiEnvelope<{ accessToken: string }> | { accessToken: string }
  >("/auth/login", { username, password });
  const data = unwrapApiData(response.data);
  if (data.accessToken) {
    setWmsAccessToken(data.accessToken);
  }
  return data.accessToken;
}

export type WmsItemType = "CUP_BLANK" | "MATERIAL" | "PACKAGING" | "CUP_PRINTED";

export type WmsAttributeKey =
  | "CUP_STYLE"
  | "MATERIAL"
  | "CAPACITY"
  | "COLOR"
  | "MATERIAL_CATEGORY"
  | "MATERIAL_TYPE"
  | "FLAVOR"
  | "SPEC"
  | "PACKAGING_CATEGORY"
  | "PACKAGING_STYLE"
  | "COMPATIBILITY"
  | "DIAMETER"
  | "LENGTH"
  | "SIZE";

export type WmsAttributeOption = {
  _id: string;
  key: WmsAttributeKey;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
};

export type WmsSkuTemplateField = {
  key: WmsAttributeKey;
  name: string;
  required: boolean;
  order: number;
};

export type WmsCategoryOption = {
  _id: string;
  name: string;
  code: string;
};

export type WmsSkuTemplateResponse = {
  templateId: string;
  type: WmsItemType;
  prefix: string;
  pattern: string;
  selectedCategory?: WmsCategoryOption;
  categoryOptions?: WmsCategoryOption[];
  fields: WmsSkuTemplateField[];
};

export type WmsItemAttribute = {
  key: string;
  optionId?: string;
  name: string;
  value: string;
  code: string;
};

export type WmsWarehouseItem = {
  _id: string;
  id?: string;
  sku: string;
  barcode?: string;
  altBarcodes?: string[];
  name: string;
  type: WmsItemType;
  unit: string;
  isPerishable?: boolean;
  isActive: boolean;
  attributes?: WmsItemAttribute[];
  category?: string;
};

export type CreateWmsItemInput = {
  templateId: string;
  attributeOptionIds: string[];
  name: string;
  unit: string;
  altUnits?: { unit: string; factor: number }[];
  isPerishable?: boolean;
  nearExpiryDays?: number;
  minQuantity?: number;
  depth?: number;
  width?: number;
  height?: number;
  blankItemId?: string;
};

export async function getWmsSkuTemplate(
  type: WmsItemType,
  categoryOptionId?: string,
): Promise<WmsSkuTemplateResponse> {
  const response = await wmsApiClient.get<
    ApiEnvelope<WmsSkuTemplateResponse> | WmsSkuTemplateResponse
  >(`/stock/item-types/${type}/sku-template`, {
    params: categoryOptionId ? { categoryOptionId } : undefined,
  });
  return unwrapApiData(response.data);
}

export async function previewWmsSku(
  templateId: string,
  attributeOptionIds: string[],
): Promise<string> {
  const response = await wmsApiClient.post<
    ApiEnvelope<{ previewSku: string }> | { previewSku: string }
  >("/stock/items/sku-preview", {
    templateId,
    attributeOptionIds,
  });
  const data = unwrapApiData(response.data);
  return data.previewSku;
}

export async function listWmsItems(params?: {
  search?: string;
  type?: WmsItemType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: WmsWarehouseItem[]; total: number }> {
  const response = await wmsApiClient.get<
    | ApiEnvelope<{ data: WmsWarehouseItem[]; total: number }>
    | { data: WmsWarehouseItem[]; total: number }
  >("/stock/items", { params });
  const res = unwrapApiData(response.data);
  if (Array.isArray(res)) {
    return { data: res, total: res.length };
  }
  return res || { data: [], total: 0 };
}

export async function createWmsItem(
  input: CreateWmsItemInput,
): Promise<WmsWarehouseItem> {
  const response = await wmsApiClient.post<
    ApiEnvelope<WmsWarehouseItem> | WmsWarehouseItem
  >("/stock/items", input);
  return unwrapApiData(response.data);
}

// ── Attribute Option APIs ──────────────────────────────────────────────────

export async function listWmsAttributeOptions(
  key: string,
  includeInactive = false,
): Promise<WmsAttributeOption[]> {
  const response = await wmsApiClient.get<
    ApiEnvelope<WmsAttributeOption[]> | WmsAttributeOption[]
  >("/stock/attribute-options", {
    params: { key, includeInactive },
  });
  return unwrapApiData(response.data);
}

export async function suggestWmsAttributeOptionCode(
  key: string,
  name: string,
): Promise<string> {
  const response = await wmsApiClient.post<
    ApiEnvelope<{ code: string }> | { code: string }
  >("/stock/attribute-options/code-suggestion", { key, name });
  const data = unwrapApiData(response.data);
  return data.code;
}

export async function createWmsAttributeOption(input: {
  key: string;
  name: string;
  code: string;
  sortOrder?: number;
}): Promise<WmsAttributeOption> {
  const response = await wmsApiClient.post<
    ApiEnvelope<WmsAttributeOption> | WmsAttributeOption
  >("/stock/attribute-options", input);
  return unwrapApiData(response.data);
}

export async function updateWmsAttributeOption(
  id: string,
  input: { name?: string; isActive?: boolean; sortOrder?: number },
): Promise<WmsAttributeOption> {
  const response = await wmsApiClient.patch<
    ApiEnvelope<WmsAttributeOption> | WmsAttributeOption
  >(`/stock/attribute-options/${id}`, input);
  return unwrapApiData(response.data);
}
