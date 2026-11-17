
import { isNegativeValue } from '../../core/index.js';
import styles from './KpiCard.module.css';

/**
 * One reusable KPI card.
 * Supporting text is optional and appears beneath the value when provided.
 */
export default function KpiCard({
  label,
  value,
  numericValue,
  title,
  supportingText,
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
        className={`${styles.value} ${
          supportingText ? styles.valueWithSupportingText : ''
        } ${isNegativeValue(numericValue) ? 'negative-value' : ''}`}
      >
        {value}
      </p>

      {supportingText && (
        <p className={styles.supportingText}>
          {supportingText}
        </p>
      )}

      <Tile
        className={styles.tile}
        style={{ right: tileRight, top: tileTop }}
      />
    </article>
  );
}
