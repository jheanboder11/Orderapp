# Instrucciones para Claude Code (léelas siempre primero)

1. La especificación completa está en **PLAN-orderapp-nextjs.md**. Constrúyela **por fases, en orden**, y espera la revisión de Jhean al terminar cada fase.
2. Cómo trabajar con Jhean: **docs/agents.md**. Resumen: no es programador; explícale todo en español simple, paso a paso; sé crítico; respuestas cortas.
3. Qué hace la app hoy: **docs/funciones.md**. Actualízalo cuando cambie una función.
4. Referencia (no se edita): **referencia/Code.gs** (reglas de negocio del piloto), **referencia/Index.html** (pantallas, textos y `parseMsg`) y **referencia/demo/index.html** (demo navegable, PIN 1234: la referencia visual exacta).
5. Construye el proyecto Next.js en una carpeta nueva **app/** dentro de esta carpeta, sin mover los documentos.
6. Nunca subas secretos a GitHub: `.env.local` va en `.gitignore`. Usa `.env.example` como plantilla.
7. Roles: **Administrador** = jefe (ve todo y crea usuarios), **Colaborador** = logística (maneja pedidos), **Mensajero** = entrega.
8. Dónde vamos y qué sigue: **docs/estado.md**. Léelo al empezar y actualízalo al terminar cada sesión de trabajo.
9. Datos del piloto y su análisis: **docs/analisis-piloto.md**. No se inventan cifras.

## Contexto de Jhean (sus negocios, cómo hablarle, prioridades)
@contexto-jhean.md

## Trabajo en varios computadores (OBLIGATORIO)
Jhean trabaja en 2 o más PCs. **GitHub es la única memoria compartida**: la memoria local de Claude (`~/.claude`) NO viaja entre PCs, así que todo lo que deba recordarse va en esta carpeta.
- **Al empezar:** un hook (`.claude/settings.json`) hace `git pull` solo. Si sale un AVISO, resuélvelo antes de trabajar. Luego lee **docs/estado.md**.
- **Cuando Jhean cuente algo nuevo** (de cualquier negocio, decisión, cifra, cambio de prioridad): actualiza **contexto-jhean.md** en ese momento. Si es de Orderapp, también **docs/estado.md**.
- **Al terminar algo importante o la sesión:** actualiza la Bitácora de docs/estado.md, haz commit y `git push`. Nunca dejes cambios sin subir: el otro PC no los verá.
- Preferencias de cómo trabajar van en **docs/agents.md**, no en la memoria local.
- Si `git pull` choca con cambios locales: no borres nada; explícale a Jhean qué pasó en una línea y propón la solución.
