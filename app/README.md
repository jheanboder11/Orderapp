# Orderapp (código de la app)

App web de domicilios hecha con Next.js. El plan completo está en `../PLAN-orderapp-nextjs.md`.

## Instalar en tu computador (una sola vez)

1. Instala **Node.js 20 o más nuevo** desde https://nodejs.org (botón "LTS").
2. Abre una terminal **en esta carpeta `app`** y escribe:
   ```
   npm install -g pnpm
   pnpm install
   ```
3. Copia el archivo `.env.example` y renombra la copia a `.env.local`. Ahí van las "llaves" secretas
   (por ejemplo la dirección de la base de datos). **Ese archivo nunca se sube a GitHub.**

## Ver la app

```
pnpm dev
```
Abre http://localhost:3000 en el navegador. Para verla como en el celular: clic derecho → Inspeccionar → ícono de celular.

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Prende la app en tu computador |
| `pnpm revisar` | Revisa el código y corre las pruebas rápidas |
| `pnpm test:e2e` | Prueba la app en un navegador de verdad (tamaño celular) |
| `pnpm db:probar` | Dice si la app logra conectarse a la base de datos |
| `pnpm db:generate` / `pnpm db:migrate` | Crean y aplican cambios en las tablas de la base de datos |

La primera vez que corras `pnpm test:e2e` instala el navegador de pruebas con `pnpm exec playwright install chromium`.
