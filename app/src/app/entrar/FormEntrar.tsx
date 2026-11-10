"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Aviso, Boton, Campo, Tarjeta } from "@/components/ui";
import type { AccesoDemo } from "@/db/demo";
import { authClient } from "@/lib/auth-client";

/** Convierte el error del servidor en palabras simples. */
function mensaje(error: { status: number; message?: string }): string {
  if (error.status === 401 || error.status === 422) {
    return "Usuario o contraseña incorrectos. Revisa e intenta otra vez.";
  }
  if (error.status === 429 && error.message && !error.message.startsWith("Too many")) {
    return error.message; // bloqueo por usuario: ya viene en español
  }
  if (error.status === 429) return "Muchos intentos desde este celular. Espera unos minutos.";
  if (error.status === 403 && error.message) return error.message; // cuenta desactivada
  return "No pude entrar. Revisa tu conexión e intenta otra vez.";
}

export function FormEntrar({ accesos }: { accesos: AccesoDemo[] }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !contrasena) {
      setError("Escribe tu usuario y tu contraseña.");
      return;
    }
    setEntrando(true);
    setError(null);
    const { error: err } = await authClient.signIn.username({
      username: usuario.trim(),
      password: contrasena,
    });
    if (err) {
      setError(mensaje({ status: err.status, message: err.message }));
      setEntrando(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Tarjeta>
        <form onSubmit={entrar} autoComplete="on" noValidate>
          <h1 className="mb-2 text-lg font-bold">👋 ¡Hola! Entra a Orderapp</h1>
          <p className="text-sm text-suave">
            Escribe tu usuario y tu contraseña. Solo lo haces una vez en este celular.
          </p>
          <Campo
            etiqueta="🙋 Tu usuario"
            name="usuario"
            autoComplete="username"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Ej: Teo"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            maxLength={30}
          />
          <Campo
            etiqueta="🔒 Tu contraseña"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            maxLength={72}
          />
          {error ? <Aviso tipo="error">{error}</Aviso> : null}
          <Boton type="submit" variante="principal" grande disabled={entrando}>
            {entrando ? "Entrando…" : "Entrar"}
          </Boton>
          <p className="mt-2.5 text-center text-[13px] text-suave">
            ¿Olvidaste tu contraseña? Pídesela al Administrador.
          </p>
        </form>
      </Tarjeta>

      {accesos.length > 0 ? (
        <Tarjeta>
          <h2 className="mb-1 text-lg font-bold">🔑 Para entrar de prueba</h2>
          <p className="text-sm text-suave">
            Toca uno y luego <b>Entrar</b>.
          </p>
          <div className="mt-2 flex justify-between pb-1 text-xs font-bold text-suave">
            <span>USUARIO</span>
            <span>CONTRASEÑA</span>
          </div>
          {accesos.map((a) => (
            <button
              key={a.usuario}
              type="button"
              onClick={() => {
                setUsuario(a.usuario);
                setContrasena(a.contrasena);
                setError(null);
              }}
              className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl bg-campo px-3 py-2 text-left font-semibold"
            >
              <span>
                <b>{a.usuario}</b> <span className="text-sm font-normal text-suave">· {a.rol}</span>
              </span>
              <b className="tracking-wider">{a.contrasena}</b>
            </button>
          ))}
        </Tarjeta>
      ) : null}
    </>
  );
}
