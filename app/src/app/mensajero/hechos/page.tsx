import type { Metadata } from "next";
import { Tarjeta, TituloModulo } from "@/components/ui";
import { FilaEntregado } from "@/modules/entregas/components/FilaEntregado";
import { FilaMini } from "@/modules/entregas/components/piezas";
import { misPedidos } from "@/modules/entregas/queries";
import { barrio, cobroCorto } from "@/modules/entregas/rules";

export const metadata: Metadata = { title: "Entregados · Orderapp" };

/** ✅ Lo que ya entregó (hoy o sin cierre) y 🗓️ lo que tiene para mañana. */
export default async function Entregados() {
  const { entregados, manana } = await misPedidos();
  return (
    <>
      <TituloModulo>✅ Entregados</TituloModulo>
      {entregados.length ? (
        <Tarjeta>
          <h2 className="mb-1 font-extrabold">Pedidos ({entregados.length})</h2>
          <p className="mb-1 text-[13px] text-suave">Toca un pedido para ver su detalle.</p>
          <ul>
            {entregados.map((p) => (
              <FilaEntregado key={p.id} p={p} />
            ))}
          </ul>
        </Tarjeta>
      ) : (
        <Tarjeta className="px-4 py-7 text-center text-suave">
          <span aria-hidden="true" className="mb-1.5 block text-[38px]">
            ✅
          </span>
          Todavía no has entregado pedidos hoy.
        </Tarjeta>
      )}

      {manana.length ? (
        <Tarjeta>
          <h2 className="mb-1 font-extrabold">🗓️ Para mañana ({manana.length})</h2>
          <ul>
            {manana.map((p) => (
              <FilaMini
                key={p.id}
                numero={p.numeroDia}
                cliente={p.cliente}
                detalle={`${barrio(p.direccion, p.zona)} · ${p.items}`}
                derecha={cobroCorto(p.formaPago, p.valorTotal)}
              />
            ))}
          </ul>
        </Tarjeta>
      ) : null}
    </>
  );
}
