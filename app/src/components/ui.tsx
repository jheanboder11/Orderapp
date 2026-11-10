import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

/** Piezas visuales básicas de Orderapp (tarjeta, botón, campo, selector, avisos). */

export function Tarjeta({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-3.5 rounded-tarjeta border border-linea bg-tarjeta p-4 shadow-suave ${className}`}
      {...props}
    />
  );
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "principal" = naranja. Solo uno por pantalla. */
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
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-boton border font-semibold disabled:cursor-not-allowed disabled:opacity-45";
  const estilo = {
    principal:
      "border-naranja bg-naranja font-bold text-white shadow-[0_3px_0_var(--color-naranja-sombra)]",
    normal: "border-linea bg-tarjeta text-tinta",
    peligro: "border-problema bg-tarjeta text-problema",
  }[variante];
  const tamano = grande
    ? "mt-3 min-h-[54px] w-full px-3.5 py-3 text-[17px]"
    : pequeno
      ? "min-h-[40px] px-3 py-2 text-[13px]"
      : "min-h-[46px] px-3.5 py-3";
  return <button className={`${base} ${estilo} ${tamano} ${className}`} {...props} />;
}

const claseCampo =
  "mt-1 w-full rounded-boton border border-linea bg-campo p-[13px] text-base text-tinta focus:border-naranja-sombra focus:outline-2 focus:outline-naranja-sombra";

export function Campo({
  etiqueta,
  pista,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; pista?: string }) {
  return (
    <label className="mt-2.5 block text-sm text-suave">
      {etiqueta}
      <input className={`${claseCampo} ${className}`} {...props} />
      {pista ? <span className="mt-1 block text-xs">{pista}</span> : null}
    </label>
  );
}

export function Selector({
  etiqueta,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; children: ReactNode }) {
  return (
    <label className="mt-2.5 block text-sm text-suave">
      {etiqueta}
      <select className={`${claseCampo} ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

/** Mensaje de error o de éxito debajo de un formulario. */
export function Aviso({ tipo, children }: { tipo: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={`mt-2 text-sm font-bold ${tipo === "error" ? "text-problema" : "text-exito"}`}
    >
      {children}
    </p>
  );
}

/** Título de cada módulo (ej. "👥 Equipo"). */
export function TituloModulo({ children }: { children: ReactNode }) {
  return <h1 className="mx-0.5 mt-4 mb-3 text-[22px] font-extrabold">{children}</h1>;
}
