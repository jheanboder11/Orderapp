"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { enviarSinBorrar } from "@/components/enviar";
import { Aviso, Boton, Campo, Selector, Tarjeta } from "@/components/ui";
import { pesos } from "@/lib/formato";
import type { EstadoAccion } from "../actions";
import { FORMAS_PAGO, NOMBRE_PAGO } from "../rules";
import { faltantes, leerMensaje } from "../whatsapp";
import { HoraLimite } from "./HoraLimite";

type Zona = { id: number; nombre: string; tarifaDomi: number };
type Mensajero = { id: string; nombre: string };

export type CamposPedido = {
  cliente: string;
  celular: string;
  direccion: string;
  zonaId: string;
  items: string;
  nota: string;
  formaPago: string;
  valorTotal: string;
  para: string;
  entregarAntes: string;
  mensajeroId: string;
};

type Props = {
  zonas: Zona[];
  mensajeros: Mensajero[];
  accion: (prev: EstadoAccion, form: FormData) => Promise<EstadoAccion>;
  /** Para crear: el número que tendrá el pedido. */
  numero?: number;
  /** Para editar: el número y los datos actuales. */
  editando?: { numero: number; campos: CamposPedido };
};

const claseArea =
  "mt-1.5 w-full rounded-campo border border-dashed border-[#ffa5bd] bg-campo p-4 text-base font-medium text-tinta placeholder:text-suave/70 focus:border-solid focus:border-guayaba focus:shadow-[0_0_0_2px_var(--color-guayaba),0_0_0_7px_rgba(232,49,107,0.14)] focus:outline-none";

export function FormPedido({
  zonas,
  mensajeros,
  accion,
  numero,
  editando,
}: Props) {
  const router = useRouter();
  const vacio = (): CamposPedido => ({
    cliente: "",
    celular: "",
    direccion: "",
    zonaId: String(zonas[0]?.id ?? ""),
    items: "",
    nota: "",
    formaPago: "EFECTIVO",
    valorTotal: "",
    para: "HOY",
    entregarAntes: "",
    mensajeroId: mensajeros[0]?.id ?? "",
  });

  const [c, setC] = useState<CamposPedido>(editando?.campos ?? vacio);
  const [pegado, setPegado] = useState("");
  const [nota, setNota] = useState<string | null>(null);
  const [estado, enviar, guardando] = useActionState(accion, null);

  // Al guardar bien: si es nuevo, deja el formulario limpio para el siguiente; si es edición, vuelve a la lista.
  useEffect(() => {
    if (!estado?.ok) return;
    if (editando) {
      router.push("/colaborador/pedidos");
      return;
    }
    setC((antes) => ({ ...vacio(), mensajeroId: antes.mensajeroId }));
    setPegado("");
    setNota(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const cambiar =
    (k: keyof CamposPedido) => (e: { target: { value: string } }) =>
      setC((antes) => ({ ...antes, [k]: e.target.value }));

  function llenar() {
    const d = leerMensaje(pegado);
    const zona = d.zona ? zonas.find((z) => z.nombre === d.zona) : undefined;
    setC((antes) => ({
      ...antes,
      ...(d.cliente && { cliente: d.cliente }),
      ...(d.celular && { celular: d.celular }),
      ...(d.direccion && { direccion: d.direccion }),
      ...(d.items && { items: d.items }),
      ...(d.formaPago && { formaPago: d.formaPago }),
      ...(d.valorTotal && {
        valorTotal: pesos(Number(d.valorTotal)).replace("$ ", ""),
      }),
      ...(d.nota && { nota: d.nota }),
      ...(zona && { zonaId: String(zona.id) }),
    }));
    const f = faltantes(d);
    setNota(
      f.length
        ? `Revisa que todo esté bien. No encontré: ${f.join(", ")}.`
        : "Revisa que todo esté bien antes de guardar.",
    );
  }

  const zona = zonas.find((z) => String(z.id) === c.zonaId);
  const siguiente = estado?.ok && estado.numero ? estado.numero + 1 : numero;

  if (mensajeros.length === 0) {
    return (
      <Tarjeta>
        <p className="font-bold">Todavía no hay mensajeros activos.</p>
        <p className="text-sm text-suave">
          Pídele al Administrador que cree uno en 👥 Equipo.
        </p>
      </Tarjeta>
    );
  }

  return (
    <>
      {estado?.ok && !editando ? (
        <Tarjeta className="border-menta bg-menta-fondo" role="status">
          <p className="font-bold text-exito">{estado.mensaje}</p>
          <p className="text-sm text-suave">
            Pedido #{estado.numero}.{" "}
            <Link
              href="/colaborador/pedidos"
              className="font-semibold text-tinta underline"
            >
              Ver los pedidos
            </Link>
          </p>
        </Tarjeta>
      ) : null}

      <form noValidate onSubmit={enviarSinBorrar(enviar)}>
        {editando ? null : (
          <>
            {/* Tarjeta protagonista: pegar el chat de WhatsApp */}
            <Tarjeta className="rounded-[28px] shadow-[0_24px_44px_-24px_rgba(232,49,107,0.45)]">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 flex-none place-items-center rounded-[16px] bg-rosa text-guayaba"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                    <path d="M19 16v4M17 18h4" />
                  </svg>
                </span>
                <div>
                  <p className="text-[17px] leading-tight font-extrabold">
                    Pega el chat de WhatsApp
                  </p>
                  <p className="text-[13px] font-medium text-suave">
                    Yo lleno los campos por ti
                  </p>
                </div>
              </div>
              <textarea
                aria-label="Mensaje del cliente"
                rows={4}
                placeholder="Pega aquí lo que escribió el cliente"
                value={pegado}
                onChange={(e) => setPegado(e.target.value)}
                className={`${claseArea} mt-4`}
                maxLength={3000}
              />
              <Boton
                type="button"
                className="mt-3 w-full"
                onClick={llenar}
                disabled={!pegado.trim()}
              >
                ✨ Llenar con este mensaje
              </Boton>
              {nota ? (
                <p
                  role="status"
                  className="mt-3 rounded-[16px] bg-rosa px-3.5 py-2.5 text-sm font-semibold text-frambuesa"
                >
                  {nota}
                </p>
              ) : null}
            </Tarjeta>
            <p className="my-4 flex items-center gap-3 text-sm font-medium text-suave before:h-px before:flex-1 before:bg-linea after:h-px after:flex-1 after:bg-linea">
              o llénalo a mano
            </p>
          </>
        )}

        <Tarjeta>
          <h2 className="mb-1 flex items-center gap-2.5 text-[20px] font-extrabold tracking-[-0.02em]">
            {editando ? (
              `✏️ Editando el pedido #${editando.numero}`
            ) : (
              <>
                Domicilio{" "}
                <span className="rounded-[12px] bg-tinta px-2.5 py-0.5 text-[17px] text-white">
                  #{siguiente}
                </span>
              </>
            )}
          </h2>

          {editando ? (
            <p className="my-2 rounded-[16px] bg-rosa px-3.5 py-2.5 text-sm font-medium text-frambuesa">
              Cambia lo que haga falta y guarda. Solo se puede editar mientras
              el pedido está empacado.
            </p>
          ) : null}

          <Campo
            etiqueta="¿Cómo se llama el cliente?"
            name="cliente"
            autoComplete="off"
            value={c.cliente}
            onChange={cambiar("cliente")}
            maxLength={80}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Campo
              etiqueta="Celular"
              name="celular"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              value={c.celular}
              onChange={cambiar("celular")}
              maxLength={20}
            />
            <Selector
              etiqueta="¿A dónde va?"
              name="zonaId"
              value={c.zonaId}
              onChange={cambiar("zonaId")}
            >
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </Selector>
          </div>
          <Campo
            etiqueta="Dirección"
            name="direccion"
            autoComplete="off"
            value={c.direccion}
            onChange={cambiar("direccion")}
            maxLength={200}
          />
          <Campo
            etiqueta="¿Qué lleva?"
            name="items"
            autoComplete="off"
            value={c.items}
            onChange={cambiar("items")}
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Selector
              etiqueta="¿Cómo paga?"
              name="formaPago"
              value={c.formaPago}
              onChange={cambiar("formaPago")}
            >
              {FORMAS_PAGO.map((f) => (
                <option key={f} value={f}>
                  {NOMBRE_PAGO[f]}
                </option>
              ))}
            </Selector>
            <Campo
              etiqueta="¿Cuánto cobra en total? (con domi)"
              name="valorTotal"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej: 172.000"
              value={c.valorTotal}
              onChange={cambiar("valorTotal")}
              maxLength={15}
            />
          </div>
          <Selector
            etiqueta="¿Para cuándo es?"
            name="para"
            value={c.para}
            onChange={cambiar("para")}
          >
            <option value="HOY">Hoy</option>
            <option value="MANANA">Mañana</option>
          </Selector>
          <HoraLimite
            valor={c.entregarAntes}
            cambiar={(v) => setC((antes) => ({ ...antes, entregarAntes: v }))}
          />
          <Campo
            etiqueta="¿Algo especial? (referencia)"
            name="nota"
            autoComplete="off"
            value={c.nota}
            onChange={cambiar("nota")}
            maxLength={200}
          />
          <Selector
            etiqueta="¿Quién lo lleva?"
            name="mensajeroId"
            value={c.mensajeroId}
            onChange={cambiar("mensajeroId")}
          >
            {mensajeros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Selector>

          {zona ? (
            <p className="mt-2 text-sm text-suave">
              El domi cuesta{" "}
              <b className="text-tinta">{pesos(zona.tarifaDomi)}</b> (se calcula
              solo)
            </p>
          ) : null}

          {estado && !estado.ok ? (
            <Aviso tipo="error">{estado.error}</Aviso>
          ) : null}

          {editando ? (
            <>
              <Boton
                type="submit"
                variante="principal"
                grande
                disabled={guardando}
              >
                {guardando ? "Guardando…" : "💾 Guardar los cambios"}
              </Boton>
              <Link
                href="/colaborador/pedidos"
                className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-boton border border-borde-rosa bg-tarjeta text-[17px] font-bold text-frambuesa"
              >
                Volver sin cambiar
              </Link>
            </>
          ) : (
            <Boton
              type="submit"
              variante="principal"
              grande
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "📦 Listo, ya lo empaqué"}
            </Boton>
          )}
        </Tarjeta>
      </form>
    </>
  );
}
