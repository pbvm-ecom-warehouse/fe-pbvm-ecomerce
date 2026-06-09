"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { CatalogProduct } from "@/types/api";

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  variant = "default",
}: {
  product: CatalogProduct;
  quantity?: number;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
}) {
  const addProduct = useCartStore((state) => state.addProduct);
  const disabled = product.stockSnapshot <= 0;

  return (
    <Button
      className={className}
      variant={variant}
      disabled={disabled}
      onClick={() => {
        addProduct(product, quantity);
        toast.success("Đã thêm vào giỏ hàng");
      }}
    >
      <ShoppingCart data-icon="inline-start" className="size-3.5 mr-1" />
      {disabled ? "Hết hàng" : "Thêm"}
    </Button>
  );
}
