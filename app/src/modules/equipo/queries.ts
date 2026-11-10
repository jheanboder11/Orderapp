import "server-only";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/modules/auth/schema";
import { exigirRol } from "@/modules/auth/sesion";

/** El equipo completo (solo Administrador): activos primero. */
export async function listarEquipo() {
  await exigirRol("ADMINISTRADOR");
  return db
    .select({
      id: users.id,
      nombre: users.name,
      usuario: users.displayUsername,
      rol: users.rol,
      activo: users.activo,
    })
    .from(users)
    .orderBy(desc(users.activo), asc(users.rol), asc(users.name));
}

export type Persona = Awaited<ReturnType<typeof listarEquipo>>[number];
