/** Al terminar las pruebas, borra los usuarios de prueba (los que empiezan por "e2e"). */
import { config } from "dotenv";
import postgres from "postgres";

export default async function limpiar() {
  config({ path: ".env.local", quiet: true });
  if (!process.env.DATABASE_URL) return;
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    await sql`delete from users where usuario like 'e2e%'`;
    await sql`delete from intentos_entrada where usuario like 'e2e%'`;
  } finally {
    await sql.end();
  }
}
