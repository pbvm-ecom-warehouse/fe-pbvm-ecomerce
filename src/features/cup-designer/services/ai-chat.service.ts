import {
  parsePromptToBananaLogoOptions,
  generateBananaLogoArtworkAsync,
} from "./artwork-generator.service";
import { uploadImageToCloudinary } from "./cloudinary-upload.service";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  imageUrl?: string;
  timestamp: string;
}

export interface CupContext {
  materialType: string;
  style: string;
  size: string;
  layersCount: number;
  currentLayers?: Array<{
    type: string;
    prompt?: string;
    text?: string;
  }>;
}

/**
 * GOOGLE GEMINI LLM PROMPT DIRECTOR
 * Phân tích và chuyển đổi mọi yêu cầu chỉnh sửa/tạo logo của người dùng thành Prompt AI tiếng Anh chuyên sâu 8K,
 * hiểu rõ màu sắc, hình khối, chi tiết, phông chữ và ngữ cảnh của mẫu thiết kế hiện tại trên ly!
 */
async function translateAndExpandPromptWithLLM(
  userText: string,
  history: ChatMessage[],
  cupContext: CupContext,
  apiKey: string,
): Promise<string> {
  try {
    const recentHistoryStr = history
      .slice(-6)
      .map((m) => `${m.sender === "user" ? "Khách" : "AI"}: ${m.text}`)
      .join("\n");

    const currentCanvasSummary = (cupContext.currentLayers ?? [])
      .map((l) => (l.type === "image" ? `Existing Logo/Image Layer: "${l.prompt || "Logo thiết kế"}"` : `Text Layer: "${l.text}"`))
      .join("\n");

    const promptForLLM = `You are an expert AI Art Director for high-end corporate logo design.
Your task is to analyze the user's Vietnamese request and output a detailed, highly specific English AI Image Generation Prompt for a Diffusion Model.

Current Design/Logo on the Cup Canvas:
${currentCanvasSummary || "No logo currently on canvas (creating new logo)."}

Cup Specs: Material ${cupContext.materialType}, Style ${cupContext.style}, Size ${cupContext.size}

Recent Chat History:
${recentHistoryStr}

Current User Request: "${userText}"

Directives:
1. Carefully extract ALL requested details: colors (e.g. red, gold, metallic, yellow, emerald green, dark navy), shapes (circle, square, triangle, emblem), icons/subjects, typography/text, and background requirements (e.g. solid black background, solid red background, transparent/white isolated background).
2. IMPORTANT: If the user asks to edit/modify/change the current logo (e.g. "đổi sang màu đỏ", "bỏ nền", "đổi thành hình tròn", "sửa chữ thành Arknote", "thay chú gấu thành con rồng"), APPLY THAT MODIFICATION DIRECTLY ONTO THE EXISTING LOGO CONTEXT ("${currentCanvasSummary || ""}")! Maintain the subject, style, and brand identity unless explicitly told to change it.
3. Output ONLY the final 1-sentence English prompt. No explanation, no markdown quotes.`;


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptForLLM }] }],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (translated && translated.trim().length > 5) {
        return translated.trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (err) {
    console.warn("LLM prompt translation failed, falling back to raw prompt:", err);
  }

  return userText;
}

export async function sendChatMessageToAi(
  userText: string,
  history: ChatMessage[],
  cupContext: CupContext,
): Promise<{ text: string; imageUrl?: string; logoPromptInfo?: string }> {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_AI_API_KEY ||
    process.env.NEXT_PUBLIC_BANANA_API_KEY ||
    "";


  const lower = userText.toLowerCase();

  // Nhận diện bất kỳ yêu cầu liên quan đến logo, chỉnh sửa màu sắc, hình khối, nền, chữ...
  const isDirectLogoCreation =
    lower.includes("logo") ||
    lower.includes("tạo") ||
    lower.includes("vẽ") ||
    lower.includes("in") ||
    lower.includes("thiết kế") ||
    lower.includes("sách") ||
    lower.includes("mèo") ||
    lower.includes("cà phê") ||
    lower.includes("trà") ||
    lower.includes("vương miện") ||
    lower.includes("ngôi sao") ||
    lower.includes("lửa") ||
    lower.includes("kim cương") ||
    lower.includes("dragon") ||
    lower.includes("rồng") ||
    lower.includes("quán");

  const isLogoModification =
    lower.includes("bỏ nền") ||
    lower.includes("tách nền") ||
    lower.includes("xóa nền") ||
    lower.includes("đổi nền") ||
    lower.includes("sửa nền") ||
    lower.includes("đổi màu") ||
    lower.includes("thay màu") ||
    lower.includes("màu") ||
    lower.includes("đổi hình") ||
    lower.includes("sửa logo") ||
    lower.includes("chỉnh logo") ||
    lower.includes("chỉnh lại") ||
    lower.includes("đổi chữ") ||
    lower.includes("thêm slogan") ||
    lower.includes("thay logo") ||
    lower.includes("bỏ chữ") ||
    lower.includes("làm tròn") ||
    lower.includes("làm vuông") ||
    lower.includes("đổi sang") ||
    lower.includes("chuyển sang") ||
    lower.includes("thành hình") ||
    lower.includes("thành màu") ||
    lower.includes("sửa thành") ||
    lower.includes("đổi thành");

  const isLogoRequest = isDirectLogoCreation || isLogoModification;

  let imageUrl: string | undefined = undefined;
  let logoPromptInfo: string | undefined = undefined;

  // 1. KHI TẠO HOẶC CHỈNH SỬA LOGO: DÙNG GEMINI LLM ĐỌC HIỂU CHI TIẾT & CHUYỂN THÀNH PROMPT SẮC NÉT
  if (isLogoRequest) {
    // Dùng Gemini LLM để đọc toàn bộ ngữ cảnh và tạo câu lệnh prompt tiếng Anh siêu chuẩn xác
    const structuredEnglishPrompt = await translateAndExpandPromptWithLLM(
      userText,
      history,
      cupContext,
      apiKey,
    );


    const logoOptions = parsePromptToBananaLogoOptions(userText);
    logoPromptInfo = logoOptions.brandName;

    // Tạo ảnh logo (trả về base64 dataUrl)
    const rawDataUrl = await generateBananaLogoArtworkAsync(logoOptions, structuredEnglishPrompt);

    // Upload lên Cloudinary để có URL bền vững, gửi cho BE
    try {
      imageUrl = await uploadImageToCloudinary(rawDataUrl);
    } catch (uploadErr) {
      console.warn("Cloudinary upload thất bại, dùng base64 tạm thời:", uploadErr);
      imageUrl = rawDataUrl; // fallback: vẫn dùng base64 nếu Cloudinary chưa cấu hình
    }


    return {
      text: isLogoModification ? "Đã cập nhật chỉnh sửa logo theo yêu cầu!" : "Đã tạo thành công!",
      imageUrl,
      logoPromptInfo,
    };
  }

  // 2. KHI TRÒ CHUYỆN HỎI ĐÁP THÔNG THƯỜNG
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Bạn là Trợ lý AI chuyên gia tư vấn thiết kế logo & in ấn ly thương hiệu cho PBVM E-commerce.
Thông tin ly hiện tại khách chọn: Dung tích ${cupContext.size}, Chất liệu ${cupContext.materialType}, Kiểu dáng ${cupContext.style}.
Lịch sử trò chuyện gần đây:
${history.slice(-4).map((m) => `${m.sender === "user" ? "Khách" : "AI"}: ${m.text}`).join("\n")}

Khách hàng nhắn: "${userText}"

Hãy trả lời tự nhiên, ngắn gọn, thân thiện và chuyên nghiệp bằng tiếng Việt (1-2 câu).`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        return { text: aiReply.trim(), imageUrl, logoPromptInfo };
      }
    }
  } catch (err) {
    console.warn("Gemini AI API Call Failed:", err);
  }

  return {
    text: "Xin chào! Tôi có thể giúp bạn tạo mới hoặc chỉnh sửa logo (đổi màu sắc, hình khối, bỏ nền, thêm chi tiết...) cho chiếc ly của bạn.",
    imageUrl,
    logoPromptInfo,
  };
}
