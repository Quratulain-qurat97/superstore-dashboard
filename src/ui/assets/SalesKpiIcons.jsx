
export function KpiTileGlobe(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="64" height="64" rx="15" fill="#DCFCE7" />

      <circle
        cx="32"
        cy="32"
        r="19"
        stroke="#16A34A"
        strokeWidth="4"
      />

      <path
        d="M13 32H51M32 13C37.5 19 40 25.5 40 32C40 38.5 37.5 45 32 51C26.5 45 24 38.5 24 32C24 25.5 26.5 19 32 13Z"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiTileMoneyLoss(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="64" height="64" rx="15" fill="#FCE7F3" />

      <path
        d="M30 15V39M37 20H27.5C25.6 20 24 21.6 24 23.5C24 25.4 25.6 27 27.5 27H33.5C35.4 27 37 28.6 37 30.5C37 32.4 35.4 34 33.5 34H23"
        stroke="#EC4899"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M43 31V46M36 39L43 46L50 39"
        stroke="#EC4899"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function KpiTileLossImpact(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="64" height="64" rx="15" fill="#F3E8FF" />

      {/* Chart axes - replicated from KpiTileSpline */}
      <path
        d="M17 18V44C17 44.884 17.351 45.732 17.976 46.357C18.601 46.982 19.449 47.333 20.333 47.333H47"
        stroke="#9333EA"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Downward trend - mirrored from KpiTileSpline */}
      <path
  d="M25 24C25.7 27 27.2 34 30.5 34C33.5 34 33.5 30 36.5 30C39.8 30 42.5 37 43.5 40"
  stroke="#9333EA"
  strokeWidth="4"
  strokeLinecap="round"
  strokeLinejoin="round"
/>
    </svg>
  );
}



export function KpiTileWorstState(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="64" height="64" rx="15" fill="#EAF2FF" />

      {/* Globe */}
      <circle
        cx="29"
        cy="29"
        r="19"
        stroke="#2563EB"
        strokeWidth="4"
      />

      <path
        d="M11 29H47M29 11C34.5 17 37 23 37 29C37 35 34.5 41 29 47C23.5 41 21 35 21 29C21 23 23.5 17 29 11Z"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Warning triangle */}
  {/* Smaller warning triangle */}
{/* Smaller warning triangle — shifted right */}
<path
  d="M48 43L55 55H41L48 43Z"
  fill="#EAF2FF"
  stroke="#2563EB"
  strokeWidth="2"
  strokeLinejoin="round"
/>

{/* Exclamation mark */}
<path
  d="M48 47V50M48 52.5V52.7"
  stroke="#2563EB"
  strokeWidth="1.5"
  strokeLinecap="round"
/>
    </svg>
  );
}
