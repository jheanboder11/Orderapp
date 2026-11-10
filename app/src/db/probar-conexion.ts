/** `pnpm db:probar` → dice si la app puede hablar con la base de datos. */
import { config } from "dotenv";
import postgres from "postgres";
import { leerEnv } from "../lib/env";

config({ path: ".env.local" });

async function main() {
  const sql = postgres(leerEnv().DATABASE_URL, { max: 1, prepare: false });
  try {
    const [fila] = await sql<{ version: string }[]>`select version()`;
    console.log("✅ Conectado a la base de datos:", fila?.version.split(",")[0]);
  } finally {
    await sql.end();
  }
}

main().catch((e: unknown) => {
  console.error("❌ No pude conectarme a la base de datos.");
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
