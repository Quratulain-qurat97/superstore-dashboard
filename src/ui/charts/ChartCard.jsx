
import styles from './ChartCard.module.css';

/**
 * The frame every dashboard chart sits in.
 *
 * Optional props:
 * height: custom card height in pixels.
 * width: custom card width in pixels or CSS length.
 */
export default function ChartCard({
  title,
  callout,
  left,
  top,
  height,
  width,
  layout,
  legend,
  onBackgroundClick,
  children,
}) {
  return (
    <section
      className={styles.card}
      style={{
        left,
        top,
        ...(height !== undefined ? { height } : {}),
        ...(width !== undefined ? { width } : {}),
      }}
      aria-label={title}
      onClick={onBackgroundClick}
    >
      <h2
        className={styles.title}
        style={{
          left: layout.titleLeft,
          top: layout.titleTop,
        }}
      >
        {title}
      </h2>

      {callout !== undefined && (
        <p
          className={styles.callout}
          style={{
            left: `calc(var(--chart-w) - ${layout.calloutFromRight}px)`,
            top: layout.calloutTop,
          }}
        >
          {callout}
        </p>
      )}

      {legend && (
        <div
          className={styles.legend}
          style={{
            right: layout.legend.right,
            top: layout.legend.top,
          }}
        >
          {legend}
        </div>
      )}

      <div className={styles.body} style={layout.body}>
        {children}
      </div>
    </section>
  );
}
