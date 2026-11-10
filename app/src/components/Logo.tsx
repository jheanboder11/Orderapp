/** Logo de Orderapp: pin naranja con chulo blanco + "orderapp". */
export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" aria-hidden="true" className="h-10 w-10 flex-none">
        <rect width="40" height="40" rx="12" fill="#1c1a36" />
        <path
          d="M20 9.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3c0-4.3-3.6-7.7-8-7.7z"
          fill="#ff7a45"
        />
        <path
          d="M16.6 17.4l2.4 2.4 4.6-4.7"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <b className="block text-2xl leading-none font-extrabold tracking-[-0.035em] text-tinta">
          orderapp
        </b>
        <span className="mt-[3px] block text-[11px] font-semibold tracking-[0.04em] text-suave uppercase">
          Domicilios en orden
        </span>
      </div>
    </div>
  );
}
