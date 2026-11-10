import type { Metadata } from "next";
import { fechaBogota } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { crearPedido } from "@/modules/pedidos/actions";
import { FormPedido } from "@/modules/pedidos/components/FormPedido";
import { listarZonas, mensajerosActivos, siguienteNumero } from "@/modules/pedidos/queries";

export const metadata: Metadata = { title: "Nuevo pedido · Orderapp" };

export default async function Nuevo() {
  await exigirRol("COLABORADOR");
  const [zonas, mensajeros, numero] = await Promise.all([
    listarZonas(),
    mensajerosActivos(),
    siguienteNumero(fechaBogota()),
  ]);
  return (
    <div className="mt-4">
      <FormPedido zonas={zonas} mensajeros={mensajeros} numero={numero} accion={crearPedido} />
    </div>
  );
}
