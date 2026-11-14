# Estado de Orderapp (bitácora)

> Dónde vamos, qué sigue y qué riesgos hay. Claude lo lee al empezar y lo actualiza al terminar cada sesión. Lo más nuevo va arriba en "Bitácora".

## Dónde vamos
| Fase | Estado |
|---|---|
| 0. Base | ✅ Lista |
| 1. Inicio de sesión y Equipo | ✅ Lista |
| 2. Pedidos del Colaborador | ✅ Lista |
| 3. Mensajero + fotos | ✅ Lista (falta revisión de Jhean) |
| 4. Cierres | ⏳ Sigue |
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
- **PC 2 ya corre la app** (2026-11-13): pnpm instalado y `.env.local` con la llave de Neon. En cada PC nuevo hay que repetir esos 2 pasos.
- **Accesos de prueba** (Leo, Ana, Teo, Luz): hay que apagarlos (`MOSTRAR_ACCESOS_PRUEBA=false`) y borrar esas cuentas antes del uso real.
- **Mensajero sin señal:** si pasa seguido en el piloto, la foto puede fallar. Medirlo antes de construir un "modo sin señal".

## Pendientes de negocio (no son código)
- Precio de venta al jefe y qué incluye (instalación, soporte mensual, cambios).
- Quién paga Vercel / Neon / dominio cuando pase del plan gratis.
- Fecha del piloto y quiénes participan (1 Colaborador + 1 Mensajero).

## Bitácora
- 2026-11-14: ✅ Fase 3 construida y probada (18 pruebas de punta a punta en verde). Fotos: sin la llave de Blob se guardan en el PC (`app/.fotos-locales/`); la llave no quedó pegada en `.env.local`, se pondrá sola al conectar el Blob al proyecto en Vercel. ▶️ SIGUIENTE: Jhean prueba la Fase 3 como Teo → Fase 4 (cierre) → Fase 5 mínima (💰 Hoy) → publicar en Vercel → recargar datos de ejemplo (las pruebas movieron algunos pedidos de Teo y Luz).
- 2026-11-13: ▶️ SIGUIENTE: Jhean prueba la Fase 2 en el PC 1 y trae su lista de ajustes. Luego: corregir esos ajustes y arrancar la **Fase 3 recortada** (ver "Meta de esta semana"). Antes de la Fase 3, pedirle la llave de Vercel Blob para las fotos.
- 2026-11-13: PC 2 listo para correr la app (pnpm + llave de Neon en `app/.env.local`). La base ya tenía usuarios y pedidos de prueba. Jhean empieza a revisar la Fase 2.
- 2026-11-12: ⚠️ PENDIENTE: el repo sigue PÚBLICO. contexto-jhean.md NO se ha subido (está solo en el PC 1). Cuando Jhean lo ponga privado: quitarlo de .gitignore y subirlo. Siguiente paso: Jhean da acceso a Neon (DATABASE_URL en app/.env.local) y se arranca la demo.
- 2026-11-12: Configurado para varios PCs: el contexto de Jhean ahora va en GitHub, `git pull` automático al abrir Claude Code y regla de subir cambios al terminar. Meta de la semana: demo para el jefe (fases 3, 4 y 5 recortadas + publicar).
- 2026-11-12: Carpeta conectada a GitHub. Documentos ordenados: versión vieja (Apps Script) al archivo, análisis del piloto adaptado a la app nueva, contexto personal fuera de GitHub (`CLAUDE.local.md`). Se crea esta bitácora.
- 2026-11-09: Fases 0, 1 y 2 terminadas y subidas.
