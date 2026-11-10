import "server-only";
import { and, asc, eq, gte, inArray, max, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { fechaBogota, sumarDias } from "@/lib/formato";
import { users } from "@/modules/auth/schema";
import { exigirRol } from "@/modules/auth/sesion";
import { estaDemorado } from "./rules";
import { pedidos, zonas } from "./schema";

/** Inicio del día en Bogotá como instante (Colombia no cambia la hora en el año: siempre UTC−5). */
export const inicioDelDia = (fecha: string) => new Date(`${fecha}T00:00:00-05:00`);

export async function listarZonas() {
  return db.select().from(zonas).orderBy(asc(zonas.id));
}

export async function mensajerosActivos() {
  return db
    .select({ id: users.id, nombre: users.name })
    .from(users)
    .where(and(eq(users.rol, "MENSAJERO"), eq(users.activo, true)))
    .orderBy(asc(users.name));
}

/** Número que tendrá el próximo pedido creado hoy (solo para mostrarlo en el título). */
export async function siguienteNumero(hoy: string) {
  const [r] = await db
    .select({ n: max(pedidos.numeroDia) })
    .from(pedidos)
    .where(eq(pedidos.fechaCreacion, hoy));
  return (r?.n ?? 0) + 1;
}

const columnasTarjeta = {
  id: pedidos.id,
  numeroDia: pedidos.numeroDia,
  fechaCreacion: pedidos.fechaCreacion,
  fechaEntrega: pedidos.fechaEntrega,
  entregarAntes: pedidos.entregarAntes,
  cliente: pedidos.cliente,
  celular: pedidos.celular,
  direccion: pedidos.direccion,
  items: pedidos.items,
  nota: pedidos.nota,
  formaPago: pedidos.formaPago,
  valorTotal: pedidos.valorTotal,
  valorDomi: pedidos.valorDomi,
  estado: pedidos.estado,
  motivoProblema: pedidos.motivoProblema,
  detalleProblema: pedidos.detalleProblema,
  motivoCancelacion: pedidos.motivoCancelacion,
  fotoSalidaUrl: pedidos.fotoSalidaUrl,
  fotoEntregaUrl: pedidos.fotoEntregaUrl,
  horaSalida: pedidos.horaSalida,
  horaEntrega: pedidos.horaEntrega,
  mensajeroId: pedidos.mensajeroId,
  mensajero: users.name,
  zona: zonas.nombre,
  limiteMinutos: zonas.limiteMinutos,
};

/** Pedidos que ve el Colaborador: ayer, hoy, mañana y todo lo que siga abierto o con problema. */
export async function pedidosDelColaborador(hoy: string = fechaBogota()) {
  await exigirRol("COLABORADOR");
  const ayer = sumarDias(hoy, -1);
  return db
    .select(columnasTarjeta)
    .from(pedidos)
    .innerJoin(zonas, eq(pedidos.zonaId, zonas.id))
    .innerJoin(users, eq(pedidos.mensajeroId, users.id))
    .where(
      or(
        gte(pedidos.fechaEntrega, ayer),
        inArray(pedidos.estado, ["EMPACADO", "EN_ENTREGA", "PROBLEMA"]),
        gte(pedidos.horaEntrega, inicioDelDia(ayer)),
      ),
    );
}

export type PedidoTarjeta = Awaited<ReturnType<typeof pedidosDelColaborador>>[number];

/** Un pedido para editarlo (solo Colaborador). */
export async function pedidoParaEditar(id: number) {
  await exigirRol("COLABORADOR");
  const [p] = await db.select().from(pedidos).where(eq(pedidos.id, id));
  return p ?? null;
}

/** Numerito naranja de "📋 Pedidos": demorados + problemas por resolver. */
export async function pendientesColaborador() {
  const lista = await db
    .select({
      estado: pedidos.estado,
      horaSalida: pedidos.horaSalida,
      limiteMinutos: zonas.limiteMinutos,
    })
    .from(pedidos)
    .innerJoin(zonas, eq(pedidos.zonaId, zonas.id))
    .where(inArray(pedidos.estado, ["EN_ENTREGA", "PROBLEMA"]));
  const ahora = new Date();
  return lista.filter((p) => p.estado === "PROBLEMA" || estaDemorado(p, p.limiteMinutos, ahora)).length;
}

/** Bloquea el número del día mientras se crea un pedido (evita dos #5 el mismo día). */
export const bloqueoNumeroDelDia = (fecha: string) =>
  sql`select pg_advisory_xact_lock(hashtext(${`pedidos-${fecha}`}))`;
