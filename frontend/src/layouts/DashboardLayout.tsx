import { useNavigate , Link, Outlet} from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import Button from "../components/Button";

function DashboardLayout() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        {/* Left: User info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar} />
          <div>
            <p className={styles.username}>John Doe</p>
            <p className={styles.userType}>Learner</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className={styles.headerActions}>
          <Button onClick={() => navigate("/dashboard/notifications")}>Notifications</Button>
          <Button onClick={() => navigate("/edit-profile")}>
            Edit Profile
          </Button>
          <Button onClick={() => navigate("/login")}>
            Logout
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link to="products">Products</Link>
            <Link to="courses">Courses</Link>
            <Link to="craftsmen">Craftsmen</Link>
            <Link to="">Back to Dashboard</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
