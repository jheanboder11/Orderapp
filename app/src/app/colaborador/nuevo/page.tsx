import type { Metadata } from "next";
import { Resaltar, TituloModulo } from "@/components/ui";
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
    <>
      <TituloModulo>
        ¿Qué <Resaltar>domicilio</Resaltar> vamos a enviar hoy?
      </TituloModulo>
      <FormPedido zonas={zonas} mensajeros={mensajeros} numero={numero} accion={crearPedido} />
    </>
  );
}
