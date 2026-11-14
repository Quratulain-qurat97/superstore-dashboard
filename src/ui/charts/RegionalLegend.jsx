import { MEASURE_COLORS, MEASURE_LABELS } from './regionalGeometry.js';
import styles from './ChartCard.module.css';

/** The compact Sales / Profit legend shown in the Regional Performance card's title row. */
export default function RegionalLegend() {
  return (
    <>
      {['sales', 'profit'].map((measure) => (
        <span key={measure} className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: MEASURE_COLORS[measure] }} aria-hidden="true" />
          {MEASURE_LABELS[measure]}
        </span>
      ))}
    </>
  );
}
