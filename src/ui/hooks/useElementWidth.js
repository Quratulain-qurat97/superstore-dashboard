import { useLayoutEffect, useState } from 'react';

/**
 * The layout width (in CSS pixels, ignoring any scaling transform) of the element in `ref`,
 * kept up to date when it resizes. `fallback` is used until a real width is known.
 */
export function useElementWidth(ref, fallback) {
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => {
      const next = element.clientWidth;
      if (next > 0) setWidth((current) => (current === next ? current : next));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
