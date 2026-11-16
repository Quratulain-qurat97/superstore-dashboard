
import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav.jsx';
import ScaleToFit from './ScaleToFit.jsx';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './designCanvas.js';
import styles from './AppShell.module.css';

export default function AppShell() {
  const [activePanel, setActivePanel] = useState(null);
  const [navExpanded, setNavExpanded] = useState(false);

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
      setActivePanel('executiveSummary');
    }
  }, [activePanel]);

  const closeExecutiveSummary = useCallback(() => {
    setActivePanel((current) =>
      current === 'executiveSummary' ? null : current
    );
  }, []);

  return (
    <>
      <ScaleToFit
        designWidth={DESIGN_WIDTH}
        designHeight={DESIGN_HEIGHT}
      >
        <div className={styles.frame}>
          <Outlet
            context={{
              activePanel,
              toggleExecutiveSummary,
              closeExecutiveSummary,
            }}
          />
        </div>
      </ScaleToFit>

      <SideNav
        isExpanded={activePanel === 'navigation' && navExpanded}
        onToggle={toggleNavigation}
      />
    </>
  );
}
