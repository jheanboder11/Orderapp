"use server";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ErrorClaro, YA_CAMBIO, fallo } from "@/lib/errores";
import { fechaBogota } from "@/lib/formato";
import { users } from "@/modules/auth/schema";
import { permitirSolo } from "@/modules/auth/sesion";
import { cambiarEstado, refrescarPantallas } from "./cambios";
import { bloqueoNumeroDelDia } from "./queries";
import {
  errorValor,
  esquemaPedido,
  fechaEntregaEditada,
  fechaEntregaNueva,
  motivoCancelacion,
  puedeEditar,
  puedeReasignar,
} from "./rules";
import { pedidoEventos, pedidos, zonas } from "./schema";

export type EstadoAccion =
  | { ok: true; mensaje: string; numero?: number }
  | { ok: false; error: string; campos?: Record<string, string> }
  | null;

const refrescar = refrescarPantallas;

const CAMPOS = [
  "cliente",
  "celular",
  "direccion",
  "zonaId",
  "items",
  "nota",
  "formaPago",
  "valorTotal",
  "para",
  "entregarAntes",
  "mensajeroId",
] as const;

function leerCampos(form: FormData): Record<string, string> {
  return Object.fromEntries(CAMPOS.map((k) => [k, String(form.get(k) ?? "")]));
}

/** Valida el formulario y los datos que dependen de la base de datos (zona y mensajero). */
async function validar(campos: Record<string, string>) {
  const r = esquemaPedido.safeParse(campos);
  if (!r.success) throw new ErrorClaro(r.error.issues[0]?.message ?? "Revisa los datos.");
  const d = r.data;
  const [zona] = await db.select().from(zonas).where(eq(zonas.id, d.zonaId));
  if (!zona) throw new ErrorClaro("Elige a dónde va.");
  const [mensajero] = await db
    .select({ id: users.id, nombre: users.name })
    .from(users)
    .where(and(eq(users.id, d.mensajeroId), eq(users.rol, "MENSAJERO"), eq(users.activo, true)));
  if (!mensajero) throw new ErrorClaro("Elige quién lo lleva.");
  const errValor = errorValor(d.valorTotal, zona.tarifaDomi);
  if (errValor) throw new ErrorClaro(errValor);
  return { d, zona, mensajero };
}

/** 📦 Listo, ya lo empaqué: crea el pedido. */
export async function crearPedido(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  const campos = leerCampos(form);
  try {
    const yo = await permitirSolo("COLABORADOR");
    const { d, zona, mensajero } = await validar(campos);
    const hoy = fechaBogota();

    const numero = await db.transaction(async (tx) => {
      await tx.execute(bloqueoNumeroDelDia(hoy));
      const [r] = await tx
        .select({ n: max(pedidos.numeroDia) })
        .from(pedidos)
        .where(eq(pedidos.fechaCreacion, hoy));
      const numeroDia = (r?.n ?? 0) + 1;
      const [nuevo] = await tx
        .insert(pedidos)
        .values({
          numeroDia,
          fechaCreacion: hoy,
          fechaEntrega: fechaEntregaNueva(d.para, hoy),
          entregarAntes: d.entregarAntes || null,
          cliente: d.cliente,
          celular: d.celular,
          direccion: d.direccion,
          zonaId: zona.id,
          items: d.items,
          nota: d.nota || null,
          formaPago: d.formaPago,
          valorTotal: d.valorTotal,
          valorDomi: zona.tarifaDomi,
          mensajeroId: mensajero.id,
          creadoPor: yo.id,
        })
        .returning({ id: pedidos.id });
      if (!nuevo) throw new Error("No se guardó el pedido");
      await tx.insert(pedidoEventos).values({
        pedidoId: nuevo.id,
        tipo: "CREADO",
        estadoDespues: "EMPACADO",
        usuarioId: yo.id,
      });
      return numeroDia;
    });

    refrescar();
    return { ok: true, numero, mensaje: `Listo, ${mensajero.nombre} ya lo ve en su celular ✅` };
  } catch (e) {
    return { ...fallo(e), campos };
  }
}

/** 💾 Guardar los cambios (solo mientras está empacado). */
export async function editarPedido(id: number, _prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  const campos = leerCampos(form);
  try {
    const yo = await permitirSolo("COLABORADOR");
    const { d, zona, mensajero } = await validar(campos);
    const hoy = fechaBogota();

    await db.transaction(async (tx) => {
      const [p] = await tx.select().from(pedidos).where(eq(pedidos.id, id)).for("update");
      if (!p) throw new ErrorClaro("No encontré el pedido. Actualiza la pantalla.");
      if (!puedeEditar(p.estado)) {
        throw new ErrorClaro("Solo se puede editar un pedido que todavía está empacado.");
      }
      const cambios = {
        fechaEntrega: fechaEntregaEditada(d.para, p.fechaEntrega, hoy),
        entregarAntes: d.entregarAntes || null,
        cliente: d.cliente,
        celular: d.celular,
        direccion: d.direccion,
        zonaId: zona.id,
        items: d.items,
        nota: d.nota || null,
        formaPago: d.formaPago,
        valorTotal: d.valorTotal,
        // Si cambia de zona, el domi se toma de la tarifa actual de la nueva zona.
        valorDomi: zona.id === p.zonaId ? p.valorDomi : zona.tarifaDomi,
        mensajeroId: mensajero.id,
      };
      // La hora viene de la base como "17:00:00" y del formulario como "17:00".
      const igual = (k: string, v: unknown) =>
        k === "entregarAntes"
          ? (p.entregarAntes ?? "").slice(0, 5) === String(v ?? "")
          : String(p[k as keyof typeof p] ?? "") === String(v ?? "");
      const cambiados = Object.entries(cambios)
        .filter(([k, v]) => !igual(k, v))
        .map(([k]) => k);
      await tx
        .update(pedidos)
        .set({ ...cambios, actualizadoEn: new Date() })
        .where(eq(pedidos.id, id));
      await tx.insert(pedidoEventos).values({
        pedidoId: id,
        tipo: "EDITADO",
        estadoAntes: p.estado,
        estadoDespues: p.estado,
        usuarioId: yo.id,
        detalle: { cambios: cambiados },
      });
    });

    refrescar();
    return { ok: true, mensaje: "Listo, guardé los cambios ✅" };
  } catch (e) {
    return { ...fallo(e), campos };
  }
}

const esquemaId = z.coerce.number().int().positive();

/** 🚫 Cancelar con motivo obligatorio. */
export async function cancelarPedido(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  try {
    const yo = await permitirSolo("COLABORADOR");
    const id = esquemaId.parse(form.get("id"));
    const m = motivoCancelacion(String(form.get("motivo") ?? ""), String(form.get("detalle") ?? ""));
    if (!m.ok) return { ok: false, error: m.error };
    await cambiarEstado(
      yo,
      id,
      "CANCELADO",
      { motivoCancelacion: m.texto, horaCancelado: new Date() },
      "CANCELADO",
      { motivo: m.texto },
    );
    refrescar();
    return { ok: true, mensaje: "Listo, el pedido quedó cancelado." };
  } catch (e) {
    return fallo(e);
  }
}

/** ↩️ Ya recibí el paquete de vuelta: Problema → Devuelto. */
export async function marcarDevuelto(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  try {
    const yo = await permitirSolo("COLABORADOR");
    const id = esquemaId.parse(form.get("id"));
    await cambiarEstado(yo, id, "DEVUELTO", {}, "DEVUELTO");
    refrescar();
    return { ok: true, mensaje: "Listo, el paquete ya está de vuelta en el local ↩️" };
  } catch (e) {
    return fallo(e);
  }
}

/** Cambiar quién lleva el pedido (mientras no esté terminado). */
export async function reasignarPedido(_prev: EstadoAccion, form: FormData): Promise<EstadoAccion> {
  try {
    const yo = await permitirSolo("COLABORADOR");
    const id = esquemaId.parse(form.get("id"));
    const mensajeroId = z.string().min(1).max(100).parse(form.get("mensajeroId"));
    const [nuevo] = await db
      .select({ id: users.id, nombre: users.name })
      .from(users)
      .where(and(eq(users.id, mensajeroId), eq(users.rol, "MENSAJERO"), eq(users.activo, true)));
    if (!nuevo) return { ok: false, error: "Elige quién lo lleva." };

    await db.transaction(async (tx) => {
      const [p] = await tx
        .select({ estado: pedidos.estado, mensajeroId: pedidos.mensajeroId })
        .from(pedidos)
        .where(eq(pedidos.id, id))
        .for("update");
      if (!p) throw new ErrorClaro("No encontré el pedido. Actualiza la pantalla.");
      if (!puedeReasignar(p.estado)) throw new ErrorClaro(YA_CAMBIO);
      if (p.mensajeroId === nuevo.id) throw new ErrorClaro(`${nuevo.nombre} ya lleva este pedido.`);
      await tx
        .update(pedidos)
        .set({ mensajeroId: nuevo.id, actualizadoEn: new Date() })
        .where(eq(pedidos.id, id));
      await tx.insert(pedidoEventos).values({
        pedidoId: id,
        tipo: "REASIGNADO",
        estadoAntes: p.estado,
        estadoDespues: p.estado,
        usuarioId: yo.id,
        detalle: { de: p.mensajeroId, a: nuevo.id },
      });
    });
    refrescar();
    return { ok: true, mensaje: `Listo, ahora lo lleva ${nuevo.nombre} ✅` };
  } catch (e) {
    return fallo(e);
  }
}
