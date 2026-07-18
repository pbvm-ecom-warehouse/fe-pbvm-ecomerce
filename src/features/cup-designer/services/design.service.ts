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

/**
 * Lưu thiết kế mới vào thư viện của khách hàng.
 * `file` và `thumbnail` là data URLs (base64) hoặc URL storage.
 * BE yêu cầu JWT (CustomerGuard).
 */
export async function createDesign(input: {
  name: string;
  /** data URL hoặc URL của file artwork */
  file: string;
  /** data URL hoặc URL thumbnail preview */
  thumbnail?: string;
}) {
  const response = await apiClient.post<any>("/designs", {
    name: input.name,
    file: input.file,
    thumbnail: input.thumbnail ?? input.file,
  });
  return unwrapApiData(response.data);
}

export async function listMyDesigns(): Promise<DesignResponse[]> {
  const response = await apiClient.get<any>("/designs");
  return unwrapApiData(response.data);
}

export async function deleteDesign(id: string) {
  const response = await apiClient.delete<{ success?: boolean }>(`/designs/${id}`);
  return unwrapApiData(response.data);
}
