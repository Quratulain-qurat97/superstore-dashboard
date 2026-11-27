
import { buildCustomerKpiCards } from '../../core/index.js';

import {
  KpiTileDollar,
  KpiTileUsers,
} from '../assets/figmaIcons.jsx';

import { KpiTileMoneyLoss } from '../assets/SalesKpiIcons.jsx';

import KpiCard from '../kpi/KpiCard.jsx';

// Customer-only receipt icon.
// Purple tile styling matches the original KpiTileSpline.
function KpiTileReceipt(props) {
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

      {/* Receipt / order document */}
      <path
        d="M19 13H43V51L39.5 48L36 51L32.5 48L29 51L25.5 48L22 51L19 48.5V13Z"
        stroke="#9333EA"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Document lines */}
      <path
        d="M25 23H37M25 30H37M25 37H33"
        stroke="#9333EA"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const cardLeft = (index) =>
  `calc(var(--content-left) + ${index} * (var(--kpi-w) + 20px))`;

const SLOTS = [
  { radius: 20, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 14, tileTop: 31 },
  { radius: 25, tileRight: 14, tileTop: 31 },
];

const TILES = {
  averageSalesPerCustomer: KpiTileDollar,
  averageOrderValue: KpiTileReceipt,
  lossMakingCustomers: KpiTileMoneyLoss,
  customerRetention: KpiTileUsers,
};

const PLACEHOLDER = '—';

export default function CustomerKpiRow({ kpis, loading = false }) {
  const cards = kpis
    ? buildCustomerKpiCards(kpis)
    : [
        {
          id: 'averageSalesPerCustomer',
          label: 'Avg Sales per Customer',
          value: PLACEHOLDER,
        },
        {
          id: 'averageOrderValue',
          label: 'Avg Order Value',
          value: PLACEHOLDER,
        },
        {
          id: 'lossMakingCustomers',
          label: 'Loss-Making Customers',
          value: PLACEHOLDER,
        },
        {
          id: 'customerRetention',
          label: 'Customer Retention',
          value: PLACEHOLDER,
        },
      ];

  return (
    <section aria-label="Customer key metrics">
      {cards.map((card, index) => (
        <KpiCard
          key={card.id}
          label={card.label}
          value={card.value}
          numericValue={card.numericValue}
          title={card.exact}
          Tile={TILES[card.id]}
          left={cardLeft(index)}
          loading={loading}
          {...SLOTS[index]}
        />
      ))}
    </section>
  );
}
