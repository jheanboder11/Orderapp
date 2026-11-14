import "server-only";
import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { fechaBogota } from "@/lib/formato";
import { users } from "@/modules/auth/schema";
import { exigirRol } from "@/modules/auth/sesion";
import { columnasTarjeta, inicioDelDia } from "@/modules/pedidos/queries";
import { pedidos, zonas } from "@/modules/pedidos/schema";
import { repartir } from "./rules";

/**
 * Los pedidos del Mensajero que está usando la app. SOLO los suyos: el filtro va en el servidor.
 * Trae lo pendiente, lo de hoy en adelante y las entregas que todavía no entran en un cierre.
 */
export async function misPedidos(hoy: string = fechaBogota()) {
  const yo = await exigirRol("MENSAJERO");
  const lista = await db
    .select(columnasTarjeta)
    .from(pedidos)
    .innerJoin(zonas, eq(pedidos.zonaId, zonas.id))
    .innerJoin(users, eq(pedidos.mensajeroId, users.id))
    .where(
      and(
        eq(pedidos.mensajeroId, yo.id),
        or(
          inArray(pedidos.estado, ["EMPACADO", "EN_ENTREGA", "PROBLEMA"]),
          and(eq(pedidos.estado, "ENTREGADO"), isNull(pedidos.cierreId)),
          gte(pedidos.horaEntrega, inicioDelDia(hoy)),
          gte(pedidos.horaCancelado, inicioDelDia(hoy)),
        ),
      ),
    );
  return repartir(lista, hoy);
}

export type PedidoDelMensajero = Awaited<ReturnType<typeof misPedidos>>["enCamino"][number];

/** Numerito naranja de "🏍️ Entregas": lo que todavía tiene por hacer. */
export async function pendientesMensajero(mensajeroId: string, hoy: string = fechaBogota()) {
  const lista = await db
    .select({
      numeroDia: pedidos.numeroDia,
      fechaCreacion: pedidos.fechaCreacion,
      fechaEntrega: pedidos.fechaEntrega,
      estado: pedidos.estado,
      horaSalida: pedidos.horaSalida,
      horaEntrega: pedidos.horaEntrega,
      horaCancelado: pedidos.horaCancelado,
      cierreId: pedidos.cierreId,
    })
    .from(pedidos)
    .where(
      and(
        eq(pedidos.mensajeroId, mensajeroId),
        or(
          inArray(pedidos.estado, ["EMPACADO", "EN_ENTREGA", "PROBLEMA"]),
          gte(pedidos.horaCancelado, inicioDelDia(hoy)),
        ),
      ),
    );
  const r = repartir(lista, hoy);
  return r.enCamino.length + r.porRecoger.length + r.regresar.length;
}
