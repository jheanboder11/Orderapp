import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { leerEnv } from "@/lib/env";

/**
 * Conexión a PostgreSQL (Neon). Se crea una sola vez y se reutiliza.
 * En desarrollo se guarda en globalThis para no abrir conexiones de más al recargar.
 */
const g = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

export const sql = (g._sql ??= postgres(leerEnv().DATABASE_URL, { max: 5, prepare: false }));
if (process.env.NODE_ENV !== "production") g._sql = sql;

export const db = drizzle(sql);
