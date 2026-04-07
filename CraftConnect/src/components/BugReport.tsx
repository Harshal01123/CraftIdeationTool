import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import styles from "./BugReport.module.css";

/**
 * Self-contained Bug Report component.
 * Renders a trigger button + modal. Drop it anywhere — e.g. the home page footer.
 */
function BugReport() {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  function openModal() {
    setIsOpen(true);
    setStatus("idle");
  }

  function closeModal() {
    setIsOpen(false);
    setSubject("");
    setContent("");
    setStatus("idle");
  }

  async function handleSend() {
    if (!subject.trim() || !content.trim()) return;
    setStatus("sending");
    try {
      const { error } = await supabase.functions.invoke("send-bug-report", {
        body: { subject, content },
      });
      if (error) throw error;
      setStatus("sent");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* ── Trigger Button ── */}
      <button className={styles.bugReportBtn} onClick={openModal}>
        <span className="material-symbols-outlined">bug_report</span>
        {t("dashboard.reportBug")}
      </button>

      {/* ── Modal ── */}
      {isOpen && (
        <div className={styles.bugOverlay} onClick={closeModal}>
          <div
            className={styles.bugModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.bugModalHeader}>
              <h3 className={styles.bugModalTitle}>
                {t("extended.reportBugTitle")}
              </h3>
              <button className={styles.bugCloseBtn} onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className={styles.bugModalSubtitle}>
              {t("extended.reportBugSubtitle")}
            </p>

            {status === "sent" ? (
              <div className={styles.bugSuccess}>
                <span className="material-symbols-outlined">check_circle</span>
                {t("extended.reportSuccess")}
              </div>
            ) : (
              <>
                <div className={styles.bugField}>
                  <label className={styles.bugLabel}>
                    {t("extended.subject")}
                  </label>
                  <input
                    className={styles.bugInput}
                    type="text"
                    placeholder={t("extended.subjectPlaceholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={status === "sending"}
                  />
                </div>

                <div className={styles.bugField}>
                  <label className={styles.bugLabel}>
                    {t("extended.details")}
                  </label>
                  <textarea
                    className={styles.bugTextarea}
                    placeholder={t("extended.detailsPlaceholder")}
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={status === "sending"}
                  />
                </div>

                {status === "error" && (
                  <p className={styles.bugError}>
                    {t("extended.reportError")}
                  </p>
                )}

                <div className={styles.bugActions}>
                  <button
                    className={styles.bugCancelBtn}
                    onClick={closeModal}
                  >
                    {t("extended.cancel")}
                  </button>
                  <button
                    className={styles.bugSubmitBtn}
                    onClick={handleSend}
                    disabled={
                      status === "sending" ||
                      !subject.trim() ||
                      !content.trim()
                    }
                  >
                    {status === "sending" ? (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{ animation: "spin 1s linear infinite" }}
                        >
                          progress_activity
                        </span>
                        {t("extended.sending")}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        {t("extended.sendReport")}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BugReport;
