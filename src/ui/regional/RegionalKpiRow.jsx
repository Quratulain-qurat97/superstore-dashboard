
import { buildRegionalKpiCards } from '../../core/index.js';

import {
  KpiTileGlobe,
  KpiTileMoneyLoss,
  KpiTileLossImpact,
  KpiTileWorstState,
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
  lossMakingStates: KpiTileGlobe,
  totalStateLosses: KpiTileMoneyLoss,
  lossImpact: KpiTileLossImpact,
  worstStateProfit: KpiTileWorstState,
};

const PLACEHOLDER = '—';

export default function RegionalKpiRow({ kpis, loading = false }) {
  const cards = kpis
    ? buildRegionalKpiCards(kpis)
    : [
        {
          id: 'lossMakingStates',
          label: 'Loss-Making States',
          value: PLACEHOLDER,
        },
        {
          id: 'totalStateLosses',
          label: 'Total State Losses',
          value: PLACEHOLDER,
        },
        {
          id: 'lossImpact',
          label: 'Loss Impact',
          value: PLACEHOLDER,
        },
        {
          id: 'worstStateProfit',
          label: 'Worst State Profit',
          value: PLACEHOLDER,
        },
      ];

  return (
    <section aria-label="Regional key metrics">
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
          loading={loading}
          {...SLOTS[index]}
        />
      ))}
    </section>
  );
}
