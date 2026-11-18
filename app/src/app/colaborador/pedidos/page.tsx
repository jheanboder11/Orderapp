import type { Metadata } from "next";
import Link from "next/link";
import { RefrescoAutomatico } from "@/components/RefrescoAutomatico";
import { Tarjeta } from "@/components/ui";
import { fechaBogota } from "@/lib/formato";
import { exigirRol } from "@/modules/auth/sesion";
import { MensajeMensajero } from "@/modules/pedidos/components/MensajeMensajero";
import { TarjetaPedido } from "@/modules/pedidos/components/TarjetaPedido";
import { mensajerosActivos, pedidosDelColaborador } from "@/modules/pedidos/queries";
import { clasificar } from "@/modules/pedidos/rules";

export const metadata: Metadata = { title: "Pedidos · Orderapp" };

const FILTROS = [
  { clave: "hoy", texto: "Hoy" },
  { clave: "manana", texto: "Mañana" },
  { clave: "ayer", texto: "Ayer" },
] as const;
type Filtro = (typeof FILTROS)[number]["clave"];

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ ver?: string; m?: string }> }) {
  await exigirRol("COLABORADOR");
  const { ver, m } = await searchParams;
  const filtro: Filtro = ver === "manana" || ver === "ayer" ? ver : "hoy";

  const hoy = fechaBogota();
  const [todos, mensajeros] = await Promise.all([pedidosDelColaborador(hoy), mensajerosActivos()]);
  const listas = clasificar(todos, hoy);
  const delDia = listas[filtro];

  // Botones por mensajero: solo los que tienen pedidos en este día.
  const porMensajero = new Map<string, { id: string; nombre: string; n: number }>();
  for (const p of delDia) {
    const x = porMensajero.get(p.mensajeroId) ?? { id: p.mensajeroId, nombre: p.mensajero, n: 0 };
    x.n++;
    porMensajero.set(p.mensajeroId, x);
  }
  const botonesMensajero = [...porMensajero.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const elegido = m && porMensajero.has(m) ? m : null;
  const lista = elegido ? delDia.filter((p) => p.mensajeroId === elegido) : delDia;
  const linkDe = (dia: Filtro, mensajero: string | null) => {
    const q = new URLSearchParams();
    if (dia !== "hoy") q.set("ver", dia);
    if (mensajero) q.set("m", mensajero);
    const s = q.toString();
    return s ? `/colaborador/pedidos?${s}` : "/colaborador/pedidos";
  };

  const titulo = {
    hoy: "Los pedidos de hoy",
    manana: `Para mañana (${listas.manana.length})`,
    ayer: "Ayer",
  }[filtro];

  return (
    <>
      <RefrescoAutomatico />
      <nav aria-label="Filtro de pedidos" className="mt-4 mb-3.5 flex gap-1.5 rounded-full bg-campo p-1">
        {FILTROS.map((f) => (
          <Link
            key={f.clave}
            href={linkDe(f.clave, null)}
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

      {botonesMensajero.length > 0 ? (
        <nav aria-label="Pedidos por mensajero" className="mb-3.5 flex flex-wrap gap-1.5">
          {[{ id: null as string | null, nombre: "Todos", n: delDia.length }, ...botonesMensajero].map((b) => {
            const activo = elegido === b.id;
            return (
              <Link
                key={b.id ?? "todos"}
                href={linkDe(filtro, b.id)}
                aria-current={activo ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center rounded-full border px-3.5 text-sm font-semibold ${
                  activo ? "border-tinta bg-tinta text-white" : "border-linea bg-tarjeta text-tinta"
                }`}
              >
                {b.id ? "🏍️ " : ""}
                {b.nombre} ({b.n})
              </Link>
            );
          })}
        </nav>
      ) : null}

      {elegido && filtro !== "ayer" ? (
        <MensajeMensajero
          key={elegido}
          nombre={porMensajero.get(elegido)?.nombre ?? ""}
          cantidad={lista.filter((p) => p.estado === "EMPACADO").length}
          dia={filtro === "hoy" ? "hoy" : "mañana"}
        />
      ) : null}

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
