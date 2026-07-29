import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const prompt = body.prompt || body.brandName || "vector logo design";
    const includeText = body.includeText === true;
    const seed = Math.floor(Math.random() * 1000000);
    const rawLower = String(prompt).toLowerCase();

    // Phân tích thuộc tính Nền từ prompt
    let wantsTransparent = true;
    const hasExplicitBg =
      rawLower.includes("nền đen") ||
      rawLower.includes("nền trắng") ||
      rawLower.includes("nền vàng") ||
      rawLower.includes("nền đỏ") ||
      rawLower.includes("nền xanh") ||
      rawLower.includes("nền cam") ||
      rawLower.includes("nền màu") ||
      rawLower.includes("black background") ||
      rawLower.includes("solid background") ||
      rawLower.includes("red background") ||
      rawLower.includes("yellow background") ||
      rawLower.includes("blue background");

    const wantsExplicitNoBg =
      rawLower.includes("tách nền") ||
      rawLower.includes("không nền") ||
      rawLower.includes("nền trong suốt") ||
      rawLower.includes("transparent") ||
      rawLower.includes("no background") ||
      rawLower.includes("isolated white background");

    if (hasExplicitBg && !wantsExplicitNoBg) {
      wantsTransparent = false;
    }

    // Giữ nguyên toàn bộ câu chữ prompt (chỉ loại bỏ các ký tự điều khiển không hợp lệ)
    const cleanPrompt = String(prompt)
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const textDirective = includeText
      ? "include only the exact requested readable text, no extra words"
      : "no text, no letters, no words, no typography, no watermark";
    const fullPrompt = `${cleanPrompt}, ${textDirective}, flat vector graphic logo design, minimal clean icon motif, sharp contours, 8k resolution, centered emblem, masterpiece`;
    const encodedPrompt = encodeURIComponent(fullPrompt);

    const aiEndpoints = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`,
      `https://gen.pollinations.ai/image/${encodedPrompt}?width=1024&height=1024&seed=${seed}`,
    ];

    let response: Response | null = null;
    for (const url of aiEndpoints) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res && res.ok) {
          response = res;
          break;
        }
      } catch (e) {
        // Thử endpoint tiếp theo
      }
    }

    if (response && response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      return NextResponse.json({
        dataUrl: `data:${mimeType};base64,${base64}`,
        wantsTransparent,
      });
    }

    return NextResponse.json(
      {
        error: "AI image generation failed. Please try again with a clearer prompt.",
      },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("AI Logo Route Exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Error" }, { status: 500 });
  }
}
