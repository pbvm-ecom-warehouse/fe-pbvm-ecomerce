"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { CatalogProduct } from "@/types/api";

export function AddToCartButton({
  product,
  quantity = 1,
  selectedSize,
  selectedMaterial,
  selectedStyle,
  attributes,
  className,
  variant = "default",
  disabled: customDisabled,
}: {
  product: CatalogProduct;
  quantity?: number;
  selectedSize?: string;
  selectedMaterial?: string;
  selectedStyle?: string;
  attributes?: Record<string, string>;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  disabled?: boolean;
}) {
  const addProduct = useCartStore((state) => state.addProduct);
  const disabled = customDisabled ?? (product.stockSnapshot <= 0);

  return (
    <Button
      className={className}
      variant={variant}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        addProduct(product, quantity, {
          selectedSize,
          selectedMaterial,
          selectedStyle,
          attributes,
        });
        toast.success("Đã thêm vào giỏ hàng");
      }}
    >
      <ShoppingCart data-icon="inline-start" className="size-3.5 mr-1" />
      {disabled ? "Hết hàng" : "Thêm"}
    </Button>
  );
}
