# Estado de Orderapp (bitácora)

> Dónde vamos, qué sigue y qué riesgos hay. Claude lo lee al empezar y lo actualiza al terminar cada sesión. Lo más nuevo va arriba en "Bitácora".

## Dónde vamos
| Fase | Estado |
|---|---|
| 0. Base | ✅ Lista |
| 1. Inicio de sesión y Equipo | ✅ Lista |
| 2. Pedidos del Colaborador | ✅ Lista |
| 3. Mensajero + fotos | ✅ Lista y revisada por Jhean (2026-11-18), con sus ajustes |
| 4. Cierres | ✅ Lista, versión demo sin correo (falta revisión de Jhean) |
| 5. Panel del Administrador | ⏳ Sigue: versión mínima 💰 Hoy para la demo |
| 6. Correos y Ajustes | — |
| 7. Auditoría y métricas | — |
| 8. Pulido y despliegue | — |

## 🎯 Meta de esta semana (desde 2026-11-12): demo para el jefe
Demo funcional que muestre el valor, **no** la app terminada. La historia que debe ver el jefe en 3 minutos:
> El Colaborador pega el WhatsApp → sale el pedido → el Mensajero sale con foto y entrega con foto → hace el cierre con un toque → el jefe ve la plata del día.

Lo que falta para contar esa historia (versión recortada de las fases 3, 4 y 5):
1. ✅ **Fase 3 recortada — Mensajero:** ver sus entregas, "Salí" con foto, "Entregado" con foto, "No pude" con motivo. Sin pedir más.
2. ✅ **Fase 4 recortada — Cierre:** efectivo − domis = lo que consigna, en el mismo formato de hoy. Sin correo todavía.
3. ⏳ **Fase 5 mínima — 💰 Hoy del Administrador:** ventas del día, efectivo vs transferencia, cierres hechos.
4. **Publicarla en Vercel** con datos de ejemplo, para abrirla desde el celular en la reunión.

Se deja para después de la reunión: correos, Ajustes, auditoría visible, CSV, historial completo, pulido.

## Después de la demo
- Si el jefe dice sí → piloto de 2 semanas (1 Colaborador + 1 Mensajero) y se terminan las fases 5–8 con lo que él pida.
- Definir el precio **antes** de la reunión (ver "Pendientes de negocio").

## Riesgos
- **Construir de más sin saber si el jefe paga.** Ver recomendación de arriba.
- **PC 2 ya corre la app** (2026-11-13): pnpm instalado y `.env.local` con la llave de Neon. En cada PC nuevo hay que repetir esos 2 pasos.
- **Accesos de prueba** (Leo, Ana, Teo, Luz): hay que apagarlos (`MOSTRAR_ACCESOS_PRUEBA=false`) y borrar esas cuentas antes del uso real.
- **Mensajero sin señal:** si pasa seguido en el piloto, la foto puede fallar. Medirlo antes de construir un "modo sin señal".

## ▶️ Cómo retomar en otro PC (léelo primero)
1. Claude hace `git pull` solo al abrir. Luego, en `app/`: `pnpm install` (por si hay librerías nuevas) y `pnpm dev`. Abrir http://localhost:3000.
2. **La base de datos (Neon) es la misma para los dos PCs.** Las migraciones 0002 (celular de usuarios) y 0003 (tabla cierres) **ya están aplicadas**: no hay que correr nada. Si algún día sale "column does not exist", correr `pnpm db:migrate` en `app/`.
3. Cuentas de prueba: Ana / 12345678 (Colaboradora), Teo / 123456 y Luz / 123456 (Mensajeros). El Administrador usa ADMIN_USUARIO / ADMIN_PASSWORD de `.env.local`.
4. Si la app sale con "Cannot find module": parar `pnpm dev`, borrar `app/.next` y volver a correr `pnpm dev`.
5. Pruebas: `pnpm test` (rápidas, 94) y `pnpm test:e2e` (de punta a punta; construyen en `.next-pruebas` y no dañan la app abierta). Con la app abierta en el mismo PC pueden fallar por lentitud: correr el archivo que falló solo, con `--workers=1`.
6. Las fotos de prueba se guardan en `app/.fotos-locales/` de cada PC y NO viajan por GitHub (en el otro PC salen como "No encontré la foto": es normal).

## Pendientes (código) que Jhean ya pidió o aceptó
- Poner/cambiar el **celular** de cada usuario desde 👥 Equipo (hoy solo Teo tiene, puesto por Claude directo en la base).
- **Recargar datos de ejemplo** con la fecha del día antes de la demo (los de hoy son de hace ~8 días y hay pedidos de prueba revueltos). Pedirle permiso a Jhean: borra todos los pedidos.
- Teo tiene 2 pedidos de prueba sin entregar ("Prueba Mensaje 1 y 2"): por eso su cierre sale bloqueado.

## Pendientes de negocio (no son código)
- ⚠️ **Poner el repo de GitHub en privado** (sigue público). Mientras tanto: NO subir celulares, nombres reales ni datos de clientes a GitHub.
- Precio de venta al jefe y qué incluye (instalación, soporte mensual, cambios).
- Quién paga Vercel / Neon / dominio cuando pase del plan gratis.
- Fecha del piloto y quiénes participan (1 Colaborador + 1 Mensajero).

## Bitácora
- 2026-11-18 (PC 1, cierre de sesión): ✅ **Fase 4 (cierre del Mensajero) lista**, versión demo sin correo. Módulo nuevo `app/src/modules/cierres/` (schema, rules con pruebas, queries, actions, BotonCierre), pantalla `app/mensajero/cierre`, foto en `/api/fotos/cierre/[id]`, migración 0003 aplicada. Reglas 3–6 del plan con pruebas (neto positivo, negativo, cero, pedidos de mañana). E2E `e2e/fase4-cierre.spec.ts` (2 casos) en verde. Arreglado de paso: el aviso de bloqueo decía "11 minutos" por un desfase de reloj (ahora nunca pasa de 10). Jhean dio la Fase 3 por revisada. ▶️ SIGUIENTE: Jhean prueba el cierre (como Teo, después de entregar o cancelar sus 2 pedidos de prueba) → **Fase 5 mínima: 💰 Hoy del Administrador** (ventas del día sin domis, domicilios, efectivo vs transferencia, cierres por mensajero) → publicar en Vercel → recargar datos de ejemplo.
- 2026-11-18: Nueva columna `celular` en usuarios (migración 0002, ya aplicada en Neon). A Teo se le puso el celular que dio Jhean (guardado solo en la base, no en GitHub porque el repo es público). Pendiente: poner/cambiar el celular desde 👥 Equipo.
- 2026-11-18: Mensaje personalizado para cada mensajero (copiar / abrir WhatsApp). Los mensajeros no tienen celular en la app: WhatsApp abre el mensaje y el colaborador escoge el contacto. Se crearon 2 pedidos de prueba para Teo ("Prueba Mensaje 1 y 2").
- 2026-11-17: Hora límite del pedido: Sin afán / Con hora con flechas ▲▼ (hora, minutos de 5 en 5, a. m./p. m.). Jhean no quiso la lista de horas. Ojo: con la app abierta en pnpm dev, las pruebas de punta a punta pueden fallar por lentitud; corridas solas pasan.
- 2026-11-17: 🐞 La app se dañó ("Cannot find module") porque las pruebas de punta a punta reconstruían en la misma carpeta `.next` que usa `pnpm dev`. Arreglado: las pruebas ahora construyen en `.next-pruebas`. Si vuelve a pasar: parar la app, borrar `app/.next` y correr `pnpm dev`.
- 2026-11-17 (PC 1): Ajustes de Jhean al Colaborador: módulo 🚨 Alerta, orden #1→#N, filtro por mensajero. 9 pruebas de punta a punta en verde. ▶️ SIGUIENTE: Jhean revisa estos cambios → Fase 4 (cierre).
- 2026-11-17 (PC 1): Primeros ajustes de Jhean a la Fase 3: "Hechos" → "Entregados", el pago con palabra (Efectivo / Transferencia con valor / Pago anticipado) y detalle al tocar un pedido entregado. ▶️ SIGUIENTE: Jhean termina de revisar la Fase 3 → Fase 4 (cierre).
- 2026-11-14 (cierre de sesión, PC 1): ▶️ PARA RETOMAR EN OTRO PC: 1) en `app/` correr `pnpm install` (se agregó la librería de fotos `@vercel/blob`); 2) preguntarle a Jhean cómo le fue probando la Fase 3 (aún no lo ha contado) y corregir lo que diga; 3) seguir con la Fase 4 (cierre). Ojo: las fotos de prueba de este PC quedaron en `app/.fotos-locales/` y NO viajan por GitHub; en el otro PC esas fotos saldrán como "No encontré la foto" (normal, no es un error).
- 2026-11-14: ✅ Fase 3 construida y probada (18 pruebas de punta a punta en verde). Fotos: sin la llave de Blob se guardan en el PC (`app/.fotos-locales/`); la llave no quedó pegada en `.env.local`, se pondrá sola al conectar el Blob al proyecto en Vercel. ▶️ SIGUIENTE: Jhean prueba la Fase 3 como Teo → Fase 4 (cierre) → Fase 5 mínima (💰 Hoy) → publicar en Vercel → recargar datos de ejemplo (las pruebas movieron algunos pedidos de Teo y Luz).
- 2026-11-13: ▶️ SIGUIENTE: Jhean prueba la Fase 2 en el PC 1 y trae su lista de ajustes. Luego: corregir esos ajustes y arrancar la **Fase 3 recortada** (ver "Meta de esta semana"). Antes de la Fase 3, pedirle la llave de Vercel Blob para las fotos.
- 2026-11-13: PC 2 listo para correr la app (pnpm + llave de Neon en `app/.env.local`). La base ya tenía usuarios y pedidos de prueba. Jhean empieza a revisar la Fase 2.
- 2026-11-12: ⚠️ PENDIENTE: el repo sigue PÚBLICO. contexto-jhean.md NO se ha subido (está solo en el PC 1). Cuando Jhean lo ponga privado: quitarlo de .gitignore y subirlo. Siguiente paso: Jhean da acceso a Neon (DATABASE_URL en app/.env.local) y se arranca la demo.
- 2026-11-12: Configurado para varios PCs: el contexto de Jhean ahora va en GitHub, `git pull` automático al abrir Claude Code y regla de subir cambios al terminar. Meta de la semana: demo para el jefe (fases 3, 4 y 5 recortadas + publicar).
- 2026-11-12: Carpeta conectada a GitHub. Documentos ordenados: versión vieja (Apps Script) al archivo, análisis del piloto adaptado a la app nueva, contexto personal fuera de GitHub (`CLAUDE.local.md`). Se crea esta bitácora.
- 2026-11-09: Fases 0, 1 y 2 terminadas y subidas.
