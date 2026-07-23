import { uploadDesignImage } from "./design.service";

/**
 * Upload ảnh (base64 dataUrl) lên Cloudinary qua Backend NestJS endpoint `POST /designs/upload`.
 * Trả về Cloudinary URL để lưu và hiển thị.
 */
export async function uploadImageToCloudinary(
  dataUrl: string
): Promise<string> {
  if (!dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  const result = await uploadDesignImage(dataUrl);
  return result.file || result.thumbnail || dataUrl;
}

