"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Aviso, Boton, Selector, Tarjeta } from "@/components/ui";
import { horaCorta, pesos } from "@/lib/formato";
import { type EstadoAccion, cancelarPedido, marcarDevuelto, reasignarPedido } from "../actions";
import type { PedidoTarjeta } from "../queries";
import {
  MOTIVOS_CANCELACION,
  esAbierto,
  etiquetaDia,
  puedeEditar,
  puedeReasignar,
  textoParaWhatsApp,
} from "../rules";
import { linkFotoPedido } from "@/modules/fotos/rules";
import { ChipEstado } from "./piezas";
import { enviarSinBorrar } from "@/components/enviar";

type Abierto = "nada" | "cancelar" | "reasignar";
type Mensajero = { id: string; nombre: string };

const claseNota = "mt-2 rounded-[10px] border-l-4 border-naranja bg-campo px-3 py-2 text-sm";

export function TarjetaPedido({
  p,
  hoy,
  mensajeros,
}: {
  p: PedidoTarjeta;
  hoy: string;
  mensajeros: Mensajero[];
}) {
  const [abierto, setAbierto] = useState<Abierto>("nada");
  const [motivo, setMotivo] = useState("");
  const [nuevoMensajero, setNuevoMensajero] = useState(p.mensajeroId);
  const [copiado, setCopiado] = useState(false);

  const cerrarSiOk = (accion: (prev: EstadoAccion, f: FormData) => Promise<EstadoAccion>) =>
    async (prev: EstadoAccion, f: FormData) => {
      const r = await accion(prev, f);
      if (r?.ok) setAbierto("nada");
      return r;
    };
  const [eCancelar, cancelar, cancelando] = useActionState(cerrarSiOk(cancelarPedido), null);
  const [eReasignar, reasignar, reasignando] = useActionState(cerrarSiOk(reasignarPedido), null);
  const [eDevuelto, devuelto, devolviendo] = useActionState(marcarDevuelto, null);
  const resultado = [eCancelar, eReasignar, eDevuelto].find((x) => x !== null) ?? null;

  const etiqueta = etiquetaDia(p, hoy);
  const abiertoPedido = esAbierto(p.estado);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoParaWhatsApp(p));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Tarjeta className="min-[900px]:mb-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <b>
          #{p.numeroDia} {p.cliente}
        </b>
        <ChipEstado estado={p.estado} />
      </div>
      <div>{p.direccion}</div>
      <div className="text-sm text-suave">
        {p.zona} · {pesos(p.valorDomi)} de domi
        {etiqueta ? (
          <span className={`font-bold ${etiqueta.tipo === "ok" ? "text-exito" : "text-problema"}`}>
            {" "}
            {etiqueta.texto}
          </span>
        ) : null}
        {p.entregarAntes ? ` · Antes de las ${horaCorta(p.entregarAntes)}` : ""}
      </div>

      {abierto === "reasignar" ? (
        <form onSubmit={enviarSinBorrar(reasignar)} className="mt-2 rounded-2xl bg-campo p-3">
          <input type="hidden" name="id" value={p.id} />
          <Selector
            etiqueta="¿Quién lo lleva ahora?"
            name="mensajeroId"
            value={nuevoMensajero}
            onChange={(e) => setNuevoMensajero(e.target.value)}
            className="bg-tarjeta"
          >
            {mensajeros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Selector>
          <div className="mt-2 flex gap-2">
            <Boton type="button" onClick={() => setAbierto("nada")}>
              Volver
            </Boton>
            <Boton
              type="submit"
              className="flex-1"
              disabled={reasignando || nuevoMensajero === p.mensajeroId}
            >
              Sí, que lo lleve {mensajeros.find((m) => m.id === nuevoMensajero)?.nombre ?? ""}
            </Boton>
          </div>
        </form>
      ) : (
        <div className="text-sm text-suave">
          🏍️ Lo lleva <b className="text-tinta">{p.mensajero}</b>
          {puedeReasignar(p.estado) ? (
            <button
              type="button"
              onClick={() => {
                setNuevoMensajero(p.mensajeroId);
                setAbierto("reasignar");
              }}
              className="ml-1.5 cursor-pointer text-[13px] underline"
            >
              cambiar
            </button>
          ) : null}
        </div>
      )}

      {p.nota ? <div className={claseNota}>{p.nota}</div> : null}

      {p.estado === "CANCELADO" && p.motivoCancelacion ? (
        <div className={claseNota}>🚫 Cancelado: {p.motivoCancelacion}</div>
      ) : null}
      {p.motivoProblema ? (
        <div className={claseNota}>
          <b className="text-problema">Problema:</b> {p.motivoProblema}.
          {p.detalleProblema && p.detalleProblema !== p.motivoProblema ? ` ${p.detalleProblema}` : ""}
        </div>
      ) : null}

      {p.fotoSalidaUrl || p.fotoEntregaUrl ? (
        <div className="mt-2 flex flex-wrap gap-2.5 text-sm">
          {p.fotoSalidaUrl ? (
            <a href={linkFotoPedido(p.id, "salida")} target="_blank" rel="noopener noreferrer" className="font-semibold">
              📸 Foto al salir
            </a>
          ) : null}
          {p.fotoEntregaUrl ? (
            <a href={linkFotoPedido(p.id, "entrega")} target="_blank" rel="noopener noreferrer" className="font-semibold">
              📸 Foto al entregar
            </a>
          ) : null}
        </div>
      ) : null}

      {abierto === "cancelar" ? (
        <form onSubmit={enviarSinBorrar(cancelar)} className={claseNota}>
          <input type="hidden" name="id" value={p.id} />
          <b>🚫 ¿Por qué se cancela el pedido #{p.numeroDia}?</b>
          <select
            aria-label="Motivo de la cancelación"
            name="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1 w-full rounded-boton border border-linea bg-tarjeta p-[13px] text-base"
          >
            <option value="">Elige una opción</option>
            {MOTIVOS_CANCELACION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {motivo === "Otro" ? (
            <textarea
              aria-label="Cuéntanos qué pasó"
              name="detalle"
              rows={2}
              placeholder="Cuéntanos qué pasó"
              maxLength={300}
              className="mt-1 w-full rounded-boton border border-linea bg-tarjeta p-[13px] text-base"
            />
          ) : null}
          <div className="mt-2 flex gap-2">
            <Boton type="button" onClick={() => setAbierto("nada")}>
              Volver
            </Boton>
            <Boton type="submit" variante="peligro" className="flex-1" disabled={cancelando}>
              🚫 Sí, cancelar el pedido
            </Boton>
          </div>
        </form>
      ) : null}

      {p.estado === "PROBLEMA" ? (
        <form onSubmit={enviarSinBorrar(devuelto)}>
          <input type="hidden" name="id" value={p.id} />
          <Boton type="submit" variante="principal" grande disabled={devolviendo}>
            ↩️ Ya recibí el paquete de vuelta
          </Boton>
        </form>
      ) : null}

      {p.estado !== "CANCELADO" && abierto !== "cancelar" ? (
        <div className="mt-2.5 flex gap-2">
          <Boton type="button" pequeno className="flex-1" onClick={copiar}>
            {copiado ? "✅ Copiado" : "📋 Copiar"}
          </Boton>
          {puedeEditar(p.estado) ? (
            <Link
              href={`/colaborador/editar/${p.id}`}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-boton border border-linea bg-tarjeta px-3 text-[13px] font-semibold"
            >
              ✏️ Editar
            </Link>
          ) : null}
          {abiertoPedido ? (
            <Boton
              type="button"
              pequeno
              className="flex-1"
              onClick={() => {
                setMotivo("");
                setAbierto("cancelar");
              }}
            >
              🚫 Cancelar
            </Boton>
          ) : null}
        </div>
      ) : null}

      {resultado ? (
        <Aviso tipo={resultado.ok ? "ok" : "error"}>{resultado.ok ? resultado.mensaje : resultado.error}</Aviso>
      ) : null}
    </Tarjeta>
  );
}
