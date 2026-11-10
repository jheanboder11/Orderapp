import { salir } from "@/modules/auth/actions";
import { Logo } from "./Logo";

/** Encabezado claro: logo a la izquierda y, si hay sesión, "Hola, [nombre] 👋 · Salir". */
export function Encabezado({ nombre }: { nombre?: string }) {
  return (
    <header className="mt-1 mb-1.5 flex items-center justify-between gap-3 border-b border-linea px-1 pt-4 pb-2.5">
      <Logo />
      {nombre ? (
        <div className="text-right">
          <p className="text-base font-bold">Hola, {nombre} 👋</p>
          <form action={salir}>
            <button type="submit" className="cursor-pointer text-xs text-suave underline">
              Salir
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
