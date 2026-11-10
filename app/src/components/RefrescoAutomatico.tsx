"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Vuelve a pedir los datos cada minuto (y al volver a la pantalla),
 * para que la lista y las alertas de demora se mantengan al día sin tocar nada.
 */
export function RefrescoAutomatico({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const t = setInterval(refrescar, segundos * 1000);
    document.addEventListener("visibilitychange", refrescar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refrescar);
    };
  }, [router, segundos]);
  return null;
}
