"use client";
import { type ReactNode, useRef, useState, useTransition } from "react";
import { avisar } from "@/components/Avisos";
import { Aviso, Boton } from "@/components/ui";
import { comprimirFoto } from "../comprimir";

type Resultado = { ok: true; mensaje: string } | { ok: false; error: string };

/**
 * Botón que abre la cámara, achica la foto y la envía junto con `campos` a la acción.
 * Mientras sube, avisa "Subiendo la foto, no cierres la pantalla…".
 */
export function BotonFoto({
  children,
  accion,
  campos,
  className = "",
}: {
  children: ReactNode;
  accion: (datos: FormData) => Promise<Resultado>;
  campos: Record<string, string | number | (string | number)[]>;
  className?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    empezar(async () => {
      try {
        const foto = await comprimirFoto(archivo);
        const datos = new FormData();
        for (const [k, v] of Object.entries(campos)) {
          for (const x of Array.isArray(v) ? v : [v]) datos.append(k, String(x));
        }
        datos.append("foto", foto, "foto.jpg");
        const r = await accion(datos);
        if (r.ok) avisar(r.mensaje);
        else setError(r.error);
      } catch (e) {
        setError(
          e instanceof Error && e.message.startsWith("No pude")
            ? e.message
            : "No se pudo subir la foto. Revisa la señal e intenta otra vez.",
        );
      } finally {
        if (entrada.current) entrada.current.value = "";
      }
    });
  }

  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => alElegir(e.target.files?.[0])}
      />
      <Boton
        type="button"
        variante="principal"
        grande
        className={className}
        disabled={subiendo}
        onClick={() => entrada.current?.click()}
      >
        {subiendo ? "⏳ Subiendo la foto…" : children}
      </Boton>
      {subiendo ? (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/60 p-6"
        >
          <div className="rounded-tarjeta bg-tarjeta px-6 py-5 text-center font-bold shadow-suave">
            <span aria-hidden="true" className="mb-1 block text-[34px]">
              📸
            </span>
            Subiendo la foto, no cierres la pantalla…
          </div>
        </div>
      ) : null}
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </>
  );
}
