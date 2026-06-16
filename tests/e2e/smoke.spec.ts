import { expect, test } from "@playwright/test";

test("loads storefront and cart", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Đặt hàng nhanh/i }),
  ).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /Giỏ hàng/i })).toBeVisible();
});

test("loads custom cup designer fallback route", async ({ page }) => {
  await page.goto("/design-cup");
  await expect(
    page.getByRole("heading", { name: /Thiết kế ly custom/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm vào giỏ/i })).toBeVisible();
});
