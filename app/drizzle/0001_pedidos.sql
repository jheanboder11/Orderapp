CREATE TYPE "public"."estado_pedido" AS ENUM('EMPACADO', 'EN_ENTREGA', 'ENTREGADO', 'PROBLEMA', 'DEVUELTO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."forma_pago" AS ENUM('EFECTIVO', 'TRANSFERENCIA', 'YA_PAGADO');--> statement-breakpoint
CREATE TABLE "pedido_eventos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pedido_eventos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pedido_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"estado_antes" "estado_pedido",
	"estado_despues" "estado_pedido",
	"usuario_id" text NOT NULL,
	"detalle" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pedidos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"numero_dia" integer NOT NULL,
	"fecha_creacion" date NOT NULL,
	"fecha_entrega" date NOT NULL,
	"entregar_antes" time,
	"cliente" text NOT NULL,
	"celular" text NOT NULL,
	"direccion" text NOT NULL,
	"zona_id" integer NOT NULL,
	"items" text NOT NULL,
	"nota" text,
	"forma_pago" "forma_pago" NOT NULL,
	"valor_total" integer NOT NULL,
	"valor_domi" integer NOT NULL,
	"mensajero_id" text NOT NULL,
	"estado" "estado_pedido" DEFAULT 'EMPACADO' NOT NULL,
	"motivo_problema" text,
	"detalle_problema" text,
	"motivo_cancelacion" text,
	"foto_salida_url" text,
	"foto_entrega_url" text,
	"hora_salida" timestamp with time zone,
	"hora_entrega" timestamp with time zone,
	"hora_cancelado" timestamp with time zone,
	"cierre_id" integer,
	"creado_por" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_dia_numero" UNIQUE("fecha_creacion","numero_dia")
);
--> statement-breakpoint
CREATE TABLE "zonas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "zonas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" text NOT NULL,
	"tarifa_domi" integer NOT NULL,
	"limite_minutos" integer NOT NULL,
	CONSTRAINT "zonas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zona_id_zonas_id_fk" FOREIGN KEY ("zona_id") REFERENCES "public"."zonas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_mensajero_id_users_id_fk" FOREIGN KEY ("mensajero_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedido_eventos_pedido_idx" ON "pedido_eventos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "pedidos_estado_idx" ON "pedidos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "pedidos_mensajero_estado_idx" ON "pedidos" USING btree ("mensajero_id","estado");--> statement-breakpoint
CREATE INDEX "pedidos_fecha_entrega_idx" ON "pedidos" USING btree ("fecha_entrega");--> statement-breakpoint
CREATE INDEX "pedidos_hora_entrega_idx" ON "pedidos" USING btree ("hora_entrega");--> statement-breakpoint
-- Zonas iniciales con su tarifa de domi y los minutos antes de la alerta de demora
INSERT INTO "zonas" ("nombre", "tarifa_domi", "limite_minutos") VALUES ('Medellín', 12000, 120), ('Aledaño', 15000, 180), ('Especial', 15000, 180) ON CONFLICT ("nombre") DO NOTHING;
