import type { FormaPago } from "./rules";

/**
 * Atajo de WhatsApp: lee el mensaje que mandó el cliente y saca los datos del pedido.
 * Copia la lógica de `parseMsg` de referencia/Index.html.
 */

export type DatosLeidos = {
  cliente?: string;
  celular?: string;
  direccion?: string;
  /** Nombre de la zona: "Medellín" o "Aledaño". */
  zona?: string;
  items?: string;
  formaPago?: FormaPago;
  valorTotal?: string;
  nota?: string;
};

const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "172.000", "172 mil", "$172,000" → 172000 (igual que `num` de la referencia). */
export function numeroDe(s: string): number {
  const t = String(s).toLowerCase();
  const mil = /(\d+(?:[.,]\d+)?)\s*mil\b/.exec(t);
  if (mil?.[1]) return Math.round(parseFloat(mil[1].replace(",", ".")) * 1000);
  const m = /\d[\d.,]*/.exec(t);
  if (!m) return 0;
  const d = m[0].replace(/[.,]+$/, "");
  return /^\d{1,3}([.,]\d{3})+$/.test(d) ? Number(d.replace(/[.,]/g, "")) : Number(d.replace(/\D/g, "")) || 0;
}

const ETIQUETAS = {
  cliente: /^(nombre(?: completo)?|cliente|a nombre de|recibe|persona que recibe)\b/i,
  celular: /^(celular|cel|tel[eé]fono|tel|whatsapp|n[uú]mero(?: de contacto)?|contacto)\b/i,
  direccion: /^(direcci[oó]n(?: de entrega)?|dir|domicilio)\b/i,
  barrio: /^(barrio|sector|zona|punto de referencia|referencia|torre|apto|apartamento|casa|conjunto|edificio|unidad)\b/i,
  ciudad: /^(ciudad|municipio)\b/i,
  items: /^(producto|pedido|art[ií]culo|modelo|chaqueta|prenda|talla|color|cantidad)\b/i,
  valor: /^(valor|total|precio|a pagar|monto)\b/i,
  pago: /^(pago|forma de pago|m[eé]todo de pago|medio de pago)\b/i,
  nota: /^(nota|notas|observaci[oó]n|observaciones|horario|hora)\b/i,
} as const;
type Clave = keyof typeof ETIQUETAS;

/** Encabezados que WhatsApp pone al copiar varios mensajes: "[3:15 p. m., 9/11/2026] Ana: …" */
const PREFIJO_1 = /^\[\d{1,2}:\d{2}(?:\s?[ap]\.?\s?m\.?)?,\s*\d{1,2}\/\d{1,2}\/\d{2,4}\]\s*[^:]{1,40}:\s*/i;
const PREFIJO_2 = /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s*\d{1,2}:\d{2}\s*(?:[ap]\.?\s?m\.?)?\s*-\s*[^:]{1,40}:\s*/i;

const MUNICIPIOS_ALEDANOS = [
  "envigado",
  "sabaneta",
  "bello",
  "itagui",
  "la estrella",
  "caldas",
  "copacabana",
  "girardota",
  "barbosa",
  "rionegro",
];

export function leerMensaje(mensaje: string): DatosLeidos {
  const lineas = String(mensaje || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.replace(PREFIJO_1, "").replace(PREFIJO_2, "").trim())
    .filter((x) => x && !/[:=]\s*$/.test(x));

  const g: Record<Clave, string[]> = {
    cliente: [],
    celular: [],
    direccion: [],
    barrio: [],
    ciudad: [],
    items: [],
    valor: [],
    pago: [],
    nota: [],
  };
  const resto: string[] = [];

  for (const l of lineas) {
    const m = /^([^:=\-–]{2,50}?)\s*[:=–-]\s*(.+)$/.exec(l);
    let clave: Clave | null = null;
    if (m?.[1]) {
      const etiqueta = m[1].trim();
      for (const k of Object.keys(ETIQUETAS) as Clave[]) {
        if (ETIQUETAS[k].test(etiqueta)) {
          clave = k;
          break;
        }
      }
    }
    if (clave && m?.[1] && m[2]) {
      const etiqueta = m[1].trim();
      const v = m[2].trim();
      // "Talla: M" → "talla M"; "Producto: chaqueta" → "chaqueta"
      g[clave].push(
        clave === "items" && !/^(producto|pedido|art[ií]culo|modelo)/i.test(etiqueta)
          ? `${etiqueta.toLowerCase()} ${v}`
          : v,
      );
    } else resto.push(l);
  }

  const cuerpo = [...Object.values(g).flat(), ...resto].join("\n");
  const cuerpoSinTildes = sinTildes(cuerpo);
  const f: DatosLeidos = {};

  if (g.cliente[0]) f.cliente = g.cliente[0];

  let tel = g.celular[0] ? g.celular[0].replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "") : "";
  if (!/^3\d{9}$/.test(tel)) {
    const m = /(?:\+?57[\s-]*)?(3\d{2})[\s.-]*(\d{3})[\s.-]*(\d{4})/.exec(cuerpo);
    tel = m ? `${m[1]}${m[2]}${m[3]}` : tel.length >= 7 ? tel : "";
  }
  if (tel) f.celular = tel;

  let dir = g.direccion[0] ?? "";
  if (!dir) {
    const l = resto.find((x) =>
      /\b(calle|cll|cl|cra|cr|carrera|kr|av|avenida|diagonal|diag|transversal|circular)\b|#/i.test(x),
    );
    if (l) dir = l;
  }
  if (dir) {
    if (g.barrio.length) dir += `, ${g.barrio.join(", ")}`;
    const ciudad = g.ciudad[0];
    if (ciudad && !sinTildes(dir).includes(sinTildes(ciudad))) dir += `, ${ciudad}`;
    f.direccion = dir;
  }

  let items = g.items.join(", ");
  if (!items) {
    const l = resto.find((x) => /chaqueta|cortavientos|doble faz|forro|talla/i.test(x));
    if (l) items = l;
  }
  if (items) f.items = items;

  if (MUNICIPIOS_ALEDANOS.some((x) => cuerpoSinTildes.includes(x))) f.zona = "Aledaño";
  else if (cuerpoSinTildes.includes("medellin")) f.zona = "Medellín";

  const pago = sinTildes(g.pago.join(" ") || cuerpo);
  if (/transferencia|nequi|daviplata|bancolombia|pse|consign/.test(pago)) f.formaPago = "TRANSFERENCIA";
  else if (/efectivo|contra ?entrega|al recibir/.test(pago)) f.formaPago = "EFECTIVO";
  else if (/ya pag|cancelad|pagado/.test(pago)) f.formaPago = "YA_PAGADO";

  let valor = g.valor[0] ? numeroDe(g.valor[0]) : 0;
  if (!valor) {
    const montos = [...cuerpo.matchAll(/\$\s*([\d.,]+(?:\s*mil)?)/gi)].map((x) => numeroDe(x[1] ?? ""));
    if (montos.length) valor = Math.max(...montos);
  }
  if (valor) f.valorTotal = String(valor);

  if (g.nota.length) f.nota = g.nota.join(", ");
  return f;
}

/** Nombres simples de los datos que no se encontraron, para "No encontré: …". */
export function faltantes(d: DatosLeidos): string[] {
  const nombres: [keyof DatosLeidos, string][] = [
    ["cliente", "el nombre"],
    ["celular", "el celular"],
    ["direccion", "la dirección"],
    ["items", "qué lleva"],
    ["formaPago", "cómo paga"],
    ["valorTotal", "cuánto cobra"],
  ];
  return nombres.filter(([k]) => !d[k]).map(([, n]) => n);
}
