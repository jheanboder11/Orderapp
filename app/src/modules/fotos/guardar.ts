import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { ErrorClaro } from "@/lib/errores";
import { fechaBogota } from "@/lib/formato";
import { errorFoto } from "./rules";

/**
 * Dónde viven las fotos:
 * - Con la llave de Vercel Blob (BLOB_READ_WRITE_TOKEN, o el Blob conectado al proyecto en Vercel):
 *   en Blob, como PRIVADAS. Solo se ven a través de la app, con sesión.
 * - Sin llave y en el computador (desarrollo): en la carpeta .fotos-locales/ (no se sube a GitHub).
 *
 * En la base se guarda una "referencia": "blob:<ruta>" o "local:<ruta>". Nunca un link público.
 */
const CARPETA_LOCAL = path.join(process.cwd(), ".fotos-locales");

const hayBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export type TipoFoto = "salida" | "entrega" | "consignacion";

/** Guarda la foto que llegó del celular y devuelve su referencia. */
export async function guardarFoto(archivo: FormDataEntryValue | null, tipo: TipoFoto): Promise<string> {
  if (!(archivo instanceof File)) throw new ErrorClaro("Falta la foto. Tómala otra vez.");
  const error = errorFoto({ tipo: archivo.type, bytes: archivo.size });
  if (error) throw new ErrorClaro(error);

  // Nombre imposible de adivinar: tipo/fecha/código-al-azar.jpg
  const ruta = `${tipo}/${fechaBogota()}/${randomUUID()}.jpg`;
  const datos = Buffer.from(await archivo.arrayBuffer());

  if (hayBlob()) {
    await put(ruta, datos, { access: "private", contentType: "image/jpeg", addRandomSuffix: false });
    return `blob:${ruta}`;
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new ErrorClaro("Las fotos todavía no están configuradas. Avísale al Administrador.");
  }
  const destino = path.join(CARPETA_LOCAL, ruta);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return `local:${ruta}`;
}

/** Lee una foto guardada. Devuelve null si no existe. Quien llama debe revisar el permiso antes. */
export async function leerFoto(referencia: string): Promise<{ cuerpo: BodyInit; tipo: string } | null> {
  const [donde, ...resto] = referencia.split(":");
  const ruta = resto.join(":");
  // Solo rutas que la app misma creó (evita que alguien pida archivos fuera de la carpeta).
  if (!/^(salida|entrega|consignacion)\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.jpg$/.test(ruta)) return null;

  if (donde === "blob") {
    const r = await get(ruta, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    return { cuerpo: r.stream, tipo: r.blob.contentType };
  }
  if (donde === "local") {
    try {
      const datos = await readFile(path.join(CARPETA_LOCAL, ruta));
      return { cuerpo: new Uint8Array(datos), tipo: "image/jpeg" };
    } catch {
      return null;
    }
  }
  return null;
}
