"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/modules/auth/rules";

type Modulo = { href: string; emoji: string; texto: string };

/** Módulos de cada rol, en el orden en que aparecen en la barra. */
const MODULOS: Record<Rol, Modulo[]> = {
  ADMINISTRADOR: [
    { href: "/admin/hoy", emoji: "💰", texto: "Hoy" },
    { href: "/admin/cierres", emoji: "🧾", texto: "Cierres" },
    { href: "/admin/historial", emoji: "🗂️", texto: "Historial" },
    { href: "/admin/equipo", emoji: "👥", texto: "Equipo" },
  ],
  COLABORADOR: [
    { href: "/colaborador/pedidos", emoji: "📋", texto: "Pedidos" },
    { href: "/colaborador/nuevo", emoji: "➕", texto: "Nuevo" },
  ],
  MENSAJERO: [
    { href: "/mensajero/entregas", emoji: "🏍️", texto: "Entregas" },
    { href: "/mensajero/cierre", emoji: "🧾", texto: "Cierre" },
    { href: "/mensajero/hechos", emoji: "✅", texto: "Hechos" },
  ],
};

/**
 * Barra de módulos: fija abajo en el celular (a mano del pulgar), arriba en el computador.
 * `pendientes` pone el numerito naranja (se usará desde la Fase 2).
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
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center gap-1 border-t border-linea bg-tarjeta px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] min-[900px]:sticky min-[900px]:top-0 min-[900px]:bottom-auto min-[900px]:mb-2 min-[900px]:rounded-[18px] min-[900px]:border min-[900px]:shadow-suave"
    >
      {MODULOS[rol].map((m) => {
        const activo = ruta === m.href || ruta.startsWith(`${m.href}/`);
        const n = pendientes[m.href] ?? 0;
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={activo ? "page" : undefined}
            className={`relative flex max-w-[140px] flex-1 flex-col items-center gap-0.5 rounded-[14px] px-1 py-1.5 text-xs font-semibold min-[900px]:max-w-[220px] min-[900px]:flex-row min-[900px]:justify-center min-[900px]:gap-2 min-[900px]:p-2.5 min-[900px]:text-sm ${
              activo ? "bg-campo text-tinta" : "text-suave"
            }`}
          >
            <span aria-hidden="true" className="text-[21px] leading-tight min-[900px]:text-lg">
              {m.emoji}
            </span>
            {m.texto}
            {n > 0 ? (
              <span className="absolute top-0.5 right-[calc(50%-24px)] h-[18px] min-w-[18px] rounded-full bg-naranja px-[5px] text-[11px] leading-[18px] font-bold text-white min-[900px]:static">
                {n}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
