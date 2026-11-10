import type { Metadata } from "next";
import Link from "next/link";
import { RefrescoAutomatico } from "@/components/RefrescoAutomatico";
import { Tarjeta } from "@/components/ui";
import { fechaBogota } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { AlertaDemorados } from "@/modules/pedidos/components/piezas";
import { TarjetaPedido } from "@/modules/pedidos/components/TarjetaPedido";
import { mensajerosActivos, pedidosDelColaborador } from "@/modules/pedidos/queries";
import { clasificar, estaDemorado, minutosEnLaCalle } from "@/modules/pedidos/rules";

export const metadata: Metadata = { title: "Pedidos · Orderapp" };

const FILTROS = [
  { clave: "hoy", texto: "Hoy" },
  { clave: "manana", texto: "Mañana" },
  { clave: "ayer", texto: "Ayer" },
] as const;
type Filtro = (typeof FILTROS)[number]["clave"];

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await exigirRol("COLABORADOR");
  const { ver } = await searchParams;
  const filtro: Filtro = ver === "manana" || ver === "ayer" ? ver : "hoy";

  const hoy = fechaBogota();
  const ahora = new Date();
  const [todos, mensajeros] = await Promise.all([pedidosDelColaborador(hoy), mensajerosActivos()]);
  const listas = clasificar(todos, hoy);
  const lista = listas[filtro];

  const demorados = todos
    .filter((p) => estaDemorado(p, p.limiteMinutos, ahora))
    .map((p) => ({
      id: p.id,
      numeroDia: p.numeroDia,
      cliente: p.cliente,
      mensajero: p.mensajero,
      minutos: minutosEnLaCalle(p.horaSalida, ahora) ?? 0,
    }));

  const titulo = {
    hoy: "Los pedidos de hoy",
    manana: `Para mañana (${listas.manana.length})`,
    ayer: "Ayer",
  }[filtro];

  return (
    <>
      <RefrescoAutomatico />
      <div className="mt-4">
        <AlertaDemorados lista={demorados} />
      </div>

      <nav aria-label="Filtro de pedidos" className="mb-3.5 flex gap-1.5 rounded-full bg-campo p-1">
        {FILTROS.map((f) => (
          <Link
            key={f.clave}
            href={f.clave === "hoy" ? "/colaborador/pedidos" : `/colaborador/pedidos?ver=${f.clave}`}
            aria-current={filtro === f.clave ? "page" : undefined}
            className={`flex-1 rounded-full px-1.5 py-2.5 text-center text-sm font-semibold ${
              filtro === f.clave ? "bg-tarjeta text-tinta shadow-suave" : "text-suave"
            }`}
          >
            {f.texto} ({listas[f.clave].length})
          </Link>
        ))}
      </nav>

      <h1
        className={`mx-0.5 mb-3 font-extrabold tracking-[-0.02em] ${filtro === "hoy" ? "text-[26.4px]" : "text-[22px]"}`}
      >
        {titulo}
      </h1>

      {lista.length === 0 ? (
        filtro === "hoy" ? (
          <Tarjeta className="px-4 py-7 text-center">
            <span aria-hidden="true" className="mb-1.5 block text-[38px]">
              📦
            </span>
            <b>Todavía no hay pedidos hoy</b>
            <p className="text-sm text-suave">Cuando crees uno, aparece aquí.</p>
            <Link
              href="/colaborador/nuevo"
              className="mt-3 flex min-h-[54px] w-full items-center justify-center rounded-boton border border-naranja bg-naranja text-[17px] font-bold text-white shadow-[0_3px_0_var(--color-naranja-sombra)]"
            >
              ➕ Crear un pedido
            </Link>
          </Tarjeta>
        ) : (
          <Tarjeta className="px-4 py-7 text-center text-suave">
            <span aria-hidden="true" className="mb-1.5 block text-[38px]">
              🗓️
            </span>
            No hay pedidos aquí.
          </Tarjeta>
        )
      ) : (
        <div className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-3.5">
          {lista.map((p) => (
            <TarjetaPedido key={p.id} p={p} hoy={hoy} mensajeros={mensajeros} />
          ))}
        </div>
      )}
    </>
  );
}
