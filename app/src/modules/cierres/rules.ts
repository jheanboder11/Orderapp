/** Reglas del cierre del Mensajero (reglas 3 a 6 del plan). Lógica pura, con pruebas. */
import type { Estado, FormaPago } from "@/modules/pedidos/rules";

export type EntregaParaCierre = {
  formaPago: FormaPago;
  valorTotal: number;
  valorDomi: number;
};

export type Cuentas = {
  nEntregas: number;
  /** Regla 4: valor total de los entregados que se pagaron en efectivo. */
  efectivo: number;
  /** Regla 3: suma de los domis entregados. */
  pago: number;
  /** Regla 5: efectivo − pago. */
  neto: number;
};

/** Reglas 3, 4 y 5: cuánto efectivo recibió, cuánto ganó y cuánto consigna (o le consignan). */
export function calcularCierre(entregas: EntregaParaCierre[]): Cuentas {
  const efectivo = entregas
    .filter((p) => p.formaPago === "EFECTIVO")
    .reduce((s, p) => s + p.valorTotal, 0);
  const pago = entregas.reduce((s, p) => s + p.valorDomi, 0);
  return { nEntregas: entregas.length, efectivo, pago, neto: efectivo - pago };
}

/** Regla 6: bloquean el cierre los pedidos Empacado o En entrega de hoy o de antes. Los de mañana no. */
export function bloqueaCierre(
  p: { estado: Estado; fechaEntrega: string },
  hoy: string,
): boolean {
  return (
    (p.estado === "EMPACADO" || p.estado === "EN_ENTREGA") &&
    p.fechaEntrega <= hoy
  );
}

/** null si se puede cerrar; si no, el mensaje para el Mensajero. */
export function errorCierre(c: {
  nEntregas: number;
  pendientes: number;
  neto: number;
  conFoto: boolean;
}): string | null {
  if (c.pendientes > 0) {
    return `Antes del cierre, termina ${c.pendientes === 1 ? "tu pedido pendiente" : `tus ${c.pendientes} pedidos pendientes`}.`;
  }
  if (c.nEntregas === 0) return "No tienes entregas para cerrar.";
  if (c.neto > 0 && !c.conFoto)
    return "Toma la foto de la consignación para poder cerrar.";
  return null;
}

/** La frase grande del cierre. */
export function textoNeto(neto: number, hecho = false): string {
  if (neto > 0) return hecho ? "Consignaste" : "Te toca consignar";
  if (neto < 0) return "La empresa te consigna";
  return "Quedas a paz y salvo";
}
