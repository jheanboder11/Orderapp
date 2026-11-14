import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ErrorClaro } from "@/lib/errores";
import type { UsuarioActual } from "@/modules/auth/sesion";
import { type Estado, errorTransicion } from "./rules";
import { pedidoEventos, pedidos } from "./schema";

/** Después de cualquier cambio, todas las pantallas vuelven a leer los pedidos. */
export function refrescarPantallas() {
  revalidatePath("/colaborador", "layout");
  revalidatePath("/mensajero", "layout");
  revalidatePath("/admin", "layout");
}

/**
 * Cambia el estado de un pedido revisando la regla de estados, dentro de una transacción con bloqueo.
 * Si quien lo hace es Mensajero, el pedido tiene que ser suyo.
 */
export async function cambiarEstado(
  yo: UsuarioActual,
  id: number,
  a: Estado,
  extra: Partial<typeof pedidos.$inferInsert>,
  tipo: string,
  detalle?: Record<string, unknown>,
) {
  await db.transaction(async (tx) => {
    const [p] = await tx
      .select({ estado: pedidos.estado, mensajeroId: pedidos.mensajeroId })
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for("update");
    if (!p) throw new ErrorClaro("No encontré el pedido. Actualiza la pantalla.");
    if (yo.rol === "MENSAJERO" && p.mensajeroId !== yo.id) {
      throw new ErrorClaro("Este pedido ya no está a tu nombre. Actualiza la pantalla.");
    }
    const error = errorTransicion(p.estado, a, yo.rol);
    if (error) throw new ErrorClaro(error);
    await tx
      .update(pedidos)
      .set({ ...extra, estado: a, actualizadoEn: new Date() })
      .where(eq(pedidos.id, id));
    await tx.insert(pedidoEventos).values({
      pedidoId: id,
      tipo,
      estadoAntes: p.estado,
      estadoDespues: a,
      usuarioId: yo.id,
      detalle: detalle ?? null,
    });
  });
}
