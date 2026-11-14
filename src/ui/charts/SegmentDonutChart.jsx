import { useRef } from 'react';
import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import { donutLabelPoints, formatCompactCurrency, formatCurrency, formatPercent } from '../../core/index.js';
import { useElementWidth } from '../hooks/useElementWidth.js';
import { DIM_OPACITY, DONUT, DONUT_LABEL, SEGMENT_BOX, SEGMENT_COLORS, SEGMENT_LABEL_COLORS } from './segmentGeometry.js';
import styles from './SegmentDonutChart.module.css';

const DESIGN_WIDTH = 660; // Figma chart box width; used until the real width is measured

function SegmentTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const slice = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{slice.segment}</p>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>{formatCurrency(slice.sales)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Share of total sales</span>
        <span className={styles.tooltipValue}>{formatPercent(slice.share)}</span>
      </div>
    </div>
  );
}

/**
 * The Revenue by Segment donut (Consumer, Corporate, Home Office), drawn with Recharts to the Figma donut
 * geometry (see segmentGeometry.js).
 *
 * props:
 *   series              from buildSegmentSeries(): { slices, hasAnyData, total, ... }
 *   selectedSegment     the effective Segment filter (dropdown or chart click) or null. That slice stays fully
 *                       visible and the others are dimmed; all slices always stay on the chart.
 *   onSelectSegment     (segment) => void   a slice was clicked (clicking the selected slice again is handled
 *                       by the filter state, which deselects it)
 *   onClearSegment      () => void          empty chart space was clicked
 *   fallbackWidth       width to use before the real width is measured (tests / first paint)
 */
export default function SegmentDonutChart({ series, selectedSegment, onSelectSegment, onClearSegment, fallbackWidth = DESIGN_WIDTH }) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);
  const { slices, hasAnyData } = series;

  const cx = width / 2 + DONUT.centerXOffset;
  const cy = DONUT.centerY;

  // One slice: a ring segment in the segment's colour with Figma's 5px white outline.
  const renderSlice = (props) => {
    const segment = props.payload.segment;
    const selected = selectedSegment === segment;
    return (
      <g
        key={`slice-${segment}`}
        data-segment={segment}
        style={{ cursor: 'pointer' }}
        opacity={selectedSegment && !selected ? DIM_OPACITY : 1}
        onClick={(event) => {
          event.stopPropagation(); // a slice click must not count as a click on empty space
          onSelectSegment(segment);
        }}
      >
        <Sector
          cx={props.cx}
          cy={props.cy}
          innerRadius={props.innerRadius}
          outerRadius={props.outerRadius}
          startAngle={props.startAngle}
          endAngle={props.endAngle}
          fill={SEGMENT_COLORS[segment]}
          stroke="#ffffff"
          strokeWidth={DONUT.gap}
        />
      </g>
    );
  };

  // The leader line and the label, placed outside the ring at the slice's mid-angle.
  const renderLabel = (props) => {
    const slice = props.payload;
    const place = donutLabelPoints({
      cx: props.cx,
      cy: props.cy,
      midAngle: props.midAngle,
      outerRadius: DONUT.outerRadius,
      minY: DONUT_LABEL.minY,
      maxY: DONUT_LABEL.maxY,
      startOffset: DONUT_LABEL.startOffset,
      endOffset: DONUT_LABEL.endOffset,
      textGap: DONUT_LABEL.textGap,
    });
    const color = SEGMENT_LABEL_COLORS[slice.segment];
    return (
      <g key={`label-${slice.segment}`} data-label={slice.segment} pointerEvents="none">
        <line x1={place.start.x} y1={place.start.y} x2={place.end.x} y2={place.end.y} stroke={color} strokeWidth={1} />
        <text
          x={place.textX}
          y={place.end.y + DONUT_LABEL.baselineDrop}
          textAnchor={place.anchor}
          style={{ font: `400 ${DONUT_LABEL.fontSize}px var(--font-inter)`, fill: color }}
        >
          {`${slice.segment} ${formatCompactCurrency(slice.sales)}`}
        </text>
      </g>
    );
  };

  const summary = `Revenue by segment, ${hasAnyData ? `total ${formatCompactCurrency(series.total)}` : 'no sales for the current selection'}`;

  return (
    <div ref={wrapRef} className={styles.wrap} role="img" aria-label={summary}>
      {/* margin 0: Recharts' PieChart adds a 5px margin by default, which would shift the ring off the Figma centre */}
      <PieChart width={width} height={SEGMENT_BOX.height} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => onClearSegment()} style={{ outline: 'none' }}>
        <Pie
          data={slices}
          dataKey="sales"
          nameKey="segment"
          cx={cx}
          cy={cy}
          innerRadius={DONUT.innerRadius}
          outerRadius={DONUT.outerRadius}
          startAngle={DONUT.startAngle}
          endAngle={DONUT.endAngle}
          stroke="#ffffff"
          strokeWidth={DONUT.gap}
          isAnimationActive={false}
          shape={renderSlice}
          label={renderLabel}
          labelLine={false}
          rootTabIndex={-1}
        />
        <Tooltip content={<SegmentTooltip />} cursor={false} isAnimationActive={false} wrapperStyle={{ outline: 'none', zIndex: 10 }} />
      </PieChart>

      {!hasAnyData && <div className={styles.empty}>No data for this selection</div>}
    </div>
  );
}
