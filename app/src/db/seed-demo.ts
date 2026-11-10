/** `pnpm db:seed:demo` → crea las cuentas de prueba (Ana, Teo y Luz). Los pedidos de ejemplo llegan en la Fase 2. */
import "./cargar-env";
import { esquemaNuevoUsuario } from "@/modules/auth/rules";
import { crearUsuarioEnBD } from "@/modules/equipo/crear";
import { ACCESOS_DEMO } from "./demo";
import { sql } from "./index";

async function main() {
  for (const a of ACCESOS_DEMO) {
    const datos = esquemaNuevoUsuario.parse({
      nombre: a.nombre,
      usuario: a.usuario,
      rol: a.rol === "Colaborador" ? "COLABORADOR" : "MENSAJERO",
      contrasena: a.contrasena,
    });
    const r = await crearUsuarioEnBD(datos);
    console.log(r.ok ? `✅ ${a.nombre} (${a.rol}) creado` : `ℹ️  ${r.error}`);
  }
}

main()
  .catch((e: unknown) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
