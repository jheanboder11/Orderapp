import { expect, test } from "@playwright/test";

test("la raíz lleva a la pantalla de entrada con la marca", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByText("orderapp", { exact: true })).toBeVisible();
  await expect(page.getByText("Domicilios en orden")).toBeVisible();
  await expect(page.getByRole("heading", { name: "👋 ¡Hola! Entra a Orderapp" })).toBeVisible();
  await expect(page.getByText("¿Olvidaste tu contraseña? Pídesela al Administrador.")).toBeVisible();
});

test("el botón Entrar es naranja (la acción principal)", async ({ page }) => {
  await page.goto("/entrar");
  const boton = page.getByRole("button", { name: "Entrar" });
  await expect(boton).toHaveCSS("background-color", "rgb(255, 122, 69)");
  const caja = await boton.boundingBox();
  expect(caja?.height ?? 0).toBeGreaterThanOrEqual(46);
});

test("no existe una página de registro", async ({ page }) => {
  const r = await page.goto("/registro");
  expect(r?.status()).toBe(404);
});
