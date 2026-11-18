import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarioActual } from "@/modules/auth/sesion";
import { cierres } from "@/modules/cierres/schema";
import { leerFoto } from "@/modules/fotos/guardar";

/**
 * Muestra la foto de la consignación de un cierre.
 * Solo con sesión. El Mensajero solo ve las de SUS cierres.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const yo = await usuarioActual();
  if (!yo)
    return new Response("Entra a Orderapp para ver la foto.", { status: 401 });

  const cierreId = Number((await params).id);
  if (!Number.isInteger(cierreId) || cierreId <= 0)
    return new Response("No encontré la foto.", { status: 404 });

  const [c] = await db
    .select({
      mensajeroId: cierres.mensajeroId,
      foto: cierres.fotoConsignacionUrl,
    })
    .from(cierres)
    .where(eq(cierres.id, cierreId));
  if (!c || !c.foto || (yo.rol === "MENSAJERO" && c.mensajeroId !== yo.id)) {
    return new Response("No encontré la foto.", { status: 404 });
  }

  const foto = await leerFoto(c.foto);
  if (!foto) return new Response("No encontré la foto.", { status: 404 });
  return new Response(foto.cuerpo, {
    headers: {
      "Content-Type": foto.tipo,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
