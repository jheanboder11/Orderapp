import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

/** Piezas visuales básicas de Orderapp (tarjeta, botón, campo, selector, avisos). */

export function Tarjeta({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-4 rounded-tarjeta border border-linea bg-tarjeta p-[18px] shadow-suave ${className}`}
      {...props}
    />
  );
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "principal" = guayaba. Solo uno por pantalla. */
  variante?: "principal" | "normal" | "peligro";
  grande?: boolean;
  pequeno?: boolean;
};

export function Boton({
  variante = "normal",
  grande = false,
  pequeno = false,
  className = "",
  ...props
}: BotonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-boton border font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
  const estilo = {
    principal: "border-guayaba bg-guayaba text-white shadow-guayaba",
    normal: "border-borde-rosa bg-tarjeta text-frambuesa",
    peligro: "border-problema bg-tarjeta text-problema",
  }[variante];
  const tamano = grande
    ? TAMANO_GRANDE
    : pequeno
      ? TAMANO_CHICO
      : TAMANO_NORMAL;
  return (
    <button className={`${base} ${estilo} ${tamano} ${className}`} {...props} />
  );
}

/** Tres tamaños de botón para que todo se vea parejo. "Grande" solo para la acción final de un formulario. */
const TAMANO_GRANDE = "mt-3 min-h-[56px] w-full px-5 py-3 text-[18px]";
const TAMANO_NORMAL = "min-h-[46px] px-4 py-2 text-[15px]";
const TAMANO_CHICO = "h-11 min-w-0 px-3 text-[13px] whitespace-nowrap";

/** Para enlaces (<a>, <Link>) que deben verse como un botón chico secundario. */
export const claseBotonChico = `inline-flex items-center justify-center gap-1.5 rounded-boton border border-borde-rosa bg-tarjeta font-bold text-frambuesa ${TAMANO_CHICO}`;

/** Caja de nota dentro de una tarjeta (motivo, problema, formulario corto). */
export const claseNota =
  "mt-3 rounded-[16px] bg-campo border border-linea px-3.5 py-2.5 text-sm";

const claseCampo =
  "mt-1.5 min-h-[54px] w-full rounded-campo border border-linea bg-campo px-4 py-[13px] text-base font-medium text-tinta placeholder:text-suave/70 focus:border-guayaba focus:shadow-[0_0_0_2px_var(--color-guayaba),0_0_0_7px_rgba(232,49,107,0.14)] focus:outline-none";

export function Campo({
  etiqueta,
  pista,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  pista?: string;
}) {
  return (
    <label className="mt-3 block text-[13px] font-bold text-tinta">
      {etiqueta}
      <input className={`${claseCampo} ${className}`} {...props} />
      {pista ? (
        <span className="mt-1 block text-xs font-medium text-suave">
          {pista}
        </span>
      ) : null}
    </label>
  );
}

export function Selector({
  etiqueta,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-3 block text-[13px] font-bold text-tinta">
      {etiqueta}
      <select className={`${claseCampo} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

/** Mensaje de error o de éxito debajo de un formulario. */
export function Aviso({
  tipo,
  children,
}: {
  tipo: "error" | "ok";
  children: ReactNode;
}) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={`mt-3 rounded-[16px] px-3.5 py-2.5 text-sm font-bold ${
        tipo === "error"
          ? "bg-ambar-fondo text-ambar"
          : "bg-menta-fondo text-exito"
      }`}
    >
      {children}
    </p>
  );
}

/** Título de cada módulo: grande y grueso. Envuelve una palabra en <Resaltar> para marcarla. */
export function TituloModulo({ children }: { children: ReactNode }) {
  return (
    <h1 className="mx-0.5 mt-5 mb-4 text-[30px] leading-[1.1] font-extrabold tracking-[-0.035em]">
      {children}
    </h1>
  );
}

/** Palabra resaltada del título: guayaba con subrayado menta. */
export function Resaltar({ children }: { children: ReactNode }) {
  return <span className="resaltar">{children}</span>;
}
