
import { useOutletContext } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle }) {
  const {
    activePanel,
    toggleExecutiveSummary,
    isMobile,
    mobileNavOpen,
    toggleMobileNav,
  } = useOutletContext();

  const isSummaryOpen = activePanel === 'executiveSummary';

  return (
    <header>
      <div className={styles.titleRow}>
        {isMobile && !mobileNavOpen && (
          <button
            type="button"
            className="dash-menu-toggle"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              {mobileNavOpen ? (
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path
                    d="M2 5H18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 10H14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 15H10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
        )}

        <h1 className={styles.title}>{title}</h1>

        <button
          type="button"
          className={styles.summaryButton}
          onClick={toggleExecutiveSummary}
          aria-expanded={isSummaryOpen}
          aria-controls="executive-summary-panel"
          aria-label="Executive Summary"
        >
          <Sparkles size={16} strokeWidth={1.8} />
          <span>Executive Summary</span>
        </button>
      </div>

      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
