"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Botón "Salir": cierra la sesión en este celular. */
export async function salir() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/entrar");
}
