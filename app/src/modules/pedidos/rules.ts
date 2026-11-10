import { z } from "zod";
import type { Rol } from "@/modules/auth/rules";
import { fechaBogota, fechaBonita, pesos, sumarDias } from "@/lib/formato";

/** Reglas de los pedidos (lógica pura, con pruebas en rules.test.ts). */

export const ESTADOS = [
  "EMPACADO",
  "EN_ENTREGA",
  "ENTREGADO",
  "PROBLEMA",
  "DEVUELTO",
  "CANCELADO",
] as const;
export type Estado = (typeof ESTADOS)[number];

export const FORMAS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "YA_PAGADO"] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const NOMBRE_ESTADO: Record<Estado, string> = {
  EMPACADO: "Empacado",
  EN_ENTREGA: "En entrega",
  ENTREGADO: "Entregado",
  PROBLEMA: "Problema",
  DEVUELTO: "Devuelto",
  CANCELADO: "Cancelado",
};

export const EMOJI_ESTADO: Record<Estado, string> = {
  EMPACADO: "📦",
  EN_ENTREGA: "🏍️",
  ENTREGADO: "✅",
  PROBLEMA: "⚠️",
  DEVUELTO: "↩️",
  CANCELADO: "🚫",
};

export const NOMBRE_PAGO: Record<FormaPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  YA_PAGADO: "Ya pagado",
};

export const MOTIVOS_CANCELACION = [
  "El cliente canceló",
  "Error al crear el pedido",
  "No hay el producto",
  "Otro",
] as const;

export const MOTIVOS_PROBLEMA = [
  "No contesta",
  "No estaba",
  "Dirección incorrecta",
  "Error al empacar",
  "Rechazó el pedido",
  "Otro",
] as const;

/* ---------- Estados ---------- */

export const ABIERTOS: readonly Estado[] = ["EMPACADO", "EN_ENTREGA"];
export const esAbierto = (e: Estado) => ABIERTOS.includes(e);

/** Qué cambios de estado existen y quién puede hacerlos. Cualquier otro cambio se rechaza. */
const TRANSICIONES: Record<Estado, Partial<Record<Estado, readonly Rol[]>>> = {
  EMPACADO: { EN_ENTREGA: ["MENSAJERO"], CANCELADO: ["COLABORADOR"] },
  EN_ENTREGA: { ENTREGADO: ["MENSAJERO"], PROBLEMA: ["MENSAJERO"], CANCELADO: ["COLABORADOR"] },
  PROBLEMA: { DEVUELTO: ["COLABORADOR"] },
  ENTREGADO: {},
  DEVUELTO: {},
  CANCELADO: {},
};

/** null si el cambio se puede hacer; si no, el mensaje que se le muestra a la persona. */
export function errorTransicion(de: Estado, a: Estado, rol: Rol): string | null {
  const quienes = TRANSICIONES[de][a];
  if (!quienes) {
    return `Este pedido está ${NOMBRE_ESTADO[de].toLowerCase()} y no puede pasar a ${NOMBRE_ESTADO[a].toLowerCase()}. Actualiza la pantalla.`;
  }
  if (!quienes.includes(rol)) return "No tienes permiso para hacer esto.";
  return null;
}

export const puedeEditar = (e: Estado) => e === "EMPACADO";
export const puedeReasignar = (e: Estado) => esAbierto(e);

/** Regla 2: un pedido para mañana no puede salir hoy. */
export function errorSalida(fechaEntrega: string, hoy: string): string | null {
  return fechaEntrega > hoy ? `Este pedido es para el ${fechaBonita(fechaEntrega)}, todavía no sale` : null;
}

/* ---------- Formulario ---------- */

export const PARA = ["HOY", "MANANA"] as const;

/** Convierte "172.000", "$ 172000" o "172 mil" en 172000. */
export function leerPesos(texto: string): number {
  const t = texto.toLowerCase().trim();
  const mil = /(\d+(?:[.,]\d+)?)\s*mil\b/.exec(t);
  if (mil?.[1]) return Math.round(parseFloat(mil[1].replace(",", ".")) * 1000);
  const digitos = t.replace(/\D/g, "");
  return digitos ? Number(digitos) : 0;
}

const texto = (max: number, falta: string) =>
  z.string().trim().min(1, falta).max(max, `Es muy largo (máximo ${max} letras).`);

export const esquemaPedido = z.object({
  cliente: texto(80, "Te falta el nombre del cliente."),
  celular: z
    .string()
    .transform((s) => s.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, ""))
    .pipe(
      z
        .string()
        .min(7, "Revisa el celular: le faltan números.")
        .max(15, "Revisa el celular: tiene demasiados números."),
    ),
  direccion: texto(200, "Te falta la dirección."),
  zonaId: z.coerce.number("Elige a dónde va.").int().positive("Elige a dónde va."),
  items: texto(200, "Te falta decir qué lleva."),
  nota: z.string().trim().max(200, "La nota es muy larga (máximo 200 letras).").optional().default(""),
  formaPago: z.enum(FORMAS_PAGO, "Elige cómo paga."),
  valorTotal: z
    .string()
    .transform(leerPesos)
    .pipe(
      z
        .number()
        .int()
        .positive("Te falta decir cuánto cobra en total (con domi).")
        .max(20_000_000, "Revisa el valor: es demasiado alto."),
    ),
  para: z.enum(PARA, "Elige para cuándo es."),
  entregarAntes: z
    .string()
    .trim()
    .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "La hora límite no es válida.")
    .optional()
    .default(""),
  mensajeroId: z.string().min(1, "Elige quién lo lleva.").max(100),
});

export type DatosPedido = z.infer<typeof esquemaPedido>;

/** El total incluye el domi: debe ser mayor que el domi. */
export function errorValor(valorTotal: number, valorDomi: number): string | null {
  return valorTotal <= valorDomi
    ? `El total debe ser mayor que el domi (${pesos(valorDomi)}). Recuerda que el total incluye el domi.`
    : null;
}

/** Fecha de entrega al crear. */
export function fechaEntregaNueva(para: (typeof PARA)[number], hoy: string): string {
  return para === "MANANA" ? sumarDias(hoy, 1) : hoy;
}

/** Fecha de entrega al editar: si no se cambia "Hoy/Mañana", se conserva la original. */
export function fechaEntregaEditada(
  para: (typeof PARA)[number],
  fechaOriginal: string,
  hoy: string,
): string {
  const eraParaDespues = fechaOriginal > hoy;
  if ((para === "MANANA") === eraParaDespues) return fechaOriginal;
  return fechaEntregaNueva(para, hoy);
}

/** Motivo de cancelación: si es "Otro", el texto es obligatorio. */
export function motivoCancelacion(motivo: string, detalle: string): { ok: true; texto: string } | { ok: false; error: string } {
  if (!(MOTIVOS_CANCELACION as readonly string[]).includes(motivo)) {
    return { ok: false, error: "Elige por qué se cancela." };
  }
  const d = detalle.trim().slice(0, 300);
  if (motivo === "Otro") {
    if (!d) return { ok: false, error: "Cuéntanos por qué se cancela, aunque sea corto." };
    return { ok: true, texto: `Otro: ${d}` };
  }
  return { ok: true, texto: motivo };
}

/* ---------- Listas y alertas ---------- */

/** Lo mínimo que necesitan las reglas de listas y alertas. */
export type PedidoBase = {
  numeroDia: number;
  fechaCreacion: string;
  fechaEntrega: string;
  estado: Estado;
  horaSalida: Date | null;
  horaEntrega: Date | null;
};

/** Reparte los pedidos en las tres listas del Colaborador: hoy, mañana y ayer. */
export function clasificar<T extends PedidoBase>(lista: T[], hoy: string) {
  const ayer = sumarDias(hoy, -1);
  const r = { hoy: [] as T[], manana: [] as T[], ayer: [] as T[] };
  for (const p of lista) {
    const diaEntregado = p.horaEntrega ? fechaBogota(p.horaEntrega) : null;
    if (p.fechaEntrega > hoy) r.manana.push(p);
    else if (
      esAbierto(p.estado) ||
      p.estado === "PROBLEMA" ||
      p.fechaEntrega === hoy ||
      diaEntregado === hoy
    )
      r.hoy.push(p);
    else if (p.fechaEntrega === ayer || diaEntregado === ayer) r.ayer.push(p);
  }
  const orden = (a: T, b: T) =>
    a.fechaCreacion === b.fechaCreacion
      ? b.numeroDia - a.numeroDia
      : a.fechaCreacion < b.fechaCreacion
        ? 1
        : -1;
  r.hoy.sort(orden);
  r.manana.sort(orden);
  r.ayer.sort(orden);
  return r;
}

/** Minutos que lleva en la calle (o null si no ha salido). */
export function minutosEnLaCalle(horaSalida: Date | null, ahora: Date = new Date()): number | null {
  if (!horaSalida) return null;
  return Math.max(0, Math.round((ahora.getTime() - horaSalida.getTime()) / 60_000));
}

/** Regla 8: demorado = en entrega por más minutos que el límite de su zona. */
export function estaDemorado(
  p: Pick<PedidoBase, "estado" | "horaSalida">,
  limiteMinutos: number,
  ahora: Date = new Date(),
): boolean {
  const min = minutosEnLaCalle(p.horaSalida, ahora);
  return p.estado === "EN_ENTREGA" && min !== null && min > limiteMinutos;
}

/** Etiqueta del día junto al pedido. */
export function etiquetaDia(p: PedidoBase, hoy: string): { texto: string; tipo: "ok" | "mal" } | null {
  if (esAbierto(p.estado) && p.fechaEntrega === hoy && p.fechaCreacion < p.fechaEntrega) {
    return { texto: "🗓️ Agendado: toca entregarlo hoy", tipo: "ok" };
  }
  if (esAbierto(p.estado) && p.fechaEntrega < hoy) {
    return { texto: `(era para el ${fechaBonita(p.fechaEntrega)})`, tipo: "mal" };
  }
  if (p.fechaEntrega > hoy && p.estado === "EMPACADO") {
    return { texto: `(para el ${fechaBonita(p.fechaEntrega)})`, tipo: "ok" };
  }
  return null;
}

/** Botón "📋 Copiar": el resumen del pedido para pegar en WhatsApp. */
export function textoParaWhatsApp(p: {
  numeroDia: number;
  cliente: string;
  celular: string;
  direccion: string;
  zona: string;
  items: string;
  formaPago: FormaPago;
  valorTotal: number;
  nota: string | null;
}): string {
  const cobro =
    p.formaPago === "EFECTIVO"
      ? `Cobrar efectivo ${pesos(p.valorTotal)}`
      : p.formaPago === "TRANSFERENCIA"
        ? "Pago por transferencia, no cobrar"
        : "Ya pagado, no cobrar";
  return [
    `Pedido #${p.numeroDia}`,
    `${p.cliente} ${p.celular}`,
    `${p.direccion} (${p.zona})`,
    `Lleva: ${p.items}`,
    cobro,
    ...(p.nota ? [`Nota: ${p.nota}`] : []),
  ].join("\n");
}

/** Mensaje para "💬 Escribirle" al mensajero de un pedido demorado. */
export function textoDemora(p: { numeroDia: number; cliente: string; mensajero: string; minutos: number }) {
  return `Hola ${p.mensajero} 👋 ¿Cómo vas con el pedido #${p.numeroDia} de ${p.cliente}? Ya lleva ${p.minutos} min en la calle.`;
}
