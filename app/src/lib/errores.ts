import { SinPermiso } from "@/modules/auth/sesion";

/** Error con un mensaje pensado para la persona (se muestra tal cual en pantalla). */
export class ErrorClaro extends Error {}

/** Lo que devuelve una acción cuando algo falla. Los errores raros no se le muestran a la persona. */
export function fallo(e: unknown): { ok: false; error: string } {
  if (e instanceof SinPermiso || e instanceof ErrorClaro) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Algo salió mal. Intenta otra vez en un momento." };
}

export const YA_CAMBIO = "Este pedido ya cambió. Actualiza la pantalla.";
