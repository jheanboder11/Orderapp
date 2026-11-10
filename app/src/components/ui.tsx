import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

/** Piezas visuales básicas de Orderapp (tarjeta, botón, campo). */

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
  variante?: "principal" | "normal";
  grande?: boolean;
};

export function Boton({ variante = "normal", grande = false, className = "", ...props }: BotonProps) {
  const base =
    "inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-boton border px-3.5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-45";
  const estilo =
    variante === "principal"
      ? "border-naranja bg-naranja font-bold text-white shadow-[0_3px_0_var(--color-naranja-sombra)]"
      : "border-linea bg-tarjeta text-tinta";
  const tamano = grande ? "mt-3 min-h-[54px] w-full text-[17px]" : "";
  return <button className={`${base} ${estilo} ${tamano} ${className}`} {...props} />;
}

export function Campo({
  etiqueta,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string }) {
  return (
    <label className="mt-2.5 block text-sm text-suave">
      {etiqueta}
      <input
        className={`mt-1 w-full rounded-boton border border-linea bg-campo p-[13px] text-base text-tinta focus:border-naranja-sombra focus:outline-2 focus:outline-naranja-sombra ${className}`}
        {...props}
      />
    </label>
  );
}
