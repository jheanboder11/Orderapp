"use client";
import { useState, useTransition } from "react";
import { avisar } from "@/components/Avisos";
import { Aviso, Boton, Tarjeta } from "@/components/ui";
import { horaCorta } from "@/lib/formato";
import { BotonFoto } from "@/modules/fotos/components/BotonFoto";
import { ChipEstado } from "@/modules/pedidos/components/piezas";
import { MOTIVOS_PROBLEMA } from "@/modules/pedidos/rules";
import { entregarConFoto, noPudeEntregar } from "../actions";
import type { PedidoDelMensajero } from "../queries";
import { linkLlamar, linkMapa, linkWhatsApp, textoCobro } from "../rules";

const claseNota = "mt-2 rounded-[10px] border-l-4 border-naranja bg-campo px-3 py-2 text-sm";
const claseHerramienta =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-boton border border-linea bg-tarjeta px-2 text-[13px] font-semibold";

/** Tarjeta completa de un pedido en la calle (o que hay que regresar al local). */
export function TarjetaEntrega({ p }: { p: PedidoDelMensajero }) {
  const [problema, setProblema] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [avisando, empezar] = useTransition();

  function avisarProblema(datos: FormData) {
    setError(null);
    empezar(async () => {
      const r = await noPudeEntregar(datos);
      if (r.ok) {
        setProblema(false);
        avisar(r.mensaje);
      } else setError(r.error);
    });
  }

  const enLaCalle = p.estado === "EN_ENTREGA";

  return (
    <Tarjeta>
      <div className="mb-1 flex items-center justify-between gap-2">
        <b className="text-[17px]">
          #{p.numeroDia} {p.cliente}
        </b>
        <ChipEstado estado={p.estado} />
      </div>
      <div className="text-[16px] font-semibold">{p.direccion}</div>
      <div className="text-sm text-suave">
        {p.zona}. Lleva: {p.items}
        {p.entregarAntes ? (
          <b className="text-ambar"> · Antes de las {horaCorta(p.entregarAntes)}</b>
        ) : null}
      </div>
      <div className="mt-1.5">{textoCobro(p.formaPago, p.valorTotal)}</div>

      {p.nota ? <div className={claseNota}>{p.nota}</div> : null}
      {p.estado === "CANCELADO" ? (
        <div className={claseNota}>🚫 Este pedido se canceló. Si ya tienes el paquete, regrésalo al local.</div>
      ) : null}
      {p.estado === "PROBLEMA" ? (
        <div className={claseNota}>
          <b className="text-problema">Problema:</b> {p.motivoProblema ?? "sin motivo"}. Regresa el paquete al
          local.
        </div>
      ) : null}
      {p.fotoSalidaUrl ? (
        <div className="mt-1.5 text-[13px] text-suave">
          Foto al salir: <b className="text-exito">lista</b>
        </div>
      ) : null}

      {enLaCalle && problema ? (
        <form
          className="mt-2 rounded-2xl bg-campo p-3"
          onSubmit={(e) => {
            e.preventDefault();
            avisarProblema(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="id" value={p.id} />
          <label className="block text-sm text-suave">
            😕 ¿Qué pasó?
            <select
              name="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 w-full rounded-boton border border-linea bg-tarjeta p-[13px] text-base text-tinta"
            >
              <option value="">Elige una opción</option>
              {MOTIVOS_PROBLEMA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {motivo === "Otro" ? (
            <label className="mt-2 block text-sm text-suave">
              Cuéntanos
              <textarea
                name="detalle"
                rows={2}
                maxLength={300}
                className="mt-1 w-full rounded-boton border border-linea bg-tarjeta p-[13px] text-base text-tinta"
              />
            </label>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Boton type="button" onClick={() => setProblema(false)}>
              Volver
            </Boton>
            <Boton type="submit" variante="principal" className="flex-1" disabled={avisando}>
              📣 Avisar lo que pasó
            </Boton>
          </div>
        </form>
      ) : enLaCalle ? (
        <BotonFoto accion={entregarConFoto} campos={{ id: p.id }}>
          ✅ Ya lo entregué <span className="font-normal opacity-90">(toma la foto)</span>
        </BotonFoto>
      ) : null}

      {p.estado !== "CANCELADO" ? (
        <div className="mt-2.5 flex gap-2">
          <a className={claseHerramienta} href={linkLlamar(p.celular)}>
            📞 Llamar
          </a>
          <a className={claseHerramienta} href={linkMapa(p.direccion, p.zona)} target="_blank" rel="noopener noreferrer">
            📍 Mapa
          </a>
          <a className={claseHerramienta} href={linkWhatsApp(p.celular)} target="_blank" rel="noopener noreferrer">
            💬 WhatsApp
          </a>
        </div>
      ) : null}

      {enLaCalle && !problema ? (
        <button
          type="button"
          onClick={() => {
            setMotivo("");
            setProblema(true);
          }}
          className="mx-auto mt-3 block cursor-pointer text-sm text-suave underline"
        >
          😕 No pude entregarlo
        </button>
      ) : null}

      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </Tarjeta>
  );
}
