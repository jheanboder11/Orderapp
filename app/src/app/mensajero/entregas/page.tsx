import type { Metadata } from "next";
import Link from "next/link";
import { RefrescoAutomatico } from "@/components/RefrescoAutomatico";
import { Tarjeta } from "@/components/ui";
import { Resumen, TituloSeccion } from "@/modules/entregas/components/piezas";
import { RecogerEnLocal } from "@/modules/entregas/components/RecogerEnLocal";
import { TarjetaEntrega } from "@/modules/entregas/components/TarjetaEntrega";
import { misPedidos } from "@/modules/entregas/queries";

export const metadata: Metadata = { title: "Entregas · Orderapp" };

/** Pantalla del Mensajero, ordenada como su día: entregar → recoger → regresar. */
export default async function Entregas() {
  const r = await misPedidos();
  const pendientes = r.enCamino.length + r.porRecoger.length + r.regresar.length;

  return (
    <>
      <RefrescoAutomatico />
      <Resumen enCamino={r.enCamino.length} porRecoger={r.porRecoger.length} entregados={r.entregados.length} />

      {pendientes === 0 ? (
        <Tarjeta className="mt-3 px-4 py-7 text-center">
          <span aria-hidden="true" className="mb-1.5 block text-[38px]">
            😎
          </span>
          {r.entregados.length ? (
            <>
              <b>Estás al día</b>
              <p className="text-sm text-suave">No tienes pedidos pendientes.</p>
              <Link
                href="/mensajero/cierre"
                className="mt-3 flex min-h-[54px] w-full items-center justify-center rounded-boton border border-naranja bg-naranja text-[17px] font-bold text-white shadow-[0_3px_0_var(--color-naranja-sombra)]"
              >
                🧾 Hacer mi cierre
              </Link>
            </>
          ) : (
            <>
              <b>Hoy no tienes domicilios</b>
              <p className="text-sm text-suave">Cuando el Colaborador te asigne uno, sale aquí.</p>
            </>
          )}
        </Tarjeta>
      ) : null}

      {r.enCamino.length ? (
        <section aria-label="Entrégalos ahora">
          <TituloSeccion nota={`${r.enCamino.length} en camino`}>🏍️ Entrégalos ahora</TituloSeccion>
          {r.enCamino.map((p) => (
            <TarjetaEntrega key={p.id} p={p} />
          ))}
        </section>
      ) : null}

      {r.porRecoger.length ? (
        <section aria-label="Recógelos en el local">
          <TituloSeccion nota={`${r.porRecoger.length} ${r.porRecoger.length === 1 ? "listo" : "listos"}`}>
            📦 Recógelos en el local
          </TituloSeccion>
          <RecogerEnLocal lista={r.porRecoger} />
        </section>
      ) : null}

      {r.regresar.length ? (
        <section aria-label="Regrésalos al local">
          <TituloSeccion nota={String(r.regresar.length)}>↩️ Regrésalos al local</TituloSeccion>
          {r.regresar.map((p) => (
            <TarjetaEntrega key={p.id} p={p} />
          ))}
        </section>
      ) : null}

      {r.manana.length ? (
        <p className="mt-5 text-center text-sm text-suave">
          🗓️ Tienes {r.manana.length} {r.manana.length === 1 ? "pedido" : "pedidos"} para mañana.{" "}
          <Link href="/mensajero/hechos" className="font-semibold underline">
            Verlos
          </Link>
        </p>
      ) : null}
    </>
  );
}
