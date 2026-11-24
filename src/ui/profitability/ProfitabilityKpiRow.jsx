import { buildProfitabilityKpiCards } from '../../core/index.js';

import {
  ProfitabilityKpiTileSpline,
  ProfitabilityKpiTileMoneyLoss,
  ProfitabilityKpiTileUsers,
  ProfitabilityKpiTileLossImpact,
} from '../assets/ProfitabilityKpiIcons.jsx';

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
  profitMargin: ProfitabilityKpiTileSpline,
  discountedSalesProfit: ProfitabilityKpiTileMoneyLoss,
  lossMakingCustomers: ProfitabilityKpiTileUsers,
  lossMakingOrders: ProfitabilityKpiTileLossImpact,
};

const PLACEHOLDER = '—';

export default function ProfitabilityKpiRow({ kpis }) {
  const cards = kpis
    ? buildProfitabilityKpiCards(kpis)
    : [
        { id: 'profitMargin', label: 'Profit Margin', value: PLACEHOLDER },
        {
          id: 'discountedSalesProfit',
          label: 'Discounted Sales Profit',
          value: PLACEHOLDER,
        },
        {
          id: 'lossMakingCustomers',
          label: 'Loss-Making Customers',
          value: PLACEHOLDER,
        },
        {
          id: 'lossMakingOrders',
          label: 'Loss-Making Orders',
          value: PLACEHOLDER,
        },
      ];

  return (
    <section aria-label="Profitability key metrics">
      {cards.map((card, index) => (
        <KpiCard
          key={card.id}
          label={card.label}
          value={card.value}
          numericValue={card.numericValue}
          title={card.exact}
          supportingText={card.supportingText}
          Tile={TILES[card.id]}
          left={cardLeft(index)}
          {...SLOTS[index]}
        />
      ))}
    </section>
  );
}