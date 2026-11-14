import type { ReactNode } from "react";

/** Fila corta de una lista: "#3 Mateo · Laureles · Chaqueta"  ……  "💵 $ 172.000". */
export function FilaMini({
  numero,
  cliente,
  detalle,
  derecha,
}: {
  numero: number;
  cliente: string;
  detalle: string;
  derecha: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2.5 border-t border-linea py-2.5 text-sm first:border-t-0">
      <span>
        <b>
          #{numero} {cliente}
        </b>
        <br />
        <span className="text-suave">{detalle}</span>
      </span>
      <span className="font-semibold whitespace-nowrap">{derecha}</span>
    </li>
  );
}

/** Título de cada parte de la pantalla: "🏍️ Entrégalos ahora ……… 2 en camino". */
export function TituloSeccion({ children, nota }: { children: ReactNode; nota?: string }) {
  return (
    <div className="mx-0.5 mt-6 mb-2 flex items-center justify-between">
      <h2 className="text-[19px] font-extrabold">{children}</h2>
      {nota ? <small className="text-[13px] text-suave">{nota}</small> : null}
    </div>
  );
}

/** Los tres cuadros de arriba. El de "En camino" se pinta naranja si tiene pedidos. */
export function Resumen({ enCamino, porRecoger, entregados }: { enCamino: number; porRecoger: number; entregados: number }) {
  const cuadro = "rounded-2xl border border-linea bg-tarjeta px-1.5 py-2.5 text-center shadow-suave";
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <div className={enCamino ? `${cuadro} border-naranja bg-naranja text-white` : cuadro}>
        <b className="block text-2xl leading-tight font-extrabold">{enCamino}</b>
        <span className={`text-xs ${enCamino ? "text-white" : "text-suave"}`}>🏍️ En camino</span>
      </div>
      <div className={cuadro}>
        <b className="block text-2xl leading-tight font-extrabold">{porRecoger}</b>
        <span className="text-xs text-suave">📦 Por recoger</span>
      </div>
      <div className={cuadro}>
        <b className="block text-2xl leading-tight font-extrabold">{entregados}</b>
        <span className="text-xs text-suave">✅ Entregados</span>
      </div>
    </div>
  );
}
