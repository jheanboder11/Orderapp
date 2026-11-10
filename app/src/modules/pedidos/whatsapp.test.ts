import { describe, expect, it } from "vitest";
import { faltantes, leerMensaje, numeroDe } from "./whatsapp";

describe("leer el mensaje de WhatsApp", () => {
  it("lee un mensaje con etiquetas", () => {
    const d = leerMensaje(
      [
        "Nombre: Juliana Restrepo",
        "Celular: +57 311 222 3344",
        "Dirección: Cl 37 Sur #43-10",
        "Barrio: El Dorado",
        "Ciudad: Envigado",
        "Producto: Chaqueta reflectiva",
        "Talla: S",
        "Valor: 175.000",
        "Pago: contraentrega",
        "Nota: llamar al llegar",
      ].join("\n"),
    );
    expect(d).toEqual({
      cliente: "Juliana Restrepo",
      celular: "3112223344",
      direccion: "Cl 37 Sur #43-10, El Dorado, Envigado",
      zona: "Aledaño",
      items: "Chaqueta reflectiva, talla S",
      formaPago: "EFECTIVO",
      valorTotal: "175000",
      nota: "llamar al llegar",
    });
  });

  it("lee un mensaje sin etiquetas y quita el encabezado que pone WhatsApp", () => {
    const d = leerMensaje(
      [
        "[3:15 p. m., 9/11/2026] Cliente: Hola, quiero la chaqueta doble faz M",
        "[3:16 p. m., 9/11/2026] Cliente: Cra 70 #45-20 Laureles Medellín",
        "[3:16 p. m., 9/11/2026] Cliente: 3104567890",
        "[3:17 p. m., 9/11/2026] Cliente: Pago por Nequi, son $192.000",
      ].join("\n"),
    );
    expect(d.celular).toBe("3104567890");
    expect(d.direccion).toBe("Cra 70 #45-20 Laureles Medellín");
    expect(d.zona).toBe("Medellín");
    expect(d.items).toBe("Hola, quiero la chaqueta doble faz M");
    expect(d.formaPago).toBe("TRANSFERENCIA");
    expect(d.valorTotal).toBe("192000");
    expect(faltantes(d)).toEqual(["el nombre"]);
  });

  it("dice qué no encontró", () => {
    expect(faltantes(leerMensaje("hola"))).toEqual([
      "el nombre",
      "el celular",
      "la dirección",
      "qué lleva",
      "cómo paga",
      "cuánto cobra",
    ]);
  });

  it("entiende los valores escritos de varias formas", () => {
    expect(numeroDe("172.000")).toBe(172000);
    expect(numeroDe("172 mil")).toBe(172000);
    expect(numeroDe("1,5 mil")).toBe(1500);
    expect(numeroDe("$ 145,000")).toBe(145000);
  });
});
