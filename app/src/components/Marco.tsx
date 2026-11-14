import type { ReactNode } from "react";
import type { Rol } from "@/modules/auth/rules";
import { exigirRol } from "@/modules/auth/sesion";
import { pendientesMensajero } from "@/modules/entregas/queries";
import { pendientesColaborador } from "@/modules/pedidos/queries";
import { Avisos } from "./Avisos";
import { BarraModulos } from "./BarraModulos";
import { Encabezado } from "./Encabezado";
import { Tarjeta, TituloModulo } from "./ui";

/** Marco de cada sección: revisa el rol en el servidor, pone el encabezado y la barra de módulos. */
export async function Marco({ rol, children }: { rol: Rol; children: ReactNode }) {
  const u = await exigirRol(rol);
  const pendientes: Record<string, number> =
    rol === "COLABORADOR"
      ? { "/colaborador/pedidos": await pendientesColaborador() }
      : rol === "MENSAJERO"
        ? { "/mensajero/entregas": await pendientesMensajero(u.id) }
        : {};
  return (
    <>
      <Encabezado nombre={u.nombre} />
      <BarraModulos rol={rol} pendientes={pendientes} />
      <main>{children}</main>
      <Avisos />
    </>
  );
}

/** Módulo que todavía no se construye (se reemplaza en su fase). */
export function Pronto({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <>
      <TituloModulo>{titulo}</TituloModulo>
      <Tarjeta>
        <p className="text-suave">🚧 Esta parte se construye en la Fase {fase}.</p>
      </Tarjeta>
    </>
  );
}
