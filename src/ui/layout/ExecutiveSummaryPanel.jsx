import { useEffect } from 'react';
import { X } from 'lucide-react';

import styles from './ExecutiveSummaryPanel.module.css';

export default function ExecutiveSummaryPanel({
  isOpen,
  onClose,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <aside
      id="executive-summary-panel"
      className={`${styles.panel} ${
        isOpen ? styles.open : ''
      }`}
      aria-label="Executive Summary"
      aria-hidden={!isOpen}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>Executive Summary</h2>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close Executive Summary"
          tabIndex={isOpen ? 0 : -1}
        >
          <X size={19} strokeWidth={1.8} />
        </button>
      </header>

      <div className={styles.content}>
        {children}
      </div>
    </aside>
  );
}