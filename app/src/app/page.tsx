import { redirect } from "next/navigation";

export default function Inicio() {
  // En la Fase 1: si hay sesión, se envía a la pantalla de su rol.
  redirect("/entrar");
}
