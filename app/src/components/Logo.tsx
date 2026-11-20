/** Logo de Orderapp: cuadro guayaba con pin blanco y chulo guayaba + "orderapp". */
export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" aria-hidden="true" className="h-11 w-11 flex-none">
        <rect width="40" height="40" rx="12.4" fill="#e8316b" />
        <path
          d="M20 8.5c-4.7 0-8.5 3.6-8.5 8.2 0 6 8.5 14.3 8.5 14.3s8.5-8.3 8.5-14.3c0-4.6-3.8-8.2-8.5-8.2z"
          fill="#fff"
        />
        <path
          d="M16.4 16.9l2.6 2.6 4.8-4.9"
          fill="none"
          stroke="#e8316b"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <b className="block text-[24px] leading-none font-extrabold tracking-[-0.04em] text-tinta">
          orderapp
        </b>
        <span className="mt-1 block text-[10px] font-bold tracking-[0.14em] text-suave uppercase">
          Domicilios en orden
        </span>
      </div>
    </div>
  );
}
