/** `pnpm db:seed:demo` → crea las cuentas de prueba (Ana, Teo y Luz) y unos 10 pedidos de ejemplo. */
import "./cargar-env";
import { count, eq } from "drizzle-orm";
import { fechaBogota, sumarDias } from "@/lib/formato";
import { users } from "@/modules/auth/schema";
import { esquemaNuevoUsuario, normalizarUsuario } from "@/modules/auth/rules";
import { crearUsuarioEnBD } from "@/modules/equipo/crear";
import { pedidoEventos, pedidos, zonas } from "@/modules/pedidos/schema";
import { ACCESOS_DEMO } from "./demo";
import { db, sql } from "./index";

async function crearCuentas() {
  for (const a of ACCESOS_DEMO) {
    const datos = esquemaNuevoUsuario.parse({
      nombre: a.nombre,
      usuario: a.usuario,
      rol: a.rol === "Colaborador" ? "COLABORADOR" : "MENSAJERO",
      contrasena: a.contrasena,
    });
    const r = await crearUsuarioEnBD(datos);
    console.log(r.ok ? `✅ ${a.nombre} (${a.rol}) creado` : `ℹ️  ${r.error}`);
  }
}

async function idDe(usuario: string) {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.username, normalizarUsuario(usuario)));
  if (!u) throw new Error(`No encontré a ${usuario}`);
  return u.id;
}

async function crearPedidos() {
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(pedidos);
  if (n > 0) {
    console.log("ℹ️  Ya hay pedidos: no creé los de ejemplo.");
    return;
  }
  const ana = await idDe("Ana");
  const teo = await idDe("Teo");
  const luz = await idDe("Luz");
  const z = Object.fromEntries((await db.select().from(zonas)).map((x) => [x.nombre, x]));
  const med = z["Medellín"];
  const ale = z["Aledaño"];
  if (!med || !ale) throw new Error("Faltan las zonas. Corre pnpm db:migrate primero.");

  const hoy = fechaBogota();
  const ayer = sumarDias(hoy, -1);
  const manana = sumarDias(hoy, 1);
  const hace = (min: number) => new Date(Date.now() - min * 60_000);
  const ayerA = (hora: number) => new Date(`${ayer}T${String(hora).padStart(2, "0")}:00:00-05:00`);

  type Nuevo = typeof pedidos.$inferInsert;
  const base = (o: Partial<Nuevo> & Pick<Nuevo, "numeroDia" | "cliente" | "direccion" | "items" | "valorTotal">): Nuevo => ({
    fechaCreacion: hoy,
    fechaEntrega: hoy,
    celular: "3001234567",
    zonaId: med.id,
    valorDomi: med.tarifaDomi,
    formaPago: "EFECTIVO",
    mensajeroId: teo,
    creadoPor: ana,
    ...o,
  });
  const enAledano = { zonaId: ale.id, valorDomi: ale.tarifaDomi };

  const lista: Nuevo[] = [
    // Ayer
    base({ numeroDia: 1, fechaCreacion: ayer, fechaEntrega: ayer, cliente: "Simón Vélez", direccion: "Cra 76 #49-30, Estadio", items: "Chaqueta azul M", formaPago: "TRANSFERENCIA", valorTotal: 157000, estado: "ENTREGADO", horaSalida: ayerA(10), horaEntrega: ayerA(11) }),
    base({ numeroDia: 2, fechaCreacion: ayer, fechaEntrega: ayer, cliente: "Andrés Mejía", direccion: "Cra 48 #20-30, Envigado", items: "Chaqueta doble faz L", valorTotal: 145000, mensajeroId: luz, ...enAledano, estado: "ENTREGADO", horaSalida: ayerA(14), horaEntrega: ayerA(15) }),
    base({ numeroDia: 3, fechaCreacion: ayer, fechaEntrega: ayer, cliente: "Sofía Lara", direccion: "Cra 65 #30-40, Belén", items: "Cortavientos negro M", formaPago: "TRANSFERENCIA", valorTotal: 149000, mensajeroId: luz, estado: "CANCELADO", motivoCancelacion: "El cliente canceló", horaCancelado: ayerA(12) }),
    // Hoy
    base({ numeroDia: 1, cliente: "Carlos Ruiz", celular: "3104567890", direccion: "Cra 70 #45-20, Laureles", items: "Chaqueta reflectiva L", valorTotal: 192000, estado: "ENTREGADO", horaSalida: hace(150), horaEntrega: hace(100) }),
    base({ numeroDia: 2, cliente: "Valentina Cano", celular: "3205551234", direccion: "Cl 50 #80-15, Calasanz", items: "Chaqueta doble faz M", valorTotal: 172000, nota: "Portería, dejar con el vigilante", estado: "EN_ENTREGA", horaSalida: hace(35) }),
    base({ numeroDia: 3, cliente: "Mateo Arango", celular: "3017778899", direccion: "Cra 43A #1-50, El Poblado", items: "Cortavientos azul L", formaPago: "TRANSFERENCIA", valorTotal: 149000, estado: "EN_ENTREGA", horaSalida: hace(35) }),
    base({ numeroDia: 4, cliente: "Juliana Restrepo", celular: "3112223344", direccion: "Cl 37 Sur #43-10, Envigado", items: "Chaqueta reflectiva S", valorTotal: 175000, mensajeroId: luz, ...enAledano, estado: "EN_ENTREGA", horaSalida: hace(200) }),
    base({ numeroDia: 5, cliente: "Felipe Zapata", celular: "3009998877", direccion: "Cra 65 #8-40, Belén", items: "Chaqueta negra XL", valorTotal: 182000, entregarAntes: "17:00" }),
    base({ numeroDia: 6, cliente: "Daniel Ochoa", celular: "3156667788", direccion: "Cl 30 #55-12, Itagüí", items: "Chaqueta doble faz L", formaPago: "YA_PAGADO", valorTotal: 160000, mensajeroId: luz, ...enAledano, estado: "PROBLEMA", horaSalida: hace(120), motivoProblema: "No contesta", detalleProblema: "No contesta" }),
    base({ numeroDia: 7, fechaEntrega: manana, cliente: "Camila Vélez", celular: "3021112233", direccion: "Cra 80 #33-10, La América", items: "Chaqueta reflectiva M", formaPago: "TRANSFERENCIA", valorTotal: 157000, mensajeroId: luz }),
  ];

  const creados = await db.insert(pedidos).values(lista).returning({ id: pedidos.id, estado: pedidos.estado });
  await db.insert(pedidoEventos).values(
    creados.map((p) => ({ pedidoId: p.id, tipo: "DEMO", estadoDespues: p.estado, usuarioId: ana })),
  );
  console.log(`✅ ${creados.length} pedidos de ejemplo creados`);
}

async function main() {
  await crearCuentas();
  await crearPedidos();
}

main()
  .catch((e: unknown) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
