import type { Metadata } from "next";
import Link from "next/link";
import { RefrescoAutomatico } from "@/components/RefrescoAutomatico";
import { Tarjeta, TituloModulo } from "@/components/ui";
import { horaBogota, pesos } from "@/lib/formato";
import { BotonCierre } from "@/modules/cierres/components/BotonCierre";
import { miCierre } from "@/modules/cierres/queries";
import { textoNeto } from "@/modules/cierres/rules";
import { cobroCorto } from "@/modules/entregas/rules";

export const metadata: Metadata = { title: "Cierre · Orderapp" };

const claseBoton =
  "mt-3 flex min-h-[54px] w-full items-center justify-center rounded-boton border border-linea bg-tarjeta text-[17px] font-bold";

/** 🧾 Tu cierre: lo que falta por cerrar (con el cálculo) y los cierres que ya hizo hoy. */
export default async function Cierre() {
  const { entregas, pendientes, cuentas, hechosHoy } = await miCierre();
  const hayPorCerrar = cuentas.nEntregas > 0;

  return (
    <>
      <RefrescoAutomatico />
      <TituloModulo>🧾 Tu cierre</TituloModulo>

      {hayPorCerrar && pendientes > 0 ? (
        <Tarjeta>
          <p>
            Llevas <b>{pesos(cuentas.efectivo)}</b> en efectivo y ganaste{" "}
            <b>{pesos(cuentas.pago)}</b>.
          </p>
          <p className="mt-1.5 text-sm text-suave">
            Cuando entregues{" "}
            {pendientes === 1
              ? "tu pedido pendiente"
              : `tus ${pendientes} pendientes`}
            , aquí haces el cierre.
          </p>
          <Link href="/mensajero/entregas" className={claseBoton}>
            🏍️ Ir a mis entregas
          </Link>
        </Tarjeta>
      ) : null}

      {hayPorCerrar && pendientes === 0 ? (
        <Tarjeta>
          <h2 className="mb-1 font-extrabold">
            {cuentas.nEntregas === 1
              ? "1 entrega por cerrar"
              : `${cuentas.nEntregas} entregas por cerrar`}
          </h2>
          <ul className="mb-3">
            {entregas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border-t border-linea py-2 text-sm first:border-t-0"
              >
                <span>
                  <b>
                    #{p.numeroDia} {p.cliente}
                  </b>
                  <br />
                  <span className="text-suave">
                    Domi {pesos(p.valorDomi)}
                    {p.horaEntrega ? ` · ${horaBogota(p.horaEntrega)}` : ""}
                  </span>
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {cobroCorto(p.formaPago, p.valorTotal)}
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl bg-campo p-3">
            <p className="flex justify-between">
              <span>💵 Efectivo que recibiste</span>{" "}
              <b>{pesos(cuentas.efectivo)}</b>
            </p>
            <p className="mt-1 flex justify-between">
              <span>
                🏍️ Lo que ganaste ({cuentas.nEntregas}{" "}
                {cuentas.nEntregas === 1 ? "domi" : "domis"})
              </span>{" "}
              <b>− {pesos(cuentas.pago)}</b>
            </p>
            <p className="mt-2 border-t border-linea pt-2 text-[22px] leading-tight font-extrabold">
              {textoNeto(cuentas.neto)}
              {cuentas.neto !== 0 ? ` ${pesos(Math.abs(cuentas.neto))}` : ""}
            </p>
          </div>
          {cuentas.neto > 0 ? (
            <p className="mt-2 text-sm text-suave">
              Consigna primero y luego toma la foto del comprobante. Con la foto
              se hace el cierre.
            </p>
          ) : null}
          <BotonCierre conFoto={cuentas.neto > 0} />
        </Tarjeta>
      ) : null}

      {hechosHoy.map((c) => (
        <Tarjeta key={c.id} className="border-exito">
          <h2 className="font-extrabold text-exito">
            🎉 Cierre hecho · {horaBogota(c.creadoEn)}
          </h2>
          <p className="mt-1 flex justify-between text-sm">
            <span>Entregas</span> <b>{c.nEntregas}</b>
          </p>
          <p className="flex justify-between text-sm">
            <span>Efectivo que recibiste</span> <b>{pesos(c.efectivo)}</b>
          </p>
          <p className="flex justify-between text-sm">
            <span>Lo que ganaste</span> <b>{pesos(c.pagoMensajero)}</b>
          </p>
          <p className="mt-1.5 text-[19px] font-extrabold">
            {textoNeto(c.neto, true)}
            {c.neto !== 0 ? ` ${pesos(Math.abs(c.neto))}` : ""}
          </p>
          {c.fotoConsignacionUrl ? (
            <a
              href={`/api/fotos/cierre/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold"
            >
              📸 Ver la foto de la consignación
            </a>
          ) : null}
        </Tarjeta>
      ))}

      {!hayPorCerrar && hechosHoy.length === 0 ? (
        <Tarjeta className="px-4 py-7 text-center text-suave">
          <span aria-hidden="true" className="mb-1.5 block text-[38px]">
            🧾
          </span>
          Cuando entregues tu primer pedido, aquí verás tu cierre.
        </Tarjeta>
      ) : null}
    </>
  );
}
