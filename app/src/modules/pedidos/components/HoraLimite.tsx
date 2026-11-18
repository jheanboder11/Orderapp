"use client";
import { aHora24, deHora24, moverHora, type Partes } from "@/lib/formato";

const claseFlecha =
  "flex h-11 w-full cursor-pointer items-center justify-center rounded-boton border border-linea bg-tarjeta text-lg font-bold text-tinta active:bg-campo";

/** Una columna con ▲ valor ▼ (hora, minutos o a. m./p. m.). */
export function Rueda({
  nombre,
  valor,
  subir,
  bajar,
}: {
  nombre: string;
  valor: string;
  subir: () => void;
  bajar: () => void;
}) {
  return (
    <div className="flex w-[76px] flex-col items-center gap-1">
      <button type="button" aria-label={`Subir ${nombre}`} onClick={subir} className={claseFlecha}>
        ▲
      </button>
      <output aria-label={nombre} className="py-1 text-[28px] leading-none font-extrabold tabular-nums">
        {valor}
      </output>
      <button type="button" aria-label={`Bajar ${nombre}`} onClick={bajar} className={claseFlecha}>
        ▼
      </button>
    </div>
  );
}

/**
 * "¿Antes de qué hora?": Sin afán, o una hora con flechas para hora, minutos y a. m./p. m.
 * Guarda el valor como "17:30" (o vacío) en un campo escondido para el formulario.
 */
export function HoraLimite({ valor, cambiar }: { valor: string; cambiar: (v: string) => void }) {
  const conHora = valor !== "";
  const p: Partes = deHora24(valor || "17:00");
  const poner = (campo: keyof Partes, paso: 1 | -1) => cambiar(aHora24(moverHora(p, campo, paso)));

  const claseOpcion = (activa: boolean) =>
    `flex-1 cursor-pointer rounded-full px-2 py-2.5 text-center text-sm font-semibold ${
      activa ? "bg-tarjeta text-tinta shadow-suave" : "text-suave"
    }`;

  return (
    <fieldset className="mt-3">
      <legend className="text-sm text-suave">¿Antes de qué hora?</legend>
      <input type="hidden" name="entregarAntes" value={valor} />
      <div className="mt-1 flex gap-1.5 rounded-full bg-campo p-1">
        <button type="button" aria-pressed={!conHora} onClick={() => cambiar("")} className={claseOpcion(!conHora)}>
          😎 Sin afán
        </button>
        <button
          type="button"
          aria-pressed={conHora}
          onClick={() => !conHora && cambiar("17:00")}
          className={claseOpcion(conHora)}
        >
          ⏰ Con hora
        </button>
      </div>

      {conHora ? (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-campo p-3">
          <Rueda nombre="hora" valor={String(p.hora)} subir={() => poner("hora", 1)} bajar={() => poner("hora", -1)} />
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
      ) : null}
    </fieldset>
  );
}
