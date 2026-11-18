import { type Page, expect, test } from "@playwright/test";
import { ADMIN, ADMIN_CLAVE, baseDeDatos, clientePrueba, entrar, salir } from "./ayudas";

/**
 * Fase 4: cierre del Mensajero. Cada prueba crea su propio Mensajero ("e2e…"), así no depende
 * de lo que tengan Teo o Luz. e2e/limpiar.ts borra todo al final.
 */

const FOTO = {
  name: "foto.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

const CLAVE = "112233";

async function nuevoMensajero(page: Page) {
  const usuario = `E2eCierre${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  await entrar(page, ADMIN, ADMIN_CLAVE);
  await expect(page).toHaveURL(/\/admin\/hoy$/);
  await page.goto("/admin/equipo");
  await page.getByLabel("Nombre", { exact: true }).fill("Cierre Prueba");
  await page.getByLabel("Usuario (con este entra)").fill(usuario);
  await page.getByLabel("¿Qué hace?").selectOption({ label: "Mensajero" });
  await page.getByLabel("Contraseña para empezar").fill(CLAVE);
  await page.getByRole("button", { name: "👤 Crear usuario" }).click();
  await page.getByRole("button", { name: "Ya lo anoté" }).click();
  await salir(page);
  return usuario;
}

type Nuevo = { estado: string; pago: string; valor: number; manana?: boolean };

/** Crea pedidos directo en la base para ese Mensajero. Domi Medellín ($ 12.000). */
async function crearPedidos(usuario: string, lista: Nuevo[]) {
  const sql = baseDeDatos();
  try {
    const [ana] = await sql`select id from users where usuario = 'ana'`;
    const [m] = await sql`select id from users where usuario = ${usuario.toLowerCase()}`;
    const [zona] = await sql`select id, tarifa_domi from zonas where nombre = 'Medellín'`;
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    const manana = new Date(Date.parse(`${hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    const ids: number[] = [];
    for (const p of lista) {
      const entregado = p.estado === "ENTREGADO";
      const [nuevo] = await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtext(${`pedidos-${hoy}`}))`;
        return tx`
          insert into pedidos (numero_dia, fecha_creacion, fecha_entrega, cliente, celular, direccion, zona_id, items,
            forma_pago, valor_total, valor_domi, mensajero_id, creado_por, estado, hora_salida, hora_entrega)
          values (
            (select coalesce(max(numero_dia), 0) + 1 from pedidos where fecha_creacion = ${hoy}),
            ${hoy}, ${p.manana ? manana : hoy}, ${clientePrueba("Cierre")}, '3104567890', 'Cra 70 #45-20, Laureles',
            ${zona!.id}, 'Chaqueta', ${p.pago}, ${p.valor}, ${zona!.tarifa_domi}, ${m!.id}, ${ana!.id}, ${p.estado},
            ${entregado ? sql`now() - interval '1 hour'` : null}, ${entregado ? sql`now()` : null})
          returning id`;
      });
      ids.push(nuevo!.id);
    }
    return ids;
  } finally {
    await sql.end();
  }
}

async function consulta<T>(fn: (sql: ReturnType<typeof baseDeDatos>) => Promise<T>) {
  const sql = baseDeDatos();
  try {
    return await fn(sql);
  } finally {
    await sql.end();
  }
}

test("debe consignar: lo bloquea un pendiente, los de mañana no, y cierra con la foto", async ({ page }) => {
  const usuario = await nuevoMensajero(page);
  const [, , , pendiente] = await crearPedidos(usuario, [
    { estado: "ENTREGADO", pago: "EFECTIVO", valor: 150000 },
    { estado: "ENTREGADO", pago: "EFECTIVO", valor: 150000 },
    { estado: "ENTREGADO", pago: "TRANSFERENCIA", valor: 99000 },
    { estado: "EMPACADO", pago: "EFECTIVO", valor: 100000 },
    { estado: "EMPACADO", pago: "EFECTIVO", valor: 100000, manana: true },
  ]);

  await entrar(page, usuario, CLAVE);
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
  await page.getByRole("link", { name: /Cierre/ }).click();

  // Con un pendiente de hoy: solo informa. Efectivo 300.000, ganó 3 × 12.000.
  await expect(page.getByText("Cuando entregues tu pedido pendiente, aquí haces el cierre.")).toBeVisible();
  await expect(page.getByText("$ 300.000")).toBeVisible();
  await expect(page.getByRole("button", { name: /Hacer el cierre|consignación/ })).toHaveCount(0);

  // Se cancela el pendiente de hoy. El de mañana sigue ahí, pero no bloquea.
  await consulta((sql) => sql`update pedidos set estado = 'CANCELADO', hora_cancelado = now() where id = ${pendiente!}`);
  await page.reload();
  await expect(page.getByText("3 entregas por cerrar")).toBeVisible();
  await expect(page.getByText("Te toca consignar $ 264.000")).toBeVisible();

  const [selector] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "🏦 Tomar foto de la consignación y cerrar" }).click(),
  ]);
  await selector.setFiles(FOTO);
  await expect(page.getByText(/🎉 Cierre hecho ·/)).toBeVisible();
  await expect(page.getByText("Consignaste $ 264.000", { exact: true })).toBeVisible();

  const c = await consulta(async (sql) => {
    const [cierre] = await sql<{ id: number; foto_consignacion_url: string }[]>`select c.* from cierres c
      join users u on u.id = c.mensajero_id where u.usuario = ${usuario.toLowerCase()}`;
    const [fila] = await sql<{ n: number }[]>`select count(*)::int as n from pedidos where cierre_id = ${cierre!.id}`;
    return { ...cierre!, cerrados: Number(fila!.n) };
  });
  expect(c).toMatchObject({ n_entregas: 3, efectivo: 300000, pago_mensajero: 36000, neto: 264000, cerrados: 3 });
  expect(c.foto_consignacion_url).toMatch(/^(blob|local):consignacion\//);
  expect((await page.request.get(`/api/fotos/cierre/${c.id}`)).status()).toBe(200);

  // Ya no queda nada por cerrar
  await page.getByRole("link", { name: /Entregas/ }).first().click();
  await expect(page.getByText("✅ Ya hiciste tu cierre.")).toBeVisible();
});

test("la empresa le consigna: cierra sin foto, con confirmación", async ({ page }) => {
  const usuario = await nuevoMensajero(page);
  await crearPedidos(usuario, [{ estado: "ENTREGADO", pago: "TRANSFERENCIA", valor: 149000 }]);

  await entrar(page, usuario, CLAVE);
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
  await page.goto("/mensajero/cierre");
  await expect(page.getByText("La empresa te consigna $ 12.000")).toBeVisible();

  await page.getByRole("button", { name: "🧾 Hacer el cierre" }).click();
  await page.getByRole("button", { name: "✅ Sí, hacer el cierre" }).click();
  await expect(page.getByText(/🎉 Cierre hecho ·/)).toBeVisible();

  const [c] = await consulta(
    (sql) => sql`select c.neto, c.foto_consignacion_url from cierres c join users u on u.id = c.mensajero_id
      where u.usuario = ${usuario.toLowerCase()}`,
  );
  expect(c).toMatchObject({ neto: -12000, foto_consignacion_url: null });
});
