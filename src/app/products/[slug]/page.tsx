import { notFound } from "next/navigation";

import { ProductDetailView } from "@/features/catalog/components/product-detail-view";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ variantSku?: string }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const product = await getCatalogProductBySlug(slug);

  return (
    <ProductDetailView
      initialProduct={product}
      slug={slug}
      initialVariantSku={query.variantSku}
    />
  );
}
