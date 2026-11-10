import { type Page, expect, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_USUARIO ?? "";
const ADMIN_CLAVE = process.env.ADMIN_PASSWORD ?? "";

/** Usuario único por prueba. Empieza por "e2e" para borrarlo al final (e2e/limpiar.ts). */
function nuevoUsuario(base: string) {
  return `E2e${base}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

async function entrar(page: Page, usuario: string, clave: string) {
  await page.goto("/entrar");
  await page.getByLabel("🙋 Tu usuario").fill(usuario);
  await page.getByLabel("🔒 Tu contraseña").fill(clave);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function salir(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
}

async function crearPersona(page: Page, nombre: string, usuario: string, rol: string, clave: string) {
  await page.goto("/admin/equipo");
  await page.getByLabel("Nombre", { exact: true }).fill(nombre);
  await page.getByLabel("Usuario (con este entra)").fill(usuario);
  await page.getByLabel("¿Qué hace?").selectOption({ label: rol });
  await page.getByLabel("Contraseña para empezar").fill(clave);
  await page.getByRole("button", { name: "👤 Crear usuario" }).click();
  await expect(page.getByText(`✅ Listo, ${nombre} ya puede entrar`)).toBeVisible();
  await page.getByRole("button", { name: "Ya lo anoté" }).click();
}

test.beforeAll(() => {
  expect(ADMIN, "Falta ADMIN_USUARIO en .env.local").not.toBe("");
});

test("el Administrador crea un Mensajero y este entra (sin importar mayúsculas)", async ({ page }) => {
  const usuario = nuevoUsuario("Teo");
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await expect(page.getByText(`Hola, ${ADMIN} 👋`)).toBeVisible();

  await crearPersona(page, "Mensajero de prueba", usuario, "Mensajero", "246810");
  await expect(page.getByText(usuario)).toBeVisible();
  await salir(page);

  // Entra escribiendo el usuario en MAYÚSCULAS
  await entrar(page, usuario.toUpperCase(), "246810");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
  await expect(page.getByText("Hola, Mensajero de prueba 👋")).toBeVisible();
  await expect(page.getByRole("link", { name: /Entregas/ })).toBeVisible();

  // El Mensajero no puede abrir la pantalla Equipo: lo devuelve a la suya
  await page.goto("/admin/equipo");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
});

test("la contraseña se valida según el rol", async ({ page }) => {
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await page.goto("/admin/equipo");
  await page.getByLabel("Nombre", { exact: true }).fill("Prueba Corta");
  await page.getByLabel("Usuario (con este entra)").fill(nuevoUsuario("Corta"));
  await page.getByLabel("¿Qué hace?").selectOption({ label: "Mensajero" });
  await page.getByLabel("Contraseña para empezar").fill("12ab");
  await page.getByRole("button", { name: "👤 Crear usuario" }).click();
  await expect(page.getByText("La contraseña del Mensajero lleva solo números.")).toBeVisible();
});

test("después de 5 intentos fallidos, ese usuario queda bloqueado 10 minutos", async ({ page }) => {
  const usuario = nuevoUsuario("Bloq");
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await crearPersona(page, "Bloqueo", usuario, "Mensajero", "135790");
  await salir(page);

  for (let i = 0; i < 5; i++) {
    await entrar(page, usuario, "000000");
    await expect(page.getByText("Usuario o contraseña incorrectos.", { exact: false })).toBeVisible();
  }
  // Ni con la contraseña correcta entra mientras está bloqueado
  await entrar(page, usuario, "135790");
  await expect(page.getByText(/Muchos intentos fallidos\. Espera 10 minutos/)).toBeVisible();
  await expect(page).toHaveURL(/\/entrar$/);
});

test("una cuenta desactivada no puede entrar", async ({ page }) => {
  const usuario = nuevoUsuario("Off");
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await crearPersona(page, "Desactivada", usuario, "Colaborador", "clave1234");
  await page.getByRole("button", { name: "Desactivar a Desactivada" }).click();
  await page.getByRole("button", { name: "Sí, desactivar" }).click();
  await expect(page.getByText("Desactivada ya no puede entrar. Su historial se guarda.")).toBeVisible();
  await salir(page);

  await entrar(page, usuario, "clave1234");
  await expect(page.getByText("Tu cuenta está desactivada. Habla con el Administrador.")).toBeVisible();
});

test("sin sesión, las pantallas internas mandan a entrar", async ({ page }) => {
  await page.goto("/admin/equipo");
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goto("/mensajero/entregas");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("nadie se puede registrar solo", async ({ request }) => {
  expect((await request.get("/registro")).status()).toBe(404);
  const r = await request.post("/api/auth/sign-up/email", {
    data: { email: "x@x.com", password: "12345678", name: "x" },
  });
  expect(r.status()).toBe(404);
});
