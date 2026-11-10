import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Permisos en el servidor: las acciones de pedidos solo las puede hacer el Colaborador.
 * Se simula la sesión; la base de datos queda "prohibida": si una acción la toca sin permiso, la prueba falla.
 */

const getSession = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("@/db", () => ({
  db: new Proxy(
    {},
    {
      get() {
        throw new Error("Tocó la base de datos sin permiso");
      },
    },
  ),
}));

const { cancelarPedido, crearPedido, editarPedido, marcarDevuelto, reasignarPedido } = await import(
  "./actions"
);

function sesionDe(rol: string | null) {
  getSession.mockResolvedValue(
    rol ? { user: { id: "u1", name: "Prueba", username: "prueba", rol, activo: true } } : null,
  );
}

function formulario(datos: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(datos)) f.set(k, v);
  return f;
}

const acciones = {
  crear: () =>
    crearPedido(
      null,
      formulario({
        cliente: "A",
        celular: "3001234567",
        direccion: "B",
        zonaId: "1",
        items: "C",
        formaPago: "EFECTIVO",
        valorTotal: "100000",
        para: "HOY",
        mensajeroId: "m1",
      }),
    ),
  editar: () => editarPedido(1, null, formulario({ cliente: "A" })),
  cancelar: () => cancelarPedido(null, formulario({ id: "1", motivo: "El cliente canceló" })),
  devolver: () => marcarDevuelto(null, formulario({ id: "1" })),
  reasignar: () => reasignarPedido(null, formulario({ id: "1", mensajeroId: "m2" })),
};

describe.each(["ADMINISTRADOR", "MENSAJERO", null])("sin permiso: %s", (rol) => {
  beforeEach(() => sesionDe(rol));

  it.each(Object.keys(acciones))("%s devuelve error y no toca la base de datos", async (nombre) => {
    const r = await acciones[nombre as keyof typeof acciones]();
    expect(r).toEqual(expect.objectContaining({ ok: false, error: "No tienes permiso para hacer esto." }));
  });
});

describe("una cuenta desactivada tampoco puede", () => {
  it("aunque sea Colaborador", async () => {
    getSession.mockResolvedValue({
      user: { id: "u1", name: "X", username: "x", rol: "COLABORADOR", activo: false },
    });
    const r = await acciones.cancelar();
    expect(r).toEqual({ ok: false, error: "No tienes permiso para hacer esto." });
  });
});
