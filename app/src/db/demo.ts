/**
 * Cuentas de prueba (pnpm db:seed:demo). Sus contraseñas son públicas a propósito:
 * antes de usar la app de verdad, desactívalas en Equipo y pon MOSTRAR_ACCESOS_PRUEBA=false.
 * El Administrador NO está aquí: se crea con pnpm db:seed y su clave de .env.local.
 */
export type AccesoDemo = {
  nombre: string;
  usuario: string;
  rol: "Colaborador" | "Mensajero";
  contrasena: string;
};

export const ACCESOS_DEMO: AccesoDemo[] = [
  { nombre: "Ana", usuario: "Ana", rol: "Colaborador", contrasena: "12345678" },
  { nombre: "Teo", usuario: "Teo", rol: "Mensajero", contrasena: "123456" },
  { nombre: "Luz", usuario: "Luz", rol: "Mensajero", contrasena: "123456" },
];
