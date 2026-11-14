
import { buildKpiCards } from '../../core/index.js';
import { KpiTileDollar, KpiTileSpline, KpiTileLayers, KpiTileUsers } from '../assets/figmaIcons.jsx';
import KpiCard from './KpiCard.jsx';

const cardLeft = (index) => `calc(var(--content-left) + ${index} * (var(--kpi-w) + 20px))`;

const SLOTS = [
  { radius: 20, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 14, tileTop: 31 },
  { radius: 25, tileRight: 14, tileTop: 31 },
];

const TILES = {
  totalSales: KpiTileDollar,
  totalProfit: KpiTileSpline,
  totalOrders: KpiTileLayers,
  totalCustomers: KpiTileUsers,
};

const PLACEHOLDER = '—';

export default function KpiRow({ kpis }) {
  const cards = kpis
    ? buildKpiCards(kpis)
    : [
        { id: 'totalSales', label: 'Total Sales', value: PLACEHOLDER },
        { id: 'totalProfit', label: 'Total Profit', value: PLACEHOLDER },
        { id: 'totalOrders', label: 'Total Orders', value: PLACEHOLDER },
        { id: 'totalCustomers', label: 'Total Customers', value: PLACEHOLDER },
      ];

  return (
    <section aria-label="Key metrics">
      {cards.map((card, index) => (
        <KpiCard
          key={card.id}
          label={card.label}
          value={card.value}
          numericValue={card.numericValue}
          title={card.exact}
          Tile={TILES[card.id]}
          left={cardLeft(index)}
          {...SLOTS[index]}
        />
      ))}
    </section>
  );
}
