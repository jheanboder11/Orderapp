"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { intentosEntrada, users } from "@/modules/auth/schema";
import { errorContrasena, esquemaNuevoUsuario, rolEs } from "@/modules/auth/rules";
import { SinPermiso, permitirSolo } from "@/modules/auth/sesion";
import { crearUsuarioEnBD } from "./crear";

export type EstadoCrear =
  | { ok: true; creado: { nombre: string; usuario: string; contrasena: string } }
  | { ok: false; error: string; campos?: Record<string, string> }
  | null;

export type EstadoSimple = { ok: true; mensaje: string } | { ok: false; error: string } | null;

const RUTA = "/admin/equipo";

function mensajeError(e: unknown): string {
  if (e instanceof SinPermiso) return e.message;
  console.error(e);
  return "Algo salió mal. Intenta otra vez en un momento.";
}

/** ➕ Crear un usuario (solo Administrador). */
export async function crearPersona(_prev: EstadoCrear, form: FormData): Promise<EstadoCrear> {
  const campos = {
    nombre: String(form.get("nombre") ?? ""),
    usuario: String(form.get("usuario") ?? ""),
    rol: String(form.get("rol") ?? ""),
    contrasena: String(form.get("contrasena") ?? ""),
  };
  try {
    await permitirSolo("ADMINISTRADOR");
    const r = esquemaNuevoUsuario.safeParse(campos);
    if (!r.success) {
      return { ok: false, error: r.error.issues[0]?.message ?? "Revisa los datos.", campos };
    }
    const creado = await crearUsuarioEnBD(r.data);
    if (!creado.ok) return { ok: false, error: creado.error, campos };
    revalidatePath(RUTA);
    return {
      ok: true,
      creado: { nombre: r.data.nombre, usuario: r.data.usuario, contrasena: r.data.contrasena },
    };
  } catch (e) {
    return { ok: false, error: mensajeError(e), campos };
  }
}

const esquemaId = z.string().min(1).max(100);

/** 🔑 Nueva contraseña: la cambia, lo desbloquea y cierra sus sesiones abiertas. */
export async function cambiarContrasena(_prev: EstadoSimple, form: FormData): Promise<EstadoSimple> {
  try {
    await permitirSolo("ADMINISTRADOR");
    const id = esquemaId.parse(form.get("id"));
    const contrasena = String(form.get("contrasena") ?? "");
    const [persona] = await db
      .select({ nombre: users.name, rol: users.rol, usuario: users.username })
      .from(users)
      .where(eq(users.id, id));
    if (!persona || !rolEs(persona.rol)) return { ok: false, error: "No encontré a esa persona." };

    const error = errorContrasena(persona.rol, contrasena);
    if (error) return { ok: false, error };

    const ctx = await auth.$context;
    await ctx.internalAdapter.updatePassword(id, await ctx.password.hash(contrasena));
    await ctx.internalAdapter.deleteUserSessions(id);
    await db.delete(intentosEntrada).where(eq(intentosEntrada.usuario, persona.usuario));
    revalidatePath(RUTA);
    return {
      ok: true,
      mensaje: `Listo. Pásale la nueva contraseña a ${persona.nombre}. Tiene que volver a entrar.`,
    };
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }
}

/** Activar o desactivar una cuenta. No se borra, para no romper el historial. */
export async function cambiarActivo(_prev: EstadoSimple, form: FormData): Promise<EstadoSimple> {
  try {
    const yo = await permitirSolo("ADMINISTRADOR");
    const id = esquemaId.parse(form.get("id"));
    const activo = form.get("activo") === "true";
    if (id === yo.id && !activo) {
      return { ok: false, error: "No puedes desactivar tu propia cuenta." };
    }
    const [persona] = await db
      .update(users)
      .set({ activo, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ nombre: users.name });
    if (!persona) return { ok: false, error: "No encontré a esa persona." };
    if (!activo) {
      // Si tenía la app abierta en el celular, se le cierra.
      const ctx = await auth.$context;
      await ctx.internalAdapter.deleteUserSessions(id);
    }
    revalidatePath(RUTA);
    return {
      ok: true,
      mensaje: activo
        ? `${persona.nombre} ya puede entrar otra vez.`
        : `${persona.nombre} ya no puede entrar. Su historial se guarda.`,
    };
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }
}
