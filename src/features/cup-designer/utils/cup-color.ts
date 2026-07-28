function normalizeColorToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readVariantColor(variant: any) {
  const attrs = variant?.attributes ?? {};
  return (
    variant?.color ||
    attrs.color ||
    attrs.colour ||
    attrs["màu sắc"] ||
    attrs["mau sac"] ||
    attrs["màu"] ||
    attrs.mau ||
    ""
  );
}

export function resolveCupColorFromVariant(variant: any): string | null {
  const rawColor = String(readVariantColor(variant) || "").trim();
  if (!rawColor || rawColor === "-") return null;

  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(rawColor)) {
    return rawColor;
  }

  const token = normalizeColorToken(rawColor);
  if (!token) return null;

  if (["clr", "clear", "transparent", "trong suot", "tu nhien"].some((value) => token.includes(value))) {
    return "#FAF9F6";
  }

  if (["wht", "white", "trang sua", "trang kem", "trang"].some((value) => token.includes(value))) {
    return "#F8F4EC";
  }

  if (["blk", "black", "den"].some((value) => token.includes(value))) {
    return "#1E293B";
  }

  if (token.includes("hong") || token.includes("pink")) {
    return "#FCE7F3";
  }

  if (token.includes("mint")) {
    return "#D1FAE5";
  }

  if (token.includes("xanh") || token.includes("blue")) {
    return "#E0F2FE";
  }

  if (token.includes("vang") || token.includes("yellow")) {
    return "#FEF3C7";
  }

  return null;
}
