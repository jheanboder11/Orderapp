CREATE TABLE "cierres" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cierres_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mensajero_id" text NOT NULL,
	"fecha" date NOT NULL,
	"n_entregas" integer NOT NULL,
	"efectivo" integer NOT NULL,
	"pago_mensajero" integer NOT NULL,
	"neto" integer NOT NULL,
	"foto_consignacion_url" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cierres" ADD CONSTRAINT "cierres_mensajero_id_users_id_fk" FOREIGN KEY ("mensajero_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cierres_mensajero_fecha_idx" ON "cierres" USING btree ("mensajero_id","fecha");