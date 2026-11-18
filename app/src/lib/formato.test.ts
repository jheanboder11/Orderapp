import { describe, expect, it } from "vitest";
import { HORAS_LIMITE, fechaBogota, horaBogota, horaCorta, pesos } from "./formato";

describe("pesos", () => {
  it("pone el signo $ y puntos de miles", () => {
    expect(pesos(192000)).toBe("$ 192.000");
    expect(pesos(12000)).toBe("$ 12.000");
    expect(pesos(1500000)).toBe("$ 1.500.000");
    expect(pesos(0)).toBe("$ 0");
  });
  it("muestra los negativos (la empresa le consigna al mensajero)", () => {
    expect(pesos(-24000)).toBe("-$ 24.000");
  });
  it("rechaza decimales", () => {
    expect(() => pesos(10.5)).toThrow();
  });
});

describe("fechas en Bogotá", () => {
  it("a las 11 p. m. de Bogotá sigue siendo el mismo día (en UTC ya es mañana)", () => {
    // 2026-10-26 04:00 UTC = 2026-10-25 23:00 en Bogotá
    expect(fechaBogota(new Date("2026-10-26T04:00:00Z"))).toBe("2026-10-25");
  });
  it("después de medianoche en Bogotá cambia el día", () => {
    expect(fechaBogota(new Date("2026-10-26T05:30:00Z"))).toBe("2026-10-26");
  });
  it("muestra la hora de Bogotá", () => {
    expect(horaBogota(new Date("2026-10-25T20:05:00Z"))).toMatch(/^3:05/);
  });
});

describe("horas para entregar antes de", () => {
  it("van cada media hora de 7:00 a. m. a 9:00 p. m.", () => {
    expect(HORAS_LIMITE[0]).toBe("07:00");
    expect(HORAS_LIMITE[1]).toBe("07:30");
    expect(HORAS_LIMITE.at(-1)).toBe("21:00");
    expect(HORAS_LIMITE).toHaveLength(29);
    expect(horaCorta("12:30")).toBe("12:30 p. m.");
    expect(horaCorta("17:00")).toBe("5:00 p. m.");
  });
});
