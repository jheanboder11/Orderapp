"use client";
import { CALIDAD_JPEG, medidasAchicadas } from "./rules";

/**
 * Achica la foto en el celular ANTES de subirla (máx. 1100 px, JPEG 0.72).
 * Una foto de 4 MB queda en unos 200 KB: sube rápido aunque haya poca señal.
 */
export async function comprimirFoto(archivo: File): Promise<Blob> {
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No pude leer la foto, intenta de nuevo.");
  }
  const { ancho, alto } = medidasAchicadas(imagen.width, imagen.height);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("No pude preparar la foto, intenta de nuevo.");
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();
  const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", CALIDAD_JPEG));
  if (!blob) throw new Error("No pude preparar la foto, intenta de nuevo.");
  return blob;
}
