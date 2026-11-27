
import styles from './ChartCard.module.css';

/**
 * The frame every dashboard chart sits in.
 *
 * Optional props:
 * height: custom card height in pixels.
 * width: custom card width in pixels or CSS length.
 * loading: displays a skeleton inside the chart body.
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
  loading = false,
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
      aria-busy={loading}
      onClick={loading ? undefined : onBackgroundClick}
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

      {!loading && callout !== undefined && (
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

      {!loading && legend && (
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
        {loading ? (
          <div className={styles.loadingSkeleton} aria-hidden="true">
            <span className={styles.loadingLongBar} />
            <span className={styles.loadingShortBar} />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
