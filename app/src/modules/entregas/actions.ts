"use server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ErrorClaro, YA_CAMBIO, fallo } from "@/lib/errores";
import { fechaBogota } from "@/lib/formato";
import { permitirSolo } from "@/modules/auth/sesion";
import { guardarFoto } from "@/modules/fotos/guardar";
import { cambiarEstado, refrescarPantallas } from "@/modules/pedidos/cambios";
import { errorSalida, errorTransicion } from "@/modules/pedidos/rules";
import { pedidoEventos, pedidos } from "@/modules/pedidos/schema";
import { motivoProblema } from "./rules";

export type Resultado = { ok: true; mensaje: string } | { ok: false; error: string };

const esquemaId = z.coerce.number().int().positive();
const esquemaIds = z.array(esquemaId).min(1, "No tienes pedidos por recoger.").max(50);

/** Revisa (antes de subir la foto) que los pedidos sean suyos y puedan salir hoy. */
async function revisarSalida(mensajeroId: string, ids: number[], hoy: string) {
  const lista = await db
    .select({
      id: pedidos.id,
      estado: pedidos.estado,
      fechaEntrega: pedidos.fechaEntrega,
      mensajeroId: pedidos.mensajeroId,
    })
    .from(pedidos)
    .where(inArray(pedidos.id, ids));
  if (lista.length !== ids.length || lista.some((p) => p.mensajeroId !== mensajeroId)) {
    throw new ErrorClaro("Algún pedido ya no está a tu nombre. Actualiza la pantalla.");
  }
  for (const p of lista) {
    const error = errorTransicion(p.estado, "EN_ENTREGA", "MENSAJERO") ?? errorSalida(p.fechaEntrega, hoy);
    if (error) throw new ErrorClaro(p.estado === "EMPACADO" ? error : YA_CAMBIO);
  }
}

/** 📸 Ya los tengo: tomar foto y salir. UNA sola foto para todos los paquetes. */
export async function salirConLosPedidos(datos: FormData): Promise<Resultado> {
  try {
    const yo = await permitirSolo("MENSAJERO");
    const ids = esquemaIds.parse(datos.getAll("ids"));
    const hoy = fechaBogota();
    await revisarSalida(yo.id, ids, hoy);
    const foto = await guardarFoto(datos.get("foto"), "salida");
    const ahora = new Date();

    await db.transaction(async (tx) => {
      // Se vuelven a bloquear y revisar: alguien pudo cancelar o reasignar mientras subía la foto.
      const lista = await tx
        .select({ id: pedidos.id, estado: pedidos.estado, fechaEntrega: pedidos.fechaEntrega })
        .from(pedidos)
        .where(and(inArray(pedidos.id, ids), eq(pedidos.mensajeroId, yo.id)))
        .for("update");
      if (lista.length !== ids.length) throw new ErrorClaro("Algún pedido ya no está a tu nombre. Actualiza la pantalla.");
      for (const p of lista) {
        if (errorTransicion(p.estado, "EN_ENTREGA", "MENSAJERO") || errorSalida(p.fechaEntrega, hoy)) {
          throw new ErrorClaro(YA_CAMBIO);
        }
      }
      await tx
        .update(pedidos)
        .set({ estado: "EN_ENTREGA", fotoSalidaUrl: foto, horaSalida: ahora, actualizadoEn: ahora })
        .where(inArray(pedidos.id, ids));
      await tx.insert(pedidoEventos).values(
        ids.map((id) => ({
          pedidoId: id,
          tipo: "SALIO",
          estadoAntes: "EMPACADO" as const,
          estadoDespues: "EN_ENTREGA" as const,
          usuarioId: yo.id,
          detalle: { conFoto: true, paquetes: ids.length },
        })),
      );
    });

    refrescarPantallas();
    return { ok: true, mensaje: "Listo, buen viaje 🏍️" };
  } catch (e) {
    return fallo(e);
  }
}

/** ✅ Ya lo entregué (con la foto de la entrega). */
export async function entregarConFoto(datos: FormData): Promise<Resultado> {
  try {
    const yo = await permitirSolo("MENSAJERO");
    const id = esquemaId.parse(datos.get("id"));
    // Antes de subir la foto: ¿sigue siendo suyo y en la calle?
    const [p] = await db
      .select({ estado: pedidos.estado, mensajeroId: pedidos.mensajeroId })
      .from(pedidos)
      .where(eq(pedidos.id, id));
    if (!p || p.mensajeroId !== yo.id) throw new ErrorClaro("Este pedido ya no está a tu nombre. Actualiza la pantalla.");
    if (p.estado !== "EN_ENTREGA") throw new ErrorClaro(YA_CAMBIO);

    const foto = await guardarFoto(datos.get("foto"), "entrega");
    await cambiarEstado(yo, id, "ENTREGADO", { fotoEntregaUrl: foto, horaEntrega: new Date() }, "ENTREGADO", {
      conFoto: true,
    });
    refrescarPantallas();
    return { ok: true, mensaje: "Listo, entrega anotada ✅" };
  } catch (e) {
    return fallo(e);
  }
}

/** 😕 No pude entregarlo (con motivo). El Colaborador lo ve como Problema. */
export async function noPudeEntregar(datos: FormData): Promise<Resultado> {
  try {
    const yo = await permitirSolo("MENSAJERO");
    const id = esquemaId.parse(datos.get("id"));
    const m = motivoProblema(String(datos.get("motivo") ?? ""), String(datos.get("detalle") ?? ""));
    if (!m.ok) return { ok: false, error: m.error };
    await cambiarEstado(
      yo,
      id,
      "PROBLEMA",
      { motivoProblema: m.motivo, detalleProblema: m.detalle },
      "PROBLEMA",
      { motivo: m.motivo, detalle: m.detalle },
    );
    refrescarPantallas();
    return { ok: true, mensaje: "Listo, ya le avisamos al local. Regresa el paquete ↩️" };
  } catch (e) {
    return fallo(e);
  }
}
