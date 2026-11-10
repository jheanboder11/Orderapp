import { type Page, expect, test } from "@playwright/test";
import { ADMIN, ADMIN_CLAVE, baseDeDatos, clientePrueba, entrar, salir } from "./ayudas";

/** Usa las cuentas de prueba (pnpm db:seed:demo): Ana = Colaboradora, Teo y Luz = Mensajeros. */

async function entrarComoAna(page: Page) {
  await entrar(page, "Ana", "12345678");
  await expect(page).toHaveURL(/\/colaborador\/pedidos$/);
}

/** Crea un pedido desde la pantalla ➕ Nuevo y vuelve a la lista. */
async function crearPedido(page: Page, cliente: string, extra?: (page: Page) => Promise<void>) {
  await page.goto("/colaborador/nuevo");
  await page.getByLabel("¿Cómo se llama el cliente?").fill(cliente);
  await page.getByLabel("Celular").fill("3001234567");
  await page.getByLabel("Dirección", { exact: true }).fill("Cra 70 #45-20, Laureles");
  await page.getByLabel("¿Qué lleva?").fill("Chaqueta reflectiva L");
  await page.getByLabel("¿Cuánto cobra en total? (con domi)").fill("192.000");
  await page.getByLabel("¿Quién lo lleva?").selectOption({ label: "Teo" });
  if (extra) await extra(page);
  await page.getByRole("button", { name: "📦 Listo, ya lo empaqué" }).click();
  await expect(page.getByText("Listo, Teo ya lo ve en su celular ✅")).toBeVisible();
  await page.goto("/colaborador/pedidos");
}

const tarjeta = (page: Page, cliente: string) =>
  page.locator("div.rounded-tarjeta").filter({ has: page.getByText(cliente, { exact: false }) }).first();

test("crear un pedido pegando el mensaje de WhatsApp", async ({ page }) => {
  const cliente = clientePrueba("Juliana");
  await entrarComoAna(page);
  await page.getByRole("link", { name: /Nuevo/ }).click();
  await expect(page.getByRole("heading", { name: /➕ Domicilio #\d+/ })).toBeVisible();

  await page
    .getByLabel("Mensaje del cliente")
    .fill(
      [
        "Celular: 311 222 3344",
        "Dirección: Cl 37 Sur #43-10",
        "Ciudad: Envigado",
        "Producto: Chaqueta reflectiva talla S",
        "Total: 175.000",
        "Pago: Nequi",
      ].join("\n"),
    );
  await page.getByRole("button", { name: "✨ Llenar con este mensaje" }).click();
  await expect(page.getByText("Revisa que todo esté bien. No encontré: el nombre.")).toBeVisible();
  await expect(page.getByLabel("Celular")).toHaveValue("3112223344");
  await expect(page.getByLabel("¿A dónde va?")).toHaveValue(/\d+/);
  await expect(page.getByText("El domi cuesta $ 15.000")).toBeVisible(); // Envigado = Aledaño
  await expect(page.getByLabel("¿Cuánto cobra en total? (con domi)")).toHaveValue("175.000");

  // Sin nombre no deja guardar y explica qué falta
  await page.getByRole("button", { name: "📦 Listo, ya lo empaqué" }).click();
  await expect(page.getByText("Te falta el nombre del cliente.")).toBeVisible();
  await expect(page.getByLabel("Celular")).toHaveValue("3112223344"); // no se borró lo escrito

  await page.getByLabel("¿Cómo se llama el cliente?").fill(cliente);
  await page.getByRole("button", { name: "📦 Listo, ya lo empaqué" }).click();
  await expect(page.getByText(/ya lo ve en su celular ✅/)).toBeVisible();
  await expect(page.getByLabel("¿Cómo se llama el cliente?")).toHaveValue(""); // listo para el siguiente

  await page.getByRole("link", { name: "Ver los pedidos" }).click();
  await expect(page.getByRole("heading", { name: "Los pedidos de hoy" })).toBeVisible();
  const t = tarjeta(page, cliente);
  await expect(t.getByText("📦 Empacado")).toBeVisible();
  await expect(t.getByText("Aledaño · $ 15.000 de domi")).toBeVisible();
});

test("copiar el resumen para WhatsApp", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const cliente = clientePrueba("Copia");
  await entrarComoAna(page);
  await crearPedido(page, cliente);
  await tarjeta(page, cliente).getByRole("button", { name: "📋 Copiar" }).click();
  await expect(tarjeta(page, cliente).getByRole("button", { name: "✅ Copiado" })).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain(`${cliente} 3001234567`);
  expect(copiado).toContain("Cobrar efectivo $ 192.000");
});

test("editar un pedido empacado", async ({ page }) => {
  const cliente = clientePrueba("Editar");
  await entrarComoAna(page);
  await crearPedido(page, cliente);
  await tarjeta(page, cliente).getByRole("link", { name: "✏️ Editar" }).click();
  await expect(page.getByRole("heading", { name: /✏️ Editando el pedido #\d+/ })).toBeVisible();
  await page.getByLabel("¿Algo especial? (referencia)").fill("Portería, dejar con el vigilante");
  await page.getByLabel("¿Para cuándo es?").selectOption({ label: "Mañana" });
  await page.getByRole("button", { name: "💾 Guardar los cambios" }).click();
  await expect(page).toHaveURL(/\/colaborador\/pedidos$/);

  await page.getByRole("link", { name: /Mañana/ }).click();
  await expect(page.getByRole("heading", { name: /Para mañana \(\d+\)/ })).toBeVisible();
  const t = tarjeta(page, cliente);
  await expect(t.getByText("Portería, dejar con el vigilante")).toBeVisible();
  await expect(t.getByText(/\(para el /)).toBeVisible();
});

test("cancelar pide el motivo dentro de la tarjeta", async ({ page }) => {
  const cliente = clientePrueba("Cancelar");
  await entrarComoAna(page);
  await crearPedido(page, cliente);
  const t = tarjeta(page, cliente);
  await t.getByRole("button", { name: "🚫 Cancelar" }).click();
  await t.getByLabel("Motivo de la cancelación").selectOption("Otro");
  await t.getByRole("button", { name: "🚫 Sí, cancelar el pedido" }).click();
  await expect(t.getByText("Cuéntanos por qué se cancela, aunque sea corto.")).toBeVisible();
  await t.getByLabel("Cuéntanos qué pasó").fill("El cliente se mudó");
  await t.getByRole("button", { name: "🚫 Sí, cancelar el pedido" }).click();
  await expect(t.getByText("🚫 Cancelado", { exact: true })).toBeVisible();
  await expect(t.getByText("🚫 Cancelado: Otro: El cliente se mudó")).toBeVisible();
  await expect(t.getByRole("button", { name: "📋 Copiar" })).toHaveCount(0);
});

test("cambiar quién lleva el pedido", async ({ page }) => {
  const cliente = clientePrueba("Reasignar");
  await entrarComoAna(page);
  await crearPedido(page, cliente);
  const t = tarjeta(page, cliente);
  await t.getByRole("button", { name: "cambiar" }).click();
  await t.getByLabel("¿Quién lo lleva ahora?").selectOption({ label: "Luz" });
  await t.getByRole("button", { name: "Sí, que lo lleve Luz" }).click();
  await expect(t.getByText("Listo, ahora lo lleva Luz ✅")).toBeVisible();
  await expect(t.getByText(/Lo lleva\s*Luz/)).toBeVisible();
});

test("un pedido con problema pasa a devuelto y la alerta de demora avisa", async ({ page }) => {
  const problema = clientePrueba("Problema");
  const demorado = clientePrueba("Demorado");
  const sql = baseDeDatos();
  try {
    const [ana] = await sql`select id from users where usuario = 'ana'`;
    const [teo] = await sql`select id from users where usuario = 'teo'`;
    const [zona] = await sql`select id, tarifa_domi from zonas where nombre = 'Medellín'`;
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    for (const [cliente, estado, minutos] of [
      [problema, "PROBLEMA", 60],
      [demorado, "EN_ENTREGA", 150],
    ] as const) {
      await sql`
        insert into pedidos (numero_dia, fecha_creacion, fecha_entrega, cliente, celular, direccion, zona_id, items,
          forma_pago, valor_total, valor_domi, mensajero_id, estado, motivo_problema, detalle_problema, hora_salida, creado_por)
        values (
          (select coalesce(max(numero_dia), 0) + 1 from pedidos where fecha_creacion = ${hoy}),
          ${hoy}, ${hoy}, ${cliente}, '3001234567', 'Cl 1 #2-3', ${zona!.id}, 'Chaqueta', 'EFECTIVO', 150000,
          ${zona!.tarifa_domi}, ${teo!.id}, ${estado},
          ${estado === "PROBLEMA" ? "No contesta" : null}, ${estado === "PROBLEMA" ? "No contesta" : null},
          now() - make_interval(mins => ${minutos}), ${ana!.id})`;
    }
  } finally {
    await sql.end();
  }

  await entrarComoAna(page);
  const alerta = page.getByRole("alert").filter({ hasText: "⏰ Ojo, estos pedidos se están demorando:" });
  await expect(alerta.getByText(new RegExp(`${demorado} lleva 15\\d min en la calle con Teo`))).toBeVisible();
  await expect(alerta.getByRole("link", { name: "💬 Escribirle" }).first()).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/\?text=/,
  );

  const t = tarjeta(page, problema);
  await expect(t.getByText("Problema:")).toBeVisible();
  await t.getByRole("button", { name: "↩️ Ya recibí el paquete de vuelta" }).click();
  await expect(t.getByText("↩️ Devuelto")).toBeVisible();
});

test("solo el Colaborador entra a Pedidos", async ({ page }) => {
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await page.goto("/colaborador/nuevo");
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await salir(page);

  await entrar(page, "Teo", "123456");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
  await page.goto("/colaborador/pedidos");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
});
