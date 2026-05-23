import type { CatalogProduct } from "@/types/api";

export const catalogProductFixtures: CatalogProduct[] = [
  {
    id: "catalog-plain-cup",
    productRefId: "WMS-CUP-500",
    slug: "ly-500ml-trong",
    name: "Ly 500ml trong",
    category: "plain_cup",
    price: 750,
    b2bPrice: 680,
    unit: "cái",
    stockSnapshot: 12_000,
    imageUrl: "",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "catalog-summer-cup",
    productRefId: "WMS-CUP-700-SUMMER",
    slug: "ly-700ml-in-summer",
    name: "Ly 700ml in Summer",
    category: "printed_cup",
    price: 1_250,
    b2bPrice: 1_120,
    unit: "cái",
    stockSnapshot: 4_500,
    imageUrl: "",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
];
