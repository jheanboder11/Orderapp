import type { Metadata } from "next";
import { Tarjeta, TituloModulo } from "@/components/ui";
import { exigirRol } from "@/modules/auth/sesion";
import { FilaPersona } from "@/modules/equipo/components/FilaPersona";
import { FormCrear } from "@/modules/equipo/components/FormCrear";
import { listarEquipo } from "@/modules/equipo/queries";

export const metadata: Metadata = { title: "Equipo · Orderapp" };

export default async function Equipo() {
  const yo = await exigirRol("ADMINISTRADOR");
  const equipo = await listarEquipo();
  const activos = equipo.filter((p) => p.activo).length;

  return (
    <>
      <TituloModulo>👥 Equipo</TituloModulo>
      <FormCrear />
      <Tarjeta>
        <h2 className="mb-1 text-lg font-bold">Tu equipo ({activos})</h2>
        <ul>
          {equipo.map((p) => (
            <FilaPersona key={p.id} persona={p} esYo={p.id === yo.id} />
          ))}
        </ul>
      </Tarjeta>
    </>
  );
}
