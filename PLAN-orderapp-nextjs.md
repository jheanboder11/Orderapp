# Orderapp: plan de trabajo para construirla desde cero

> **Para Claude Code:** este documento es la especificación completa. Constrúyela por fases, en orden. Al cerrar cada fase, corre las pruebas, haz commit y resume en 5 líneas qué quedó hecho. No agregues funciones que no estén aquí. Si algo es ambiguo, pregunta antes de inventar.
>
> **Referencia:** en `/referencia` están `Code.gs` e `Index.html` (la versión piloto en Google Apps Script) y `demo/index.html` (la demo navegable, la referencia visual). Úsalos para copiar las reglas de negocio, los textos y el lector de mensajes de WhatsApp (`parseMsg`). No copies su arquitectura.

---

## 1. Qué es Orderapp

App web para organizar los domicilios de **QFP Chaquetas**, una tienda de chaquetas en Medellín con unos 10 domicilios diarios. Reemplaza el control por WhatsApp y la memoria de las personas.

Resuelve cuatro cosas:
- Que no se pierdan pedidos, paquetes ni dinero.
- Que cada pedido tenga fotos de salida y de entrega como prueba.
- Que el cierre de dinero del mensajero se haga solo.
- Que el jefe vea los datos (ventas, entregas, problemas) de cualquier periodo.

### Regla #1 de diseño (obligatoria)
Todo gira alrededor de la persona que usa la pantalla. Antes de poner cada palabra, botón o paso, pregúntate: ¿le sirve a esta persona? ¿Cómo lo va a usar? ¿Cómo lo va a ver? Si un paso se puede quitar, se quita. Cada pantalla tiene **una sola acción protagonista**.

---

## 2. Stack técnico

| Pieza | Elección | Nota |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript estricto** | Server Actions para escribir y Server Components para leer |
| Base de datos | **PostgreSQL** (Neon, desde el Marketplace de Vercel) | |
| ORM | **Drizzle ORM** + drizzle-kit (migraciones) | Esquema tipado y migraciones versionadas |
| Autenticación | **Better Auth** con usuario y contraseña | Registro público **desactivado**. Solo el Administrador crea usuarios |
| Validación | **Zod** | Todas las entradas, en el servidor |
| UI | **Tailwind CSS** + componentes propios (o shadcn/ui adaptado) | Móvil primero |
| Fotos | **Vercel Blob** | La foto se comprime en el navegador antes de subirla (máx. 1100 px, JPEG 0.72) |
| Correos | **Resend** | Resumen del cierre y alertas |
| Tareas programadas | **Vercel Cron** | Ver la nota de límites en la sección 9 |
| Pruebas | **Vitest** (reglas de negocio) + **Playwright** (flujos por rol) | |
| Zona horaria | `America/Bogota` en toda la lógica de fechas | Guardar en UTC (`timestamptz`) y mostrar en hora de Bogotá |
| Dinero | Pesos colombianos en **enteros** (sin decimales) | Formato `$ 192.000` |

---

## 3. Roles y permisos

| Rol | Quién es | Qué hace | Qué NO hace |
|---|---|---|---|
| **Administrador** | El jefe / dueño | Ve todo sin filtros: ventas, cierres, problemas, historial, exportar CSV. **Crea usuarios**, cambia contraseñas y desactiva cuentas. Maneja Ajustes | No crea ni modifica pedidos |
| **Colaborador** | Empleado de logística | Vende por WhatsApp, crea, edita, cancela y reasigna pedidos, empaca, entrega al mensajero, marca devueltos y resuelve problemas. Ve hoy, mañana y ayer | No ve el panel financiero ni crea usuarios |
| **Mensajero** | El que entrega | Ve **solo sus** pedidos. Sale con foto, entrega con foto, reporta problemas y hace su cierre | No ve los pedidos de otros ni datos de la empresa |

- Los permisos se revisan **en el servidor** en cada Server Action y en cada consulta. Ocultar botones no basta.
- No existe registro público. La ruta de registro no existe o devuelve 404.
- El primer **Administrador** (jefe) se crea con un script de semilla (`pnpm db:seed`), con usuario y contraseña tomados de variables de entorno.

---

## 4. Módulos

Organiza el código por módulos: `src/modules/<modulo>/` con `schema.ts`, `actions.ts`, `queries.ts`, `rules.ts` (lógica pura con pruebas) y `components/`.

### M1. Autenticación y usuarios
- Inicio de sesión con **usuario** (corto, por ejemplo "Teo") y **contraseña**. No importan mayúsculas ni tildes al escribir el usuario.
- Contraseña mínima: 8 caracteres para Colaborador y Administrador, y 6 dígitos para Mensajero.
- Sesión de 30 días en el celular: el mensajero inicia sesión una sola vez.
- Bloqueo tras 5 intentos fallidos durante 10 minutos (el rate limit de Better Auth).
- Pantalla "Equipo" (solo Administrador) para crear usuarios (nombre, usuario, rol, contraseña inicial), cambiar contraseñas y activar o desactivar cuentas. Las cuentas se desactivan, no se borran, para que el historial no se rompa.
- Texto de la pantalla de entrada: "👋 ¡Hola! Entra a Orderapp". Debajo: "¿Olvidaste tu contraseña? Pídesela al Administrador."

### M2. Pedidos (Colaborador)
- **Formulario de pedido** con estos campos: nombre del cliente, celular, ¿a dónde va? (Medellín / Aledaño / Especial), dirección, ¿qué lleva?, ¿cómo paga? (Efectivo / Transferencia / Ya pagado), **"¿Cuánto cobra en total? (con domi)"**, ¿para cuándo es? (Hoy / Mañana), entregar antes de (hora, opcional), ¿algo especial? (nota) y ¿quién lo lleva? (por defecto, el primer mensajero activo).
- **Atajo de WhatsApp:** un cuadro para pegar el mensaje del cliente y un botón "✨ Llenar con este mensaje". Al usarlo muestra "Revisa que todo esté bien. No encontré: …". Usa la lógica de `parseMsg` de la referencia.
- El domi se calcula solo según la zona y se muestra: "El domi cuesta $ 12.000".
- Botón principal: **"📦 Listo, ya lo empaqué"**. Al guardar: "Listo, [Mensajero] ya lo ve en su celular ✅".
- Número del pedido: consecutivo por día de creación (#1, #2, #3…).
- **Editar** solo mientras el pedido está en estado Empacado.
- **Cancelar** desde Empacado o En entrega, con motivo obligatorio ("El cliente canceló", "Error al crear el pedido", "No hay el producto", "Otro" con texto). La confirmación va dentro de la tarjeta, nunca con `confirm()` del navegador.
- **Reasignar** a otro mensajero mientras el pedido no esté terminado, con confirmación dentro de la tarjeta.
- **"↩️ Ya recibí el paquete de vuelta"** en pedidos con Problema, que pasan a Devuelto.
- Botón **"📋 Copiar"**: copia el resumen del pedido para WhatsApp.
- Listas: **Los pedidos de hoy** (título 20 % más grande que los demás), **Para mañana (n)** y **Ayer**.
- **Alerta de pedidos demorados** arriba de la lista: "⏰ Ojo, estos pedidos se están demorando: #4 Juliana lleva 150 min en la calle con Luz", con un botón "💬 Escribirle".

### M3. Mensajero
La pantalla va **ordenada como su día de trabajo**:
1. **Tres cuadros arriba:** 🏍️ En camino · 📦 Por recoger · ✅ Entregados. El primero se pinta del color de marca si tiene pedidos.
2. **🏍️ Entrégalos ahora:** tarjeta completa por pedido con dirección, qué lleva y cuánto cobrar ("💵 Te toca cobrar en efectivo: $ 172.000" o "📲 Ya pagó por transferencia. No cobres nada."). La nota va resaltada. Botón grande **"✅ Ya lo entregué (toma la foto)"**, debajo 3 botones pequeños **📞 Llamar · 📍 Mapa · 💬 WhatsApp**, y un enlace discreto **"😕 No pude entregarlo"** (con motivo: No contesta, No estaba, Dirección incorrecta, Error al empacar, Rechazó el pedido, Otro).
3. **📦 Recógelos en el local:** lista corta (#, cliente, barrio, qué lleva, cuánto cobra) y un solo botón **"📸 Ya los tengo: tomar foto y salir"**. **Una sola foto** para todos los paquetes, que pasan a En entrega.
4. **↩️ Regrésalos al local:** pedidos con Problema o cancelados en la calle.
5. **🧾 Tu cierre:** mientras tenga pendientes solo informa ("Llevas $ X en efectivo y ganaste $ Y. Cuando entregues todo, aquí haces el cierre"). Sin pendientes muestra el cálculo y el botón "🧾 Hacer el cierre".
6. **✅ Ya entregados (n)** y **🗓️ Para mañana (n)**: plegados y se abren con un toque.
- La foto usa `<input type="file" accept="image/*" capture="environment">` y se comprime en el navegador. Mientras sube, muestra "Subiendo la foto, no cierres la pantalla…".

### M4. Cierres
Ver las reglas exactas en la sección 6. Pantalla de resultado: "🎉 Cierre hecho · Consignaste $ X" o "La empresa te consigna $ X".

### M5. Panel del Administrador (jefe, solo lectura de pedidos)
Navegación con barra de módulos: **💰 Hoy · 🧾 Cierres · 🗂️ Historial · 👥 Equipo**.
- **💰 Hoy:** "🛍️ Ventas" (sin domis, el número grande), "🏍️ Domicilios", y cómo entró la plata (efectivo / transferencia, con domi). Chips: **🔄 En proceso**, Por entregar, Problemas.
- **🧾 Cierres de hoy:** por mensajero, con el estado (✅ Cerró / ⏳ Sin cerrar / 😴 Sin pedidos), entregados, efectivo, su pago, lo que debe consignar o lo que hay que consignarle, y el comprobante. Botón "✉️ Enviar el resumen a mi correo".
- **🗂️ Historial (últimos 10 días):** una tarjeta por día con mini resumen (✅ entregas · 🛍️ ventas · ⚠️ problemas · 🚫 cancelados). Toca un día → ve sus pedidos. Toca un pedido → todo el detalle (dirección, qué llevaba, horas, problema, fotos). Filtro "⚠️ Solo con problemas". **Se muestran 10 días, pero no se borra nada** de la base de datos.
- **⬇️ Exportar CSV** de un rango de fechas (para ver el mes completo en Excel).
- **👥 Equipo:** ver M1.

### M6. Notificaciones
- **Resumen de cierre por correo** cuando el último mensajero cierra el día, con el formato que ya usa el negocio:
  ```
  Cierre domis 2026-10-25 — Teo
  1. 12.000 (nota) Efectivo: 157.000
  2. 12.000 Transferencia: 137.000
  Total domis: 24.000
  Efectivo: 157.000 - 24.000 = 133.000
  Comprobante: <link>
  Novedades: #3 Ana: No contesta (Devuelto)
  ```
- **10:00 p. m. (Bogotá):** si alguien tiene entregas sin cierre, correo de aviso al Colaborador y al Administrador.
- **Pedidos demorados:** alerta en vivo dentro de la app (no necesita cron).
- Los destinatarios de correo se configuran en la pantalla Ajustes.

### M7. Ajustes (solo Administrador)
- Tarifas de domi por zona (Medellín 12.000 · Aledaño 15.000 · Especial 15.000).
- Minutos límite antes de alerta (Medellín 120 · otras zonas 180).
- Correos que reciben el resumen y las alertas.
- Listas de motivos (problema y cancelación).

### M8. Auditoría (automática e invisible)
- Cada cambio de estado guarda un evento: pedido, tipo, de qué estado a qué estado, usuario, fecha y detalle.
- De aquí salen las métricas del piloto y la línea de tiempo del historial. No tiene pantalla propia.

---

## 5. Modelo de datos (PostgreSQL)

```
users            id, nombre, usuario (único, normalizado), rol (COLABORADOR|ADMINISTRADOR|MENSAJERO),
                 activo, creado_en   (+ tablas que pide Better Auth: account, session, verification)

zonas            id, nombre (Medellín|Aledaño|Especial), tarifa_domi, limite_minutos

pedidos          id, numero_dia, fecha_creacion (date Bogotá), fecha_entrega (date),
                 entregar_antes (time null), cliente, celular, direccion, zona_id,
                 items, nota, forma_pago (EFECTIVO|TRANSFERENCIA|YA_PAGADO),
                 valor_total (int, incluye domi), valor_domi (int, copiado de la tarifa al crear),
                 mensajero_id, estado (EMPACADO|EN_ENTREGA|ENTREGADO|PROBLEMA|DEVUELTO|CANCELADO),
                 motivo_problema, detalle_problema, motivo_cancelacion,
                 foto_salida_url, foto_entrega_url,
                 hora_salida, hora_entrega, hora_cancelado,
                 cierre_id (null hasta cerrar), creado_por, creado_en, actualizado_en
                 UNIQUE (fecha_creacion, numero_dia)

cierres          id, mensajero_id, fecha (date Bogotá), n_entregas, efectivo, pago_mensajero,
                 neto, foto_consignacion_url, creado_en

pedido_eventos   id, pedido_id, tipo, estado_antes, estado_despues, usuario_id, detalle (jsonb), creado_en

ajustes          clave, valor (jsonb)     -- correos, motivos
```

- Índices en `pedidos(estado)`, `pedidos(mensajero_id, estado)`, `pedidos(fecha_entrega)` y `pedidos(hora_entrega)`.
- **Mejora sobre el piloto:** `valor_total` siempre se guarda, aunque el cliente "Ya pagó". En ese caso el mensajero cobra 0, pero las ventas del Administrador quedan completas.

---

## 6. Reglas de negocio (con pruebas en Vitest)

1. **Estados permitidos:**
   - Empacado → En entrega (con foto) → Entregado (con foto) o Problema (con motivo).
   - Problema → Devuelto (solo el Colaborador).
   - Empacado o En entrega → Cancelado (solo el Colaborador, con motivo).
   - Cualquier otro cambio se rechaza con un mensaje claro.
2. **Un pedido para mañana no puede salir hoy:** "Este pedido es para el [fecha], todavía no sale".
3. **Pago del mensajero** = suma de `valor_domi` de sus pedidos **Entregados**.
4. **Efectivo** = suma de `valor_total` de sus entregados con forma de pago Efectivo.
5. **Neto** = efectivo − pago del mensajero.
   - Neto > 0: el mensajero consigna a la empresa y la **foto de la consignación es obligatoria**.
   - Neto < 0: la empresa le consigna al mensajero.
6. **Cierre por entregas, no por día:**
   - Incluye todas sus entregas sin cierre, de cualquier fecha.
   - Se bloquea si tiene pedidos Empacado o En entrega con fecha de hoy o anterior. Los de mañana no bloquean.
   - Se permiten varios cierres en un mismo día.
   - Usa una transacción y un bloqueo para evitar dobles cierres.
7. **Ventas** = suma de (`valor_total` − `valor_domi`) de los entregados del periodo. Los domis se muestran aparte.
8. **Pedido demorado:** En entrega por más del `limite_minutos` de su zona.
9. **Métricas del piloto** (calculadas desde pedidos y eventos):
   - Minutos en el local (creación → salida).
   - Minutos en la calle (salida → entrega).
   - Horas totales.
   - ¿Entregó a tiempo? (frente a "entregar antes de").
   - % de fallidos y % de cancelados.

---

## 7. Diseño visual: Orderapp (sin marca de ningún cliente)

La app es un producto propio, no de QFP: nada de logos, colores ni palabras de un cliente (por ejemplo "Ventas", no "Ventas de chaquetas").
- **Colores:**
  - Tinta `#1c1a36` (textos fuertes y logo).
  - **Naranja ruta `#ff7a45`**: solo para la acción principal de cada pantalla, con texto blanco. Sombra inferior `#e2581f`.
  - Fondo `#f5f5f9`, tarjetas blancas, líneas `#e5e4ee`, texto suave `#6b6a80`.
  - Verde éxito `#16996a`, ámbar `#c76a12` y rojo problema `#d43c4b`.
- **Logo:** cuadrado redondeado tinta con un pin de ubicación naranja y un chulo blanco; al lado "orderapp" en minúscula y el lema "DOMICILIOS EN ORDEN". SVG en `public/logo.svg` (copiar de `referencia/Index.html`, constante `LOGO`).
- **Encabezado:** claro, logo a la izquierda y "Hola, [nombre] 👋 · Salir" a la derecha. Sin bloques negros.
- **Navegación por módulos:** barra fija abajo en el celular (arriba en computador), con emoji + nombre y un numerito naranja cuando hay algo pendiente.
  - Colaborador: 📋 Pedidos (filtro Hoy · Mañana · Ayer) · ➕ Nuevo.
  - Mensajero: 🏍️ Entregas · 🧾 Cierre · ✅ Hechos.
  - Administrador: 💰 Hoy · 🧾 Cierres · 🗂️ Historial · 👥 Equipo.
- **Tipografía:** Plus Jakarta Sans con `next/font` (títulos 700–800, texto 400).
- **Formas:** tarjetas con radio de 20 px, sombras suaves y mucho aire. Botones mínimo 46 px de alto.
- **Emojis** para identificar cada cosa (🏍️ 📦 ✅ 😕 🧾 💵 📲).
- **Móvil primero.** Modo claro por defecto.
- **Referencia visual exacta:** `referencia/demo/index.html` (abrir en el navegador; PIN 1234). Copia su aspecto y sus textos.

### Lenguaje
- Español de Colombia, cercano y corto: "Ya lo entregué", "Haz tu cierre", "Te toca consignar".
- Los errores dicen qué pasó y cómo arreglarlo: "Te falta decir cuánto cobra en total (con domi)".
- Nada de jerga técnica en pantalla.

---

## 8. Fases de construcción

| Fase | Entrega | Listo cuando… |
|---|---|---|
| **0. Base** | Proyecto Next.js, Tailwind, Drizzle, conexión a Postgres, lint, Vitest, Playwright y layout con la marca | `pnpm dev` muestra la pantalla de entrada con la marca |
| **1. Autenticación y usuarios (M1)** | Login, sesiones, roles, pantalla Equipo, semilla del Administrador | El Administrador crea un Mensajero, este entra, y la URL de registro no existe |
| **2. Pedidos (M2)** | Formulario, atajo de WhatsApp, listas, editar, cancelar, reasignar, copiar | Pruebas de estados y permisos en verde |
| **3. Mensajero (M3) + fotos** | Pantalla ordenada, salida por lote con una foto, entregar, problema, devuelto | E2E: crear pedido → salir → entregar, con fotos guardadas en Blob |
| **4. Cierres (M4)** | Cálculo, bloqueos, consignación, cierre | Pruebas de las reglas 3–6 con casos de neto positivo, negativo y cero, y con pedidos de mañana |
| **5. Panel del Administrador (M5)** | Hoy, cierres, periodo, historial, filtros, CSV | El Administrador ve el "Mes pasado" completo y exporta el CSV. Cualquier intento de escribir devuelve error |
| **6. Notificaciones y Ajustes (M6, M7)** | Correos, cron 10 p. m., pantalla Ajustes | Llega el correo de prueba con el formato de cierre |
| **7. Auditoría y métricas (M8)** | Eventos y métricas del piloto | El historial muestra la línea de tiempo de cada pedido |
| **8. Pulido y despliegue** | Accesibilidad, estados vacíos, cargas, despliegue en Vercel | La app funciona en producción y pasa el checklist de la sección 10 |

**Datos de prueba** (`pnpm db:seed:demo`): usuarios Leo (Administrador), Ana (Colaboradora), Teo y Luz (Mensajeros) y unos 10 pedidos de ejemplo en distintos estados.

---

## 9. Despliegue en Vercel

1. Crea el proyecto en Vercel y agrega Neon Postgres y Vercel Blob desde el Marketplace. Las variables de entorno se configuran solas.
2. Agrega a mano estas variables: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `ADMIN_USUARIO`, `ADMIN_PASSWORD`, `CRON_SECRET`.
3. Corre las migraciones en cada despliegue (`drizzle-kit migrate`).
4. **Cron:** `vercel.json` con el chequeo de las 10 p. m. de Bogotá (`0 3 * * *` en UTC). La ruta del cron verifica `CRON_SECRET`.
   - **Límite:** el plan gratuito de Vercel solo permite crons diarios y sin hora exacta. Por eso los pedidos demorados se alertan en vivo dentro de la app. Si se necesita un correo cada 15 minutos, hace falta el plan Pro o un servicio externo que llame a la ruta protegida.
5. Dominio: `orderapp.vercel.app` o un subdominio de QFP.

---

## 10. Seguridad (checklist obligatorio)

- [ ] Contraseñas con hash (Better Auth) y nunca en texto plano.
- [ ] Rol revisado en el servidor en cada acción y consulta. El mensajero solo puede leer o modificar sus propios pedidos.
- [ ] Toda entrada validada con Zod y textos limitados en largo.
- [ ] Rate limit en el login.
- [ ] Fotos: URLs no adivinables. Se muestran solo dentro de la app a usuarios con sesión (si Blob lo permite, como privadas a través de una ruta protegida).
- [ ] Cookies `httpOnly`, `secure` y `sameSite=lax`.
- [ ] Respaldo: activar la recuperación a un punto en el tiempo de Neon y documentar cómo restaurar.
- [ ] La cuenta de Vercel y la base de datos a nombre de la **empresa**, no de una persona.

---

## 11. Fuera de alcance por ahora (no construir)

- Login con Google.
- Pantalla de seguridad avanzada para el Administrador.
- Modo sin señal (cola de fotos sin conexión). Solo se construye si el piloto muestra que pasa más de una vez por semana.
- App nativa (la web en el celular basta) y pagos en línea.
