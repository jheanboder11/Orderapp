# Estado de Orderapp (bitácora)

> Dónde vamos, qué sigue y qué riesgos hay. Claude lo lee al empezar y lo actualiza al terminar cada sesión. Lo más nuevo va arriba en "Bitácora".

## Dónde vamos
| Fase | Estado |
|---|---|
| 0. Base | ✅ Lista |
| 1. Inicio de sesión y Equipo | ✅ Lista |
| 2. Pedidos del Colaborador | ✅ Lista (falta revisión de Jhean) |
| 3. Mensajero + fotos | ⏳ Sigue |
| 4. Cierres | — |
| 5. Panel del Administrador | — |
| 6. Correos y Ajustes | — |
| 7. Auditoría y métricas | — |
| 8. Pulido y despliegue | — |

## 🎯 Meta de esta semana (desde 2026-11-12): demo para el jefe
Demo funcional que muestre el valor, **no** la app terminada. La historia que debe ver el jefe en 3 minutos:
> El Colaborador pega el WhatsApp → sale el pedido → el Mensajero sale con foto y entrega con foto → hace el cierre con un toque → el jefe ve la plata del día.

Lo que falta para contar esa historia (versión recortada de las fases 3, 4 y 5):
1. **Fase 3 recortada — Mensajero:** ver sus entregas, "Salí" con foto, "Entregado" con foto, "No pude" con motivo. Sin pedir más.
2. **Fase 4 recortada — Cierre:** efectivo − domis = lo que consigna, en el mismo formato de hoy. Sin correo todavía.
3. **Fase 5 mínima — 💰 Hoy del Administrador:** ventas del día, efectivo vs transferencia, cierres hechos.
4. **Publicarla en Vercel** con datos de ejemplo, para abrirla desde el celular en la reunión.

Se deja para después de la reunión: correos, Ajustes, auditoría visible, CSV, historial completo, pulido.

## Después de la demo
- Si el jefe dice sí → piloto de 2 semanas (1 Colaborador + 1 Mensajero) y se terminan las fases 5–8 con lo que él pida.
- Definir el precio **antes** de la reunión (ver "Pendientes de negocio").

## Riesgos
- **Construir de más sin saber si el jefe paga.** Ver recomendación de arriba.
- **Este PC no puede correr la app todavía:** falta `.env.local` (llave de la base de datos Neon) y falta instalar `pnpm`. Se arregla en 5 minutos cuando haga falta.
- **Accesos de prueba** (Leo, Ana, Teo, Luz): hay que apagarlos (`MOSTRAR_ACCESOS_PRUEBA=false`) y borrar esas cuentas antes del uso real.
- **Mensajero sin señal:** si pasa seguido en el piloto, la foto puede fallar. Medirlo antes de construir un "modo sin señal".

## Pendientes de negocio (no son código)
- Precio de venta al jefe y qué incluye (instalación, soporte mensual, cambios).
- Quién paga Vercel / Neon / dominio cuando pase del plan gratis.
- Fecha del piloto y quiénes participan (1 Colaborador + 1 Mensajero).

## Bitácora
- 2026-11-12: ⚠️ PENDIENTE: el repo sigue PÚBLICO. contexto-jhean.md NO se ha subido (está solo en el PC 1). Cuando Jhean lo ponga privado: quitarlo de .gitignore y subirlo. Siguiente paso: Jhean da acceso a Neon (DATABASE_URL en app/.env.local) y se arranca la demo.
- 2026-11-12: Configurado para varios PCs: el contexto de Jhean ahora va en GitHub, `git pull` automático al abrir Claude Code y regla de subir cambios al terminar. Meta de la semana: demo para el jefe (fases 3, 4 y 5 recortadas + publicar).
- 2026-11-12: Carpeta conectada a GitHub. Documentos ordenados: versión vieja (Apps Script) al archivo, análisis del piloto adaptado a la app nueva, contexto personal fuera de GitHub (`CLAUDE.local.md`). Se crea esta bitácora.
- 2026-11-09: Fases 0, 1 y 2 terminadas y subidas.
