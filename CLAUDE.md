# Instrucciones para Claude Code (léelas siempre primero)

1. La especificación completa está en **PLAN-orderapp-nextjs.md**. Constrúyela **por fases, en orden**, y espera la revisión de Jhean al terminar cada fase.
2. Cómo trabajar con Jhean: **docs/agents.md**. Resumen: no es programador; explícale todo en español simple, paso a paso; sé crítico; respuestas cortas.
3. Qué hace la app hoy: **docs/funciones.md**. Actualízalo cuando cambie una función.
4. Referencia (no se edita): **referencia/Code.gs** (reglas de negocio del piloto), **referencia/Index.html** (pantallas, textos y `parseMsg`) y **referencia/demo/index.html** (demo navegable, PIN 1234: la referencia visual exacta).
5. Construye el proyecto Next.js en una carpeta nueva **app/** dentro de esta carpeta, sin mover los documentos.
6. Nunca subas secretos a GitHub: `.env.local` va en `.gitignore`. Usa `.env.example` como plantilla.
7. Roles: **Administrador** = jefe (ve todo y crea usuarios), **Colaborador** = logística (maneja pedidos), **Mensajero** = entrega.
