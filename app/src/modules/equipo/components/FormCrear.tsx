"use client";
import { useActionState, useState } from "react";
import { Aviso, Boton, Campo, Selector, Tarjeta } from "@/components/ui";
import { NOMBRE_ROL, type Rol, pistaContrasena } from "@/modules/auth/rules";
import { type EstadoCrear, crearPersona } from "../actions";
import { enviarSinBorrar } from "@/components/enviar";

const ORDEN_ROLES: Rol[] = ["MENSAJERO", "COLABORADOR", "ADMINISTRADOR"];

export function FormCrear() {
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(crearPersona, null);
  const [rol, setRol] = useState<Rol>("MENSAJERO");
  const [visto, setVisto] = useState<EstadoCrear>(null);
  const [copiado, setCopiado] = useState(false);

  const campos = estado && !estado.ok ? estado.campos : undefined;
  const creado = estado?.ok && estado !== visto ? estado.creado : null;

  async function copiar() {
    if (!creado) return;
    const texto = `Hola ${creado.nombre} 👋 Ya puedes entrar a Orderapp: ${window.location.origin}\nUsuario: ${creado.usuario}\nContraseña: ${creado.contrasena}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (creado) {
    return (
      <Tarjeta className="border-exito">
        <h2 className="mb-1 text-lg font-bold">✅ Listo, {creado.nombre} ya puede entrar</h2>
        <p className="text-sm text-suave">
          Pásale estos datos. Anótalos: por seguridad no se vuelven a mostrar.
        </p>
        <div className="mt-2 rounded-xl bg-campo px-3 py-2 font-semibold">
          <div>🙋 Usuario: {creado.usuario}</div>
          <div>🔒 Contraseña: {creado.contrasena}</div>
        </div>
        <div className="mt-3 flex gap-2">
          <Boton type="button" className="flex-1" onClick={copiar}>
            {copiado ? "✅ Copiado" : "📋 Copiar para WhatsApp"}
          </Boton>
          <Boton
            type="button"
            className="flex-1"
            onClick={() => {
              setVisto(estado);
              setCopiado(false);
            }}
          >
            Ya lo anoté
          </Boton>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <form onSubmit={enviarSinBorrar(accion)} noValidate>
        <h2 className="mb-1 text-lg font-bold">➕ Crear un usuario</h2>
        <Campo
          etiqueta="Nombre"
          name="nombre"
          autoComplete="off"
          placeholder="Ej: Sara Gómez"
          defaultValue={campos?.nombre}
          maxLength={40}
        />
        <Campo
          etiqueta="Usuario (con este entra)"
          name="usuario"
          autoComplete="off"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Ej: Sara"
          pista="Una sola palabra. No importan mayúsculas ni tildes."
          defaultValue={campos?.usuario}
          maxLength={30}
        />
        <Selector
          etiqueta="¿Qué hace?"
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
        >
          {ORDEN_ROLES.map((r) => (
            <option key={r} value={r}>
              {NOMBRE_ROL[r]}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Contraseña para empezar"
          name="contrasena"
          type="text"
          autoComplete="new-password"
          inputMode={rol === "MENSAJERO" ? "numeric" : "text"}
          pista={pistaContrasena(rol)}
          maxLength={72}
        />
        {estado && !estado.ok ? <Aviso tipo="error">{estado.error}</Aviso> : null}
        <Boton type="submit" variante="principal" grande disabled={pendiente}>
          {pendiente ? "Creando…" : "👤 Crear usuario"}
        </Boton>
      </form>
    </Tarjeta>
  );
}
