
import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  PanelLeft,
  PanelLeftClose,
  UserRound,
  Settings,
  CircleHelp,
  LogOut,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

import { NAV_ITEMS } from '../../app/routes.js';

import {
  NavGlyphHome,
  NavGlyphBookOpen,
  NavGlyphClipboardList,
  NavGlyphGlobe,
} from '../assets/figmaIcons.jsx';

import styles from './SideNav.module.css';

const PROFILE_NAME = 'Qurat Ul Ain Tariq';
const PROFILE_INITIALS = 'QT';
const PROFILE_IMAGE = `${import.meta.env.BASE_URL}images/avatar2.jfif`;

function Glyph({ name }) {
  const sharedProps = {
    className: styles.figmaGlyph,
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return <NavGlyphHome {...sharedProps} />;

    case 'book-open':
      return <NavGlyphBookOpen {...sharedProps} />;

    case 'clipboard-list':
      return <NavGlyphClipboardList {...sharedProps} />;

    case 'globe':
      return <NavGlyphGlobe {...sharedProps} />;

    case 'users':
      return (
        <UserRound
          className={styles.lucideGlyph}
          size={18}
          aria-hidden="true"
        />
      );

    case 'trending-up':
      return (
        <TrendingUp
          className={styles.lucideGlyph}
          size={18}
          aria-hidden="true"
        />
      );

    default:
      return null;
  }
}

export default function SideNav({
  isExpanded,
  onToggle,
  onNavigate,
  isMobile = false,
  mobileOpen = false,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileAreaRef = useRef(null);

  // Close the profile menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!profileOpen) return;

    function handleOutsideClick(event) {
      if (
        profileAreaRef.current &&
        !profileAreaRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);

  return (
    <aside
  className={[
    styles.sidebar,
    isExpanded ? styles.expanded : styles.collapsed,
    isMobile ? styles.mobile : '',
    isMobile && mobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ')}
  inert={isMobile && !mobileOpen}
  aria-label="Dashboard navigation"
>
      {/* Top section */}

      <div className={styles.topArea}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggle}
          aria-label={
            isMobile
              ? 'Close menu'
              : isExpanded
                ? 'Collapse navigation'
                : 'Expand navigation'
          }
          aria-expanded={isMobile ? mobileOpen : isExpanded}
        >
          {isMobile ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 4L16 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : isExpanded ? (
            <PanelLeftClose size={18} strokeWidth={1.8} />
          ) : (
            <PanelLeft size={18} strokeWidth={1.8} />
          )}
        </button>

        {isExpanded && (
          <span className={styles.brandLabel}>Workspace</span>
        )}
      </div>

      {/* Navigation */}

      <nav className={styles.navigation} aria-label="Pages">
        <div
          className={styles.sectionLabel}
          aria-hidden={!isExpanded}
        >
          DASHBOARD
        </div>

        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const itemClass = ({ isActive }) =>
              [
                styles.navItem,
                isActive ? styles.active : '',
                !item.enabled ? styles.disabled : '',
              ]
                .filter(Boolean)
                .join(' ');

            const tooltipLabel =
              item.label === 'Home' ? 'Overview' : item.label;

            return (
              <li key={item.id} className={styles.navListItem}>
                {item.enabled ? (
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={itemClass}
                    onClick={onNavigate}
                  >
                    <Glyph name={item.glyph} />

                    {isExpanded ? (
                      <span className={styles.navLabel}>
                        {tooltipLabel}
                      </span>
                    ) : (
                      <span
                        className={styles.navTooltip}
                        role="tooltip"
                      >
                        {tooltipLabel}
                      </span>
                    )}
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    className={itemClass({ isActive: false })}
                    aria-disabled="true"
                    disabled
                  >
                    <Glyph name={item.glyph} />

                    {isExpanded ? (
                      <span className={styles.navLabel}>
                        {item.label}
                      </span>
                    ) : (
                      <span
                        className={styles.navTooltip}
                        role="tooltip"
                      >
                        {tooltipLabel}
                      </span>
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile section */}

      <div className={styles.profileArea} ref={profileAreaRef}>
        {profileOpen && (
          <div className={styles.profileMenu}>
            <div className={styles.profileMenuHeader}>
              <strong>{PROFILE_NAME}</strong>
              <span>Dashboard account</span>
            </div>

            <div className={styles.menuDivider} />

            <div className={styles.profileMenuItem}>
              <UserRound size={17} />
              <span>View Profile</span>
            </div>

            <div className={styles.profileMenuItem}>
              <Settings size={17} />
              <span>Dashboard Preferences</span>
            </div>

            <div className={styles.profileMenuItem}>
              <CircleHelp size={17} />
              <span>Help & About</span>
            </div>

            <div className={styles.menuDivider} />

            <div
              className={`${styles.profileMenuItem} ${styles.signOut}`}
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.profileButton}
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-label="Open profile menu"
        >
          <span className={styles.avatar}>
            <img
              src={PROFILE_IMAGE}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />

            <span className={styles.initials}>
              {PROFILE_INITIALS}
            </span>
          </span>

          {isExpanded ? (
            <>
              <span className={styles.profileText}>
                <strong>{PROFILE_NAME}</strong>
                <small>Dashboard account</small>
              </span>

              <ChevronDown
                className={`${styles.profileChevron} ${
                  profileOpen ? styles.chevronOpen : ''
                }`}
                size={17}
              />
            </>
          ) : (
            <span
              className={styles.profileTooltip}
              role="tooltip"
            >
              Profile
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
