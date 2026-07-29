export interface BananaLogoOptions {
  brandName: string;
  includeText?: boolean;
  transparentBg?: boolean;
}

export function promptRequestsText(promptText: string): boolean {
  const normalized = promptText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

  return [
    "chu",
    "text",
    "ten",
    "brand name",
    "typography",
    "wordmark",
    "slogan",
    "ghi",
    "viet",
    "them slogan",
    "doi chu",
    "sua chu",
  ].some((keyword) => normalized.includes(keyword));
}

export function parsePromptToBananaLogoOptions(promptText: string): BananaLogoOptions {
  let cleanBrand = promptText.trim();
  const matchQuotes = cleanBrand.match(/["'“]([^"'”]+)["'”]/);
  if (matchQuotes && matchQuotes[1]) {
    cleanBrand = matchQuotes[1].trim();
  }
  const includeText = promptRequestsText(promptText);
  return {
    brandName: includeText ? cleanBrand : "",
    includeText,
    transparentBg: true,
  };
}

/**
 * THUẬT TOÁN TÁCH NỀN AI THÔNG MINH CAO CẤP (SMART ADAPTIVE BACKGROUND REMOVER)
 * Tự động lấy mẫu góc ảnh để nhận biết màu nền chính xác (nền trắng, nền đen, hoặc nền đơn sắc),
 * thực hiện khử viền mịn (soft edge alpha matting) loại bỏ triệt để viền nhiễu xung quanh logo.
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

        // 1. Lấy mẫu trung bình màu R, G, B tại 4 viền góc của bức ảnh
        const samplePoints = [
          0,
          (w - 1) * 4,
          (h - 1) * w * 4,
          ((h - 1) * w + (w - 1)) * 4,
          Math.floor(w / 2) * 4,
          Math.floor((h - 1) * w + w / 2) * 4,
        ];

        let sumR = 0, sumG = 0, sumB = 0;
        samplePoints.forEach((idx) => {
          sumR += data[idx] ?? 255;
          sumG += data[idx + 1] ?? 255;
          sumB += data[idx + 2] ?? 255;
        });

        const bgR = sumR / samplePoints.length;
        const bgG = sumG / samplePoints.length;
        const bgB = sumB / samplePoints.length;
        const bgBrightness = (bgR + bgG + bgB) / 3;

        const isDarkBackground = bgBrightness < 80;

        // 2. Duyệt qua từng pixel và áp dụng thuật toán Alpha Matting mềm mịn
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Khoảng cách Euclidian giữa màu pixel và màu nền chuẩn
          const colorDistance = Math.sqrt(
            (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
          );

          if (isDarkBackground) {
            // Tách Nền Đen
            if (colorDistance < 40) {
              data[i + 3] = 0; // Trong suốt hoàn toàn
            } else if (colorDistance < 80) {
              const alphaRatio = (colorDistance - 40) / 40;
              data[i + 3] = Math.floor((data[i + 3] ?? 255) * alphaRatio);
            }
          } else {
            // Tách Nền Trắng / Nền Sáng
            if (colorDistance < 45) {
              data[i + 3] = 0; // Trong suốt hoàn toàn
            } else if (colorDistance < 90) {
              const alphaRatio = (colorDistance - 45) / 45;
              data[i + 3] = Math.floor((data[i + 3] ?? 255) * alphaRatio);
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
    body: JSON.stringify({
      prompt: promptInput,
      brandName: options.brandName,
      includeText: options.includeText === true,
    }),
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
