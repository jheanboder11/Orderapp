import type { Metadata } from "next";
import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { fechaBogota, pesos } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { editarPedido } from "@/modules/pedidos/actions";
import { FormPedido } from "@/modules/pedidos/components/FormPedido";
import { listarZonas, mensajerosActivos, pedidoParaEditar } from "@/modules/pedidos/queries";
import { puedeEditar } from "@/modules/pedidos/rules";

export const metadata: Metadata = { title: "Editar pedido · Orderapp" };

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  await exigirRol("COLABORADOR");
  const id = Number((await params).id);
  const p = Number.isInteger(id) && id > 0 ? await pedidoParaEditar(id) : null;

  if (!p || !puedeEditar(p.estado)) {
    return (
      <Tarjeta className="mt-4">
        <p className="font-bold">
          {p ? "Este pedido ya salió o terminó, por eso no se puede editar." : "No encontré ese pedido."}
        </p>
        <Link href="/colaborador/pedidos" className="mt-2 inline-block font-semibold underline">
          Volver a los pedidos
        </Link>
      </Tarjeta>
    );
  }

  const [zonas, mensajeros] = await Promise.all([listarZonas(), mensajerosActivos()]);
  const hoy = fechaBogota();

  return (
    <div className="mt-4">
      <FormPedido
        zonas={zonas}
        mensajeros={mensajeros}
        accion={editarPedido.bind(null, p.id)}
        editando={{
          numero: p.numeroDia,
          campos: {
            cliente: p.cliente,
            celular: p.celular,
            direccion: p.direccion,
            zonaId: String(p.zonaId),
            items: p.items,
            nota: p.nota ?? "",
            formaPago: p.formaPago,
            valorTotal: pesos(p.valorTotal).replace("$ ", ""),
            para: p.fechaEntrega > hoy ? "MANANA" : "HOY",
            entregarAntes: p.entregarAntes?.slice(0, 5) ?? "",
            mensajeroId: p.mensajeroId,
          },
        }}
      />
    </div>
  );
}
