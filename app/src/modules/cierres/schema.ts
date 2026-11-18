import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";

/**
 * Un cierre = las entregas de un Mensajero que todavía no habían entrado en ningún cierre.
 * Puede haber varios en un mismo día. Cada pedido cerrado guarda el id del cierre (pedidos.cierre_id).
 */
export const cierres = pgTable(
  "cierres",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    mensajeroId: text("mensajero_id")
      .notNull()
      .references(() => users.id),
    /** Día del cierre en Bogotá (YYYY-MM-DD). */
    fecha: date("fecha").notNull(),
    nEntregas: integer("n_entregas").notNull(),
    /** Efectivo que recibió (pesos enteros). */
    efectivo: integer("efectivo").notNull(),
    /** Lo que ganó: la suma de los domis entregados. */
    pagoMensajero: integer("pago_mensajero").notNull(),
    /** efectivo − pago. Positivo: él consigna. Negativo: la empresa le consigna. */
    neto: integer("neto").notNull(),
    /** Referencia de la foto ("blob:…" o "local:…"). Obligatoria si el neto es positivo. */
    fotoConsignacionUrl: text("foto_consignacion_url"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cierres_mensajero_fecha_idx").on(t.mensajeroId, t.fecha)],
);
