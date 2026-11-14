
import { NavLink, useLocation } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { NAV_ITEMS } from '../../app/routes.js';
import {
  NavGlyphHome,
  NavGlyphBookOpen,
  NavGlyphClipboardList,
  NavGlyphGlobe,
} from '../assets/figmaIcons.jsx';
import styles from './SideNav.module.css';

const NAV_TOP = 205;
const NAV_PITCH = 110;

function Glyph({ name }) {
  switch (name) {
    case 'home':
      return <NavGlyphHome className={styles.figmaGlyph} />;
    case 'book-open':
      return <NavGlyphBookOpen className={styles.figmaGlyph} />;
    case 'clipboard-list':
      return <NavGlyphClipboardList className={styles.figmaGlyph} />;
    case 'globe':
      return <NavGlyphGlobe className={styles.figmaGlyph} />;
    case 'users':
      return (
        <Users
          className={styles.lucideGlyph}
          size={30}
          strokeWidth={2}
          color="#000000"
          aria-hidden="true"
        />
      );
    case 'trending-up':
      return (
        <TrendingUp
          className={styles.lucideGlyph}
          size={30}
          strokeWidth={2}
          color="#000000"
          aria-hidden="true"
        />
      );
    default:
      return null;
  }
}

export default function SideNav() {
  const location = useLocation();

  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (!item.enabled) return false;

    return (
      location.pathname === item.path ||
      (item.path !== '/' &&
        location.pathname.startsWith(`${item.path}/`))
    );
  });

  return (
    <nav aria-label="Pages" className={styles.sidebar}>
      {/* Shared frosted-glass background */}
      <div className={styles.glassPanel} aria-hidden="true" />

      {/* One indicator that slides between active pages */}
      {activeIndex >= 0 && (
        <div
          className={styles.activeIndicator}
          style={{
            top: NAV_TOP + NAV_PITCH * activeIndex,
          }}
          aria-hidden="true"
        />
      )}

      <ul className={styles.nav}>
        {NAV_ITEMS.map((item, index) => {
          const style = {
            top: NAV_TOP + NAV_PITCH * index,
          };

          return (
            <li key={item.id}>
              {item.enabled ? (
                <NavLink
                  to={item.path}
                  end
                  className={styles.item}
                  style={style}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Glyph name={item.glyph} />
                </NavLink>
              ) : (
                <button
                  type="button"
                  className={`${styles.item} ${styles.disabled}`}
                  style={style}
                  title={`${item.label} (coming soon)`}
                  aria-label={`${item.label} (coming soon)`}
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                >
                  <Glyph name={item.glyph} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
