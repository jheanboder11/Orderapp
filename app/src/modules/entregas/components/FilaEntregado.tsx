import { horaBogota, pesos } from "@/lib/formato";
import { linkFotoPedido } from "@/modules/fotos/rules";
import type { PedidoDelMensajero } from "../queries";
import { barrio, cobroCorto, linkLlamar, linkMapa, linkWhatsApp } from "../rules";

const claseHerramienta =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-boton border border-linea bg-tarjeta px-2 text-[13px] font-semibold";

/** Fila de un pedido ya entregado. Al tocarla se abre con todo el detalle del domicilio. */
export function FilaEntregado({ p }: { p: PedidoDelMensajero }) {
  const detalle = `${barrio(p.direccion, p.zona)}${p.horaEntrega ? ` · ${horaBogota(p.horaEntrega)}` : ""}`;
  return (
    <li className="border-t border-linea text-sm first:border-t-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 py-2.5 [&::-webkit-details-marker]:hidden">
          <span>
            <b>
              #{p.numeroDia} {p.cliente}
            </b>
            <br />
            <span className="text-suave">{detalle}</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
            {cobroCorto(p.formaPago, p.valorTotal)}
            <span aria-hidden="true" className="text-suave transition-transform group-open:rotate-90">
              ›
            </span>
          </span>
        </summary>

        <div className="mb-3 rounded-2xl bg-campo p-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-suave">Dirección</dt>
            <dd className="font-semibold">{p.direccion}</dd>
            <dt className="text-suave">Zona</dt>
            <dd>{p.zona}</dd>
            <dt className="text-suave">Celular</dt>
            <dd>{p.celular}</dd>
            <dt className="text-suave">Llevó</dt>
            <dd>{p.items}</dd>
            <dt className="text-suave">Pago</dt>
            <dd>{cobroCorto(p.formaPago, p.valorTotal)}</dd>
            <dt className="text-suave">Total</dt>
            <dd>{pesos(p.valorTotal)}</dd>
            <dt className="text-suave">Tu domi</dt>
            <dd>{pesos(p.valorDomi)}</dd>
            {p.horaSalida ? (
              <>
                <dt className="text-suave">Salió</dt>
                <dd>{horaBogota(p.horaSalida)}</dd>
              </>
            ) : null}
            {p.horaEntrega ? (
              <>
                <dt className="text-suave">Entregó</dt>
                <dd>{horaBogota(p.horaEntrega)}</dd>
              </>
            ) : null}
          </dl>

          {p.nota ? (
            <div className="mt-2 rounded-[10px] border-l-4 border-naranja bg-tarjeta px-3 py-2">{p.nota}</div>
          ) : null}

          {p.fotoSalidaUrl || p.fotoEntregaUrl ? (
            <div className="mt-2 flex flex-wrap gap-2.5">
              {p.fotoSalidaUrl ? (
                <a href={linkFotoPedido(p.id, "salida")} target="_blank" rel="noopener noreferrer" className="font-semibold">
                  📸 Foto al salir
                </a>
              ) : null}
              {p.fotoEntregaUrl ? (
                <a href={linkFotoPedido(p.id, "entrega")} target="_blank" rel="noopener noreferrer" className="font-semibold">
                  📸 Foto al entregar
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2.5 flex gap-2">
            <a className={claseHerramienta} href={linkLlamar(p.celular)}>
              📞 Llamar
            </a>
            <a className={claseHerramienta} href={linkMapa(p.direccion, p.zona)} target="_blank" rel="noopener noreferrer">
              📍 Mapa
            </a>
            <a className={claseHerramienta} href={linkWhatsApp(p.celular)} target="_blank" rel="noopener noreferrer">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </details>
    </li>
  );
}
