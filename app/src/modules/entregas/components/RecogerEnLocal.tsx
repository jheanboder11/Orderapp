"use client";
import { Tarjeta } from "@/components/ui";
import { horaCorta } from "@/lib/formato";
import { BotonFoto } from "@/modules/fotos/components/BotonFoto";
import { salirConLosPedidos } from "../actions";
import type { PedidoDelMensajero } from "../queries";
import { barrio, cobroCorto } from "../rules";
import { FilaMini } from "./piezas";

/** 📦 Recógelos en el local: lista corta y UNA sola foto para salir con todos. */
export function RecogerEnLocal({ lista }: { lista: PedidoDelMensajero[] }) {
  return (
    <Tarjeta>
      <ul>
        {lista.map((p) => (
          <FilaMini
            key={p.id}
            numero={p.numeroDia}
            cliente={p.cliente}
            detalle={`${barrio(p.direccion, p.zona)} · ${p.items}${p.entregarAntes ? ` · antes de las ${horaCorta(p.entregarAntes)}` : ""}`}
            derecha={cobroCorto(p.formaPago, p.valorTotal)}
          />
        ))}
      </ul>
      <BotonFoto accion={salirConLosPedidos} campos={{ ids: lista.map((p) => p.id) }}>
        📸 Ya los tengo: tomar foto y salir
      </BotonFoto>
      <p className="mt-1.5 text-center text-[13px] text-suave">Una sola foto con todos los paquetes.</p>
    </Tarjeta>
  );
}
