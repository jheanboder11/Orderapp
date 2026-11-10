import { bigint, boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Tablas de usuarios y sesiones. Los nombres de propiedad (name, username, createdAt…)
 * son los que pide Better Auth; las columnas en la base de datos van en español.
 */

export const rolEnum = pgEnum("rol", ["ADMINISTRADOR", "COLABORADOR", "MENSAJERO"]);

const ts = (columna: string) => timestamp(columna, { withTimezone: true });

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("nombre").notNull(),
  /** Usuario normalizado: minúsculas y sin tildes ("Teó" → "teo"). */
  username: text("usuario").notNull().unique(),
  /** Usuario tal como lo escribió el Administrador. */
  displayUsername: text("usuario_visible"),
  rol: rolEnum("rol").notNull(),
  activo: boolean("activo").notNull().default(true),
  // Better Auth exige un correo. No se usa: se guarda uno interno (usuario@orderapp.local).
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verificado").notNull().default(false),
  image: text("imagen"),
  createdAt: ts("creado_en").notNull().defaultNow(),
  updatedAt: ts("actualizado_en").notNull().defaultNow(),
});

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Contraseña con hash (nunca en texto plano). */
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/** Límite de peticiones por IP (protección contra robots). Lo maneja Better Auth. */
export const rateLimits = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/** Intentos fallidos de entrar, por usuario: 5 fallos = bloqueado 10 minutos. */
export const intentosEntrada = pgTable("intentos_entrada", {
  usuario: text("usuario").primaryKey(),
  fallidos: integer("fallidos").notNull().default(0),
  bloqueadoHasta: ts("bloqueado_hasta"),
  actualizadoEn: ts("actualizado_en").notNull().defaultNow(),
});
