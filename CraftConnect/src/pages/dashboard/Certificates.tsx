import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import CertificateModal from "../../components/courses/CertificateModal";
import Spinner from "../../components/Spinner";
import styles from "./Certificates.module.css";

interface CertRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  course: {
    id: string;
    title: string;
    category: string;
    artisan: { id: string; name: string };
  };
}

interface ModalData {
  learnerName: string;
  courseTitle: string;
  artisanName: string;
  issuedAt: string;
  certificateCode: string;
}

export default function Certificates() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    async function fetch() {
      const { data } = await supabase
        .from("certificates")
        .select(`
          id, certificate_code, issued_at,
          course:courses!course_id(id, title, category, artisan:profiles!artisan_id(id, name))
        `)
        .eq("user_id", profile!.id)
        .order("issued_at", { ascending: false });
      setCerts((data as unknown as CertRow[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, [profile?.id]);

  function openModal(cert: CertRow) {
    setModalData({
      learnerName: profile?.name ?? "Learner",
      courseTitle: cert.course.title,
      artisanName: cert.course.artisan.name,
      issuedAt: cert.issued_at,
      certificateCode: cert.certificate_code,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Certificates</h1>
          <p className={styles.subtitle}>Your earned masterclass credentials</p>
        </div>

        {loading ? (
          <div className={styles.loadingWrap}><Spinner label="Loading certificates..." /></div>
        ) : certs.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">verified</span>
            <p>No certificates yet. Complete a masterclass to earn one!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {certs.map((cert) => (
              <div key={cert.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardSeal}>◈</div>
                  <span className={styles.cardCode}>{cert.certificate_code}</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardCertLabel}>Certificate of Completion</p>
                  <h3 className={styles.cardCourseTitle}>{cert.course.title}</h3>
                  <p className={styles.cardArtisan}>by {cert.course.artisan.name}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardCategory}>{cert.course.category}</span>
                    <span className={styles.cardDate}>
                      {new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <button className={styles.viewBtn} onClick={() => openModal(cert)}>
                  <span className="material-symbols-outlined">workspace_premium</span>
                  View Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CertificateModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        data={modalData}
      />
    </div>
  );
}
