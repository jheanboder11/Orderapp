/** Formatos que se usan en toda la app (dinero en pesos, fechas de Bogotá). */

export const ZONA_HORARIA = "America/Bogota";

/** 192000 → "$ 192.000". Pesos colombianos enteros, sin decimales. */
export function pesos(valor: number): string {
  if (!Number.isInteger(valor)) {
    throw new Error("El dinero se maneja en pesos enteros, sin decimales.");
  }
  const miles = Math.abs(valor)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "-" : ""}$ ${miles}`;
}

/** Fecha (YYYY-MM-DD) del día en Bogotá para un instante dado. */
export function fechaBogota(instante: Date = new Date()): string {
  // "en-CA" escribe la fecha como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Hora de Bogotá en formato 12 h, ej. "3:05 p. m.". */
export function horaBogota(instante: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA_HORARIA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instante);
}
