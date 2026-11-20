# Orderapp: guía de diseño y prompt para Claude Code

> Pega este archivo completo en Claude Code (o guárdalo como `DESIGN.md` en la raíz del proyecto y dile: "Lee DESIGN.md y úsalo como fuente de verdad para toda la interfaz"). Adjunta también las capturas de las pantallas de referencia.

## 1. Qué es Orderapp

Orderapp es una app web (mobile-first) para que una empresa pequeña organice y controle sus domicilios: que no se pierda ningún pedido, que cada entrega tenga evidencia (foto) y que el cierre del día cuadre sin dolor.

Lema: **"Domicilios en orden"**.

Usuarios y roles (usa siempre estos nombres, nunca nombres de personas):
- **Administrador**: el dueño o jefe. Ve todo, analiza números, crea usuarios y revisa los cierres.
- **Colaborador**: empleado de logística. Atiende al cliente por WhatsApp, registra el domicilio, empaca, se lo entrega al Mensajero y resuelve problemas.
- **Mensajero**: entrega. Toma fotos de salida y de entrega, cobra, reporta problemas y hace su cierre diario.

Estados de un domicilio: **Empacado → En camino → Entregado**, y **Con problema** como desvío. Regla de negocio: sin foto no avanza el estado (foto al salir del local y foto al entregar). Cada acción guarda su hora automáticamente.

## 2. Qué debe transmitir (la esencia)

1. **Orden sin esfuerzo.** Se siente como "alguien ya organizó esto por mí". Una cosa importante por pantalla.
2. **Calidez y cercanía.** Es una herramienta de trabajo que se siente amable, no una hoja de cálculo ni un sistema de oficina. Habla como una persona.
3. **Confianza.** Los números cuadran y todo queda con evidencia. Esto lo da el orden, el aire y la claridad, no la frialdad.
4. **Facilidad para el que trabaja de pie.** Un Mensajero en la calle con una mano ocupada debe poder usarla: botones grandes, poco texto, pasos claros.
5. **Un toque de ánimo.** Pequeños detalles (resaltador de color en una palabra del título, mensaje verde cuando todo va bien) hacen que dé gusto abrirla.

Referencias y qué se tomó de cada una:
- **Rappi:** una sola pregunta al centro y un color que se nota.
- **Nu:** títulos grandes, mucho aire, botones en forma de píldora, tono humano.
- **Airbnb:** tarjetas muy redondeadas con sombra suave, barra de navegación flotante, orden visual.

No copiar el naranja de Rappi. La marca es **Guayaba y Menta**.

## 3. Sistema visual

### Colores (tokens)
| Token | Hex | Uso |
|---|---|---|
| `guayaba` | `#E8316B` | Fondos de botones principales, acentos, iconos. Texto blanco encima solo si es 18.7px+ o negrita grande |
| `frambuesa` | `#B3174D` | Texto pequeño de marca, enlaces, texto en chips activos (cumple contraste) |
| `rosa-suave` | `#FFE3EB` | Fondo del tab activo, insignias, cajas de énfasis |
| `algodon` | `#FFF5F7` | Fondo de la app |
| `ciruela` | `#2B0F24` | Texto principal y fondo de filtros activos |
| `ciruela-suave` | `#7A5C6B` | Texto secundario |
| `menta` | `#8FE8CB` | Acento: resaltador de palabra del título, insignia del contador, pasos completados |
| `menta-fondo` / `menta-texto` | `#D9F7EC` / `#0B6B4F` | Estado "Entregado", cuadres correctos, mensajes de que todo va bien |
| `ambar-fondo` / `ambar-texto` | `#FFEBC2` / `#7A4B00` | Estados "Con problema", "Estancado", alertas |
| Bordes | `#F3E0E6`, `#FFCCD9`, `#FFA5BD` | Tarjetas, botones secundarios, estados vacíos con línea punteada |

Regla: guayaba es el protagonista y solo se usa en **una acción principal por pantalla**. Menta es el acento chiquito. Ámbar solo para "necesita atención". No agregar más colores.

### Tipografía
- **Plus Jakarta Sans** (Google Fonts), pesos 400, 500, 600, 700, 800.
- Títulos de pantalla: 32px, peso 800, interlineado 1.1, `letter-spacing: -0.035em`. Una palabra del título lleva resaltador: color guayaba y un subrayado de menta en el 38% inferior (`linear-gradient(transparent 62%, menta 62%)`).
- Texto de tarjeta: 15 a 16px peso 700 o 800 para el dato principal; 13px peso 500 en `ciruela-suave` para el apoyo.
- Botón principal: 19px peso 700.
- Etiquetas pequeñas de marca: 10 a 13px, mayúsculas con `letter-spacing: 0.14em`.

### Forma y espacio
- Radios: tarjetas 22 a 28px, campos 18px, botones y chips en píldora (999px), tab activo 20px.
- Padding de pantalla 18px; separación entre bloques 16px; padding interno de tarjeta 14 a 18px.
- Sombras suaves y con tinte de color, nunca grises duras. Ejemplo tarjeta: `0 14px 30px -22px rgba(43,15,36,.4)`. Botón principal: `0 14px 24px -12px rgba(232,49,107,.75)`. Tarjeta protagonista: `0 24px 44px -24px rgba(232,49,107,.45)`.
- Objetivos táctiles de mínimo 44px; botones principales de 56px.
- Iconos de línea (estilo Lucide), trazo 2.2, esquinas redondeadas. No usar emojis como iconos.

### Fondo (el detalle de marca)
El fondo no es plano. Detrás de la parte superior de cada pantalla hay tres capas muy sutiles, nunca encima del contenido:
1. Un resplandor radial guayaba (alpha ~0.20) en la esquina superior derecha.
2. Una rejilla de puntos guayaba (alpha ~0.28, 22px) que se desvanece hacia abajo con una máscara.
3. Una línea punteada de "ruta" con dos nodos, a baja opacidad, que sugiere un recorrido de domicilio.
Si estorban la lectura, bajar la opacidad antes de quitarlas.

### Logo
Cuadrado redondeado guayaba (radio ~31%) con un pin de ubicación blanco y un check guayaba adentro. Junto a él, el nombre `orderapp` en minúscula, peso 800, y debajo `DOMICILIOS EN ORDEN` en mayúsculas pequeñas.

## 4. Componentes clave
- **Encabezado:** logo a la izquierda, avatar circular de 44px a la derecha.
- **Título de pantalla** con saludo pequeño arriba ("Hola, Ana · Colaborador").
- **Tarjeta protagonista** (blanca, radio 28, sombra con tinte guayaba) para la acción más importante de la pantalla.
- **Campo de texto:** etiqueta arriba (13px, peso 700), caja de 54px con icono a la izquierda. Estado activo: borde guayaba de 2px y anillo suave `0 0 0 5px rgba(232,49,107,.14)`.
- **Botón principal** (píldora guayaba, texto blanco 19px) y **botón secundario** (píldora blanca, borde `#FFCCD9`, texto frambuesa).
- **Chip de estado:** píldora de 26px con punto de color: Empacado (gris rosado), En camino (rosa suave), Entregado (menta), Con problema (ámbar).
- **Tarjeta de pedido:** número `#N` en una caja rosa suave, nombre del cliente, barrio y hora, chip de estado, y a la derecha el valor y la forma de pago.
- **Línea de pasos** (entrega): círculo menta con check para lo hecho, círculo con anillo guayaba para lo actual, círculo punteado para lo pendiente.
- **Resumen de cierre** tipo recibo: filas etiqueta/valor, línea punteada y una caja menta con el valor "Para consignar".
- **Barra de navegación flotante** abajo: píldora blanca con sombra, el tab activo con fondo rosa suave y texto frambuesa. Una insignia menta con el número de alertas. Cada rol ve sus propios tabs.
  - Colaborador: Pedidos, Nuevo, Alertas.
  - Mensajero: Entregas, Cierre.
  - Administrador: Resumen, Equipo, Cierres.

## 5. Pantallas de referencia (ver capturas adjuntas)
1. **Nuevo domicilio (Colaborador):** título "¿Qué domicilio vamos a enviar hoy?". Aviso de alertas arriba. Tarjeta protagonista "Pega el chat de WhatsApp" con botón "Llenar con este mensaje". Separador "o llénalo a mano". Formulario con nombre, celular y dirección.
2. **Pedidos (Colaborador):** filtros en píldora y lista de tarjetas de pedido.
3. **Alertas (Colaborador):** una tarjeta por problema con botones "Llamar" y "Resolver", y un mensaje menta de que lo demás va bien.
4. **Entrega (Mensajero):** datos del cliente, copiar dirección, abrir mapa, cuánto cobrar, línea de pasos y los botones "Tomar foto de entrega" y "Tuve un problema".
5. **Cierre del día (Mensajero):** resumen tipo recibo (efectivo recibido, menos el pago por domicilios, menos domis de días anteriores, igual a lo que debe consignar), revisión de fotos y el botón "Hacer el cierre".
6. **Resumen (Administrador):** cuatro números del día, cierres de la semana con su estado y el equipo de hoy.

## 6. Voz y textos
- Español colombiano, cercano y claro. Frases cortas. Tuteo.
- Hablar de la acción, no del sistema: "Llenar con este mensaje", "Hacer el cierre", "Tuve un problema", "Tomar foto de entrega".
- Los errores y las alertas ayudan, no regañan: "Falta la foto de entrega", no "Error: campo requerido".
- Los mensajes de éxito son sobrios y breves: "Los otros 3 domicilios van bien."
- Nunca usar nombres propios de empleados en la interfaz ni en el código de ejemplo: solo los roles.

## 7. Reglas de experiencia de usuario
- Antes de poner cada palabra, frase, botón o proceso, preguntarse: ¿le sirve a esta persona (Administrador, Colaborador o Mensajero)? ¿Cómo lo va a usar? ¿Cómo lo va a ver?
- Una acción principal por pantalla. Lo demás, secundario.
- El Mensajero necesita lo mínimo: pocos campos, botones grandes, fotos fáciles.
- Menos es más: si algo no se usa en el piloto, no se muestra.
- Accesibilidad: contraste mínimo 4.5:1 en texto (3:1 en texto grande de 18.7px+ en negrita), botones y campos reales (`button`, `a`, `input` con `label`), `aria-label` en iconos sin texto, nunca depender solo del color para el estado (siempre texto en el chip).

## 8. Implementación (para Claude Code)
- Stack: **Next.js (App Router) + Tailwind CSS + PostgreSQL**, desplegado en Vercel. Autenticación sencilla con usuario y contraseña; solo el Administrador crea usuarios.
- Define los colores, radios y sombras como tokens en `tailwind.config` y variables CSS (`--guayaba`, `--frambuesa`, etc.). No pongas colores "a mano" en los componentes.
- Carga Plus Jakarta Sans con `next/font/google`.
- Crea primero una librería de componentes reutilizables (`Button`, `Card`, `Chip`, `Field`, `NavBar`, `Stepper`, `ReceiptRow`, `ScreenHeader`) y construye las pantallas con ellos.
- Mobile-first a 390px de ancho; en escritorio, centrar un contenedor de máximo 480px para el Colaborador y el Mensajero. La vista del Administrador puede ser más ancha.
- Trabaja por fases y pídeme confirmación al terminar cada una:
  1. Tokens, fuente, fondo con las tres capas y componentes base.
  2. Pantalla Nuevo domicilio y Pedidos.
  3. Alertas y Entrega (con fotos obligatorias).
  4. Cierre del día y Resumen del Administrador.
- Antes de escribir código, resume en 5 líneas cómo entendiste el estilo y qué te falta saber. Si algo choca con esta guía, avísame en vez de improvisar.
