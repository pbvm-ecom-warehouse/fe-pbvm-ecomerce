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

    const fullPrompt = `${cleanPrompt}, masterpiece, 8k resolution, professional graphic design logo, sharp focus`;
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

    // SVG Vector fallback if external AI servers busy
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#10B981;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="512" cy="512" r="420" fill="none" stroke="url(#grad1)" stroke-width="24" />
      <text x="512" y="520" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="#059669" text-anchor="middle" letter-spacing="4">
        ${cleanPrompt.toUpperCase().slice(0, 20)}
      </text>
    </svg>`;

    const base64Svg = Buffer.from(svgContent).toString("base64");
    return NextResponse.json({
      dataUrl: `data:image/svg+xml;base64,${base64Svg}`,
      wantsTransparent,
    });
  } catch (error: any) {
    console.error("AI Logo Route Exception:", error);
    return NextResponse.json({ error: error?.message || "Internal Error" }, { status: 500 });
  }
}
