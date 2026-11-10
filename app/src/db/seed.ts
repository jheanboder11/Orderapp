/** `pnpm db:seed` → crea el primer Administrador con ADMIN_USUARIO y ADMIN_PASSWORD de .env.local. */
import "./cargar-env";
import { esquemaNuevoUsuario } from "@/modules/auth/rules";
import { crearUsuarioEnBD } from "@/modules/equipo/crear";
import { sql } from "./index";

async function main() {
  const datos = esquemaNuevoUsuario.safeParse({
    nombre: process.env.ADMIN_USUARIO,
    usuario: process.env.ADMIN_USUARIO,
    rol: "ADMINISTRADOR",
    contrasena: process.env.ADMIN_PASSWORD ?? "",
  });
  if (!datos.success) {
    throw new Error(
      `Revisa ADMIN_USUARIO y ADMIN_PASSWORD en .env.local: ${datos.error.issues.map((i) => i.message).join(" ")}`,
    );
  }
  const r = await crearUsuarioEnBD(datos.data);
  if (r.ok) console.log(`✅ Administrador "${datos.data.usuario}" creado. Ya puede entrar.`);
  else console.log(`ℹ️  ${r.error} (no cambié nada)`);
}

main()
  .catch((e: unknown) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
