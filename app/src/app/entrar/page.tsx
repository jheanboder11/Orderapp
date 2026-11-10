import type { Metadata } from "next";
import { Encabezado } from "@/components/Encabezado";
import { Boton, Campo, Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Entrar · Orderapp" };

export default function Entrar() {
  // Fase 0: solo la pantalla. El inicio de sesión real llega en la Fase 1.
  return (
    <>
      <Encabezado />
      <Tarjeta>
        <form method="post" autoComplete="on">
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
            required
          />
          <Campo
            etiqueta="🔒 Tu contraseña"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            required
          />
          <Boton type="submit" variante="principal" grande>
            Entrar
          </Boton>
          <p className="mt-2.5 text-center text-[13px] text-suave">
            ¿Olvidaste tu contraseña? Pídesela al Administrador.
          </p>
        </form>
      </Tarjeta>
    </>
  );
}
