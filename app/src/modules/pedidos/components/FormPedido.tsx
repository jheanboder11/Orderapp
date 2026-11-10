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
  "mt-1 w-full rounded-boton border border-linea bg-campo p-[13px] text-base text-tinta focus:border-naranja-sombra focus:outline-2 focus:outline-naranja-sombra";

export function FormPedido({ zonas, mensajeros, accion, numero, editando }: Props) {
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

  const cambiar = (k: keyof CamposPedido) => (e: { target: { value: string } }) =>
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
      ...(d.valorTotal && { valorTotal: pesos(Number(d.valorTotal)).replace("$ ", "") }),
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
        <p className="text-sm text-suave">Pídele al Administrador que cree uno en 👥 Equipo.</p>
      </Tarjeta>
    );
  }

  return (
    <>
      {estado?.ok && !editando ? (
        <Tarjeta className="border-exito" role="status">
          <p className="font-bold text-exito">{estado.mensaje}</p>
          <p className="text-sm text-suave">
            Pedido #{estado.numero}.{" "}
            <Link href="/colaborador/pedidos" className="font-semibold text-tinta underline">
              Ver los pedidos
            </Link>
          </p>
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <form
          noValidate
          onSubmit={enviarSinBorrar(enviar)}
        >
          <h1 className="mb-2 text-lg font-bold">
            {editando ? `✏️ Editando el pedido #${editando.numero}` : `➕ Domicilio #${siguiente}`}
          </h1>

          {editando ? (
            <p className="my-2 rounded-[10px] border-l-4 border-naranja bg-campo px-3 py-2 text-sm">
              Cambia lo que haga falta y guarda. Solo se puede editar mientras el pedido está empacado.
            </p>
          ) : (
            <>
              <p className="my-2 rounded-[10px] border-l-4 border-naranja bg-campo px-3 py-2 text-sm">
                <b>Atajo:</b> pega aquí lo que escribió el cliente en WhatsApp y la app llena los campos
                por ti.
              </p>
              <textarea
                aria-label="Mensaje del cliente"
                rows={4}
                placeholder="Pega aquí el mensaje del cliente"
                value={pegado}
                onChange={(e) => setPegado(e.target.value)}
                className={claseArea}
                maxLength={3000}
              />
              <Boton type="button" className="mt-2 w-full" onClick={llenar} disabled={!pegado.trim()}>
                ✨ Llenar con este mensaje
              </Boton>
              {nota ? (
                <p role="status" className="mt-2 rounded-[10px] border-l-4 border-naranja bg-campo px-3 py-2 text-sm">
                  {nota}
                </p>
              ) : null}
              <p className="mt-3 text-sm text-suave">O llénalo a mano:</p>
            </>
          )}

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
            <Selector etiqueta="¿A dónde va?" name="zonaId" value={c.zonaId} onChange={cambiar("zonaId")}>
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
            <Selector etiqueta="¿Cómo paga?" name="formaPago" value={c.formaPago} onChange={cambiar("formaPago")}>
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
          <div className="grid grid-cols-2 gap-2.5">
            <Selector etiqueta="¿Para cuándo es?" name="para" value={c.para} onChange={cambiar("para")}>
              <option value="HOY">Hoy</option>
              <option value="MANANA">Mañana</option>
            </Selector>
            <Campo
              etiqueta="Entregar antes de (opcional)"
              name="entregarAntes"
              type="time"
              value={c.entregarAntes}
              onChange={cambiar("entregarAntes")}
            />
          </div>
          <Campo
            etiqueta="¿Algo especial? (referencia)"
            name="nota"
            autoComplete="off"
            value={c.nota}
            onChange={cambiar("nota")}
            maxLength={200}
          />
          <Selector etiqueta="¿Quién lo lleva?" name="mensajeroId" value={c.mensajeroId} onChange={cambiar("mensajeroId")}>
            {mensajeros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Selector>

          {zona ? (
            <p className="mt-2 text-sm text-suave">
              El domi cuesta <b className="text-tinta">{pesos(zona.tarifaDomi)}</b> (se calcula solo)
            </p>
          ) : null}

          {estado && !estado.ok ? <Aviso tipo="error">{estado.error}</Aviso> : null}

          {editando ? (
            <>
              <Boton type="submit" variante="principal" grande disabled={guardando}>
                {guardando ? "Guardando…" : "💾 Guardar los cambios"}
              </Boton>
              <Link
                href="/colaborador/pedidos"
                className="mt-3 flex min-h-[54px] w-full items-center justify-center rounded-boton border border-linea bg-tarjeta text-[17px] font-semibold"
              >
                Volver sin cambiar
              </Link>
            </>
          ) : (
            <Boton type="submit" variante="principal" grande disabled={guardando}>
              {guardando ? "Guardando…" : "📦 Listo, ya lo empaqué"}
            </Boton>
          )}
        </form>
      </Tarjeta>
    </>
  );
}
