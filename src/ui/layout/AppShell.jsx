import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import SideNav from './SideNav.jsx';
import ScaleToFit from './ScaleToFit.jsx';
import ExecutiveSummaryPanel from './ExecutiveSummaryPanel.jsx';

import RouteErrorBoundary from '../../app/RouteErrorBoundary.jsx';

import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './designCanvas.js';

import styles from './AppShell.module.css';

export default function AppShell() {
  const [activePanel, setActivePanel] = useState(null);
  const [navExpanded, setNavExpanded] = useState(false);
  const [summaryContent, setSummaryContent] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // <= 767px  : phone  (hamburger + slide-in menu, 2 x 2 filters / KPIs, 1 chart per row)
  // 768-1199px: tablet (56px icon rail, fluid grid, no hamburger)
  // >= 1200px : desktop (the original scaled Figma canvas, unchanged)
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isFluid = useMediaQuery('(max-width: 1199px)');

  const { pathname } = useLocation();

  // Opening the phone menu closes the Executive Summary panel (and vice versa).
  const toggleMobileNav = useCallback(() => {
    setMobileNavOpen((open) => !open);
    setActivePanel((current) =>
      current === 'executiveSummary' ? null : current
    );
  }, []);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  // Close the phone menu after navigating, when leaving phone size, or on Escape.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  const toggleNavigation = useCallback(() => {
    if (activePanel === 'navigation' && navExpanded) {
      setNavExpanded(false);
      setActivePanel(null);
    } else {
      setNavExpanded(true);
      setActivePanel('navigation');
    }
  }, [activePanel, navExpanded]);

  const toggleExecutiveSummary = useCallback(() => {
    if (activePanel === 'executiveSummary') {
      setActivePanel(null);
    } else {
      setNavExpanded(false);
      setMobileNavOpen(false);
      setActivePanel('executiveSummary');
    }
  }, [activePanel]);

  const closeExecutiveSummary = useCallback(() => {
    setActivePanel((current) =>
      current === 'executiveSummary' ? null : current
    );
  }, []);

  const updateSummaryContent = useCallback((content) => {
    setSummaryContent(content);
  }, []);

  const outlet = (
    <RouteErrorBoundary key={pathname}>
      <Outlet
        context={{
          activePanel,
          toggleExecutiveSummary,
          closeExecutiveSummary,
          updateSummaryContent,
          isMobile,
          mobileNavOpen,
          toggleMobileNav,
        }}
      />
    </RouteErrorBoundary>
  );

  return (
    <>
      {isFluid ? (
        <div
          className={[
            'dash-viewport',
            isMobile ? 'dash-viewport--mobile' : '',
            isMobile && mobileNavOpen ? 'is-nav-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="dash-push">
            <div className={`${styles.frame} dash-fluid`}>{outlet}</div>

            {isMobile && mobileNavOpen && (
              <button
                type="button"
                className="dash-push-scrim"
                aria-label="Close menu"
                onClick={closeMobileNav}
              />
            )}
          </div>
        </div>
      ) : (
        <ScaleToFit designWidth={DESIGN_WIDTH} designHeight={DESIGN_HEIGHT}>
          <div className={styles.frame}>{outlet}</div>
        </ScaleToFit>
      )}

      <SideNav
        isExpanded={isMobile || (activePanel === 'navigation' && navExpanded)}
        onToggle={isMobile ? closeMobileNav : toggleNavigation}
        onNavigate={closeMobileNav}
        isMobile={isMobile}
        mobileOpen={mobileNavOpen}
      />

      <ExecutiveSummaryPanel
        isOpen={activePanel === 'executiveSummary'}
        onClose={closeExecutiveSummary}
      >
        {summaryContent}
      </ExecutiveSummaryPanel>
    </>
  );
}
