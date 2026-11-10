import { z } from "zod";

/** Reglas de usuarios (lógica pura, con pruebas). */

export const ROLES = ["ADMINISTRADOR", "COLABORADOR", "MENSAJERO"] as const;
export type Rol = (typeof ROLES)[number];

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  COLABORADOR: "Colaborador",
  MENSAJERO: "Mensajero",
};

/** Pantalla de inicio de cada rol. */
export const INICIO_ROL: Record<Rol, string> = {
  ADMINISTRADOR: "/admin/hoy",
  COLABORADOR: "/colaborador/pedidos",
  MENSAJERO: "/mensajero/entregas",
};

/** "  Teó " → "teo". No importan mayúsculas, tildes ni espacios a los lados. */
export function normalizarUsuario(usuario: string): string {
  return usuario
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export const USUARIO_MIN = 2;
export const USUARIO_MAX = 30;

/** Después de normalizar: solo letras sin tilde, números, punto o guion bajo. */
export function usuarioValido(normalizado: string): boolean {
  return (
    normalizado.length >= USUARIO_MIN &&
    normalizado.length <= USUARIO_MAX &&
    /^[a-z0-9._]+$/.test(normalizado)
  );
}

export function rolEs(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}

/** Qué contraseña se le pide a cada rol (se muestra debajo del campo). */
export function pistaContrasena(rol: Rol): string {
  return rol === "MENSAJERO" ? "Solo números, mínimo 6" : "Mínimo 8 letras o números";
}

/** Revisa la contraseña según el rol. Devuelve el error en palabras simples, o null si está bien. */
export function errorContrasena(rol: Rol, contrasena: string): string | null {
  if (rol === "MENSAJERO") {
    if (!/^\d+$/.test(contrasena)) return "La contraseña del Mensajero lleva solo números.";
    if (contrasena.length < 6) return "La contraseña del Mensajero necesita mínimo 6 números.";
    if (contrasena.length > 12) return "La contraseña del Mensajero puede tener máximo 12 números.";
    return null;
  }
  if (contrasena.length < 8) return "La contraseña necesita mínimo 8 letras o números.";
  if (contrasena.length > 72) return "La contraseña es demasiado larga (máximo 72).";
  return null;
}

/** Datos para crear una persona del equipo (se valida en el servidor). */
export const esquemaNuevoUsuario = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Te falta el nombre de la persona.")
      .max(40, "El nombre es muy largo (máximo 40)."),
    usuario: z
      .string()
      .trim()
      .min(1, "Te falta el usuario con el que va a entrar.")
      .max(USUARIO_MAX, `El usuario es muy largo (máximo ${USUARIO_MAX}).`)
      .refine(
        (u) => usuarioValido(normalizarUsuario(u)),
        "El usuario va en una sola palabra, sin espacios. Ej: Teo",
      ),
    rol: z.enum(ROLES, "Elige qué hace la persona."),
    contrasena: z.string().max(72, "La contraseña es demasiado larga."),
  })
  .superRefine((d, ctx) => {
    const error = errorContrasena(d.rol, d.contrasena);
    if (error) ctx.addIssue({ code: "custom", path: ["contrasena"], message: error });
  });

export type NuevoUsuario = z.infer<typeof esquemaNuevoUsuario>;

/** Bloqueo por intentos fallidos. */
export const MAX_FALLIDOS = 5;
export const MINUTOS_BLOQUEO = 10;

export function minutosRestantes(bloqueadoHasta: Date, ahora: Date = new Date()): number {
  return Math.max(1, Math.ceil((bloqueadoHasta.getTime() - ahora.getTime()) / 60_000));
}
