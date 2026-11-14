import { fechaBogota, pesos } from "@/lib/formato";
import { type Estado, type FormaPago, MOTIVOS_PROBLEMA } from "@/modules/pedidos/rules";

/** Reglas de la pantalla del Mensajero (lógica pura, con pruebas en rules.test.ts). */

export type PedidoMensajero = {
  numeroDia: number;
  fechaCreacion: string;
  fechaEntrega: string;
  estado: Estado;
  horaSalida: Date | null;
  horaEntrega: Date | null;
  horaCancelado: Date | null;
  cierreId: number | null;
};

/**
 * Reparte los pedidos del Mensajero en las partes de su pantalla, en el orden de su día:
 * - enCamino: ya salió con ellos (🏍️ Entrégalos ahora).
 * - porRecoger: empacados que ya pueden salir (📦 Recógelos en el local).
 * - regresar: con problema, o cancelados hoy cuando ya estaban en la calle (↩️ Regrésalos al local).
 * - entregados: entregados hoy o que todavía no entran en un cierre (✅ Hechos).
 * - manana: empacados para un día que no ha llegado (🗓️ Para mañana).
 */
export function repartir<T extends PedidoMensajero>(lista: T[], hoy: string) {
  const r = { enCamino: [] as T[], porRecoger: [] as T[], regresar: [] as T[], entregados: [] as T[], manana: [] as T[] };
  for (const p of lista) {
    if (p.estado === "EN_ENTREGA") r.enCamino.push(p);
    else if (p.estado === "EMPACADO") (p.fechaEntrega > hoy ? r.manana : r.porRecoger).push(p);
    else if (p.estado === "PROBLEMA") r.regresar.push(p);
    else if (
      p.estado === "CANCELADO" &&
      p.horaSalida &&
      p.horaCancelado &&
      fechaBogota(p.horaCancelado) === hoy
    )
      r.regresar.push(p);
    else if (
      p.estado === "ENTREGADO" &&
      (p.cierreId === null || (p.horaEntrega && fechaBogota(p.horaEntrega) === hoy))
    )
      r.entregados.push(p);
  }
  const porDiaYNumero = (a: T, b: T) =>
    a.fechaEntrega === b.fechaEntrega
      ? a.fechaCreacion === b.fechaCreacion
        ? a.numeroDia - b.numeroDia
        : a.fechaCreacion < b.fechaCreacion
          ? -1
          : 1
      : a.fechaEntrega < b.fechaEntrega
        ? -1
        : 1;
  r.enCamino.sort(porDiaYNumero);
  r.porRecoger.sort(porDiaYNumero);
  r.regresar.sort(porDiaYNumero);
  r.manana.sort(porDiaYNumero);
  // Lo último que entregó, arriba.
  r.entregados.sort((a, b) => (b.horaEntrega?.getTime() ?? 0) - (a.horaEntrega?.getTime() ?? 0));
  return r;
}

/** Cuánto le toca cobrar, dicho como se lo diría el Colaborador. */
export function textoCobro(formaPago: FormaPago, valorTotal: number): string {
  if (formaPago === "EFECTIVO") return `💵 Te toca cobrar en efectivo: ${pesos(valorTotal)}`;
  if (formaPago === "TRANSFERENCIA") return "📲 Ya pagó por transferencia. No cobres nada.";
  return "🙌 Ya está pago. No cobres nada.";
}

/** Versión corta para las listas. */
export function cobroCorto(formaPago: FormaPago, valorTotal: number): string {
  if (formaPago === "EFECTIVO") return `💵 ${pesos(valorTotal)}`;
  if (formaPago === "TRANSFERENCIA") return "📲 Transferencia";
  return "🙌 Ya pagado";
}

/** "Cra 70 #45-20, Laureles" → "Laureles" (lo que va después de la última coma). */
export function barrio(direccion: string, zona: string): string {
  const partes = direccion.split(",");
  const ultimo = partes.length > 1 ? partes.at(-1)?.trim() : "";
  return ultimo || zona;
}

/** Motivo de "😕 No pude entregarlo": si es "Otro", contar qué pasó es obligatorio. */
export function motivoProblema(
  motivo: string,
  detalle: string,
): { ok: true; motivo: string; detalle: string } | { ok: false; error: string } {
  if (!(MOTIVOS_PROBLEMA as readonly string[]).includes(motivo)) {
    return { ok: false, error: "Elige qué pasó." };
  }
  const d = detalle.trim().slice(0, 300);
  if (motivo === "Otro" && !d) return { ok: false, error: "Cuéntanos qué pasó, aunque sea corto." };
  return { ok: true, motivo, detalle: d || motivo };
}

/* ---------- Botones 📞 Llamar · 📍 Mapa · 💬 WhatsApp ---------- */

const soloNumeros = (celular: string) => celular.replace(/\D/g, "");

export const linkLlamar = (celular: string) => `tel:${soloNumeros(celular)}`;

/** Los celulares de Colombia (10 números, empiezan por 3) llevan el 57 adelante en WhatsApp. */
export function linkWhatsApp(celular: string): string {
  const n = soloNumeros(celular);
  return `https://wa.me/${/^3\d{9}$/.test(n) ? `57${n}` : n}`;
}

/** Busca la dirección en Google Maps. En Medellín se agrega la ciudad para que la encuentre. */
export function linkMapa(direccion: string, zona: string): string {
  const consulta = zona === "Medellín" ? `${direccion}, Medellín` : `${direccion}, Antioquia`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}
