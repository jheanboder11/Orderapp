import { type Page, expect, test } from "@playwright/test";
import { baseDeDatos, clientePrueba, entrar, salir } from "./ayudas";

/** Usa las cuentas de prueba (pnpm db:seed:demo): Ana = Colaboradora, Teo y Luz = Mensajeros. */

// Una foto de verdad (PNG de 1×1) para que el celular "la tome" y la app la achique.
const FOTO = {
  name: "foto.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

/** Toca el botón que abre la cámara y "toma" la foto. */
async function tomarFoto(page: Page, boton: ReturnType<Page["getByRole"]>) {
  const [selector] = await Promise.all([page.waitForEvent("filechooser"), boton.click()]);
  await selector.setFiles(FOTO);
}

const tarjeta = (page: Page, cliente: string) =>
  page.locator("div.rounded-tarjeta").filter({ has: page.getByText(cliente, { exact: false }) }).first();

/** Crea pedidos directo en la base (más rápido que llenar el formulario: eso ya se probó en la Fase 2). */
async function crearPedidos(lista: { cliente: string; mensajero: "teo" | "luz"; manana?: boolean; pago?: string }[]) {
  const sql = baseDeDatos();
  try {
    const [ana] = await sql`select id from users where usuario = 'ana'`;
    const [zona] = await sql`select id, tarifa_domi from zonas where nombre = 'Medellín'`;
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    const manana = new Date(Date.parse(`${hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    const ids: number[] = [];
    for (const p of lista) {
      const [m] = await sql`select id from users where usuario = ${p.mensajero}`;
      const [nuevo] = await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtext(${`pedidos-${hoy}`}))`;
        return tx`
        insert into pedidos (numero_dia, fecha_creacion, fecha_entrega, cliente, celular, direccion, zona_id, items,
          forma_pago, valor_total, valor_domi, mensajero_id, creado_por)
        values (
          (select coalesce(max(numero_dia), 0) + 1 from pedidos where fecha_creacion = ${hoy}),
          ${hoy}, ${p.manana ? manana : hoy}, ${p.cliente}, '3104567890', 'Cra 70 #45-20, Laureles',
          ${zona!.id}, 'Chaqueta reflectiva L', ${p.pago ?? "EFECTIVO"}, 192000, ${zona!.tarifa_domi}, ${m!.id}, ${ana!.id})
        returning id`;
      });
      ids.push(nuevo!.id);
    }
    return ids;
  } finally {
    await sql.end();
  }
}

async function leerPedido(id: number) {
  const sql = baseDeDatos();
  try {
    const [p] = await sql`select estado, foto_salida_url, foto_entrega_url, hora_salida, hora_entrega,
      motivo_problema, detalle_problema from pedidos where id = ${id}`;
    return p!;
  } finally {
    await sql.end();
  }
}

test("crear pedido → salir con una foto → entregar con foto", async ({ page }) => {
  const uno = clientePrueba("Salida1");
  const dos = clientePrueba("Salida2");
  const manana = clientePrueba("Manana");
  const [id1, id2] = await crearPedidos([
    { cliente: uno, mensajero: "teo" },
    { cliente: dos, mensajero: "teo", pago: "TRANSFERENCIA" },
    { cliente: manana, mensajero: "teo", manana: true },
  ]);

  await entrar(page, "Teo", "123456");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);

  // 📦 Recógelos en el local: aparecen los dos de hoy, no el de mañana
  const local = page.getByRole("region", { name: "Recógelos en el local" });
  await expect(local.getByText(uno)).toBeVisible();
  await expect(local.getByText(dos)).toBeVisible();
  await expect(local.getByText(manana)).toHaveCount(0);

  // Una sola foto para salir con todos
  await tomarFoto(page, local.getByRole("button", { name: "📸 Ya los tengo: tomar foto y salir" }));
  await expect(page.getByText("Listo, buen viaje 🏍️")).toBeVisible();

  const p1 = await leerPedido(id1!);
  const p2 = await leerPedido(id2!);
  expect(p1.estado).toBe("EN_ENTREGA");
  expect(p2.estado).toBe("EN_ENTREGA");
  expect(p1.foto_salida_url).toMatch(/^(blob|local):salida\//);
  expect(p2.foto_salida_url).toBe(p1.foto_salida_url); // la MISMA foto para los dos
  expect(p1.hora_salida).not.toBeNull();

  // 🏍️ Entrégalos ahora: cobro claro y botones de ayuda
  const enCamino = page.getByRole("region", { name: "Entrégalos ahora" });
  const t1 = tarjeta(page, uno);
  await expect(enCamino.getByText(uno)).toBeVisible();
  await expect(t1.getByText("💵 Te toca cobrar en efectivo: $ 192.000")).toBeVisible();
  await expect(tarjeta(page, dos).getByText("📲 Ya pagó por transferencia. No cobres nada.")).toBeVisible();
  await expect(t1.getByRole("link", { name: "📞 Llamar" })).toHaveAttribute("href", "tel:3104567890");
  await expect(t1.getByRole("link", { name: "💬 WhatsApp" })).toHaveAttribute("href", "https://wa.me/573104567890");

  // ✅ Ya lo entregué (toma la foto)
  await tomarFoto(page, t1.getByRole("button", { name: /✅ Ya lo entregué/ }));
  await expect(page.getByText("Listo, entrega anotada ✅")).toBeVisible();
  const entregado = await leerPedido(id1!);
  expect(entregado.estado).toBe("ENTREGADO");
  expect(entregado.foto_entrega_url).toMatch(/^(blob|local):entrega\//);
  expect(entregado.hora_entrega).not.toBeNull();

  // La foto se puede ver con sesión…
  const foto = await page.request.get(`/api/fotos/pedido/${id1}/entrega`);
  expect(foto.status()).toBe(200);
  expect(foto.headers()["content-type"]).toBe("image/jpeg");

  // ✅ Hechos muestra la entrega y lo de mañana
  await page.getByRole("link", { name: /Hechos/ }).click();
  await expect(page.getByText(uno)).toBeVisible();
  await expect(page.getByText(manana)).toBeVisible();

  // …pero otro Mensajero no la puede ver
  await salir(page);
  await entrar(page, "Luz", "123456");
  await expect(page).toHaveURL(/\/mensajero\/entregas$/);
  await expect(page.getByText(uno)).toHaveCount(0);
  expect((await page.request.get(`/api/fotos/pedido/${id1}/entrega`)).status()).toBe(404);

  // …ni alguien sin sesión
  await salir(page);
  expect((await page.request.get(`/api/fotos/pedido/${id1}/entrega`)).status()).toBe(401);
});

test("no pude entregarlo: pide el motivo y el Colaborador lo ve como problema", async ({ page }) => {
  const cliente = clientePrueba("NoPude");
  const [id] = await crearPedidos([{ cliente, mensajero: "luz" }]); // Luz: así no se cruza con la otra prueba

  await entrar(page, "Luz", "123456");
  await tomarFoto(
    page,
    page.getByRole("region", { name: "Recógelos en el local" }).getByRole("button", { name: /Ya los tengo/ }),
  );
  await expect(page.getByText("Listo, buen viaje 🏍️")).toBeVisible();

  const t = tarjeta(page, cliente);
  await t.getByRole("button", { name: "😕 No pude entregarlo" }).click();
  await t.getByRole("button", { name: "📣 Avisar lo que pasó" }).click();
  await expect(t.getByText("Elige qué pasó.")).toBeVisible();
  await t.getByLabel("😕 ¿Qué pasó?").selectOption("Otro");
  await t.getByRole("button", { name: "📣 Avisar lo que pasó" }).click();
  await expect(t.getByText("Cuéntanos qué pasó, aunque sea corto.")).toBeVisible();
  await t.getByLabel("Cuéntanos").fill("Portería cerrada");
  await t.getByRole("button", { name: "📣 Avisar lo que pasó" }).click();
  await expect(page.getByText(/ya le avisamos al local/)).toBeVisible();

  // Pasa a ↩️ Regrésalos al local
  const regresar = page.getByRole("region", { name: "Regrésalos al local" });
  await expect(regresar.getByText(cliente)).toBeVisible();
  const p = await leerPedido(id!);
  expect(p.estado).toBe("PROBLEMA");
  expect(p.detalle_problema).toBe("Portería cerrada");

  // El Colaborador lo ve con el problema y su foto de salida
  await salir(page);
  await entrar(page, "Ana", "12345678");
  const tc = tarjeta(page, cliente);
  await expect(tc.getByText("Problema:")).toBeVisible();
  await expect(tc.getByText("Portería cerrada")).toBeVisible();
  await expect(tc.getByRole("link", { name: "📸 Foto al salir" })).toHaveAttribute(
    "href",
    `/api/fotos/pedido/${id}/salida`,
  );
});
