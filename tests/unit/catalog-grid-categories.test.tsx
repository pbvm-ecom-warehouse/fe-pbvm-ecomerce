import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const searchParamsMock = vi.hoisted(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/features/catalog/services/admin-catalog.service", () => ({
  subscribeProductSync: vi.fn(() => vi.fn()),
}));

vi.mock("@/features/catalog/components/product-card", () => ({
  ProductCard: ({ product }: any) => <div>{product.name}</div>,
}));

import { CatalogGridContent } from "@/features/catalog/components/catalog-grid";

describe("CatalogGrid categories", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("shows real API categories even when a category has no products yet", () => {
    render(
      <CatalogGridContent
        title="Tất cả sản phẩm"
        products={[]}
        categories={[
          {
            id: "cat-1",
            name: "Ly chưa in",
            slug: "ly-chua-in",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Tất cả" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ly chưa in" })).toBeInTheDocument();
  });
});
