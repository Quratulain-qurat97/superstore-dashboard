
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
  loading = false,
}) {
  return (
    <article
      className={styles.card}
      style={{ left, width, borderRadius: radius }}
      title={loading ? undefined : title}
      aria-label={label}
      aria-busy={loading}
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
        } ${isNegativeValue(numericValue) ? 'negative-value' : ''} ${
          loading ? styles.loadingTextHidden : ''
        }`}
      >
        {value}
      </p>

      {supportingText && (
        <p
          className={`${styles.supportingText} ${
            loading ? styles.loadingTextHidden : ''
          }`}
          style={{ color: supportingTextColor }}
        >
          {supportingText}
        </p>
      )}

      {loading && (
        <div className={styles.loadingBars} aria-hidden="true">
          <span className={styles.loadingValue} />
          <span className={styles.loadingSupportingText} />
        </div>
      )}

      <Tile
        className={styles.tile}
        style={{ right: tileRight, top: tileTop }}
      />
    </article>
  );
}
