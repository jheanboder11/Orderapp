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
- Entrar con usuario + PIN/contraseña. Solo el Administrador crea usuarios.
- Crear pedido pegando el mensaje de WhatsApp (la app llena los campos).
- Editar (solo empacado), cancelar con motivo, reasignar mensajero, copiar datos.
- Mensajero: una foto para salir con todos sus paquetes, foto al entregar, "No pude entregarlo" con motivo, botones Llamar · Mapa · WhatsApp.
- Cierre del mensajero: efectivo − pago de domis = lo que consigna (o lo que la empresa le consigna), con foto de la consignación.
- Alerta de pedidos demorados (120 min Medellín, 180 otras zonas).
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
- 2026-11-08: carpeta del proyecto lista para Claude Code + plan actualizado a roles nuevos y diseño sin marca.
- 2026-11-05: roles nuevos (Administrador = jefe, Colaborador, Mensajero). "En calle" → "En proceso".
- 2026-11-04: Historial de 10 días unificado con detalle por día y por pedido.
- 2026-11-03: app sin marca (Orderapp), módulos con barra de navegación, módulo Equipo.
