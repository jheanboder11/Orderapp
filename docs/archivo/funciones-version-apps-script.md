# Funciones de la app

> Documento vivo. Se actualiza cada vez que la app cambia. Lo nuevo va arriba en "Historial".

## De qué se trata
App web para organizar y controlar los domicilios de QFP Chaquetas (unos 10 al día). Evita que se pierdan pedidos, paquetes o plata, deja evidencia con fotos y hace sola el cierre del día de cada mensajero.

- **Tecnología:** Google Apps Script (la página) + Google Sheets (la base de datos) + Google Drive (fotos) + Gmail (correos).
- **Estado:** piloto de 2 semanas, funciones congeladas.

## Quién la usa
| Rol | Qué hace |
|---|---|
| Administrador | Parte manual: crea y reasigna pedidos, pone los datos, ve todo, recibe las alertas |
| Líder | Solo mira y decide: datos, historial, ingresos, cierres y seguridad. No crea pedidos ni pone datos |
| Mensajero 1, 2, 3 | Solo ve y trabaja sus pedidos |

> Decisión (2026-10-21): el Líder tiene acceso a todo en modo lectura, pero su pantalla se enfoca en lo que necesita saber para tomar decisiones.
> Hecho: el Líder ya es solo lectura (rol "Lider" en la pestaña Usuarios). Su pantalla tiene dos pestañas: **Hoy** (ventas, efectivo, transferencia, pago de domis, cierres por mensajero y últimos 7 días) e **Historial** (últimos 80 pedidos con fotos). La pantalla de Seguridad se dejó para después.

Entrada: nombre + PIN de 4 dígitos (validado en el servidor, se bloquea tras 5 intentos).

## Demo inicial (funciones fundamentales por rol)
- **Todos:** entrar con nombre y PIN.
- **Administrador:** crear pedido · cambiar de mensajero · ver todos los pedidos con estado y fotos.
- **Mensajero:** ver sus pedidos · foto al salir · foto al entregar o "No pude" con motivo · hacer el cierre.
- **Líder (solo lectura):** resumen por mensajero (ingresos y cierres) · historial de pedidos · seguridad (quién hizo qué y las fotos de prueba) · correo del cierre.
- **Público de la demo:** primero Cristian (amigo programador, para que opine cómo mejorar la app), después el jefe.

## Funciones activas (piloto)
1. **Crear pedido:** cliente, celular, dirección, qué lleva, forma de pago, valor, mensajero, para hoy o mañana, hora límite opcional. El valor del domi se calcula solo por zona.
2. **Atajo de pegar WhatsApp:** llena el formulario desde el mensaje del cliente (opcional, siempre se revisa).
3. **Estados:** Empacado → En entrega → Entregado, o Problema → Devuelto.
4. **Fotos obligatorias:** una sola foto de todos los paquetes al "Iniciar entrega" (el mensajero sale con todos sus pedidos listos), y una foto por pedido al entregar.
5. **Problema con motivo:** lista fija (No contesta, No estaba, Dirección incorrecta, Error al empacar, Rechazó el pedido, Otro).
6. **Pedidos para mañana:** sección aparte, no bloquean el cierre de hoy.
7. **Cierre automático por mensajero:** suma lo entregado que aún no se cerró, descuenta su pago de domis; si queda plata a favor de la empresa, exige foto de la consignación.
8. **Correo de cierre** con el mismo formato que hoy se manda por WhatsApp.
9. **Alertas por correo:** pedido estancado (cada 15 min) y cierres sin hacer a las 10 pm.
10. **Hoja "Piloto":** mide las 5 preguntas del piloto (tiempo, fallas, cuadre de plata, trabajo que ahorra, si quieren seguirla usando).

## Reglas del negocio
- Domi: Medellín 12.000 · Aledaño 15.000 · Especial 15.000.
- Pago del mensajero = valor del domi, solo cuando entrega.
- Neto = efectivo recibido − pago de domis. Si es positivo el mensajero consigna; si es negativo, la empresa le consigna.
- Pedido estancado: más de 120 min (Medellín) o 180 min (otros) en la calle.
- Los pedidos de Salome no se incluyen por ahora.

## Desactivado o quitado por ahora
- Pedir ayuda y plantilla de WhatsApp (quitados para el piloto).
- AppSheet / login con cuentas Google (descartado, se usa PIN).

## Ideas pendientes (no se hacen hasta terminar el piloto)
- Historial y búsqueda de pedidos antiguos.
- Reintento de foto si la señal es mala.
- Copia de seguridad y cuenta de Google propia de la empresa.
- PIN en celulares compartidos.
- Integración con WhatsApp / Kommo (la jefa es reacia a bots y plantillas).
- Logo oficial en la barra superior.
- Dejar un solo tema visual (Claro o Noche).

## Historial
- 2026-10-21 · Mensajero: "Iniciar entrega" con una sola foto para todos los pedidos listos; la foto por pedido solo se pide al entregar.
- 2026-10-21 · Pantalla del Líder (solo lectura): ingresos, cierres, últimos 7 días e historial. El Líder ya no puede crear ni modificar pedidos.
- 2026-10-21 · Se redefine el Líder como rol de lectura y decisión; se define la demo por rol.
- 2026-10-21 · Diseño nuevo (claro, cálido, emojis, marca QFP) con opción Noche.
- 2026-10-21 · Nombres personales cambiados por roles.
- 2026-10-20 · Versión piloto: PIN, pedidos agendados, cierre por entrega, motivos, hoja Piloto, correo con el formato real.
