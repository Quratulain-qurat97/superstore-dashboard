import { Outlet } from 'react-router-dom';
import SideNav from './SideNav.jsx';
import ProfileBadge from './ProfileBadge.jsx';
import ScaleToFit from './ScaleToFit.jsx';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './designCanvas.js';
import styles from './AppShell.module.css';

// Everything that appears on every page: the left navigation and the profile badge.
// The current page renders into <Outlet />.
export default function AppShell() {
  return (
    <ScaleToFit designWidth={DESIGN_WIDTH} designHeight={DESIGN_HEIGHT}>
      <div className={styles.frame}>
        <SideNav />
        <ProfileBadge />
        <Outlet />
      </div>
    </ScaleToFit>
  );
}
