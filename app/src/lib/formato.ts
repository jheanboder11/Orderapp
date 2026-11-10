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

/** "2026-11-09" + 1 → "2026-11-10" (sin importar la zona horaria del computador). */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a ?? 0, (m ?? 1) - 1, (d ?? 1) + dias));
  return f.toISOString().slice(0, 10);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."];

/** "2026-11-10" → "martes 10 de nov." */
export function fechaBonita(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a ?? 0, (m ?? 1) - 1, d ?? 1));
  return `${DIAS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]}`;
}

/** "17:00:00" o "17:00" → "5:00 p. m." */
export function horaCorta(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hora = h ?? 0;
  const sufijo = hora < 12 ? "a. m." : "p. m.";
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${sufijo}`;
}
