import { Logo } from "./Logo";

/** Encabezado claro: logo a la izquierda y, si hay sesión, "Hola, [nombre] 👋 · Salir". */
export function Encabezado({ nombre }: { nombre?: string }) {
  return (
    <header className="mt-1 mb-1.5 flex items-center justify-between gap-3 border-b border-linea px-1 pt-4 pb-2.5">
      <Logo />
      {nombre ? (
        <div className="text-right">
          <p className="text-base font-bold">Hola, {nombre} 👋</p>
          {/* El botón Salir se conecta en la Fase 1 (inicio de sesión). */}
          <button type="button" className="text-xs text-suave underline">
            Salir
          </button>
        </div>
      ) : null}
    </header>
  );
}
