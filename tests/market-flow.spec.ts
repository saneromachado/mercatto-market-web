import { expect, test } from "@playwright/test";

test("login e navegação pelas áreas conectadas à API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar no painel" }).click();

  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("API conectada")).toBeVisible();

  await page.getByRole("button", { name: "Produtos" }).click();
  await expect(page.getByRole("heading", { name: "Produtos" })).toBeVisible();
  await expect(page.getByText("Arroz 5kg")).toBeVisible();

  await page.getByRole("button", { name: "Frente de caixa" }).click();
  await expect(page.getByRole("heading", { name: "Frente de caixa" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Arroz 5kg/ })).toBeVisible();

  await page.screenshot({
    path: "test-results/market-checkout.png",
    fullPage: true,
  });
});
