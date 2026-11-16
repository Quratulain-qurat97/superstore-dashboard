
import { buildSalesKpiCards } from '../../core/index.js';

import {
  KpiTileDollar,
  KpiTileSpline,
} from '../assets/figmaIcons.jsx';

import {
  KpiTileGlobe,
  KpiTileMoneyLoss,
} from '../assets/SalesKpiIcons.jsx';

import KpiCard from '../kpi/KpiCard.jsx';

const cardLeft = (index) =>
  `calc(var(--content-left) + ${index} * (var(--kpi-w) + 20px))`;

const SLOTS = [
  { radius: 20, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 14, tileTop: 31 },
  { radius: 25, tileRight: 14, tileTop: 31 },
];

const TILES = {
  totalSales: KpiTileDollar,
  totalProfit: KpiTileSpline,
  profitMargin: KpiTileMoneyLoss,
  lossMakingStates: KpiTileGlobe,
};

const PLACEHOLDER = '—';

export default function SalesKpiRow({ kpis }) {
  const cards = kpis
    ? buildSalesKpiCards(kpis)
    : [
        { id: 'totalSales', label: 'Total Sales', value: PLACEHOLDER },
        { id: 'totalProfit', label: 'Total Profit', value: PLACEHOLDER },
        { id: 'profitMargin', label: 'Profit Margin', value: PLACEHOLDER },
        {
          id: 'lossMakingStates',
          label: 'Loss-Making States',
          value: PLACEHOLDER,
        },
      ];

  return (
    <section aria-label="Sales key metrics">
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
