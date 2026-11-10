import { redirect } from "next/navigation";
import { INICIO_ROL } from "@/modules/auth/rules";
import { usuarioActual } from "@/modules/auth/sesion";

/** La raíz manda a cada persona a su pantalla, o a entrar si no tiene sesión. */
export default async function Inicio() {
  const u = await usuarioActual();
  redirect(u ? INICIO_ROL[u.rol] : "/entrar");
}
