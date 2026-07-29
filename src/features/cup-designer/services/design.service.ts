import { apiClient } from "@/lib/api-client";
import { unwrapApiData } from "@/lib/api-contract";

export type DesignResponse = {
  id: string;
  customerId: string;
  name: string;
  /** URL hoặc data URL của file artwork */
  file: string;
  /** URL ảnh xem trước */
  thumbnail: string;
  lastUsedAt: string | null;
};

export type DesignUploadResponse = {
  file: string;
  thumbnail: string;
};

function normalizeDesign(design: any): DesignResponse {
  return {
    ...design,
    id: design?.id ?? design?._id,
  } as DesignResponse;
}

/**
 * Upload artwork/image lên Cloudinary thông qua BE endpoint `POST /designs/upload`.
 * Nhận base64 dataUrl, chuyển thành File object, trả về { file, thumbnail } là Cloudinary URLs.
 */
export async function uploadDesignImage(dataUrl: string): Promise<DesignUploadResponse> {
  if (!dataUrl.startsWith("data:")) {
    return { file: dataUrl, thumbnail: dataUrl };
  }

  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const fileObj = new File([u8arr], "design-artwork.png", { type: mime });

  const formData = new FormData();
  formData.append("file", fileObj);

  const response = await apiClient.post<any>("/designs/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrapApiData(response.data);
}

/**
 * Lưu thiết kế mới vào thư viện của khách hàng.
 * `file` và `thumbnail` là URL storage (Cloudinary).
 * BE yêu cầu JWT (CustomerGuard).
 */
export async function createDesign(input: {
  name: string;
  /** URL của file artwork */
  file: string;
  /** URL thumbnail preview */
  thumbnail?: string;
}) {
  const response = await apiClient.post<any>("/designs", {
    name: input.name,
    file: input.file,
    thumbnail: input.thumbnail ?? input.file,
  });
  const payload = unwrapApiData(response.data) as any;
  const design = payload?.data ?? payload;
  return normalizeDesign(design);
}

export async function listMyDesigns(): Promise<DesignResponse[]> {
  const response = await apiClient.get<any>("/designs");
  const payload = unwrapApiData(response.data) as any;
  const designs = Array.isArray(payload?.data) ? payload.data : payload;
  return Array.isArray(designs) ? designs.map(normalizeDesign) : [];
}

export async function updateDesign(
  id: string,
  input: Partial<Pick<DesignResponse, "name" | "file" | "thumbnail">>,
) {
  const response = await apiClient.patch<any>(`/designs/${id}`, input);
  const payload = unwrapApiData(response.data) as any;
  const design = payload?.data ?? payload;
  return normalizeDesign(design);
}

export async function deleteDesign(id: string) {
  const response = await apiClient.delete<{ success?: boolean }>(`/designs/${id}`);
  return unwrapApiData(response.data);
}

