export function ProfitabilityKpiTileSpline(props) {
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

export function ProfitabilityKpiTileMoneyLoss(props) {
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

      {/* Shopping cart */}
      <path
        d="M11 15H17L22 40H45L51 22H19"
        stroke="#9333EA"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cart wheels */}
      <circle cx="25" cy="48" r="3" stroke="#9333EA" strokeWidth="3" />
      <circle cx="43" cy="48" r="3" stroke="#9333EA" strokeWidth="3" />

      {/* Minus badge */}
      <circle
        cx="47"
        cy="29"
        r="9"
        fill="#9333EA"
        stroke="#F3E8FF"
        strokeWidth="2"
      />

      <path
        d="M43 29H51"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfitabilityKpiTileUsers(props) {
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

      <path
        d="M38.67 47V43.667C38.67 41.899 37.96 40.203 36.71 38.953C35.46 37.702 33.77 37 32 37H22C20.23 37 18.54 37.702 17.29 38.953C16.04 40.203 15.33 41.899 15.33 43.667V47"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M38.67 17.213C40.1 17.584 41.36 18.419 42.27 19.587C43.17 20.755 43.66 22.19 43.66 23.667C43.66 25.144 43.17 26.579 42.27 27.747C41.36 28.915 40.1 29.749 38.67 30.12"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M48.67 47V43.667C48.67 42.19 48.17 40.755 47.27 39.587C46.36 38.42 45.1 37.586 43.67 37.217"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M33.67 23.667C33.67 27.349 30.68 30.333 27 30.333C23.32 30.333 20.33 27.349 20.33 23.667C20.33 19.985 23.32 17 27 17C30.68 17 33.67 19.985 33.67 23.667Z"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfitabilityKpiTileLossImpact(props) {
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

      {/* Order receipt */}
      <path
        d="M19 13H43V51L39.5 48L36 51L32.5 48L29 51L25.5 48L22 51L19 48.5V13Z"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Document lines */}
      <path
        d="M25 23H37M25 30H37"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Negative indicator */}
      <circle cx="45" cy="44" r="10" fill="#2563EB" stroke="#EAF2FF" strokeWidth="2" />

      <path
        d="M40.5 44H49.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}