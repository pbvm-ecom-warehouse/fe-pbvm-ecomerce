import { StorefrontHome } from "@/features/catalog/components/storefront-home";
import { listCatalogProducts } from "@/features/catalog/services/catalog.service";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";

export default async function HomePage() {
  const products = await listCatalogProducts();
  const featuredProducts = products.data.slice(0, 8);

  return <StorefrontHome featuredProducts={featuredProducts} />;
}
