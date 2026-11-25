
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { formatCurrency } from '../../core/index.js';

import styles from './ProductSalesProfitMarginChart.module.css';

const POSITIVE_COLOR = '#16A34A';
const NEGATIVE_COLOR = '#EF4444';

const ZOOM_FACTOR = 1.5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;

const CHART_MARGIN = {
  top: 22,
  right: 24,
  bottom: 38,
  left: 65,
};

const formatMargin = (value) =>
  value == null ? '—' : `${value.toFixed(1)}%`;

function formatCompactCurrency(value) {
  if (value == null) return '';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(value);
}

function getDataBounds(items) {
  const positiveSales = items
    .filter((item) => item.sales > 0)
    .map((item) => item.sales);

  const margins = items.map((item) => item.profitMargin);

  if (!positiveSales.length || !margins.length) {
    return null;
  }

  const minSales = Math.min(...positiveSales);
  const maxSales = Math.max(...positiveSales);

  const minMargin = Math.min(...margins);
  const maxMargin = Math.max(...margins);

  const logMin = Math.log10(minSales);
  const logMax = Math.log10(maxSales);
  const logPadding = Math.max((logMax - logMin) * 0.05, 0.05);

  const marginRange = Math.max(maxMargin - minMargin, 1);
  const marginPadding = marginRange * 0.08;

  return {
    x: [
      Math.pow(10, logMin - logPadding),
      Math.pow(10, logMax + logPadding),
    ],
    y: [
      minMargin - marginPadding,
      maxMargin + marginPadding,
    ],
  };
}

function getDomains(dataBounds, view) {
  if (!dataBounds) return null;

  const logMin = Math.log10(dataBounds.x[0]);
  const logMax = Math.log10(dataBounds.x[1]);

  const originalXCenter = (logMin + logMax) / 2;
  const originalXRange = logMax - logMin;

  const originalYCenter =
    (dataBounds.y[0] + dataBounds.y[1]) / 2;

  const originalYRange =
    dataBounds.y[1] - dataBounds.y[0];

  const xCenter = view.centerX ?? originalXCenter;
  const yCenter = view.centerY ?? originalYCenter;

  const xHalfRange = originalXRange / (2 * view.zoom);
  const yHalfRange = originalYRange / (2 * view.zoom);

  return {
    x: [
      Math.pow(10, xCenter - xHalfRange),
      Math.pow(10, xCenter + xHalfRange),
    ],
    y: [
      yCenter - yHalfRange,
      yCenter + yHalfRange,
    ],
  };
}

function drawChart(canvas, chartData, domains, dimensions) {
  if (
    !canvas ||
    !domains ||
    !dimensions.width ||
    !dimensions.height
  ) {
    return [];
  }

  const { width, height } = dimensions;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  const context = canvas.getContext('2d');

  if (!context) return [];

  context.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0,
  );

  context.clearRect(0, 0, width, height);

  const plotLeft = CHART_MARGIN.left;
  const plotRight = width - CHART_MARGIN.right;
  const plotTop = CHART_MARGIN.top;
  const plotBottom = height - CHART_MARGIN.bottom;

  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  if (plotWidth <= 0 || plotHeight <= 0) return [];

  const logMin = Math.log10(domains.x[0]);
  const logMax = Math.log10(domains.x[1]);

 const xToPixel = (value) => {
  const ratio =
    (Math.log10(value) - logMin) /
    (logMax - logMin);

  return plotLeft + ratio * plotWidth;
};

  const yToPixel = (value) => {
    const ratio =
      (value - domains.y[0]) /
      (domains.y[1] - domains.y[0]);

    return plotBottom - ratio * plotHeight;
  };

  // Draw grid lines.
  context.strokeStyle = '#E5E7EB';
  context.lineWidth = 1;
  context.setLineDash([3, 3]);

  const xTicks = Array.from({ length: 5 }, (_, index) =>
    Math.pow(
      10,
      logMin + ((logMax - logMin) * index) / 4,
    ),
  );

  const yTicks = Array.from({ length: 5 }, (_, index) =>
    domains.y[0] +
    ((domains.y[1] - domains.y[0]) * index) / 4,
  );

  xTicks.forEach((value) => {
    const x = xToPixel(value);

    context.beginPath();
    context.moveTo(x, plotTop);
    context.lineTo(x, plotBottom);
    context.stroke();
  });

  yTicks.forEach((value) => {
    const y = yToPixel(value);

    context.beginPath();
    context.moveTo(plotLeft, y);
    context.lineTo(plotRight, y);
    context.stroke();
  });

  context.setLineDash([]);

  // Draw zero-profit reference line.
  if (domains.y[0] <= 0 && domains.y[1] >= 0) {
    const zeroY = yToPixel(0);

    context.strokeStyle = '#6B7280';
    context.lineWidth = 1.5;

    context.beginPath();
    context.moveTo(plotLeft, zeroY);
    context.lineTo(plotRight, zeroY);
    context.stroke();
  }

  // Draw axis labels.
  context.fillStyle = '#6B7280';
  context.font = '600 7px Arial';
  context.textBaseline = 'middle';

  xTicks.forEach((value) => {
    const x = xToPixel(value);

    context.textAlign = 'center';
    context.fillText(
      formatCompactCurrency(value),
      x,
      height - 15,
    );
  });

  yTicks.forEach((value) => {
    const y = yToPixel(value);

    context.textAlign = 'right';
    context.fillText(
      `${value.toFixed(1)}%`,
      plotLeft - 10,
      y,
    );
  });

  // Draw individual product dots.
  const positions = [];

  chartData.forEach((item) => {
    const x = xToPixel(item.plottedSales);
    const y = yToPixel(item.profitMargin);

    if (
      x < plotLeft ||
      x > plotRight ||
      y < plotTop ||
      y > plotBottom
    ) {
      return;
    }

    context.beginPath();
    context.arc(x, y, 3, 0, Math.PI * 2);

    context.fillStyle =
      item.profitMargin < 0
        ? NEGATIVE_COLOR
        : POSITIVE_COLOR;

    context.globalAlpha = item.isMuted ? 0.2 : 0.5;
    context.fill();
    context.globalAlpha = 1;

    positions.push({
      x,
      y,
      item,
    });
  });

  return positions;
}

function CustomTooltip({ item }) {
  if (!item) return null;

  return (
    <>
      <p className={styles.tooltipTitle}>
        {item.productName}
      </p>

      {item.sales <= 0 && (
        <p className={styles.tooltipNote}>
          Non-positive sales: displayed at the left edge
        </p>
      )}

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Total Sales</span>
        <strong>{formatCurrency(item.sales)}</strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <strong
          className={
            item.profitMargin < 0
              ? styles.negativeValue
              : styles.positiveValue
          }
        >
          {formatMargin(item.profitMargin)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Total Profit</span>
        <strong
          className={
            item.profit < 0
              ? styles.negativeValue
              : styles.positiveValue
          }
        >
          {formatCurrency(item.profit)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Transaction Lines</span>
        <strong>
          {item.transactionCount.toLocaleString('en-US')}
        </strong>
      </div>
    </>
  );
}

export default function ProductSalesProfitMarginCanvasChart({
  series,
  selectedCategory,
  selectedSubCategory,
  onSelectSubCategory,
}) {
  const canvasRef = useRef(null);
  const positionsRef = useRef([]);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const tooltipRef = useRef(null);

  const previousSelectedSubCategoryRef = useRef(
    selectedSubCategory,
  );

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [view, setView] = useState({
    zoom: MIN_ZOOM,
    centerX: null,
    centerY: null,
  });

  const [isZoomMode, setIsZoomMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const [tooltipPosition, setTooltipPosition] = useState({
    x: 8,
    y: 8,
  });

  const chartData = useMemo(() => {
    if (!series?.length) return [];

    const positiveSales = series
      .filter((item) => item.sales > 0)
      .map((item) => item.sales);

    const minimumPositiveSales = positiveSales.length
      ? Math.min(...positiveSales)
      : 1;

    return series
      .filter(
        (item) =>
          Number.isFinite(item.sales) &&
          Number.isFinite(item.profitMargin),
      )
      .map((item) => ({
        ...item,
        plottedSales:
          item.sales > 0
            ? item.sales
            : minimumPositiveSales,
        isMuted: selectedSubCategory
          ? item.subCategory !== selectedSubCategory
          : selectedCategory
            ? item.category !== selectedCategory
            : false,
      }));
  }, [series, selectedCategory, selectedSubCategory]);

  const dataBounds = useMemo(
    () => getDataBounds(chartData),
    [chartData],
  );

  const domains = useMemo(
    () => getDomains(dataBounds, view),
    [dataBounds, view],
  );

  // Measure the available chart area.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;

    if (!container) return undefined;

    function updateDimensions() {
      const rect = container.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) return;

      setDimensions((current) => {
        if (
          current.width === rect.width &&
          current.height === rect.height
        ) {
          return current;
        }

        return {
          width: rect.width,
          height: rect.height,
        };
      });
    }

    const observer = new ResizeObserver(updateDimensions);

    observer.observe(container);
    updateDimensions();

    return () => observer.disconnect();
  }, [chartData.length]);

  // Preserve the view when selecting, switching, or clearing a subcategory.
  // Reset only when the underlying dataset changes independently.
  useEffect(() => {
    const selectionChanged =
      previousSelectedSubCategoryRef.current !==
      selectedSubCategory;

    previousSelectedSubCategoryRef.current =
      selectedSubCategory;

    if (selectionChanged) {
      setHoveredItem(null);
      return;
    }

    setView({
      zoom: MIN_ZOOM,
      centerX: null,
      centerY: null,
    });

    setHoveredItem(null);
  }, [series, selectedSubCategory]);

  // Redraw when data, zoom, or chart dimensions change.
  useEffect(() => {
    positionsRef.current = drawChart(
      canvasRef.current,
      chartData,
      domains,
      dimensions,
    );
  }, [chartData, domains, dimensions]);

  function zoomAtPoint(factor, mouseX = null, mouseY = null) {
    if (
      !domains ||
      !dimensions.width ||
      !dimensions.height
    ) {
      return;
    }

    const newZoom = Math.max(
      MIN_ZOOM,
      Math.min(view.zoom * factor, MAX_ZOOM),
    );

    if (newZoom === view.zoom) return;

    if (newZoom <= MIN_ZOOM) {
      setView({
        zoom: MIN_ZOOM,
        centerX: null,
        centerY: null,
      });

      setHoveredItem(null);
      return;
    }

    const plotWidth =
      dimensions.width -
      CHART_MARGIN.left -
      CHART_MARGIN.right;

    const plotHeight =
      dimensions.height -
      CHART_MARGIN.top -
      CHART_MARGIN.bottom;

    if (plotWidth <= 0 || plotHeight <= 0) return;

    const oldXMin = Math.log10(domains.x[0]);
    const oldXMax = Math.log10(domains.x[1]);

    const oldYMin = domains.y[0];
    const oldYMax = domains.y[1];

    const oldXRange = oldXMax - oldXMin;
    const oldYRange = oldYMax - oldYMin;

    const newXRange = oldXRange * (view.zoom / newZoom);
    const newYRange = oldYRange * (view.zoom / newZoom);

    let centerX = (oldXMin + oldXMax) / 2;
    let centerY = (oldYMin + oldYMax) / 2;

    if (mouseX !== null && mouseY !== null) {
      const xRatio = Math.max(
        0,
        Math.min(
          1,
          (mouseX - CHART_MARGIN.left) / plotWidth,
        ),
      );

      const yRatio = Math.max(
        0,
        Math.min(
          1,
          (mouseY - CHART_MARGIN.top) / plotHeight,
        ),
      );

      const anchorX = oldXMin + xRatio * oldXRange;
      const anchorY = oldYMax - yRatio * oldYRange;

      centerX =
        anchorX - (xRatio - 0.5) * newXRange;

      centerY =
        anchorY + (yRatio - 0.5) * newYRange;
    }

    setView({
      zoom: newZoom,
      centerX,
      centerY,
    });

    setHoveredItem(null);
  }

  function handleZoomIn() {
    zoomAtPoint(ZOOM_FACTOR);
  }

  function handleZoomOut() {
    zoomAtPoint(1 / ZOOM_FACTOR);
  }

  function handleResetZoom() {
    setView({
      zoom: MIN_ZOOM,
      centerX: null,
      centerY: null,
    });

    setHoveredItem(null);
  }

  // Trackpad pinch zoom is enabled only in Zoom Mode.
  function handleWheel(event) {
    if (!isZoomMode || !event.ctrlKey) return;

    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    zoomAtPoint(
      event.deltaY < 0 ? 1.15 : 1 / 1.15,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  // Use a native non-passive listener so preventDefault can work.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return undefined;

    const wheelListener = (event) => {
      if (!isZoomMode || !event.ctrlKey) return;

      event.preventDefault();
      handleWheel(event);
    };

    canvas.addEventListener('wheel', wheelListener, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener('wheel', wheelListener);
    };
  }, [isZoomMode, domains, dimensions, view]);

  // Start dragging only when zoomed in.
  function handlePointerDown(event) {
    if (view.zoom <= MIN_ZOOM || event.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();

    canvas.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    suppressClickRef.current = false;

    setIsDragging(true);
    setHoveredItem(null);
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    suppressClickRef.current = drag.moved;

    dragRef.current = null;
    setIsDragging(false);

    const canvas = canvasRef.current;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel() {
    if (!dragRef.current) return;

    const drag = dragRef.current;

    dragRef.current = null;
    setIsDragging(false);
    suppressClickRef.current = drag.moved;
  }

  // Handle pointer movement, panning, and tooltip positioning.
  function handlePointerMove(event) {
    const drag = dragRef.current;

    // 1. DRAG TO PAN
    if (drag) {
      const deltaX = event.clientX - drag.lastX;
      const deltaY = event.clientY - drag.lastY;

      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      if (
        Math.abs(event.clientX - drag.startX) > 3 ||
        Math.abs(event.clientY - drag.startY) > 3
      ) {
        drag.moved = true;
      }

      const plotWidth =
        dimensions.width -
        CHART_MARGIN.left -
        CHART_MARGIN.right;

      const plotHeight =
        dimensions.height -
        CHART_MARGIN.top -
        CHART_MARGIN.bottom;

      if (domains && plotWidth > 0 && plotHeight > 0) {
        const xRange =
          Math.log10(domains.x[1]) -
          Math.log10(domains.x[0]);

        const yRange =
          domains.y[1] - domains.y[0];

        setView((current) => ({
          ...current,
          centerX:
            (current.centerX ??
              (Math.log10(domains.x[0]) +
                Math.log10(domains.x[1])) / 2) -
            (deltaX / plotWidth) * xRange,
          centerY:
            (current.centerY ??
              (domains.y[0] + domains.y[1]) / 2) +
            (deltaY / plotHeight) * yRange,
        }));
      }

      return;
    }

    // 2. FIND THE NEAREST PRODUCT
    const nearest = findNearestPoint(event);

    if (!nearest) {
      setHoveredItem(null);
      return;
    }

    setHoveredItem(nearest.item);

    // 3. POSITION TOOLTIP NEAR THE CURSOR
    const tooltipWidth = tooltipRef.current?.offsetWidth || 220;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 150;

    const gap = 16;
    const padding = 8;

    let x = event.clientX + gap;
    let y = event.clientY + gap;

    // Move left if there isn't enough room on the right.
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = event.clientX - tooltipWidth - gap;
    }

    // Move above if there isn't enough room below.
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = event.clientY - tooltipHeight - gap;
    }

    // Keep the tooltip inside the visible browser window.
    x = Math.max(
      padding,
      Math.min(x, window.innerWidth - tooltipWidth - padding),
    );

    y = Math.max(
      padding,
      Math.min(y, window.innerHeight - tooltipHeight - padding),
    );

    setTooltipPosition({ x, y });
  }

  function findNearestPoint(event) {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let nearest = null;
    let nearestDistance = 8;

    positionsRef.current.forEach((point) => {
      const dx = point.x - mouseX;
      const dy = point.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = point;
      }
    });

    return nearest;
  }

  function handlePointerLeave() {
    if (!dragRef.current) {
      setHoveredItem(null);
    }
  }

  function handlePointClick(event) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const clickedItem = findNearestPoint(event)?.item;

    if (!clickedItem) return;

    if (clickedItem.category && clickedItem.subCategory) {
      onSelectSubCategory?.(
        clickedItem.category,
        clickedItem.subCategory,
      );
    }
  }

  if (!chartData.length) {
    return (
      <div className={styles.empty}>
        No sales and profitability data available
        for the selected filters.
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.toolbar}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.positiveSwatch} />
            <span>Positive Margin</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.negativeSwatch} />
            <span>Negative Margin</span>
          </div>
        </div>

        <div className={styles.zoomControls}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => setIsZoomMode((current) => !current)}
            aria-pressed={isZoomMode}
            title="Toggle trackpad pinch zoom"
          >
            {isZoomMode ? 'Zoom Mode On' : 'Zoom Mode Off'}
          </button>

          <button
            type="button"
            className={styles.zoomButton}
            onClick={handleZoomOut}
            disabled={view.zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>

          <button
            type="button"
            className={styles.zoomButton}
            onClick={handleZoomIn}
            disabled={view.zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            className={styles.resetButton}
            onClick={handleResetZoom}
            disabled={view.zoom === MIN_ZOOM}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className={styles.plot}
        style={{ position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onClick={handlePointClick}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: isDragging
              ? 'grabbing'
              : view.zoom > MIN_ZOOM
                ? 'grab'
                : hoveredItem
                  ? 'pointer'
                  : 'default',
            touchAction: 'pan-x pan-y',
            userSelect: 'none',
          }}
          aria-label="Scatter chart showing product sales against profit margin"
          role="img"
        />
      </div>

      {hoveredItem &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              zIndex: 99999,
              pointerEvents: 'none',
              transform: 'none',
            }}
          >
            <CustomTooltip item={hoveredItem} />
          </div>,
          document.body,
        )}
    </div>
  );
}
