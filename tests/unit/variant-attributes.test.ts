import { describe, expect, it } from "vitest";

import {
  buildVariantAttributeRows,
  collectVariantAttributes,
  collectWmsItemVariantAttributes,
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

  it("normalizes coded cup attributes when the API sends SKU-code keys", () => {
    expect(
      collectVariantAttributes({
        sku: "CUP-RND-PP-700-WHT",
        attributes: {
          "700": "700ml",
          rnd: "Trụ tròn",
          pp: "Nhựa PP",
          wht: "Trắng sữa",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        capacity: "700ml",
        style: "Trụ tròn",
        material: "Nhựa PP",
        color: "Trắng sữa",
      }),
    );
  });

  it("normalizes coded material attributes when the API sends SKU-code keys", () => {
    expect(
      collectVariantAttributes({
        sku: "MAT-TEA-BLK-ORG-500G",
        attributes: {
          tea: "Trà",
          blk: "Trà đen",
          org: "Nguyên bản",
          "500g": "500g",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        category: "Trà",
        type: "Trà đen",
        flavor: "Nguyên bản",
        weight: "500g",
      }),
    );
  });

  it("normalizes coded packaging attributes when the API sends SKU-code keys", () => {
    expect(
      collectVariantAttributes({
        sku: "PKG-STRAW",
        attributes: {
          straw: "Ống hút",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        packaging: "Ống hút",
        style: "Ống hút",
      }),
    );
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

  it("collects attributes from variant-level API fields for admin variants", () => {
    expect(
      collectVariantAttributes({
        sku: "MAT-TEA-BLK-ORG-500G",
        attributeValues: [
          { key: "weight", value: "500g" },
          { key: "packaging", value: "Túi bạc" },
        ],
        variantAttributes: {
          origin: "Việt Nam",
        },
        color: "Đen",
      }),
    ).toEqual(
      expect.objectContaining({
        weight: "500g",
        packaging: "Túi bạc",
        origin: "Việt Nam",
        color: "Đen",
      }),
    );
  });

  it("maps WMS item attributes by their real attribute keys", () => {
    expect(
      collectWmsItemVariantAttributes({
        sku: "PKG-STRAW-12MM-BLK",
        attributes: [
          { key: "PACKAGING_CATEGORY", value: "Ống hút", code: "STRAW" },
          { key: "SIZE", value: "12mm", code: "12MM" },
          { key: "COLOR", value: "Đen", code: "BLK" },
        ],
      }),
    ).toEqual({
      style: "Ống hút",
      packaging: "Ống hút",
      size: "12mm",
      color: "Đen",
    });
  });
});
