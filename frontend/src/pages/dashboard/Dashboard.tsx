import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <section className={styles.hero}>
      <h2>Overview</h2>

      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>Certificates</h3>
          <p>0</p>
        </div>

        <div className={styles.card}>
          <h3>Enrolled Courses</h3>
          <p>0</p>
        </div>

        <div className={styles.card}>
          <h3>Completed Courses</h3>
          <p>0</p>
        </div>

        <div className={styles.card}>
          <h3>Streak</h3>
          <p>0 days</p>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
