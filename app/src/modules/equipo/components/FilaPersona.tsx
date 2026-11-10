"use client";
import { useActionState, useState } from "react";
import { Aviso, Boton, Campo } from "@/components/ui";
import { NOMBRE_ROL, pistaContrasena, rolEs } from "@/modules/auth/rules";
import { type EstadoSimple, cambiarActivo, cambiarContrasena } from "../actions";
import type { Persona } from "../queries";
import { enviarSinBorrar } from "@/components/enviar";

type Abierto = "nada" | "contrasena" | "desactivar";

export function FilaPersona({ persona, esYo }: { persona: Persona; esYo: boolean }) {
  const [abierto, setAbierto] = useState<Abierto>("nada");
  const [estadoClave, accionClave, guardandoClave] = useActionState<EstadoSimple, FormData>(
    async (prev, form) => {
      const r = await cambiarContrasena(prev, form);
      if (r?.ok) setAbierto("nada");
      return r;
    },
    null,
  );
  const [estadoActivo, accionActivo, guardandoActivo] = useActionState<EstadoSimple, FormData>(
    async (prev, form) => {
      const r = await cambiarActivo(prev, form);
      setAbierto("nada");
      return r;
    },
    null,
  );

  const rol = rolEs(persona.rol) ? persona.rol : "MENSAJERO";
  const estado = estadoClave ?? estadoActivo;

  return (
    <li className={`border-t border-linea py-3 first:border-t-0 ${persona.activo ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 text-sm">
          <b className="text-base">{persona.nombre}</b>
          {esYo ? <span className="text-suave"> (tú)</span> : null}
          <div className="text-suave">
            {persona.usuario} · {NOMBRE_ROL[rol]}
            {persona.activo ? "" : " · 🚫 Desactivada"}
          </div>
        </div>
        <div className="flex flex-none gap-1.5">
          {persona.activo ? (
            <>
              <Boton
                type="button"
                pequeno
                onClick={() => setAbierto(abierto === "contrasena" ? "nada" : "contrasena")}
              >
                🔑 Nueva contraseña
              </Boton>
              {esYo ? null : (
                <Boton
                  type="button"
                  pequeno
                  aria-label={`Desactivar a ${persona.nombre}`}
                  onClick={() => setAbierto(abierto === "desactivar" ? "nada" : "desactivar")}
                >
                  🚫
                </Boton>
              )}
            </>
          ) : (
            <form onSubmit={enviarSinBorrar(accionActivo)}>
              <input type="hidden" name="id" value={persona.id} />
              <input type="hidden" name="activo" value="true" />
              <Boton type="submit" pequeno disabled={guardandoActivo}>
                ✅ Activar
              </Boton>
            </form>
          )}
        </div>
      </div>

      {abierto === "contrasena" ? (
        <form onSubmit={enviarSinBorrar(accionClave)} className="mt-2 rounded-2xl bg-campo p-3">
          <input type="hidden" name="id" value={persona.id} />
          <Campo
            etiqueta={`Nueva contraseña para ${persona.nombre}`}
            name="contrasena"
            type="text"
            autoComplete="new-password"
            inputMode={rol === "MENSAJERO" ? "numeric" : "text"}
            pista={pistaContrasena(rol)}
            className="bg-tarjeta"
            maxLength={72}
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <Boton type="submit" className="flex-1" disabled={guardandoClave}>
              {guardandoClave ? "Guardando…" : "Guardar contraseña"}
            </Boton>
            <Boton type="button" onClick={() => setAbierto("nada")}>
              Cancelar
            </Boton>
          </div>
        </form>
      ) : null}

      {abierto === "desactivar" ? (
        <form onSubmit={enviarSinBorrar(accionActivo)} className="mt-2 rounded-2xl bg-campo p-3 text-sm">
          <input type="hidden" name="id" value={persona.id} />
          <input type="hidden" name="activo" value="false" />
          <p>
            ¿Desactivar a <b>{persona.nombre}</b>? Ya no podrá entrar, pero su historial se guarda.
            Puedes activarla de nuevo cuando quieras.
          </p>
          <div className="mt-2 flex gap-2">
            <Boton type="submit" variante="peligro" className="flex-1" disabled={guardandoActivo}>
              Sí, desactivar
            </Boton>
            <Boton type="button" onClick={() => setAbierto("nada")}>
              No
            </Boton>
          </div>
        </form>
      ) : null}

      {estado ? (
        <Aviso tipo={estado.ok ? "ok" : "error"}>{estado.ok ? estado.mensaje : estado.error}</Aviso>
      ) : null}
    </li>
  );
}
