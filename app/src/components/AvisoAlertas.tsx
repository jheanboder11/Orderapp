"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Franja roja arriba en cualquier módulo cuando hay domicilios con alerta. En 🚨 Alerta no sale. */
export function AvisoAlertas({ cuantos, href }: { cuantos: number; href: string }) {
  const ruta = usePathname();
  if (cuantos <= 0 || ruta.startsWith(href)) return null;
  return (
    <Link
      href={href}
      role="status"
      className="mt-3 flex items-center justify-between gap-2 rounded-boton border-2 border-problema bg-tarjeta px-3.5 py-2.5 text-sm font-semibold text-problema"
    >
      <span>
        🚨 {cuantos === 1 ? "1 domicilio necesita ayuda" : `${cuantos} domicilios necesitan ayuda`}
      </span>
      <span className="whitespace-nowrap">Ver →</span>
    </Link>
  );
}
