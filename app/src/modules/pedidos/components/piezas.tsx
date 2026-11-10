import { EMOJI_ESTADO, type Estado, NOMBRE_ESTADO, textoDemora } from "../rules";

const ESTILO_CHIP: Record<Estado, string> = {
  EMPACADO: "bg-campo border-linea",
  EN_ENTREGA: "bg-naranja border-naranja text-white",
  ENTREGADO: "bg-campo border-exito text-exito",
  PROBLEMA: "bg-campo border-problema text-problema",
  DEVUELTO: "bg-campo border-ambar text-ambar",
  CANCELADO: "bg-campo border-suave text-suave line-through",
};

/** Etiqueta del estado: "🏍️ En entrega". */
export function ChipEstado({ estado }: { estado: Estado }) {
  return (
    <span
      className={`rounded-full border px-[11px] py-1 text-[13px] font-bold whitespace-nowrap ${ESTILO_CHIP[estado]}`}
    >
      {EMOJI_ESTADO[estado]} {NOMBRE_ESTADO[estado]}
    </span>
  );
}

export type Demorado = { id: number; numeroDia: number; cliente: string; mensajero: string; minutos: number };

/** ⏰ Alerta de pedidos demorados, arriba de la lista. */
export function AlertaDemorados({ lista }: { lista: Demorado[] }) {
  if (lista.length === 0) return null;
  return (
    <div role="alert" className="mb-3.5 rounded-tarjeta border-2 border-ambar bg-tarjeta p-3.5">
      <b className="text-ambar">⏰ Ojo, estos pedidos se están demorando:</b>
      <ul className="mt-1">
        {lista.map((d) => (
          <li key={d.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
            <span>
              #{d.numeroDia} {d.cliente} lleva {d.minutos} min en la calle con {d.mensajero}
            </span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(textoDemora(d))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] flex-none items-center rounded-boton border border-linea bg-tarjeta px-3 text-[13px] font-semibold"
            >
              💬 Escribirle
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
