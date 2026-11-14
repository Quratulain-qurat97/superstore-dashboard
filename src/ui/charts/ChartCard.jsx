import styles from './ChartCard.module.css';

/**
 * The frame every Home chart sits in.
 * props: title, callout (text, optional), left (CSS length: card x), top (card y),
 *        layout (title / callout / chart-box offsets, see cardLayouts.js),
 *        legend (optional element shown at the right of the title row; needs layout.legend),
 *        onBackgroundClick (clicks on the card itself, outside the chart), children (the chart)
 */
export default function ChartCard({ title, callout, left, top, layout, legend, onBackgroundClick, children }) {
  return (
    <section className={styles.card} style={{ left, top }} aria-label={title} onClick={onBackgroundClick}>
      <h2 className={styles.title} style={{ left: layout.titleLeft, top: layout.titleTop }}>
        {title}
      </h2>
      {callout !== undefined && (
        <p className={styles.callout} style={{ left: `calc(var(--chart-w) - ${layout.calloutFromRight}px)`, top: layout.calloutTop }}>
          {callout}
        </p>
      )}
      {legend && (
        <div className={styles.legend} style={{ right: layout.legend.right, top: layout.legend.top }}>
          {legend}
        </div>
      )}
      <div className={styles.body} style={layout.body}>
        {children}
      </div>
    </section>
  );
}
