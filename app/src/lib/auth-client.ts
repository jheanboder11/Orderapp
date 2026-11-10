"use client";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Cliente de inicio de sesión que usa el navegador. */
export const authClient = createAuthClient({ plugins: [usernameClient()] });
