import { notFound } from "next/navigation";

import { ProductDetailView } from "@/features/catalog/components/product-detail-view";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
