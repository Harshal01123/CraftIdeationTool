import { useRef } from "react";
import styles from "./CertificateModal.module.css";

interface CertificateData {
  learnerName: string;
  courseTitle: string;
  artisanName: string;
  issuedAt: string;       // ISO date string
  certificateCode: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData | null;
}

export default function CertificateModal({ isOpen, onClose, data }: Props) {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const formattedDate = new Date(data.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handlePrint() {
    const el = certRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate — ${data.courseTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
            .cert { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
            ${el.ownerDocument.querySelector("style")?.innerHTML ?? ""}
          </style>
        </head>
        <body><div class="cert">${el.outerHTML}</div></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Certificate */}
        <div className={styles.certificate} ref={certRef}>
          {/* Top bar */}
          <div className={styles.topBar}>
            <span className={styles.brandName}>CRAFTCONNECT</span>
            <span className={styles.brandTagline}>Heritage Masterclass Programme</span>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <p className={styles.certLabel}>Certificate of Completion</p>

            <div className={styles.dividerOrnament}>
              <span className={styles.ornamentLine} />
              <span className={styles.ornamentDiamond}>◆</span>
              <span className={styles.ornamentLine} />
            </div>

            <p className={styles.certSubLabel}>This certifies that</p>
            <h2 className={styles.learnerName}>{data.learnerName}</h2>
            <p className={styles.certSubLabel}>has successfully completed the masterclass</p>
            <h3 className={styles.courseTitle}>{data.courseTitle}</h3>

            <div className={styles.dividerThin} />

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Date of Issue</span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>
              <div className={styles.metaSeal}>
                <span className={styles.sealIcon}>◈</span>
              </div>
              <div className={styles.metaItem} style={{ textAlign: "right" }}>
                <span className={styles.metaLabel}>Certificate ID</span>
                <span className={styles.metaValue}>{data.certificateCode}</span>
              </div>
            </div>

            <div className={styles.signatureRow}>
              <div className={styles.signatureBlock}>
                <span className={styles.signatureName}>{data.artisanName}</span>
                <span className={styles.signatureLine} />
                <span className={styles.signatureRole}>Master Artisan · CraftConnect</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
            <span>© {new Date().getFullYear()} CraftConnect. Preserving the Handcrafted.</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.downloadBtn} onClick={handlePrint}>
            <span className="material-symbols-outlined">download</span>
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
}
