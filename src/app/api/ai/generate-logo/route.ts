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

    const fullPrompt = `${cleanPrompt}, flat vector graphic logo design, minimal clean icon motif, sharp contours, 8k resolution, centered emblem, masterpiece`;
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

    // High-quality SVG Vector fallback if external AI servers are busy
    const displayTitle = cleanPrompt.replace(/[^a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, "").trim();
    const shortTitle = (displayTitle || "LOGO DESIGN").toUpperCase().slice(0, 18);

    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#059669" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="1024" height="1024" fill="none"/>
      <g filter="url(#shadow)">
        <circle cx="512" cy="460" r="320" fill="none" stroke="url(#grad1)" stroke-width="28" />
        <polygon points="512,220 580,360 740,360 610,460 660,610 512,510 364,610 414,460 284,360 444,360" fill="url(#grad1)" opacity="0.85"/>
      </g>
      <text x="512" y="860" font-family="'Be Vietnam Pro', system-ui, sans-serif" font-size="64" font-weight="900" fill="#047857" text-anchor="middle" letter-spacing="3">
        ${shortTitle}
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
