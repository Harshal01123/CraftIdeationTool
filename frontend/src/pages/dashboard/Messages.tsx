import styles from "./Messages.module.css";
import { supabase } from "../../lib/supabase";

function Messages() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Messages</h2>
      <p className={styles.sub}>Chat feature coming soon...</p>
    </div>
  );
}

export default Messages;
