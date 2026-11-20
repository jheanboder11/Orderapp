"use client";
import { useState } from "react";
import { avisar } from "@/components/Avisos";
import { linkWhatsApp } from "@/modules/entregas/rules";
import {
  aHora24,
  deHora24,
  horaCorta,
  moverHora,
  type Partes,
} from "@/lib/formato";
import { textoParaMensajero } from "../rules";
import { Rueda } from "./HoraLimite";

const claseBoton =
  "inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-boton border px-3 text-[13px] font-bold whitespace-nowrap";

/**
 * Pestaña "💬 Enviar mensaje a Teo": arma un mensaje con su nombre, cuántos domis tiene y
 * a qué hora debe venir, para copiarlo o abrirlo en WhatsApp.
 */
export function MensajeMensajero({
  nombre,
  celular,
  cantidad,
  dia,
}: {
  nombre: string;
  celular: string | null;
  cantidad: number;
  dia: "hoy" | "mañana";
}) {
  const [hora, setHora] = useState("14:00");
  const p: Partes = deHora24(hora);
  const poner = (campo: keyof Partes, paso: 1 | -1) =>
    setHora(aHora24(moverHora(p, campo, paso)));
  const texto = textoParaMensajero(nombre, cantidad, dia, horaCorta(hora));

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(`📋 Mensaje para ${nombre} copiado. Pégalo en WhatsApp.`);
    } catch {
      avisar(
        "No pude copiarlo. Mantén el dedo sobre el mensaje para copiarlo a mano.",
      );
    }
  }

  return (
    <details className="mb-3.5 rounded-tarjeta border border-linea bg-tarjeta shadow-suave">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span>💬 Enviar mensaje a {nombre}</span>
        <span className="text-sm text-suave">Abrir ›</span>
      </summary>

      <div className="px-4 pb-4">
        {cantidad === 0 ? (
          <p className="text-sm text-suave">
            {nombre} no tiene domis por recoger {dia}.
          </p>
        ) : (
          <>
            <p className="text-sm text-suave">¿Antes de qué hora debe venir?</p>
            <div className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-campo p-3">
              <Rueda
                nombre="hora"
                valor={String(p.hora)}
                subir={() => poner("hora", 1)}
                bajar={() => poner("hora", -1)}
              />
              <span className="text-[28px] font-extrabold">:</span>
              <Rueda
                nombre="minutos"
                valor={String(p.minutos).padStart(2, "0")}
                subir={() => poner("minutos", 1)}
                bajar={() => poner("minutos", -1)}
              />
              <Rueda
                nombre="a. m. o p. m."
                valor={p.pm ? "p. m." : "a. m."}
                subir={() => poner("pm", 1)}
                bajar={() => poner("pm", -1)}
              />
            </div>

            <p className="mt-3 text-sm text-suave">Así le llega:</p>
            <p className="mt-1 rounded-2xl bg-campo p-3 text-[15px] select-all">
              {texto}
            </p>

            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={copiar}
                className={`${claseBoton} border-borde-rosa bg-tarjeta text-frambuesa`}
              >
                📋 Copiar
              </button>
              <a
                href={`${celular ? linkWhatsApp(celular) : "https://wa.me/"}?text=${encodeURIComponent(texto)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${claseBoton} border-guayaba bg-guayaba text-white`}
              >
                💬 {celular ? `WhatsApp a ${nombre}` : "Abrir WhatsApp"}
              </a>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
