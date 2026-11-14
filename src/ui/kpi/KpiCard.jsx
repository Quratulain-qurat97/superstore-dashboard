
import { isNegativeValue } from '../../core/index.js';
import styles from './KpiCard.module.css';

/**
 * One KPI card.
 */
export default function KpiCard({
  label,
  value,
  numericValue,
  title,
  Tile,
  left,
  radius,
  tileRight,
  tileTop,
}) {
  return (
    <article
      className={styles.card}
      style={{ left, borderRadius: radius }}
      title={title}
      aria-label={label}
    >
      <p className={styles.label}>{label}</p>
      <p
        className={`${styles.value} ${isNegativeValue(numericValue) ? 'negative-value' : ''}`}
      >
        {value}
      </p>
      <Tile
        className={styles.tile}
        style={{ right: tileRight, top: tileTop }}
      />
    </article>
  );
}
