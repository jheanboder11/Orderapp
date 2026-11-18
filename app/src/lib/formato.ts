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

/** Hora partida como la ve la persona: 5 : 30 p. m. */
export type Partes = { hora: number; minutos: number; pm: boolean };

/** "17:30" → { hora: 5, minutos: 30, pm: true } */
export function deHora24(hhmm: string): Partes {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return { hora: h % 12 === 0 ? 12 : h % 12, minutos: m, pm: h >= 12 };
}

/** { hora: 5, minutos: 30, pm: true } → "17:30" */
export function aHora24(p: Partes): string {
  const h = (p.hora % 12) + (p.pm ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${String(p.minutos).padStart(2, "0")}`;
}

/** Flechas ▲▼: la hora da la vuelta 12 → 1, los minutos van de 5 en 5 (55 → 00) y a. m./p. m. se alterna. */
export function moverHora(p: Partes, campo: keyof Partes, paso: 1 | -1): Partes {
  if (campo === "hora") return { ...p, hora: ((p.hora - 1 + paso + 12) % 12) + 1 };
  if (campo === "minutos") {
    const base = Math.round(p.minutos / 5) * 5;
    return { ...p, minutos: (base + paso * 5 + 60) % 60 };
  }
  return { ...p, pm: !p.pm };
}

/** "17:00:00" o "17:00" → "5:00 p. m." */
export function horaCorta(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hora = h ?? 0;
  const sufijo = hora < 12 ? "a. m." : "p. m.";
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${sufijo}`;
}
