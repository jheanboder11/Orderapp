import { describe, expect, it } from "vitest";
import { bloqueaCierre, calcularCierre, errorCierre, textoNeto } from "./rules";

const ef = (valorTotal: number, valorDomi = 12000) => ({
  formaPago: "EFECTIVO" as const,
  valorTotal,
  valorDomi,
});
const tr = (valorTotal: number, valorDomi = 12000) => ({
  formaPago: "TRANSFERENCIA" as const,
  valorTotal,
  valorDomi,
});
const pagado = (valorTotal: number, valorDomi = 15000) => ({
  formaPago: "YA_PAGADO" as const,
  valorTotal,
  valorDomi,
});

describe("reglas 3, 4 y 5: cuentas del cierre", () => {
  it("neto positivo: cobró más efectivo que lo que ganó → consigna", () => {
    const c = calcularCierre([ef(172000), ef(150000, 15000), tr(149000)]);
    expect(c).toEqual({
      nEntregas: 3,
      efectivo: 322000,
      pago: 39000,
      neto: 283000,
    });
  });

  it("neto negativo: todo por transferencia o ya pagado → la empresa le consigna", () => {
    const c = calcularCierre([tr(149000), pagado(160000)]);
    expect(c).toEqual({ nEntregas: 2, efectivo: 0, pago: 27000, neto: -27000 });
  });

  it("neto cero: el efectivo es justo lo que ganó", () => {
    const c = calcularCierre([ef(24000, 12000), tr(100000, 12000)]);
    expect(c.neto).toBe(0);
  });

  it("sin entregas todo da cero", () => {
    expect(calcularCierre([])).toEqual({
      nEntregas: 0,
      efectivo: 0,
      pago: 0,
      neto: 0,
    });
  });
});

describe("regla 6: qué bloquea el cierre", () => {
  const hoy = "2026-11-18";
  it("bloquean los empacados y en entrega de hoy o de antes", () => {
    expect(bloqueaCierre({ estado: "EMPACADO", fechaEntrega: hoy }, hoy)).toBe(
      true,
    );
    expect(
      bloqueaCierre({ estado: "EN_ENTREGA", fechaEntrega: "2026-11-17" }, hoy),
    ).toBe(true);
  });
  it("los de mañana no bloquean", () => {
    expect(
      bloqueaCierre({ estado: "EMPACADO", fechaEntrega: "2026-11-19" }, hoy),
    ).toBe(false);
  });
  it("problemas, devueltos, cancelados y entregados no bloquean", () => {
    for (const estado of [
      "PROBLEMA",
      "DEVUELTO",
      "CANCELADO",
      "ENTREGADO",
    ] as const) {
      expect(bloqueaCierre({ estado, fechaEntrega: hoy }, hoy)).toBe(false);
    }
  });
});

describe("cuándo se puede cerrar", () => {
  it("con pendientes no se puede", () => {
    expect(
      errorCierre({ nEntregas: 3, pendientes: 1, neto: 0, conFoto: false }),
    ).toBe("Antes del cierre, termina tu pedido pendiente.");
    expect(
      errorCierre({ nEntregas: 3, pendientes: 2, neto: 0, conFoto: false }),
    ).toBe("Antes del cierre, termina tus 2 pedidos pendientes.");
  });
  it("sin entregas no hay nada que cerrar", () => {
    expect(
      errorCierre({ nEntregas: 0, pendientes: 0, neto: 0, conFoto: false }),
    ).toBe("No tienes entregas para cerrar.");
  });
  it("si debe consignar, la foto es obligatoria", () => {
    expect(
      errorCierre({ nEntregas: 2, pendientes: 0, neto: 1000, conFoto: false }),
    ).toBe("Toma la foto de la consignación para poder cerrar.");
    expect(
      errorCierre({ nEntregas: 2, pendientes: 0, neto: 1000, conFoto: true }),
    ).toBeNull();
  });
  it("si el neto es cero o negativo no pide foto", () => {
    expect(
      errorCierre({ nEntregas: 2, pendientes: 0, neto: 0, conFoto: false }),
    ).toBeNull();
    expect(
      errorCierre({
        nEntregas: 2,
        pendientes: 0,
        neto: -27000,
        conFoto: false,
      }),
    ).toBeNull();
  });
  it("la frase grande", () => {
    expect(textoNeto(5000)).toBe("Te toca consignar");
    expect(textoNeto(5000, true)).toBe("Consignaste");
    expect(textoNeto(-5000)).toBe("La empresa te consigna");
    expect(textoNeto(0)).toBe("Quedas a paz y salvo");
  });
});
