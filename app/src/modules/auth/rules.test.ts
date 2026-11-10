import { describe, expect, it } from "vitest";
import {
  errorContrasena,
  esquemaNuevoUsuario,
  minutosRestantes,
  normalizarUsuario,
  usuarioValido,
} from "./rules";

describe("usuario", () => {
  it("no importan mayúsculas, tildes ni espacios a los lados", () => {
    expect(normalizarUsuario("Teo")).toBe("teo");
    expect(normalizarUsuario("  TEÓ ")).toBe("teo");
    expect(normalizarUsuario("Ángela")).toBe("angela");
    expect(normalizarUsuario("Muñoz")).toBe("munoz");
  });
  it("solo una palabra con letras, números, punto o guion bajo", () => {
    expect(usuarioValido("teo")).toBe(true);
    expect(usuarioValido("ana.m")).toBe(true);
    expect(usuarioValido("ana maria")).toBe(false);
    expect(usuarioValido("a")).toBe(false);
    expect(usuarioValido("teo@")).toBe(false);
  });
});

describe("contraseña según el rol", () => {
  it("Mensajero: solo números, mínimo 6", () => {
    expect(errorContrasena("MENSAJERO", "123456")).toBeNull();
    expect(errorContrasena("MENSAJERO", "12345")).toMatch(/mínimo 6/);
    expect(errorContrasena("MENSAJERO", "12345a")).toMatch(/solo números/);
  });
  it("Colaborador y Administrador: mínimo 8", () => {
    expect(errorContrasena("COLABORADOR", "clave123")).toBeNull();
    expect(errorContrasena("ADMINISTRADOR", "1234567")).toMatch(/mínimo 8/);
    expect(errorContrasena("COLABORADOR", "123456")).toMatch(/mínimo 8/);
  });
});

describe("crear usuario", () => {
  it("acepta datos completos y limpia espacios", () => {
    const r = esquemaNuevoUsuario.safeParse({
      nombre: " Sara ",
      usuario: "Sara",
      rol: "MENSAJERO",
      contrasena: "654321",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nombre).toBe("Sara");
  });
  it("dice qué falta en palabras simples", () => {
    const r = esquemaNuevoUsuario.safeParse({
      nombre: "",
      usuario: "ana maria",
      rol: "COLABORADOR",
      contrasena: "123",
    });
    expect(r.success).toBe(false);
    const mensajes = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(mensajes).toContain("Te falta el nombre de la persona.");
    expect(mensajes).toContain("El usuario va en una sola palabra, sin espacios. Ej: Teo");
    expect(mensajes).toContain("La contraseña necesita mínimo 8 letras o números.");
  });
  it("rechaza un rol que no existe", () => {
    const r = esquemaNuevoUsuario.safeParse({
      nombre: "Xavi",
      usuario: "xavi",
      rol: "JEFE",
      contrasena: "12345678",
    });
    expect(r.success).toBe(false);
  });
});

describe("bloqueo", () => {
  it("redondea hacia arriba los minutos que faltan", () => {
    const ahora = new Date("2026-11-09T10:00:00Z");
    expect(minutosRestantes(new Date("2026-11-09T10:09:30Z"), ahora)).toBe(10);
    expect(minutosRestantes(new Date("2026-11-09T10:00:10Z"), ahora)).toBe(1);
  });
});
