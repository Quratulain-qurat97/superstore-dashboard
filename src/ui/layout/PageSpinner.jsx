
import styles from './PageSpinner.module.css';

export default function PageSpinner() {
  return (
    <div
      className={styles.container}
      role="status"
      aria-label="Loading page"
    >
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
