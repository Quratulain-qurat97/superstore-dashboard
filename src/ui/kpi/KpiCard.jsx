
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
  supportingTextColor,
  Tile,
  left,
  radius,
  tileRight,
  tileTop,
  width,
  labelMaxWidth,
  labelFontSize,
}) {
  return (
    <article
      className={styles.card}
      style={{ left, width, borderRadius: radius }}
      title={title}
      aria-label={label}
    >
      <p
        className={styles.label}
        style={{
          maxWidth: labelMaxWidth,
          fontSize: labelFontSize,
        }}
      >
        {label}
      </p>

      <p
        className={`${styles.value} ${
          supportingText ? styles.valueWithSupportingText : ''
        } ${isNegativeValue(numericValue) ? 'negative-value' : ''}`}
      >
        {value}
      </p>

      {supportingText && (
        <p
          className={styles.supportingText}
          style={{ color: supportingTextColor }}
        >
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
