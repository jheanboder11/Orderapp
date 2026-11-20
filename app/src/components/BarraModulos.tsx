"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Rol } from "@/modules/auth/rules";

/** Iconos de línea (estilo Lucide, trazo 2.2). */
const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const ICONOS: Record<string, ReactNode> = {
  lista: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" {...trazo} />
      <path d="M9 8h6M9 12h6M9 16h4" {...trazo} />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" {...trazo} />,
  campana: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" {...trazo} />
      <path d="M10 20a2 2 0 0 0 4 0" {...trazo} />
    </>
  ),
  moto: (
    <>
      <circle cx="5.5" cy="17" r="3" {...trazo} />
      <circle cx="18.5" cy="17" r="3" {...trazo} />
      <path d="M8.5 17h6l3-7h-4M5.5 17l3-6h5M15 6h2.5l1 4" {...trazo} />
    </>
  ),
  recibo: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" {...trazo} />
      <path d="M9 8h6M9 12h6" {...trazo} />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" {...trazo} />
      <path d="M8 12.5l2.7 2.7L16 10" {...trazo} />
    </>
  ),
  moneda: (
    <>
      <circle cx="12" cy="12" r="9" {...trazo} />
      <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" {...trazo} />
    </>
  ),
  carpeta: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...trazo} />,
  equipo: (
    <>
      <circle cx="9" cy="8" r="3.5" {...trazo} />
      <path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.7.8 2.8 2.6 3 5.2" {...trazo} />
    </>
  ),
};

type Modulo = { href: string; icono: keyof typeof ICONOS; texto: string };

/** Módulos de cada rol, en el orden en que aparecen en la barra. */
const MODULOS: Record<Rol, Modulo[]> = {
  ADMINISTRADOR: [
    { href: "/admin/hoy", icono: "moneda", texto: "Hoy" },
    { href: "/admin/cierres", icono: "recibo", texto: "Cierres" },
    { href: "/admin/historial", icono: "carpeta", texto: "Historial" },
    { href: "/admin/equipo", icono: "equipo", texto: "Equipo" },
  ],
  COLABORADOR: [
    { href: "/colaborador/pedidos", icono: "lista", texto: "Pedidos" },
    { href: "/colaborador/nuevo", icono: "mas", texto: "Nuevo" },
    { href: "/colaborador/alerta", icono: "campana", texto: "Alerta" },
  ],
  MENSAJERO: [
    { href: "/mensajero/entregas", icono: "moto", texto: "Entregas" },
    { href: "/mensajero/cierre", icono: "recibo", texto: "Cierre" },
    { href: "/mensajero/hechos", icono: "check", texto: "Entregados" },
  ],
};

/**
 * Barra de módulos: píldora flotante abajo en el celular (a mano del pulgar), arriba en el computador.
 * `pendientes` pone el numerito menta.
 */
export function BarraModulos({
  rol,
  pendientes = {},
}: {
  rol: Rol;
  pendientes?: Record<string, number>;
}) {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Módulos"
      className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[532px] justify-center gap-1 rounded-[28px] border border-linea bg-tarjeta p-1.5 shadow-[0_18px_40px_-18px_rgba(43,15,36,0.45)] min-[900px]:sticky min-[900px]:top-2 min-[900px]:bottom-auto min-[900px]:mt-3 min-[900px]:mb-2"
    >
      {MODULOS[rol].map((m) => {
        const activo = ruta === m.href || ruta.startsWith(`${m.href}/`);
        const n = pendientes[m.href] ?? 0;
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={activo ? "page" : undefined}
            className={`relative flex min-h-[56px] max-w-[160px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] px-1 py-1.5 text-[13px] font-bold min-[900px]:max-w-[220px] min-[900px]:flex-row min-[900px]:gap-2 min-[900px]:text-sm ${
              activo ? "bg-rosa text-frambuesa" : "text-suave"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
              {ICONOS[m.icono]}
            </svg>
            {m.texto}
            {n > 0 ? (
              <span className="absolute top-1 right-[calc(50%-26px)] h-5 min-w-5 rounded-full bg-menta px-1.5 text-[11px] leading-5 font-extrabold text-tinta min-[900px]:static">
                {n}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
