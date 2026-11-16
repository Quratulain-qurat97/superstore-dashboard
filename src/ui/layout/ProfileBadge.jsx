
import { ProfileChevron } from '../assets/figmaIcons.jsx';
import styles from './ProfileBadge.module.css';

const PROFILE_NAME = 'Qurat Ul Ain Tariq';
const PROFILE_INITIALS = 'QT';
const PROFILE_IMAGE = '/images/avatar2.jfif';

export default function ProfileBadge() {
  return (
    <div className={styles.badge}>
      <div className={styles.avatar} aria-hidden="true">
        <img
          src={PROFILE_IMAGE}
          alt=""
          className={styles.profileImage}
        />
      </div>
      <span className={styles.name}>{PROFILE_NAME}</span>
      <ProfileChevron className={styles.chevron} />
    </div>
  );
}
