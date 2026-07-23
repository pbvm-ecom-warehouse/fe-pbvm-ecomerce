export interface BananaLogoOptions {
  brandName: string;
  transparentBg?: boolean;
}

export function parsePromptToBananaLogoOptions(promptText: string): BananaLogoOptions {
  let cleanBrand = promptText.trim();
  const matchQuotes = cleanBrand.match(/["'“]([^"'”]+)["'”]/);
  if (matchQuotes && matchQuotes[1]) {
    cleanBrand = matchQuotes[1].trim();
  }
  return {
    brandName: cleanBrand || "LOGO",
    transparentBg: true,
  };
}

/**
 * THUẬT TOÁN TÁCH NỀN THÔNG MINH ĐA SẮC (SMART DUAL-COLOR BACKGROUND REMOVER)
 * Tự động lấy mẫu 4 góc ảnh để nhận biết nền Đen hay nền Trắng do AI sinh ra, 
 * sau đó xóa sạch nền đen/trắng thành TRANSPARENT PNG 100%!
 */
export async function removeWhiteBackgroundFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 1024;
        canvas.height = img.height || 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageUrl);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const w = canvas.width;
        const h = canvas.height;

        // Lấy mẫu độ sáng tại 4 góc tệp ảnh
        const cornerIndices = [
          0, // Góc trên-trái
          (w - 1) * 4, // Góc trên-phải
          (h - 1) * w * 4, // Góc dưới-trái
          ((h - 1) * w + (w - 1)) * 4, // Góc dưới-phải
        ];

        let totalBrightness = 0;
        cornerIndices.forEach((idx) => {
          totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        });
        const avgCornerBrightness = totalBrightness / cornerIndices.length;

        // Nhận diện nếu nền là Nền Đen (< 80) hay Nền Trắng (>= 80)
        const isDarkBackground = avgCornerBrightness < 80;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          if (isDarkBackground) {
            // Tách Nền Đen
            if (brightness < 45) {
              data[i + 3] = 0; // Trong suốt 100%
            } else if (brightness < 85) {
              const alphaFactor = (brightness - 45) / 40;
              data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
            }
          } else {
            // Tách Nền Trắng
            if (brightness > 215) {
              data[i + 3] = 0; // Trong suốt 100%
            } else if (brightness > 180) {
              const alphaFactor = (215 - brightness) / 35;
              data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

/**
 * 100% PURE AI MODEL GENERATION
 * (Tự động đáp ứng đúng yêu cầu của người dùng về Hình Khối Tròn / Vuông và Có Nền / Tách Nền)
 */
export async function generateBananaLogoArtworkAsync(
  options: BananaLogoOptions,
  rawUserPrompt?: string,
): Promise<string> {
  const promptInput = rawUserPrompt || options.brandName || "logo design";

  const res = await fetch("/api/ai/generate-logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptInput, brandName: options.brandName }),
  });

  if (!res.ok) {
    throw new Error(`Máy chủ AI không thể tạo ảnh: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data?.dataUrl) {
    throw new Error("Máy chủ AI không phản hồi dữ liệu ảnh.");
  }

  // Nếu người dùng yêu cầu CÓ NỀN (ví dụ: "có nền đen", "nền vàng"), giữ nguyên nền ảnh do AI tạo!
  // Nếu người dùng yêu cầu TÁCH NỀN hoặc không yêu cầu nền màu cụ thể, tự động bóc tách nền!
  if (data.wantsTransparent !== false) {
    return await removeWhiteBackgroundFromImage(data.dataUrl);
  }

  return data.dataUrl;
}
