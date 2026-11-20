"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Aviso arriba en cualquier módulo cuando hay domicilios con alerta. En Alerta no sale. */
export function AvisoAlertas({ cuantos, href }: { cuantos: number; href: string }) {
  const ruta = usePathname();
  if (cuantos <= 0 || ruta.startsWith(href)) return null;
  return (
    <Link
      href={href}
      role="status"
      className="mt-5 flex min-h-[60px] items-center gap-3 rounded-[22px] border border-borde-rosa bg-tarjeta py-2.5 pr-4 pl-2.5 text-[15px] font-bold text-tinta shadow-suave"
    >
      <span
        aria-hidden="true"
        className="grid h-10 w-10 flex-none place-items-center rounded-full bg-rosa text-lg font-extrabold text-frambuesa"
      >
        !
      </span>
      <span className="flex-1">
        {cuantos === 1 ? "1 domicilio necesita ayuda" : `${cuantos} domicilios necesitan ayuda`}
      </span>
      <span className="whitespace-nowrap text-frambuesa">Ver →</span>
    </Link>
  );
}
