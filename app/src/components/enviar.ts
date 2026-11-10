"use client";
import { type FormEvent, startTransition } from "react";

/**
 * Envía un formulario a una acción del servidor SIN que React borre lo escrito.
 * (Por defecto React limpia el formulario al enviarlo; si hay un error, la persona perdería lo que eligió.)
 * Uso: <form onSubmit={enviarSinBorrar(accion)}>
 */
export function enviarSinBorrar(accion: (datos: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  };
}
