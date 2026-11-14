import { describe, expect, it } from "vitest";
import { errorFoto, medidasAchicadas } from "@/modules/fotos/rules";
import { errorTransicion } from "@/modules/pedidos/rules";
import {
  type PedidoMensajero,
  barrio,
  cobroCorto,
  linkMapa,
  linkWhatsApp,
  motivoProblema,
  repartir,
  textoCobro,
} from "./rules";

const HOY = "2026-11-14";
const AYER = "2026-11-13";
const MANANA = "2026-11-15";
const aLas = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00-05:00`);

const pedido = (n: number, o: Partial<PedidoMensajero> = {}): PedidoMensajero => ({
  numeroDia: n,
  fechaCreacion: HOY,
  fechaEntrega: HOY,
  estado: "EMPACADO",
  horaSalida: null,
  horaEntrega: null,
  horaCancelado: null,
  cierreId: null,
  ...o,
});

describe("repartir la pantalla del Mensajero", () => {
  it("pone cada pedido en su parte del día", () => {
    const r = repartir(
      [
        pedido(1, { estado: "EN_ENTREGA", horaSalida: aLas(HOY, "10:00") }),
        pedido(2),
        pedido(3, { fechaEntrega: MANANA }),
        pedido(4, { estado: "PROBLEMA", horaSalida: aLas(HOY, "10:00") }),
        pedido(5, { estado: "ENTREGADO", horaSalida: aLas(HOY, "09:00"), horaEntrega: aLas(HOY, "09:40") }),
      ],
      HOY,
    );
    expect(r.enCamino.map((p) => p.numeroDia)).toEqual([1]);
    expect(r.porRecoger.map((p) => p.numeroDia)).toEqual([2]);
    expect(r.manana.map((p) => p.numeroDia)).toEqual([3]);
    expect(r.regresar.map((p) => p.numeroDia)).toEqual([4]);
    expect(r.entregados.map((p) => p.numeroDia)).toEqual([5]);
  });

  it("un pedido de ayer que no salió se recoge hoy (no se pierde)", () => {
    const r = repartir([pedido(7, { fechaCreacion: AYER, fechaEntrega: AYER })], HOY);
    expect(r.porRecoger).toHaveLength(1);
  });

  it("un cancelado solo se regresa si ya estaba en la calle y se canceló hoy", () => {
    const r = repartir(
      [
        pedido(1, { estado: "CANCELADO", horaSalida: aLas(HOY, "10:00"), horaCancelado: aLas(HOY, "11:00") }),
        pedido(2, { estado: "CANCELADO", horaCancelado: aLas(HOY, "11:00") }), // nunca salió
        pedido(3, { estado: "CANCELADO", horaSalida: aLas(AYER, "10:00"), horaCancelado: aLas(AYER, "11:00") }),
      ],
      HOY,
    );
    expect(r.regresar.map((p) => p.numeroDia)).toEqual([1]);
  });

  it("entregados: los de hoy y los de antes que aún no entran en un cierre, el último arriba", () => {
    const r = repartir(
      [
        pedido(1, { estado: "ENTREGADO", horaEntrega: aLas(HOY, "09:00"), cierreId: 4 }),
        pedido(2, { estado: "ENTREGADO", horaEntrega: aLas(HOY, "15:00") }),
        pedido(3, { estado: "ENTREGADO", fechaEntrega: AYER, horaEntrega: aLas(AYER, "15:00") }),
        pedido(4, { estado: "ENTREGADO", fechaEntrega: AYER, horaEntrega: aLas(AYER, "16:00"), cierreId: 2 }),
      ],
      HOY,
    );
    expect(r.entregados.map((p) => p.numeroDia)).toEqual([2, 1, 3]);
  });

  it("devueltos no le aparecen al Mensajero", () => {
    const r = repartir([pedido(1, { estado: "DEVUELTO" })], HOY);
    expect(Object.values(r).flat()).toHaveLength(0);
  });
});

describe("estados que puede cambiar el Mensajero", () => {
  it("sale, entrega y reporta problema; nada más", () => {
    expect(errorTransicion("EMPACADO", "EN_ENTREGA", "MENSAJERO")).toBeNull();
    expect(errorTransicion("EN_ENTREGA", "ENTREGADO", "MENSAJERO")).toBeNull();
    expect(errorTransicion("EN_ENTREGA", "PROBLEMA", "MENSAJERO")).toBeNull();
    expect(errorTransicion("EMPACADO", "ENTREGADO", "MENSAJERO")).toMatch(/no puede pasar/);
    expect(errorTransicion("PROBLEMA", "DEVUELTO", "MENSAJERO")).toBe("No tienes permiso para hacer esto.");
    expect(errorTransicion("EN_ENTREGA", "CANCELADO", "MENSAJERO")).toBe("No tienes permiso para hacer esto.");
  });

  it("el Colaborador no puede entregar por el Mensajero", () => {
    expect(errorTransicion("EN_ENTREGA", "ENTREGADO", "COLABORADOR")).toBe("No tienes permiso para hacer esto.");
  });
});

describe("textos de cobro", () => {
  it("dice cuánto cobrar solo si es efectivo", () => {
    expect(textoCobro("EFECTIVO", 172000)).toBe("💵 Te toca cobrar en efectivo: $ 172.000");
    expect(textoCobro("TRANSFERENCIA", 149000)).toBe("📲 Ya pagó por transferencia. No cobres nada.");
    expect(textoCobro("YA_PAGADO", 160000)).toBe("🙌 Ya está pago. No cobres nada.");
    expect(cobroCorto("EFECTIVO", 192000)).toBe("💵 $ 192.000");
    expect(cobroCorto("TRANSFERENCIA", 1)).toBe("📲 Transferencia");
  });
});

describe("😕 No pude entregarlo", () => {
  it("pide elegir un motivo de la lista", () => {
    expect(motivoProblema("", "")).toEqual({ ok: false, error: "Elige qué pasó." });
    expect(motivoProblema("Se me antojó", "")).toEqual({ ok: false, error: "Elige qué pasó." });
  });
  it("con 'Otro' hay que contar qué pasó", () => {
    expect(motivoProblema("Otro", "  ")).toEqual({ ok: false, error: "Cuéntanos qué pasó, aunque sea corto." });
    expect(motivoProblema("Otro", "Se varó la moto")).toEqual({ ok: true, motivo: "Otro", detalle: "Se varó la moto" });
  });
  it("sin detalle, el detalle es el mismo motivo", () => {
    expect(motivoProblema("No contesta", "")).toEqual({ ok: true, motivo: "No contesta", detalle: "No contesta" });
  });
});

describe("botones de la tarjeta", () => {
  it("WhatsApp agrega el 57 a los celulares de Colombia", () => {
    expect(linkWhatsApp("310 456 7890")).toBe("https://wa.me/573104567890");
    expect(linkWhatsApp("6044445555")).toBe("https://wa.me/6044445555");
  });
  it("el mapa agrega la ciudad", () => {
    expect(linkMapa("Cra 70 #45-20, Laureles", "Medellín")).toContain(encodeURIComponent("Laureles, Medellín"));
    expect(linkMapa("Cl 37 Sur #43-10, Envigado", "Aledaño")).toContain(encodeURIComponent("Envigado, Antioquia"));
  });
  it("el barrio es lo que va después de la última coma", () => {
    expect(barrio("Cra 70 #45-20, Laureles", "Medellín")).toBe("Laureles");
    expect(barrio("Cra 70 #45-20", "Medellín")).toBe("Medellín");
  });
});

describe("fotos", () => {
  it("achica al lado más largo de 1100 px sin agrandar", () => {
    expect(medidasAchicadas(4000, 3000)).toEqual({ ancho: 1100, alto: 825 });
    expect(medidasAchicadas(3000, 4000)).toEqual({ ancho: 825, alto: 1100 });
    expect(medidasAchicadas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });
  it("rechaza lo que no es foto, vacío o muy pesado", () => {
    expect(errorFoto({ tipo: "image/jpeg", bytes: 200_000 })).toBeNull();
    expect(errorFoto({ tipo: "application/pdf", bytes: 200_000 })).toMatch(/no es una foto/);
    expect(errorFoto({ tipo: "image/jpeg", bytes: 0 })).toMatch(/vacía/);
    expect(errorFoto({ tipo: "image/jpeg", bytes: 9_000_000 })).toMatch(/pesa demasiado/);
  });
});
