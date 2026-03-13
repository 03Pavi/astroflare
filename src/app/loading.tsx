import styles from './loading.module.scss';

export default function Loading() {
  return (
    <div className={styles.wrap}>
      <div className={styles.loader} />
    </div>
  );
}
