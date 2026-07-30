import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "@/features/catalog/components/product-card";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";
import type { CatalogProduct } from "@/types/api";

const addProductMock = vi.fn();

vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    return <img {...props} />;
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/stores/cart-store", () => ({
  useCartStore: (selector: any) => selector({ addProduct: addProductMock }),
}));

vi.mock("@/features/catalog/services/catalog.service", async () => {
  const actual = await vi.importActual<typeof import("@/features/catalog/services/catalog.service")>(
    "@/features/catalog/services/catalog.service",
  );
  return {
    ...actual,
    getCatalogProductBySlug: vi.fn(),
  };
});

const ingredientProduct = {
  id: "product-1",
  productRefId: "",
  slug: "tra-den-assam",
  name: "Nguyen lieu tra den Assam",
  description: "",
  category: "ingredient",
  price: 120_000,
  b2bPrice: 120_000,
  unit: "goi",
  stockSnapshot: 2,
  imageUrl: "/images/product-placeholder.svg",
  updatedAt: "2026-07-28T00:00:00.000Z",
  variants: [
    {
      id: "variant-1",
      sku: "ING-TEA-ASSAM-500G",
      productId: "product-1",
      attributes: { weight: "500g", flavor: "Tra den" },
      price: 120_000,
      availableQty: 2,
      fulfillmentType: "STANDARD",
      isActive: true,
    },
  ],
} satisfies CatalogProduct;

describe("product card cart flow", () => {
  it("fetches product detail, defaults quantity from selected stock, and caps quantity by variant stock", async () => {
    vi.mocked(getCatalogProductBySlug).mockResolvedValue(ingredientProduct);
    addProductMock.mockClear();

    render(<ProductCard product={ingredientProduct} />);

    fireEvent.click(screen.getByRole("button", { name: /th/i }));

    await waitFor(() => {
      expect(getCatalogProductBySlug).toHaveBeenCalledWith("tra-den-assam");
    });

    expect(await screen.findByText(/Khối lượng|Trọng lượng/i)).toBeInTheDocument();
    expect(screen.getByText("Hương vị")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "500g" }));
    fireEvent.click(screen.getByRole("button", { name: "Tra den" }));

    const addToCartButton = screen.getByRole("button", { name: /thêm vào giỏ/i });
    const quantityPanel = screen.getByText(/S.*l/i).closest("div");
    expect(quantityPanel).toBeTruthy();
    expect(within(quantityPanel!).getByText("1")).toBeInTheDocument();
    expect(addToCartButton).toBeEnabled();

    const increaseButton = within(quantityPanel!).getByRole("button", { name: "Tăng số lượng" });
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    expect(within(quantityPanel!).getByText("2")).toBeInTheDocument();
    fireEvent.click(addToCartButton);

    expect(addProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productRefId: "ING-TEA-ASSAM-500G",
        price: 120_000,
        stockSnapshot: 2,
      }),
      2,
      expect.objectContaining({
        attributes: expect.objectContaining({
          weight: "500g",
          flavor: "Tra den",
        }),
      }),
    );
  });
});
