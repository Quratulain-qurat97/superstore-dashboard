import { ProfileChevron } from '../assets/figmaIcons.jsx';
import styles from './ProfileBadge.module.css';

const PROFILE_NAME = 'Qurat Ul Ain Tariq';
const PROFILE_INITIALS = 'QT';

export default function ProfileBadge() {
  return (
    <div className={styles.badge}>
      <div className={styles.avatar} aria-hidden="true">
        {PROFILE_INITIALS}
      </div>
      <span className={styles.name}>{PROFILE_NAME}</span>
      <ProfileChevron className={styles.chevron} />
    </div>
  );
}
