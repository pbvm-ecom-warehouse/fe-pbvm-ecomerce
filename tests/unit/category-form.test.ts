import { describe, expect, it } from "vitest";

import {
  buildCategorySubmitPayload,
  sanitizeCategorySlug,
} from "@/features/catalog/utils/category-form";

describe("category form payload", () => {
  it("does not send slug when editing only changes the category name", () => {
    expect(
      buildCategorySubmitPayload({
        name: "Ly chưa in mới",
        slug: "ly-chua-in",
        position: 1,
        editingCategory: { id: "cat-1", slug: "ly-chua-in" },
      }).payload,
    ).toEqual({
      name: "Ly chưa in mới",
      position: 1,
    });
  });

  it("builds a Vietnamese-safe slug for new categories", () => {
    expect(sanitizeCategorySlug("Đồ dùng đóng gói")).toBe("do-dung-dong-goi");
  });
});
