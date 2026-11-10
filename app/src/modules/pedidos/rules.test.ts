import { describe, expect, it } from "vitest";
import {
  ESTADOS,
  type Estado,
  type PedidoBase,
  clasificar,
  errorSalida,
  errorTransicion,
  errorValor,
  esquemaPedido,
  estaDemorado,
  etiquetaDia,
  fechaEntregaEditada,
  fechaEntregaNueva,
  leerPesos,
  motivoCancelacion,
  puedeEditar,
  puedeReasignar,
  textoParaWhatsApp,
} from "./rules";

describe("regla 1: estados permitidos", () => {
  const permitidos: [Estado, Estado, "MENSAJERO" | "COLABORADOR"][] = [
    ["EMPACADO", "EN_ENTREGA", "MENSAJERO"],
    ["EN_ENTREGA", "ENTREGADO", "MENSAJERO"],
    ["EN_ENTREGA", "PROBLEMA", "MENSAJERO"],
    ["PROBLEMA", "DEVUELTO", "COLABORADOR"],
    ["EMPACADO", "CANCELADO", "COLABORADOR"],
    ["EN_ENTREGA", "CANCELADO", "COLABORADOR"],
  ];

  it.each(permitidos)("%s → %s lo puede hacer el %s", (de, a, rol) => {
    expect(errorTransicion(de, a, rol)).toBeNull();
  });

  it("cualquier otro cambio se rechaza con un mensaje claro", () => {
    let probados = 0;
    for (const de of ESTADOS) {
      for (const a of ESTADOS) {
        if (permitidos.some(([d, x]) => d === de && x === a)) continue;
        for (const rol of ["ADMINISTRADOR", "COLABORADOR", "MENSAJERO"] as const) {
          expect(errorTransicion(de, a, rol)).toMatch(/no puede pasar a/);
          probados++;
        }
      }
    }
    expect(probados).toBe((36 - permitidos.length) * 3);
  });

  it("solo el Colaborador marca devuelto o cancela", () => {
    expect(errorTransicion("PROBLEMA", "DEVUELTO", "MENSAJERO")).toBe("No tienes permiso para hacer esto.");
    expect(errorTransicion("EMPACADO", "CANCELADO", "MENSAJERO")).toBe("No tienes permiso para hacer esto.");
    expect(errorTransicion("EN_ENTREGA", "CANCELADO", "ADMINISTRADOR")).toBe(
      "No tienes permiso para hacer esto.",
    );
  });

  it("el Colaborador no saca ni entrega pedidos (eso es del Mensajero)", () => {
    expect(errorTransicion("EMPACADO", "EN_ENTREGA", "COLABORADOR")).toBe("No tienes permiso para hacer esto.");
    expect(errorTransicion("EN_ENTREGA", "ENTREGADO", "COLABORADOR")).toBe("No tienes permiso para hacer esto.");
  });

  it("el Administrador no cambia ningún pedido", () => {
    for (const [de, a] of permitidos) {
      expect(errorTransicion(de, a, "ADMINISTRADOR")).not.toBeNull();
    }
  });

  it("editar solo empacado; reasignar mientras no esté terminado", () => {
    expect(ESTADOS.filter(puedeEditar)).toEqual(["EMPACADO"]);
    expect(ESTADOS.filter(puedeReasignar)).toEqual(["EMPACADO", "EN_ENTREGA"]);
  });
});

describe("regla 2: un pedido para mañana no sale hoy", () => {
  it("bloquea la salida antes de su fecha", () => {
    expect(errorSalida("2026-11-10", "2026-11-09")).toBe("Este pedido es para el martes 10 de nov., todavía no sale");
    expect(errorSalida("2026-11-10", "2026-11-09")).toMatch(/todavía no sale$/);
  });
  it("deja salir los de hoy y los atrasados", () => {
    expect(errorSalida("2026-11-09", "2026-11-09")).toBeNull();
    expect(errorSalida("2026-11-08", "2026-11-09")).toBeNull();
  });
});

describe("formulario del pedido", () => {
  const base = {
    cliente: "Juliana",
    celular: "+57 311 222 3344",
    direccion: "Cl 37 Sur #43-10",
    zonaId: "2",
    items: "Chaqueta S",
    nota: "",
    formaPago: "EFECTIVO",
    valorTotal: "$ 175.000",
    para: "HOY",
    entregarAntes: "",
    mensajeroId: "abc",
  };

  it("limpia celular y valor", () => {
    const r = esquemaPedido.parse(base);
    expect(r.celular).toBe("3112223344");
    expect(r.valorTotal).toBe(175000);
    expect(r.zonaId).toBe(2);
  });

  it("los errores dicen qué falta", () => {
    const r = esquemaPedido.safeParse({ ...base, cliente: " ", valorTotal: "" });
    const m = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(m).toContain("Te falta el nombre del cliente.");
    expect(m).toContain("Te falta decir cuánto cobra en total (con domi).");
  });

  it("el total se pide aunque ya esté pagado (las ventas quedan completas)", () => {
    const r = esquemaPedido.safeParse({ ...base, formaPago: "YA_PAGADO", valorTotal: "" });
    expect(r.success).toBe(false);
  });

  it("revisa la hora límite", () => {
    expect(esquemaPedido.safeParse({ ...base, entregarAntes: "17:00" }).success).toBe(true);
    expect(esquemaPedido.safeParse({ ...base, entregarAntes: "25:00" }).success).toBe(false);
  });

  it("el total debe ser mayor que el domi", () => {
    expect(errorValor(12000, 12000)).toMatch(/mayor que el domi \(\$ 12\.000\)/);
    expect(errorValor(172000, 12000)).toBeNull();
  });

  it("lee pesos escritos de varias formas", () => {
    expect(leerPesos("172.000")).toBe(172000);
    expect(leerPesos("172 mil")).toBe(172000);
    expect(leerPesos("")).toBe(0);
  });
});

describe("fechas de entrega", () => {
  it("hoy o mañana al crear", () => {
    expect(fechaEntregaNueva("HOY", "2026-11-09")).toBe("2026-11-09");
    expect(fechaEntregaNueva("MANANA", "2026-11-30")).toBe("2026-12-01");
  });
  it("al editar, si no cambia Hoy/Mañana, conserva la fecha original", () => {
    // Pedido creado ayer para hoy: sigue siendo "Hoy" → no se mueve
    expect(fechaEntregaEditada("HOY", "2026-11-09", "2026-11-09")).toBe("2026-11-09");
    // Era para mañana y sigue siendo para mañana
    expect(fechaEntregaEditada("MANANA", "2026-11-10", "2026-11-09")).toBe("2026-11-10");
    // Cambia de mañana a hoy
    expect(fechaEntregaEditada("HOY", "2026-11-10", "2026-11-09")).toBe("2026-11-09");
  });
});

describe("cancelar", () => {
  it("el motivo es obligatorio y 'Otro' pide texto", () => {
    expect(motivoCancelacion("", "")).toEqual({ ok: false, error: "Elige por qué se cancela." });
    expect(motivoCancelacion("Otro", " ")).toEqual({
      ok: false,
      error: "Cuéntanos por qué se cancela, aunque sea corto.",
    });
    expect(motivoCancelacion("Otro", "Se mudó")).toEqual({ ok: true, texto: "Otro: Se mudó" });
    expect(motivoCancelacion("El cliente canceló", "")).toEqual({ ok: true, texto: "El cliente canceló" });
  });
});

describe("listas de hoy, mañana y ayer", () => {
  const hoy = "2026-11-09";
  const p = (o: Partial<PedidoBase> & { id: number }): PedidoBase & { id: number } => ({
    numeroDia: o.id,
    fechaCreacion: hoy,
    fechaEntrega: hoy,
    estado: "EMPACADO",
    horaSalida: null,
    horaEntrega: null,
    ...o,
  });

  it("reparte cada pedido en su lista", () => {
    const lista = [
      p({ id: 1 }), // hoy
      p({ id: 2, fechaEntrega: "2026-11-10" }), // mañana
      p({ id: 3, fechaCreacion: "2026-11-08", fechaEntrega: "2026-11-08", estado: "ENTREGADO", horaEntrega: new Date("2026-11-08T20:00:00Z") }), // ayer
      p({ id: 4, fechaCreacion: "2026-11-07", fechaEntrega: "2026-11-07", estado: "EN_ENTREGA" }), // atrasado → hoy
      p({ id: 5, fechaCreacion: "2026-11-08", fechaEntrega: "2026-11-08", estado: "PROBLEMA" }), // problema → hoy
      p({ id: 6, fechaCreacion: "2026-11-08", fechaEntrega: "2026-11-08", estado: "ENTREGADO", horaEntrega: new Date("2026-11-09T15:00:00Z") }), // entregado hoy → hoy
      p({ id: 7, fechaCreacion: "2026-11-01", fechaEntrega: "2026-11-01", estado: "ENTREGADO", horaEntrega: new Date("2026-11-01T15:00:00Z") }), // viejo: no sale
    ];
    const r = clasificar(lista, hoy);
    expect(r.hoy.map((x) => x.id).sort()).toEqual([1, 4, 5, 6]);
    expect(r.manana.map((x) => x.id)).toEqual([2]);
    expect(r.ayer.map((x) => x.id)).toEqual([3]);
  });

  it("los más nuevos van primero", () => {
    const r = clasificar([p({ id: 1 }), p({ id: 3 }), p({ id: 2 })], hoy);
    expect(r.hoy.map((x) => x.id)).toEqual([3, 2, 1]);
  });

  it("etiqueta los agendados, atrasados y los de mañana", () => {
    expect(etiquetaDia(p({ id: 1, fechaCreacion: "2026-11-08" }), hoy)?.texto).toBe(
      "🗓️ Agendado: toca entregarlo hoy",
    );
    expect(etiquetaDia(p({ id: 1, fechaCreacion: "2026-11-07", fechaEntrega: "2026-11-07" }), hoy)?.tipo).toBe("mal");
    expect(etiquetaDia(p({ id: 1, fechaEntrega: "2026-11-10" }), hoy)?.texto).toMatch(/^\(para el martes/);
    expect(etiquetaDia(p({ id: 1 }), hoy)).toBeNull();
  });
});

describe("regla 8: pedido demorado", () => {
  const ahora = new Date("2026-11-09T20:00:00Z");
  const salida = (min: number) => new Date(ahora.getTime() - min * 60_000);
  it("en entrega por más del límite de su zona", () => {
    expect(estaDemorado({ estado: "EN_ENTREGA", horaSalida: salida(121) }, 120, ahora)).toBe(true);
    expect(estaDemorado({ estado: "EN_ENTREGA", horaSalida: salida(120) }, 120, ahora)).toBe(false);
    expect(estaDemorado({ estado: "EN_ENTREGA", horaSalida: salida(150) }, 180, ahora)).toBe(false);
  });
  it("si ya se entregó, no está demorado", () => {
    expect(estaDemorado({ estado: "ENTREGADO", horaSalida: salida(500) }, 120, ahora)).toBe(false);
  });
});

describe("copiar para WhatsApp", () => {
  it("arma el resumen con lo que hay que cobrar", () => {
    expect(
      textoParaWhatsApp({
        numeroDia: 4,
        cliente: "Juliana",
        celular: "3112223344",
        direccion: "Cl 37 Sur #43-10",
        zona: "Aledaño",
        items: "Chaqueta S",
        formaPago: "EFECTIVO",
        valorTotal: 175000,
        nota: "Portería",
      }),
    ).toBe(
      "Pedido #4\nJuliana 3112223344\nCl 37 Sur #43-10 (Aledaño)\nLleva: Chaqueta S\nCobrar efectivo $ 175.000\nNota: Portería",
    );
  });
  it("si ya pagó, dice que no cobre", () => {
    const t = textoParaWhatsApp({
      numeroDia: 1,
      cliente: "A",
      celular: "1",
      direccion: "B",
      zona: "Medellín",
      items: "C",
      formaPago: "YA_PAGADO",
      valorTotal: 100000,
      nota: null,
    });
    expect(t).toContain("Ya pagado, no cobrar");
    expect(t).not.toContain("Nota");
  });
});
