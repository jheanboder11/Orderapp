import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";

const ts = (columna: string) => timestamp(columna, { withTimezone: true });

export const formaPagoEnum = pgEnum("forma_pago", ["EFECTIVO", "TRANSFERENCIA", "YA_PAGADO"]);
export const estadoPedidoEnum = pgEnum("estado_pedido", [
  "EMPACADO",
  "EN_ENTREGA",
  "ENTREGADO",
  "PROBLEMA",
  "DEVUELTO",
  "CANCELADO",
]);

/** Zonas de entrega con su tarifa de domi y los minutos antes de la alerta de demora. */
export const zonas = pgTable("zonas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nombre: text("nombre").notNull().unique(),
  tarifaDomi: integer("tarifa_domi").notNull(),
  limiteMinutos: integer("limite_minutos").notNull(),
});

export const pedidos = pgTable(
  "pedidos",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** #1, #2, #3… por día de creación. */
    numeroDia: integer("numero_dia").notNull(),
    /** Día de creación en Bogotá (YYYY-MM-DD). */
    fechaCreacion: date("fecha_creacion").notNull(),
    /** Día en que se debe entregar (hoy o mañana). */
    fechaEntrega: date("fecha_entrega").notNull(),
    entregarAntes: time("entregar_antes"),
    cliente: text("cliente").notNull(),
    celular: text("celular").notNull(),
    direccion: text("direccion").notNull(),
    zonaId: integer("zona_id")
      .notNull()
      .references(() => zonas.id),
    items: text("items").notNull(),
    nota: text("nota"),
    formaPago: formaPagoEnum("forma_pago").notNull(),
    /** Pesos enteros. Incluye el domi. Se guarda siempre, aunque el cliente ya haya pagado. */
    valorTotal: integer("valor_total").notNull(),
    /** Copiado de la tarifa de la zona al crear (si la tarifa cambia, el pedido no cambia). */
    valorDomi: integer("valor_domi").notNull(),
    mensajeroId: text("mensajero_id")
      .notNull()
      .references(() => users.id),
    estado: estadoPedidoEnum("estado").notNull().default("EMPACADO"),
    motivoProblema: text("motivo_problema"),
    detalleProblema: text("detalle_problema"),
    motivoCancelacion: text("motivo_cancelacion"),
    fotoSalidaUrl: text("foto_salida_url"),
    fotoEntregaUrl: text("foto_entrega_url"),
    horaSalida: ts("hora_salida"),
    horaEntrega: ts("hora_entrega"),
    horaCancelado: ts("hora_cancelado"),
    /** Se llena en la Fase 4 (cierres). */
    cierreId: integer("cierre_id"),
    creadoPor: text("creado_por")
      .notNull()
      .references(() => users.id),
    creadoEn: ts("creado_en").notNull().defaultNow(),
    actualizadoEn: ts("actualizado_en").notNull().defaultNow(),
  },
  (t) => [
    unique("pedidos_dia_numero").on(t.fechaCreacion, t.numeroDia),
    index("pedidos_estado_idx").on(t.estado),
    index("pedidos_mensajero_estado_idx").on(t.mensajeroId, t.estado),
    index("pedidos_fecha_entrega_idx").on(t.fechaEntrega),
    index("pedidos_hora_entrega_idx").on(t.horaEntrega),
  ],
);

/** Cada cambio de un pedido queda anotado aquí (auditoría invisible, sirve para las métricas). */
export const pedidoEventos = pgTable(
  "pedido_eventos",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    pedidoId: integer("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    tipo: text("tipo").notNull(),
    estadoAntes: estadoPedidoEnum("estado_antes"),
    estadoDespues: estadoPedidoEnum("estado_despues"),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => users.id),
    detalle: jsonb("detalle"),
    creadoEn: ts("creado_en").notNull().defaultNow(),
  },
  (t) => [index("pedido_eventos_pedido_idx").on(t.pedidoId)],
);
