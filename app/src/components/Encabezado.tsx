import { salir } from "@/modules/auth/actions";
import { Logo } from "./Logo";

/** Encabezado: logo a la izquierda y, si hay sesión, círculo con la inicial + "Salir". */
export function Encabezado({ nombre }: { nombre?: string }) {
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-1 pt-5 pb-1">
        <Logo />
        {nombre ? (
          <div className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-full bg-tarjeta text-lg font-extrabold text-frambuesa shadow-suave"
            >
              {nombre.trim().charAt(0).toUpperCase()}
            </span>
            <form action={salir}>
              <button
                type="submit"
                className="mt-0.5 cursor-pointer px-1 text-xs font-semibold text-suave underline"
              >
                Salir
              </button>
            </form>
          </div>
        ) : null}
      </header>
      {nombre ? (
        <p className="mx-1 mt-3 -mb-3 text-[15px] font-medium text-suave">
          Hola, {nombre} 👋
        </p>
      ) : null}
    </>
  );
}
