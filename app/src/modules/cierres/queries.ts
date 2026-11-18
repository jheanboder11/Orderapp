import "server-only";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { fechaBogota } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { pedidos } from "@/modules/pedidos/schema";
import { bloqueaCierre, calcularCierre } from "./rules";
import { cierres } from "./schema";

/** Entregas sin cierre y pedidos que bloquean, de un Mensajero. Se usa en la pantalla y en la acción. */
export async function estadoCierre(
  mensajeroId: string,
  hoy: string,
  tx: Pick<typeof db, "select"> = db,
) {
  const [entregas, abiertos] = await Promise.all([
    tx
      .select({
        id: pedidos.id,
        numeroDia: pedidos.numeroDia,
        cliente: pedidos.cliente,
        formaPago: pedidos.formaPago,
        valorTotal: pedidos.valorTotal,
        valorDomi: pedidos.valorDomi,
        horaEntrega: pedidos.horaEntrega,
      })
      .from(pedidos)
      .where(
        and(
          eq(pedidos.mensajeroId, mensajeroId),
          eq(pedidos.estado, "ENTREGADO"),
          isNull(pedidos.cierreId),
        ),
      )
      .orderBy(asc(pedidos.horaEntrega)),
    tx
      .select({ estado: pedidos.estado, fechaEntrega: pedidos.fechaEntrega })
      .from(pedidos)
      .where(
        and(
          eq(pedidos.mensajeroId, mensajeroId),
          inArray(pedidos.estado, ["EMPACADO", "EN_ENTREGA"]),
        ),
      ),
  ]);
  return {
    entregas,
    pendientes: abiertos.filter((p) => bloqueaCierre(p, hoy)).length,
    cuentas: calcularCierre(entregas),
  };
}

/** Pantalla 🧾 Cierre del Mensajero que está usando la app: lo que falta por cerrar y los cierres de hoy. */
export async function miCierre(hoy: string = fechaBogota()) {
  const yo = await exigirRol("MENSAJERO");
  const [estado, hechosHoy] = await Promise.all([
    estadoCierre(yo.id, hoy),
    db
      .select()
      .from(cierres)
      .where(and(eq(cierres.mensajeroId, yo.id), eq(cierres.fecha, hoy)))
      .orderBy(desc(cierres.creadoEn)),
  ]);
  return { ...estado, hechosHoy };
}
