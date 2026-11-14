"use client";
import { useEffect, useState } from "react";

const EVENTO = "orderapp:aviso";

/** Muestra un aviso corto flotante, ej. "Listo, buen viaje 🏍️". Se puede llamar desde cualquier pantalla. */
export function avisar(texto: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: texto }));
}

/** Dónde aparecen los avisos (va una sola vez en el marco de la app). */
export function Avisos() {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const mostrar = (e: Event) => {
      setTexto((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setTexto(null), 3500);
    };
    window.addEventListener(EVENTO, mostrar);
    return () => {
      window.removeEventListener(EVENTO, mostrar);
      clearTimeout(t);
    };
  }, []);
  if (!texto) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-2xl bg-tinta px-4 py-3 text-center text-[15px] font-semibold text-white shadow-suave min-[900px]:bottom-6"
    >
      {texto}
    </div>
  );
}
