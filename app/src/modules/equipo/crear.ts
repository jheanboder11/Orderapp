import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { users } from "@/modules/auth/schema";
import { type NuevoUsuario, normalizarUsuario } from "@/modules/auth/rules";

export type ResultadoCrear = { ok: true; id: string } | { ok: false; error: string };

/**
 * Crea una persona del equipo con su contraseña (guardada con hash).
 * Lo usan la pantalla Equipo y los scripts de semilla. Los datos ya vienen validados.
 */
export async function crearUsuarioEnBD(datos: NuevoUsuario): Promise<ResultadoCrear> {
  const ctx = await auth.$context;
  const usuario = normalizarUsuario(datos.usuario);

  const [existe] = await db.select({ id: users.id }).from(users).where(eq(users.username, usuario));
  if (existe) {
    return { ok: false, error: `Ya hay alguien con el usuario "${datos.usuario.trim()}". Prueba con otro.` };
  }

  const hash = await ctx.password.hash(datos.contrasena);
  const nuevo = await ctx.internalAdapter.createUser({
    name: datos.nombre,
    email: `${usuario}@orderapp.local`,
    emailVerified: false,
    username: usuario,
    displayUsername: datos.usuario.trim(),
    rol: datos.rol,
    activo: true,
  }, { method: "admin" });

  try {
    await ctx.internalAdapter.linkAccount({
      userId: nuevo.id,
      providerId: "credential",
      accountId: nuevo.id,
      password: hash,
    });
  } catch (e) {
    // Sin contraseña la cuenta no sirve: se deshace para no dejar una cuenta a medias.
    await db.delete(users).where(eq(users.id, nuevo.id));
    throw e;
  }
  return { ok: true, id: nuevo.id };
}
