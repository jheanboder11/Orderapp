import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Encabezado } from "@/components/Encabezado";
import { ACCESOS_DEMO } from "@/db/demo";
import { INICIO_ROL } from "@/modules/auth/rules";
import { usuarioActual } from "@/modules/auth/sesion";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar · Orderapp" };

export default async function Entrar() {
  const u = await usuarioActual();
  if (u) redirect(INICIO_ROL[u.rol]);

  // Solo para probar: se apaga con MOSTRAR_ACCESOS_PRUEBA=false antes de usarla de verdad.
  const accesos = process.env.MOSTRAR_ACCESOS_PRUEBA === "true" ? ACCESOS_DEMO : [];

  return (
    <>
      <Encabezado />
      <FormEntrar accesos={accesos} />
    </>
  );
}
