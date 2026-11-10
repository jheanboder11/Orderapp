/** Carga .env.local para los scripts. Debe importarse antes que todo lo demás. */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
