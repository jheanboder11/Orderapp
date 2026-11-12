# agents.md — Cómo le gusta a Jhean que se construya

> Lo que Claude aprende sobre cómo crear código y productos para Jhean. Se actualiza con criterio: solo entra lo que sirve para el próximo proyecto parecido.
> **Entra:** gustos y reglas que Jhean dice (o aprueba claramente) y que se repetirían. **No entra:** datos de un solo pedido, nombres de personas, correos, PIN, cifras que cambian, ni cosas que Claude supone sin que él las confirme.

## Regla #1: todo gira alrededor de quien usa la app
- Antes de poner cada palabra, frase, botón o paso, preguntarse: ¿le sirve a esta persona (Administrador, Colaborador o Mensajero)? ¿Cómo lo va a usar? ¿Cómo lo va a ver en su pantalla?
- Si algo no le sirve a nadie, no va. Si un paso se puede quitar, se quita.

## Cómo comunicarse
- Español, lenguaje simple. Jhean **no es programador**: instrucciones paso a paso y cada concepto técnico explicado en palabras sencillas.
- Respuestas cortas y al grano, con un ejemplo fácil (como para un niño de 10 años).
- Ser **crítico**: decir qué falla, qué riesgo hay y qué opción es mejor, aunque no sea lo que él espera. No darle la razón por defecto.
- Si algo es muy complejo, avisar y dar una alternativa más simple o una herramienta que ya exista.

## Cómo construir
- **Empezar simple.** Primero las funciones esenciales; lo demás se desactiva o se aplaza.
- **Probar con un piloto antes de escalar** y medir con datos reales. Durante el piloto no se agregan funciones.
- Herramientas gratis o baratas que él pueda mantener. Si el plan gratis sirve, el gratis. Si una herramienta paga es necesaria para el objetivo, se paga, pero se le dice el costo antes. Versión actual: Next.js + PostgreSQL (Neon) en Vercel, código en GitHub.
- Seguridad básica y fácil: usuario + contraseña por persona, validados en el servidor, no solo en la pantalla.
- El código debe quedar probado antes de entregarlo y venir con pasos de instalación que un no programador pueda seguir.
- Pensar en el usuario final: nada tedioso, que le ahorre clics y le sea útil (si no, no lo usan).

## Cómo debe verse y sentirse
- Simple: no saturar la vista ni la mente. Un botón importante destacado por pantalla.
- Separar por módulos con una barra de navegación; nada amontonado en la pantalla de inicio.
- Cálido, tipo Airbnb: tarjetas claras con esquinas redondeadas.
- Producto propio, sin marca de un cliente: tinta + naranja (solo en la acción principal), tipografía Plus Jakarta Sans, logo Orderapp.
- Emojis que representen cada cosa (📦 🏍️ ✅ 📸 💵).
- Pensado para celular, con una mano y al aire libre: botones grandes, buen contraste.

## Cómo hablarle al usuario de la app
- Vocabulario cercano y de la calle, no técnico: "haz el cierre", "ya salí con el pedido", "copia y pega".
- Que se note que se valora al colaborador y al administrador.
- Nombres de roles (Administrador = jefe, Colaborador = logística, Mensajero) en lugar de nombres de personas.

## Cómo trabajar con él
- Hacer exactamente lo que pide, sin extras. Al terminar, reportar solo novedades (hecho / problema / duda) en 2-5 líneas. Dudas solo si bloquean; si no, decidir y mencionarlo en una línea.
- La carpeta Orderapp es "la casa" de Claude: puede ordenar, crear y mejorar documentos sin pedir permiso, con prudencia. Lo irreversible se confirma antes.
- Presentar 2 opciones cuando es decisión de diseño o producto, y dejarlo elegir.
- Pedirle ejemplos reales (capturas, formatos que ya usa) para copiar lo que ya funciona en vez de inventar.
- Todo lo del proyecto se guarda en la carpeta Orderapp.

## Por confirmar (aún no es regla)
- Tema oscuro: por ahora solo claro.
