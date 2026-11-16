
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
