"use client";
import { useState, useTransition } from "react";
import { avisar } from "@/components/Avisos";
import { Aviso, Boton } from "@/components/ui";
import { BotonFoto } from "@/modules/fotos/components/BotonFoto";
import { hacerCierre } from "../actions";

/**
 * Botón final del cierre.
 * - Si debe consignar: abre la cámara para la foto de la consignación y cierra en el mismo paso.
 * - Si no: pide confirmar con un segundo toque (evita cierres por accidente).
 */
export function BotonCierre({ conFoto }: { conFoto: boolean }) {
  const [seguro, setSeguro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerrando, empezar] = useTransition();

  if (conFoto) {
    return (
      <BotonFoto accion={hacerCierre} campos={{}} className="mt-3">
        🏦 Tomar foto de la consignación y cerrar
      </BotonFoto>
    );
  }

  function cerrar() {
    setError(null);
    empezar(async () => {
      const r = await hacerCierre(new FormData());
      if (r.ok) avisar(r.mensaje);
      else setError(r.error);
      setSeguro(false);
    });
  }

  return (
    <>
      {seguro ? (
        <div className="mt-3 flex gap-2">
          <Boton
            type="button"
            onClick={() => setSeguro(false)}
            disabled={cerrando}
          >
            Volver
          </Boton>
          <Boton
            type="button"
            variante="principal"
            className="flex-1"
            onClick={cerrar}
            disabled={cerrando}
          >
            {cerrando ? "⏳ Cerrando…" : "✅ Sí, hacer el cierre"}
          </Boton>
        </div>
      ) : (
        <Boton
          type="button"
          variante="principal"
          grande
          className="mt-3"
          onClick={() => setSeguro(true)}
        >
          🧾 Hacer el cierre
        </Boton>
      )}
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </>
  );
}
