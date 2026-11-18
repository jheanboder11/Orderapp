import type { Metadata } from "next";
import { RefrescoAutomatico } from "@/components/RefrescoAutomatico";
import { Tarjeta, TituloModulo } from "@/components/ui";
import { fechaBogota } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { AlertaDemorados } from "@/modules/pedidos/components/piezas";
import { TarjetaPedido } from "@/modules/pedidos/components/TarjetaPedido";
import { mensajerosActivos, pedidosDelColaborador } from "@/modules/pedidos/queries";
import { estaDemorado, minutosEnLaCalle } from "@/modules/pedidos/rules";

export const metadata: Metadata = { title: "Alerta · Orderapp" };

/** 🚨 Todo lo que necesita ayuda del Colaborador: pedidos con problema y pedidos demorados. */
export default async function Alerta() {
  await exigirRol("COLABORADOR");
  const hoy = fechaBogota();
  const ahora = new Date();
  const [todos, mensajeros] = await Promise.all([pedidosDelColaborador(hoy), mensajerosActivos()]);

  const problemas = todos.filter((p) => p.estado === "PROBLEMA").sort((a, b) => a.id - b.id);
  const demorados = todos
    .filter((p) => estaDemorado(p, p.limiteMinutos, ahora))
    .map((p) => ({
      id: p.id,
      numeroDia: p.numeroDia,
      cliente: p.cliente,
      mensajero: p.mensajero,
      minutos: minutosEnLaCalle(p.horaSalida, ahora) ?? 0,
    }))
    .sort((a, b) => b.minutos - a.minutos);

  return (
    <>
      <RefrescoAutomatico />
      <TituloModulo>🚨 Alerta</TituloModulo>

      {problemas.length === 0 && demorados.length === 0 ? (
        <Tarjeta className="px-4 py-7 text-center text-suave">
          <span aria-hidden="true" className="mb-1.5 block text-[38px]">
            👌
          </span>
          Todo en orden. No hay domicilios con problemas ni demorados.
        </Tarjeta>
      ) : null}

      <AlertaDemorados lista={demorados} />

      {problemas.length ? (
        <>
          <h2 className="mx-0.5 mt-5 mb-2 text-[19px] font-extrabold">😕 Con problema ({problemas.length})</h2>
          <p className="mx-0.5 mb-3 text-sm text-suave">
            El mensajero no pudo entregarlos. Llama al cliente o recibe el paquete de vuelta.
          </p>
          <div className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-3.5">
            {problemas.map((p) => (
              <TarjetaPedido key={p.id} p={p} hoy={hoy} mensajeros={mensajeros} />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
