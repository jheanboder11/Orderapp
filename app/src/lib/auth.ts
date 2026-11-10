import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as tablas from "@/modules/auth/schema";
import {
  MAX_FALLIDOS,
  MINUTOS_BLOQUEO,
  USUARIO_MAX,
  USUARIO_MIN,
  minutosRestantes,
  normalizarUsuario,
  usuarioValido,
} from "@/modules/auth/rules";

const TREINTA_DIAS = 60 * 60 * 24 * 30;
const RUTA_ENTRAR = "/sign-in/username";

/** Lee el usuario que viene en el cuerpo de la petición de entrada. */
function usuarioDelCuerpo(body: unknown): string | null {
  if (body && typeof body === "object" && "username" in body && typeof body.username === "string") {
    return normalizarUsuario(body.username);
  }
  return null;
}

export const auth = betterAuth({
  appName: "Orderapp",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: tablas.users,
      session: tablas.sessions,
      account: tablas.accounts,
      verification: tablas.verifications,
      rateLimit: tablas.rateLimits,
    },
  }),

  // Solo usuario + contraseña. Nadie se registra solo: el Administrador crea las cuentas.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 6,
    maxPasswordLength: 72,
  },

  // El mensajero inicia sesión una sola vez: la sesión dura 30 días y se renueva sola.
  session: { expiresIn: TREINTA_DIAS, updateAge: 60 * 60 * 24 },

  user: {
    additionalFields: {
      rol: { type: "string", required: true, input: false },
      activo: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },

  // Rutas de Better Auth que Orderapp no usa: responden 404 (no existen).
  disabledPaths: [
    "/sign-up/email",
    "/sign-in/email",
    "/is-username-available",
    "/update-user",
    "/change-email",
    "/change-password",
    "/delete-user",
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/verify-email",
  ],

  // Protección contra robots por IP. El bloqueo de 5 intentos va por usuario (abajo),
  // para que una persona que se equivoca no bloquee a todo el local (misma wifi = misma IP).
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: { [RUTA_ENTRAR]: { window: 10 * 60, max: 30 } },
  },

  advanced: { cookiePrefix: "orderapp" },

  databaseHooks: {
    session: {
      create: {
        // Una cuenta desactivada no puede abrir sesión (solo se revisa con la contraseña correcta).
        async before(sesion) {
          const [u] = await db
            .select({ activo: tablas.users.activo })
            .from(tablas.users)
            .where(eq(tablas.users.id, sesion.userId));
          if (!u?.activo) {
            throw new APIError("FORBIDDEN", {
              message: "Tu cuenta está desactivada. Habla con el Administrador.",
            });
          }
        },
      },
    },
  },

  hooks: {
    // Antes de revisar la contraseña: ¿este usuario está bloqueado por muchos intentos?
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== RUTA_ENTRAR) return;
      const usuario = usuarioDelCuerpo(ctx.body);
      if (!usuario) return;
      const [fila] = await db
        .select()
        .from(tablas.intentosEntrada)
        .where(eq(tablas.intentosEntrada.usuario, usuario));
      if (fila?.bloqueadoHasta && fila.bloqueadoHasta > new Date()) {
        const min = minutosRestantes(fila.bloqueadoHasta);
        throw new APIError("TOO_MANY_REQUESTS", {
          message: `Muchos intentos fallidos. Espera ${min} ${min === 1 ? "minuto" : "minutos"} o pídele ayuda al Administrador.`,
        });
      }
    }),
    // Después: cuenta el fallo (5 = bloqueo de 10 min) o borra el contador si entró bien.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== RUTA_ENTRAR) return;
      const usuario = usuarioDelCuerpo(ctx.body);
      if (!usuario) return;
      const r = ctx.context.returned;
      const fallo = r instanceof APIError && r.statusCode === 401;
      if (!fallo) {
        if (!(r instanceof APIError)) {
          await db.delete(tablas.intentosEntrada).where(eq(tablas.intentosEntrada.usuario, usuario));
        }
        return;
      }
      const t = tablas.intentosEntrada;
      await db
        .insert(t)
        .values({ usuario, fallidos: 1 })
        .onConflictDoUpdate({
          target: t.usuario,
          set: {
            // Si el bloqueo anterior ya pasó, vuelve a contar desde 1.
            fallidos: sql`case when ${t.bloqueadoHasta} is not null and ${t.bloqueadoHasta} <= now() then 1 else ${t.fallidos} + 1 end`,
            bloqueadoHasta: sql`case when ${t.bloqueadoHasta} is not null and ${t.bloqueadoHasta} <= now() then null else ${t.bloqueadoHasta} end`,
            actualizadoEn: sql`now()`,
          },
        });
      await db
        .update(t)
        .set({
          fallidos: 0,
          bloqueadoHasta: sql`now() + make_interval(mins => ${MINUTOS_BLOQUEO})`,
        })
        .where(sql`${t.usuario} = ${usuario} and ${t.fallidos} >= ${MAX_FALLIDOS}`);
    }),
  },

  plugins: [
    username({
      minUsernameLength: USUARIO_MIN,
      maxUsernameLength: USUARIO_MAX,
      usernameNormalization: normalizarUsuario,
      usernameValidator: usuarioValido,
      validationOrder: { username: "post-normalization" },
    }),
    nextCookies(), // debe ir de último
  ],
});

export type Sesion = typeof auth.$Infer.Session;
