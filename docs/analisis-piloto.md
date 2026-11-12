# Análisis de datos del piloto

> Documento vivo. Se llena cuando el Administrador entregue los datos del periodo de prueba. Hasta entonces, todo lo marcado como **PENDIENTE** está vacío a propósito: no se inventan cifras.

**Periodo analizado:** PENDIENTE (fecha inicio – fecha fin)
**Fuente de datos:** base de datos de Orderapp (pedidos, cierres, auditoría y fotos) + export CSV del panel del Administrador
**Roles que participaron:** Administrador · Colaborador · Mensajero

---

## 1. Resumen en 5 líneas
PENDIENTE. Se escribe al final: qué pasó, qué número mejoró, qué falló, qué se decide.

---

## 2. Dashboard (los números que importan)

| # | Indicador | Base (antes de la app) | Resultado piloto | ¿Mejoró? |
|---|---|---|---|---|
| 1 | Tiempo promedio de creación a entrega | ~5 h | PENDIENTE | PENDIENTE |
| 2 | Pedidos con problema (de cada 50) | ~3 de 50 (6 %) | PENDIENTE | PENDIENTE |
| 3 | Cierres donde el dinero cuadró | "casi siempre" | PENDIENTE | PENDIENTE |
| 4 | Tiempo de trabajo del proceso | ~2 h al día | PENDIENTE | PENDIENTE |
| 5 | Tiempo en hacer el cierre del día | el paso más tedioso | PENDIENTE | PENDIENTE |
| 6 | Pedidos con ambas fotos completas | no existía | PENDIENTE | n/a |
| 7 | Pedidos estancados (alerta disparada) | no se medía | PENDIENTE | n/a |
| 8 | Cierres hechos antes de las 10 pm | no se medía | PENDIENTE | n/a |

**Gráficos a incluir (cuando haya datos):**
- Pedidos por día (entregados vs. con problema).
- Tiempo por etapa: creado → empacado → salió → entregado.
- Motivos de problema (barras).
- Neto de cada cierre (efectivo − pago de domis) por día.

---

## 3. Preguntas clave y respuestas

| Pregunta | Cómo se responde | Respuesta |
|---|---|---|
| ¿La app redujo el tiempo de creación a entrega? | Promedio de horas, comparado con ~5 h | PENDIENTE |
| ¿Bajaron los pedidos con problema? | % de problemas vs. 6 % base | PENDIENTE |
| ¿Cuál es el motivo de problema más común y se podía evitar? | Conteo por motivo | PENDIENTE |
| ¿El dinero cuadró en cada cierre? | Diferencias entre lo esperado y lo consignado | PENDIENTE |
| ¿Cuánto trabajo le ahorró al Administrador? | Horas por día antes vs. durante | PENDIENTE |
| ¿Los Mensajeros cumplieron con las fotos sin que les pareciera tedioso? | % de pedidos con fotos + comentarios | PENDIENTE |
| ¿Dónde se pierde más tiempo en el proceso? | Etapa con mayor demora promedio | PENDIENTE |
| ¿Las alertas sirvieron o fueron ruido? | Alertas disparadas vs. acciones tomadas | PENDIENTE |
| ¿El Administrador encontró lo que necesita para decidir? | Uso de Hoy, Cierres e Historial + su opinión | PENDIENTE |
| ¿Quieren seguir usando la app? | Respuesta de cada rol | PENDIENTE |

---

## 4. Qué funcionó
PENDIENTE. Regla: solo entra lo que se pueda probar con un dato.
- Formato: **Qué funcionó → dato que lo prueba → por qué creemos que pasó.**

## 5. Qué no funcionó
PENDIENTE. Mismo formato:
- **Qué falló → dato que lo prueba → a quién afectó (Administrador / Colaborador / Mensajero).**

---

## 6. Problemas y soluciones

| # | Problema | Evidencia (dato) | Gravedad (alta/media/baja) | Solución propuesta | Esfuerzo | Quién la hace |
|---|---|---|---|---|---|---|
| 1 | PENDIENTE | | | | | |
| 2 | PENDIENTE | | | | | |

**Regla de prioridad:** primero lo que afecta la plata o la evidencia; después lo que hace tedioso el uso; al final lo estético.

---

## 7. Decisión
Con los datos, una de tres:
- **Seguir como está** → los indicadores 1 a 5 mejoraron y los roles quieren usarla.
- **Ajustar y repetir** → mejoró en algo, pero hay problemas graves con solución clara.
- **Parar o replantear** → no mejoró nada medible o nadie la quiere usar.

**Decisión tomada:** PENDIENTE

### Criterios de éxito (propuestos, por confirmar con el Administrador antes del análisis)
- Tiempo de creación a entrega: menor al base.
- Pedidos con problema: igual o menor al base.
- Cierre: dinero cuadra en todos los días o las diferencias se explican.
- Trabajo del Administrador: baja de forma notable.
- Los tres roles dicen que la seguirían usando.

---

## 8. Cómo se hace el análisis (método)
1. Exportar el CSV del periodo desde el panel del Administrador (o pedirle a Claude la consulta directa a la base de datos).
2. Revisar que estén completos (fechas, horas de cada acción, fotos, valores). Anotar lo que falte.
3. Calcular los indicadores del punto 2.
4. Comparar contra la base y marcar si mejoró.
5. Buscar la causa de los problemas en los datos, no en suposiciones.
6. Llenar secciones 3 a 7 y construir el dashboard visual.

### Limitaciones a tener en cuenta
- Pocos pedidos por día (~10), así que una sola semana da una muestra pequeña. Un resultado malo o bueno puede ser casualidad.
- Los números base son estimados de memoria, no medidos. Si el piloto mide mejor que antes, parte de la mejora puede ser solo mejor medición.
- Participan pocas personas, así que cualquier hábito personal pesa mucho en el resultado.

---

## 9. Datos que necesito del Administrador cuando llegue el momento
- Acceso al CSV del periodo (o a la base de datos).
- Confirmar que los cierres del periodo coinciden con las consignaciones reales del banco.
- Opinión corta de cada rol: Administrador, Colaborador, Mensajero (qué les sirvió, qué les estorbó).
