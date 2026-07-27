import { notFound } from "next/navigation";

import { ProductDetailView } from "@/features/catalog/components/product-detail-view";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  return <ProductDetailView initialProduct={product} slug={slug} />;
}
