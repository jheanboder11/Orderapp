"use server";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { ErrorClaro, fallo } from "@/lib/errores";
import { fechaBogota, pesos } from "@/lib/formato";
import { permitirSolo } from "@/modules/auth/sesion";
import { guardarFoto } from "@/modules/fotos/guardar";
import { refrescarPantallas } from "@/modules/pedidos/cambios";
import { pedidoEventos, pedidos } from "@/modules/pedidos/schema";
import { estadoCierre } from "./queries";
import { errorCierre } from "./rules";
import { cierres } from "./schema";

export type Resultado =
  { ok: true; mensaje: string } | { ok: false; error: string };

/**
 * 🧾 Hacer el cierre. Junta todas sus entregas sin cierre (de cualquier día).
 * Si debe consignar, la foto de la consignación viene en el mismo envío ("foto").
 */
export async function hacerCierre(datos: FormData): Promise<Resultado> {
  try {
    const yo = await permitirSolo("MENSAJERO");
    const hoy = fechaBogota();

    // 1. Revisión rápida antes de subir la foto (para no subirla si igual no puede cerrar).
    const antes = await estadoCierre(yo.id, hoy);
    const archivo = datos.get("foto");
    const traeFoto = archivo instanceof File && archivo.size > 0;
    const error = errorCierre({
      ...antes.cuentas,
      pendientes: antes.pendientes,
      conFoto: traeFoto,
    });
    if (error) throw new ErrorClaro(error);
    const foto =
      antes.cuentas.neto > 0
        ? await guardarFoto(archivo, "consignacion")
        : null;

    // 2. Cierre de verdad, en una transacción con bloqueo: dos toques seguidos no crean dos cierres.
    const hecho = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`cierre-${yo.id}`}))`,
      );
      const ahora = await estadoCierre(yo.id, hoy, tx);
      const e = errorCierre({
        ...ahora.cuentas,
        pendientes: ahora.pendientes,
        conFoto: Boolean(foto),
      });
      if (e)
        throw new ErrorClaro(
          ahora.cuentas.nEntregas === 0
            ? "Este cierre ya se hizo. Actualiza la pantalla."
            : e,
        );

      const [c] = await tx
        .insert(cierres)
        .values({
          mensajeroId: yo.id,
          fecha: hoy,
          nEntregas: ahora.cuentas.nEntregas,
          efectivo: ahora.cuentas.efectivo,
          pagoMensajero: ahora.cuentas.pago,
          neto: ahora.cuentas.neto,
          fotoConsignacionUrl: ahora.cuentas.neto > 0 ? foto : null,
        })
        .returning();
      if (!c) throw new Error("No se creó el cierre");

      const ids = ahora.entregas.map((p) => p.id);
      await tx
        .update(pedidos)
        .set({ cierreId: c.id, actualizadoEn: new Date() })
        .where(
          and(
            inArray(pedidos.id, ids),
            eq(pedidos.mensajeroId, yo.id),
            isNull(pedidos.cierreId),
          ),
        );
      await tx.insert(pedidoEventos).values(
        ids.map((id) => ({
          pedidoId: id,
          tipo: "CIERRE",
          estadoAntes: "ENTREGADO" as const,
          estadoDespues: "ENTREGADO" as const,
          usuarioId: yo.id,
          detalle: { cierreId: c.id },
        })),
      );
      return c;
    });

    refrescarPantallas();
    const fin =
      hecho.neto > 0
        ? `Consignaste ${pesos(hecho.neto)}`
        : hecho.neto < 0
          ? `La empresa te consigna ${pesos(-hecho.neto)}`
          : "Quedaste a paz y salvo";
    return { ok: true, mensaje: `🎉 Cierre hecho. ${fin}. ¡Buen trabajo!` };
  } catch (e) {
    return fallo(e);
  }
}
