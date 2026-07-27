import { describe, expect, it } from "vitest";

import {
  buildVariantAttributeRows,
  coerceVariantAttributes,
  normalizeVariantAttributes,
} from "@/features/catalog/utils/variant-attributes";

describe("variant attribute utilities", () => {
  it("reads only explicit normalized attributes from the API payload", () => {
    expect(
      normalizeVariantAttributes(
        {
          capacity: "700ml",
          style: "Trụ tròn",
          material: "Nhựa PP",
          color: "Trắng sữa",
        },
        "CUP-RND-PP-700-WHT",
      ),
    ).toEqual({
      capacity: "700ml",
      style: "Trụ tròn",
      material: "Nhựa PP",
      color: "Trắng sữa",
    });
  });

  it("does not infer attributes from SKU or coded keys", () => {
    expect(
      normalizeVariantAttributes(
        {
          rnd: "Trụ tròn",
          pp: "Nhựa PP",
          wht: "Trắng sữa",
        },
        "CUP-RND-PP-700-WHT",
      ),
    ).toEqual({
      capacity: "",
      style: "",
      material: "",
      color: "",
    });
  });

  it("reads Vietnamese and camelCase attribute keys without translating values", () => {
    expect(
      normalizeVariantAttributes(
        {
          "dung tích": "700ml",
          materialType: "PP",
          mauSac: "WHT",
        },
        "CUP-RND-PP-700",
      ),
    ).toEqual({
      capacity: "700ml",
      style: "",
      material: "PP",
      color: "WHT",
    });
  });

  it("builds display rows with every variant attribute from the API", () => {
    expect(
      buildVariantAttributeRows({
        capacity: "700ml",
        style: "Trụ tròn",
        material: "Nhựa PP",
        color: "Trắng sữa",
        rim: "95mm",
        packaging: "20 cây x 50 ly",
        barcode: "893000000001",
      }),
    ).toEqual([
      { label: "Dung tích", value: "700ml" },
      { label: "Kiểu dáng", value: "Trụ tròn" },
      { label: "Chất liệu", value: "Nhựa PP" },
      { label: "Màu sắc", value: "Trắng sữa" },
      { label: "rim", value: "95mm" },
      { label: "packaging", value: "20 cây x 50 ly" },
      { label: "barcode", value: "893000000001" },
    ]);
  });

  it("coerces array attributes from the API without inventing values", () => {
    expect(
      coerceVariantAttributes([
        { key: "capacity", value: "700ml" },
        { name: "style", value: "Trụ tròn" },
        { label: "material", value: "Nhựa PP" },
        { key: "color", value: "Trắng sữa" },
      ]),
    ).toEqual({
      capacity: "700ml",
      style: "Trụ tròn",
      material: "Nhựa PP",
      color: "Trắng sữa",
    });
  });
});
