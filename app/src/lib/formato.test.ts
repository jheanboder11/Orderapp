import { describe, expect, it } from "vitest";
import { aHora24, deHora24, fechaBogota, horaBogota, horaCorta, moverHora, pesos } from "./formato";

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

describe("hora con flechas (hora, minutos, a. m./p. m.)", () => {
  it("parte y arma la hora", () => {
    expect(deHora24("17:30")).toEqual({ hora: 5, minutos: 30, pm: true });
    expect(deHora24("00:05")).toEqual({ hora: 12, minutos: 5, pm: false });
    expect(deHora24("12:00")).toEqual({ hora: 12, minutos: 0, pm: true });
    expect(aHora24({ hora: 12, minutos: 0, pm: false })).toBe("00:00");
    expect(aHora24({ hora: 12, minutos: 45, pm: true })).toBe("12:45");
    expect(aHora24({ hora: 9, minutos: 5, pm: false })).toBe("09:05");
  });
  it("las flechas dan la vuelta", () => {
    const p = { hora: 12, minutos: 55, pm: false };
    expect(moverHora(p, "hora", 1).hora).toBe(1);
    expect(moverHora({ ...p, hora: 1 }, "hora", -1).hora).toBe(12);
    expect(moverHora(p, "minutos", 1).minutos).toBe(0);
    expect(moverHora({ ...p, minutos: 0 }, "minutos", -1).minutos).toBe(55);
    expect(moverHora({ ...p, minutos: 17 }, "minutos", 1).minutos).toBe(20);
    expect(moverHora(p, "pm", 1).pm).toBe(true);
    expect(horaCorta("17:00")).toBe("5:00 p. m.");
  });
});
