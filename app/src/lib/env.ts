import { z } from "zod";

/** Revisa que las "llaves" de .env.local existan y tengan buena forma. */
const esquema = z.object({
  DATABASE_URL: z
    .string({ error: "Falta DATABASE_URL en .env.local (la dirección de la base de datos)." })
    .startsWith("postgres", "DATABASE_URL debe empezar por postgresql://"),
});

export function leerEnv() {
  const r = esquema.safeParse(process.env);
  if (!r.success) {
    throw new Error(r.error.issues.map((i) => i.message).join("\n"));
  }
  return r.data;
}
