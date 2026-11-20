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
    expect(d.items).toBe("quiero la chaqueta doble faz M");
    expect(d.formaPago).toBe("TRANSFERENCIA");
    expect(d.valorTotal).toBe("192000");
    expect(faltantes(d)).toEqual(["el nombre"]);
  });

  it("lee los datos sueltos en un solo renglón, sin etiquetas", () => {
    const d = leerMensaje("Jean maunfre , 3103205117 , calle 88c #10a 12, alfonso lopez.");
    expect(d.cliente).toBe("Jean Maunfre");
    expect(d.celular).toBe("3103205117");
    expect(d.direccion).toBe("calle 88c #10a 12, alfonso lopez");
  });

  it("lee los datos sueltos uno por renglón", () => {
    const d = leerMensaje(
      [
        "Buenas tardes",
        "María José Gómez",
        "310 320 5117",
        "Cra 45 #50-20",
        "Prado centro",
        "chaqueta reflectiva talla L",
        "150.000",
        "efectivo",
      ].join("\n"),
    );
    expect(d).toEqual({
      cliente: "María José Gómez",
      celular: "3103205117",
      direccion: "Cra 45 #50-20, Prado centro",
      items: "chaqueta reflectiva talla L",
      formaPago: "EFECTIVO",
      valorTotal: "150000",
    });
  });

  it("separa el nombre pegado al celular", () => {
    const d = leerMensaje("Jean 3103205117\ncalle 10 #20-30, Bello");
    expect(d.cliente).toBe("Jean");
    expect(d.direccion).toBe("calle 10 #20-30, Bello");
    expect(d.zona).toBe("Aledaño");
  });

  it("encuentra el nombre al final si va después del barrio", () => {
    const d = leerMensaje("calle 10 #20-30, laureles, juan perez, 3103205117");
    expect(d.cliente).toBe("Juan Perez");
    expect(d.direccion).toBe("calle 10 #20-30, laureles");
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
