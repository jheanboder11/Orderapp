# Orderapp: qué es y qué hace

> Documento vivo. Se actualiza cada vez que cambia una función.

## Qué es
Una app web para que un negocio pequeño maneje sus domicilios sin perder pedidos, paquetes ni plata. Primer cliente: una tienda en Medellín con unos 10 domicilios al día.

## Roles
| Rol | Quién es | Módulos |
|---|---|---|
| **Administrador** | El jefe | 💰 Hoy · 🧾 Cierres · 🗂️ Historial (10 días) · 👥 Equipo (crea usuarios) |
| **Colaborador** | Logística: vende, empaca y despacha | 📋 Pedidos (Hoy · Mañana · Ayer) · ➕ Nuevo |
| **Mensajero** | Entrega | 🏍️ Entregas · 🧾 Cierre · ✅ Hechos |

## Funciones activas
- Entrar con usuario + contraseña (no importan mayúsculas ni tildes). La sesión dura 30 días en el celular.
- Contraseña: Mensajero solo números (mínimo 6); Colaborador y Administrador mínimo 8.
- 5 intentos fallidos = ese usuario queda bloqueado 10 minutos (el Administrador lo desbloquea al ponerle contraseña nueva).
- 👥 Equipo (solo Administrador): crear usuarios, poner contraseña nueva, desactivar/activar cuentas (no se borran). Nadie se registra solo.
- Crear pedido pegando el mensaje de WhatsApp (la app llena los campos y dice qué no encontró). El domi se calcula solo por zona.
- El total (con domi) se pide siempre, aunque el cliente ya haya pagado, y debe ser mayor que el domi.
- Número del pedido por día (#1, #2…). Para hoy o para mañana, con hora límite opcional.
- Listas Hoy · Mañana · Ayer. Editar (solo empacado), cancelar con motivo (confirmación dentro de la tarjeta), cambiar mensajero, copiar para WhatsApp, "Ya recibí el paquete de vuelta" (Problema → Devuelto).
- La lista se actualiza sola cada minuto. Numerito naranja en 📋 Pedidos = demorados + problemas.
- Cada cambio de un pedido queda anotado (auditoría invisible).
- Mensajero: una foto para salir con todos sus paquetes, foto al entregar, "No pude entregarlo" con motivo, botones Llamar · Mapa · WhatsApp.
- Cierre del mensajero: efectivo − pago de domis = lo que consigna (o lo que la empresa le consigna), con foto de la consignación.
- Alerta de pedidos demorados (120 min Medellín, 180 otras zonas) con botón "💬 Escribirle" (abre WhatsApp con el mensaje listo).
- Administrador: ventas del día (sin domis), domicilios, efectivo vs transferencia, cierres por mensajero, historial de 10 días con detalle y filtro de problemas.
- Correo con el resumen de cierre.

## Reglas de negocio
- Domi: 12.000 Medellín · 15.000 Aledaño · 15.000 Especial. El valor del pedido **incluye** el domi.
- Pago del mensajero = valor de los domis entregados.
- Cierre por entregas (puede haber varios al día). Los pedidos de mañana no bloquean el cierre.
- Estados: Empacado → En entrega → Entregado | Problema → Devuelto | Cancelado.

## Pendiente / ideas
- Botón "Avisar al cliente" (tu pedido va en camino).
- Modo sin señal (solo si pasa seguido).
- Quitar los accesos de prueba antes de usarla de verdad.

## Historial de cambios
- 2026-11-09: Fase 2 lista: pedidos del Colaborador (crear con atajo de WhatsApp, listas, editar, cancelar, reasignar, copiar, devuelto, alerta de demorados) y 10 pedidos de ejemplo.
- 2026-11-09: Fase 1 lista: inicio de sesión real, roles, pantalla Equipo, bloqueo por intentos y cuentas de prueba (Ana, Teo, Luz).
- 2026-11-09: Fase 0 lista: proyecto Next.js en app/ con la marca Orderapp y la pantalla de entrada (todavía sin iniciar sesión de verdad). Pruebas automáticas funcionando.
- 2026-11-08: carpeta del proyecto lista para Claude Code + plan actualizado a roles nuevos y diseño sin marca.
- 2026-11-05: roles nuevos (Administrador = jefe, Colaborador, Mensajero). "En calle" → "En proceso".
- 2026-11-04: Historial de 10 días unificado con detalle por día y por pedido.
- 2026-11-03: app sin marca (Orderapp), módulos con barra de navegación, módulo Equipo.
