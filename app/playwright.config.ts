import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const PUERTO = 3100;
// Una IP inventada por corrida, para que el límite por IP no se acumule entre corridas.
const IP_PRUEBA = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // La base de datos está lejos (São Paulo): se da más tiempo a cada espera.
  expect: { timeout: 15_000 },
  timeout: 90_000,
  globalTeardown: "./e2e/limpiar.ts",
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    extraHTTPHeaders: { "x-forwarded-for": IP_PRUEBA },
  },
  // Pensada para celular primero.
  projects: [{ name: "celular", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { BETTER_AUTH_URL: `http://localhost:${PUERTO}` },
  },
});
