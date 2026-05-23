import { describe, expect, it } from "vitest";

import { filterCatalogProducts } from "@/features/catalog/utils/catalog";
import { catalogProductFixtures } from "../fixtures/catalog-products";

describe("catalog filters", () => {
  it("filters by category", () => {
    const result = filterCatalogProducts(
      catalogProductFixtures,
      "",
      "plain_cup",
    );
    expect(result.every((product) => product.category === "plain_cup")).toBe(
      true,
    );
  });

  it("filters by name query", () => {
    const result = filterCatalogProducts(
      catalogProductFixtures,
      "summer",
      "all",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("ly-700ml-in-summer");
  });
});
