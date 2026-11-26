import { useSyncExternalStore } from 'react';

const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** true while the window matches the CSS media query, e.g. useMediaQuery('(max-width: 767px)') */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      if (!supported()) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => (supported() ? window.matchMedia(query).matches : false),
    () => false,
  );
}