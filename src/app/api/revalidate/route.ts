import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/revalidate
 * Xóa Next.js cache cho catalog sau khi admin CRUD sản phẩm/danh mục.
 * Body: { tags?: string[], paths?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tags: string[] = body.tags ?? ["catalog-products", "catalog-categories"];
    const paths: string[] = body.paths ?? ["/", "/products"];

    for (const tag of tags) {
      revalidateTag(tag, "default");
    }

    for (const path of paths) {
      revalidatePath(path, "page");
    }

    return NextResponse.json({ revalidated: true, tags, paths });
  } catch (err) {
    console.error("[revalidate] error:", err);
    return NextResponse.json(
      { revalidated: false, error: String(err) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/revalidate?tag=catalog-products
 * Tiện lợi cho test nhanh trên browser.
 */
export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag") ?? "catalog-products";
  const path = req.nextUrl.searchParams.get("path") ?? "/";

  revalidateTag(tag, "default");
  revalidatePath(path, "page");
  revalidatePath("/products", "page");

  return NextResponse.json({ revalidated: true, tag, path });
}
