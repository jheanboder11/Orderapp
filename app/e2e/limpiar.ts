/** Al terminar las pruebas, borra lo que crearon: pedidos "E2E …" y usuarios que empiezan por "e2e". */
import { config } from "dotenv";
import postgres from "postgres";

export default async function limpiar() {
  config({ path: ".env.local", quiet: true });
  if (!process.env.DATABASE_URL) return;
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    const pedidosPrueba = sql`
      select p.id from pedidos p join users u on u.id = p.mensajero_id or u.id = p.creado_por
      where p.cliente like 'E2E %' or u.usuario like 'e2e%'`;
    await sql`delete from pedido_eventos where pedido_id in (${pedidosPrueba})`;
    await sql`delete from pedido_eventos where usuario_id in (select id from users where usuario like 'e2e%')`;
    await sql`delete from pedidos where id in (${pedidosPrueba})`;
    await sql`delete from users where usuario like 'e2e%'`;
    await sql`delete from intentos_entrada where usuario like 'e2e%'`;
  } finally {
    await sql.end();
  }
}
