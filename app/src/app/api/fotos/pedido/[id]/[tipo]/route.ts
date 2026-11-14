import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarioActual } from "@/modules/auth/sesion";
import { leerFoto } from "@/modules/fotos/guardar";
import { pedidos } from "@/modules/pedidos/schema";

/**
 * Muestra la foto de salida o de entrega de un pedido.
 * Solo con sesión. El Mensajero solo ve las fotos de SUS pedidos.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; tipo: string }> }) {
  const yo = await usuarioActual();
  if (!yo) return new Response("Entra a Orderapp para ver la foto.", { status: 401 });

  const { id, tipo } = await params;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0 || (tipo !== "salida" && tipo !== "entrega")) {
    return new Response("No encontré la foto.", { status: 404 });
  }

  const [p] = await db
    .select({
      mensajeroId: pedidos.mensajeroId,
      salida: pedidos.fotoSalidaUrl,
      entrega: pedidos.fotoEntregaUrl,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId));
  const referencia = p?.[tipo];
  // Al Mensajero ajeno se le responde igual que si no existiera (no se revela nada).
  if (!p || !referencia || (yo.rol === "MENSAJERO" && p.mensajeroId !== yo.id)) {
    return new Response("No encontré la foto.", { status: 404 });
  }

  const foto = await leerFoto(referencia);
  if (!foto) return new Response("No encontré la foto.", { status: 404 });
  return new Response(foto.cuerpo, {
    headers: {
      "Content-Type": foto.tipo,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
