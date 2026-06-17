import { expect, test } from "@playwright/test";

test("loads storefront and cart", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Nâng tầm thương hiệu/i }),
  ).toBeVisible();

  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng", exact: true }),
  ).toBeVisible();
});

test("loads cup designer route", async ({ page }) => {
  await page.goto("/design-cup");
  await expect(
    page.getByRole("heading", { name: /Design-cup studio/i }),
  ).toBeVisible();
  await expect(page.getByText(/2D print artboard/i)).toBeVisible();
});

test("loads custom cup designer fallback route", async ({ page }) => {
  await page.goto("/design-cup");
  await expect(
    page.getByRole("heading", { name: /Thiết kế ly custom/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm vào giỏ/i })).toBeVisible();
});

test("loads custom cup designer compatibility route", async ({ page }) => {
  await page.goto("/design");
  await expect(
    page.getByRole("heading", { name: /Thiết kế ly custom/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm vào giỏ/i })).toBeVisible();
});
