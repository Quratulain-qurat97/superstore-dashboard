import { useLayoutEffect, useState } from 'react';
import { layoutForWindow } from '../../core/index.js';

/**
 * Sizes the Figma canvas for the browser window, with no scrollbars.
 *
 *  - Window at least as big as the design: shown at exactly 100%. If the window is WIDER than the
 *    design, the canvas gets that extra width (`--canvas-w`), so the sidebar stays on the left and
 *    the main content fills the remaining space. Heights never change.
 *  - Window smaller than the design (too narrow or too short): the whole canvas is shrunk
 *    uniformly, so every size, gap and font keeps its Figma proportion.
 *
 * The wrapper reports the scaled size to the page, so its scroll size is exactly what is drawn.
 * Components read the width from the CSS variable --canvas-w (see AppShell.module.css).
 */
export default function ScaleToFit({ designWidth, designHeight, children }) {
  const [layout, setLayout] = useState({ scale: 1, canvasWidth: designWidth });

  useLayoutEffect(() => {
    const update = () => {
      const { clientWidth, clientHeight } = document.documentElement;
      const next = layoutForWindow(clientWidth, clientHeight, designWidth, designHeight);
      setLayout((current) => (current.scale === next.scale && current.canvasWidth === next.canvasWidth ? current : next));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [designWidth, designHeight]);

  const { scale, canvasWidth } = layout;
  return (
    <div style={{ width: canvasWidth * scale, height: designHeight * scale }}>
      <div
        style={{
          width: canvasWidth,
          height: designHeight,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: '0 0',
          '--canvas-w': `${canvasWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
