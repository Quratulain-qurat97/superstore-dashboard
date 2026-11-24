
import { useOutletContext } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle }) {
  const { activePanel, toggleExecutiveSummary } = useOutletContext();

  const isSummaryOpen = activePanel === 'executiveSummary';

  return (
    <header>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>

        <button
          type="button"
          className={styles.summaryButton}
          onClick={toggleExecutiveSummary}
          aria-expanded={isSummaryOpen}
          aria-controls="executive-summary-panel"
        >
          <Sparkles size={16} strokeWidth={1.8} />
          <span>Executive Summary</span>
        </button>
      </div>

      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
