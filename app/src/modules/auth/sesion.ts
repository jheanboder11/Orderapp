import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { INICIO_ROL, type Rol, rolEs } from "./rules";

export type UsuarioActual = {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
};

/** Quién está usando la app ahora (o null si nadie inició sesión). Se revisa en el servidor. */
export const usuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return null;
  const u = sesion.user;
  if (u.activo === false || !rolEs(u.rol)) return null;
  return {
    id: u.id,
    nombre: u.name,
    usuario: u.displayUsername ?? u.username ?? "",
    rol: u.rol,
  };
});

/** Para pantallas: si no tiene sesión lo manda a entrar; si es otro rol, a su propia pantalla. */
export async function exigirRol(...roles: Rol[]): Promise<UsuarioActual> {
  const u = await usuarioActual();
  if (!u) redirect("/entrar");
  if (!roles.includes(u.rol)) redirect(INICIO_ROL[u.rol]);
  return u;
}

export class SinPermiso extends Error {
  constructor() {
    super("No tienes permiso para hacer esto.");
  }
}

/** Para acciones que escriben: si no tiene el rol, lanza un error (no basta con ocultar botones). */
export async function permitirSolo(...roles: Rol[]): Promise<UsuarioActual> {
  const u = await usuarioActual();
  if (!u || !roles.includes(u.rol)) throw new SinPermiso();
  return u;
}
