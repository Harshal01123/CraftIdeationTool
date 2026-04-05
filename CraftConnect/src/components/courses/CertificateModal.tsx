import { useRef } from "react";

interface CertificateData {
  learnerName: string;
  courseTitle: string;
  artisanName: string;
  issuedAt: string;
  certificateCode: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData | null;
}

/** Fully self-contained certificate rendered with inline styles — works in print window too */
function CertificateContent({ data }: { data: CertificateData }) {
  const formattedDate = new Date(data.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{
      width: "800px",
      background: "#f5f0e4",
      border: "2px solid #c9a96e",
      outline: "6px solid #f5f0e4",
      outlineOffset: "-14px",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#2b1f13",
      boxSizing: "border-box",
      position: "relative",
      padding: "0",
    }}>
      {/* Inner border decoration */}
      <div style={{
        position: "absolute",
        inset: "12px",
        border: "1px solid rgba(201,169,110,0.5)",
        pointerEvents: "none",
      }} />

      {/* Body */}
      <div style={{
        padding: "3.5rem 4rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        {/* Brand */}
        <p style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "#a0522d",
          margin: "0 0 0.6rem",
        }}>CRAFTCONNECT</p>

        {/* Short divider */}
        <div style={{ width: "40px", height: "1px", background: "#c9a96e", margin: "0 auto 1.25rem" }} />

        {/* Main title */}
        <h1 style={{
          fontFamily: "'Georgia', serif",
          fontSize: "2.6rem",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#2b1f13",
          margin: "0 0 1.5rem",
          lineHeight: 1.2,
        }}>Certificate of Completion</h1>

        {/* This certifies that */}
        <p style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#7a6050",
          margin: "0 0 0.75rem",
        }}>THIS CERTIFIES THAT</p>

        {/* Learner name */}
        <h2 style={{
          fontFamily: "'Georgia', serif",
          fontSize: "2.8rem",
          fontWeight: 400,
          color: "#1a1208",
          margin: "0 0 1rem",
          lineHeight: 1.1,
        }}>{data.learnerName}</h2>

        {/* Divider line */}
        <div style={{ width: "100%", height: "1px", background: "rgba(43,31,19,0.15)", margin: "0 0 1.25rem" }} />

        {/* Has successfully completed */}
        <p style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#7a6050",
          margin: "0 0 0.75rem",
        }}>HAS SUCCESSFULLY COMPLETED THE MASTERCLASS</p>

        {/* Course title */}
        <h3 style={{
          fontFamily: "'Georgia', serif",
          fontSize: "1.4rem",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#a0522d",
          margin: "0 0 2.5rem",
          maxWidth: "560px",
          lineHeight: 1.4,
        }}>{data.courseTitle}</h3>

        {/* Bottom row: date | seal | signature */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
        }}>
          {/* Date */}
          <div style={{ textAlign: "left" }}>
            <p style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7a6050",
              margin: "0 0 0.3rem",
            }}>DATE OF ISSUE</p>
            <p style={{
              fontFamily: "'Georgia', serif",
              fontSize: "1.05rem",
              fontWeight: 400,
              color: "#2b1f13",
              margin: "0 0 0.5rem",
            }}>{formattedDate}</p>
            <p style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              color: "#7a6050",
              margin: 0,
            }}>ID: {data.certificateCode}</p>
          </div>

          {/* Seal */}
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "2px solid #c9a96e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c9a96e",
            fontSize: "1.5rem",
            margin: "0 1rem",
          }}>✦</div>

          {/* Signature */}
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontFamily: "'Georgia', serif",
              fontSize: "1.2rem",
              fontStyle: "italic",
              color: "#2b1f13",
              margin: "0 0 0.25rem",
            }}>{data.artisanName.split(" ").slice(-1)[0] && data.artisanName.split(" ").length > 1
              ? data.artisanName.split(" ")[0][0] + ". " + data.artisanName.split(" ").slice(-1)[0]
              : data.artisanName
            }</p>
            <div style={{ width: "100%", height: "1px", background: "rgba(43,31,19,0.2)", margin: "0 0 0.3rem" }} />
            <p style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              color: "#7a6050",
              margin: "0 0 0.1rem",
            }}>{data.artisanName}</p>
            <p style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#7a6050",
              margin: 0,
            }}>MASTER ARTISAN</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: "0.5rem",
          color: "rgba(43,31,19,0.4)",
          marginTop: "1.5rem",
          letterSpacing: "0.05em",
        }}>
          *This certificate is dynamically generated to acknowledge completion of the course syllabus and is an unofficial credential.
        </p>
      </div>
    </div>
  );
}

export default function CertificateModal({ isOpen, onClose, data }: Props) {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  function handlePrint() {
    const el = certRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Certificate — ${data!.courseTitle}</title>
  <meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #f5f0e4; }
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 800);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", maxWidth: "860px", width: "100%", position: "relative" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "-2.5rem", right: 0, background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.75rem", opacity: 0.8 }}
        >✕</button>

        {/* The certificate — ref'd for printing */}
        <div ref={certRef}>
          <CertificateContent data={data} />
        </div>

        {/* Actions */}
        <button
          onClick={handlePrint}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 2rem",
            background: "#a0522d", color: "#fff",
            border: "none", borderRadius: "8px",
            fontFamily: "Arial, sans-serif", fontSize: "0.75rem",
            fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          ↓ Download / Print
        </button>
      </div>
    </div>
  );
}
