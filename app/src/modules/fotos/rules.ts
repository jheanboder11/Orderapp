/** Reglas de las fotos (lógica pura, con pruebas). */

/** Lado más largo de la foto después de achicarla en el celular. */
export const LADO_MAXIMO = 1100;
/** Calidad JPEG al achicarla (0 a 1). */
export const CALIDAD_JPEG = 0.72;
/** Tope en el servidor (una foto achicada pesa unos 150–400 KB). */
export const BYTES_MAXIMOS = 4 * 1024 * 1024;

/** null si la foto sirve; si no, el mensaje para la persona. */
export function errorFoto(f: { tipo: string; bytes: number }): string | null {
  if (f.bytes <= 0) return "La foto llegó vacía. Tómala otra vez.";
  if (!f.tipo.startsWith("image/")) return "Eso no es una foto. Tómala con la cámara.";
  if (f.bytes > BYTES_MAXIMOS) return "La foto pesa demasiado. Tómala otra vez.";
  return null;
}

/** Tamaño final para que el lado más largo quede en LADO_MAXIMO (nunca agranda). */
export function medidasAchicadas(ancho: number, alto: number): { ancho: number; alto: number } {
  const k = Math.min(1, LADO_MAXIMO / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * k)), alto: Math.max(1, Math.round(alto * k)) };
}

/** Link interno para ver la foto de un pedido (pasa por la app, que revisa la sesión). */
export const linkFotoPedido = (pedidoId: number, tipo: "salida" | "entrega") =>
  `/api/fotos/pedido/${pedidoId}/${tipo}`;
