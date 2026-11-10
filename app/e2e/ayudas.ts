import { type Page, expect } from "@playwright/test";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

export const ADMIN = process.env.ADMIN_USUARIO ?? "";
export const ADMIN_CLAVE = process.env.ADMIN_PASSWORD ?? "";

export async function entrar(page: Page, usuario: string, clave: string) {
  await page.goto("/entrar");
  await page.getByLabel("🙋 Tu usuario").fill(usuario);
  await page.getByLabel("🔒 Tu contraseña").fill(clave);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function salir(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
}

/** Conexión directa a la base, solo para preparar datos de prueba. */
export function baseDeDatos() {
  return postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false });
}

/** Nombre único de cliente de prueba. Empieza por "E2E" para borrarlo al final. */
export function clientePrueba(nombre: string) {
  return `E2E ${nombre} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
