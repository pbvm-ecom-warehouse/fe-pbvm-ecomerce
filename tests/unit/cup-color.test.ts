import { describe, expect, it } from "vitest";

import { resolveCupColorFromVariant } from "@/features/cup-designer/utils/cup-color";

describe("resolveCupColorFromVariant", () => {
  it("uses a hex color from the variant API directly", () => {
    expect(resolveCupColorFromVariant({ color: "#abc" })).toBe("#abc");
    expect(resolveCupColorFromVariant({ attributes: { color: "#F8F4EC" } })).toBe("#F8F4EC");
  });

  it("maps common cup variant color names to 3D preview colors", () => {
    expect(resolveCupColorFromVariant({ color: "Trắng sữa" })).toBe("#F8F4EC");
    expect(resolveCupColorFromVariant({ attributes: { color: "Trong suốt" } })).toBe("#FAF9F6");
    expect(resolveCupColorFromVariant({ attributes: { "màu sắc": "Đen" } })).toBe("#1E293B");
  });

  it("maps coded color attributes from cup SKUs", () => {
    expect(resolveCupColorFromVariant({ attributes: { color: "WHT" } })).toBe("#F8F4EC");
    expect(resolveCupColorFromVariant({ attributes: { color: "CLR" } })).toBe("#FAF9F6");
  });

  it("returns null when the API has no usable color value", () => {
    expect(resolveCupColorFromVariant({})).toBeNull();
    expect(resolveCupColorFromVariant({ color: "-" })).toBeNull();
  });
});
