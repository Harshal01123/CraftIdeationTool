import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/chat";
import Spinner from "../Spinner";
import styles from "./NewChatDialog.module.css";
import { useTranslation } from "react-i18next";

interface Props {
  currentProfile: Profile;
  onClose: () => void;
  onArtisanSelected: (artisan: Profile) => void;
}

type SearchMode = "name" | "industry";

async function fetchArtisans(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").eq("role", "artisan");
  return (data as Profile[]) ?? [];
}

export default function NewChatDialog({ currentProfile, onClose, onArtisanSelected }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<SearchMode>("name");
  const [allArtisans, setAllArtisans] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Name search state
  const [nameQuery, setNameQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Industry search state
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedArtisanFromIndustry, setSelectedArtisanFromIndustry] = useState<Profile | null>(null);

  useEffect(() => {
    fetchArtisans().then((data) => {
      setAllArtisans(data.filter((a) => a.id !== currentProfile.id));
      setLoading(false);
    });
  }, []);

  const industries = [...new Set(allArtisans.map((a) => a.industry).filter(Boolean))].sort() as string[];

  const nameSuggestions = nameQuery.trim().length > 0
    ? allArtisans.filter((a) => a.name.toLowerCase().includes(nameQuery.toLowerCase())).slice(0, 6)
    : [];

  const artisansInIndustry = selectedIndustry
    ? allArtisans.filter((a) => a.industry === selectedIndustry)
    : [];

  function selectArtisan(artisan: Profile) {
    onArtisanSelected(artisan);
    onClose();
  }

  function handleOkFromIndustry() {
    if (selectedArtisanFromIndustry) selectArtisan(selectedArtisanFromIndustry);
  }

  // ── Render ──
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{t("extended.newConversation")}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
            {/* Mode toggle */}
            <div className={styles.modeRow}>
              <button
                className={`${styles.modeBtn} ${mode === "name" ? styles.modeBtnActive : ""}`}
                onClick={() => { setMode("name"); setNameQuery(""); }}
              >
                <span className="material-symbols-outlined">person_search</span>
                {t("extended.searchByName")}
              </button>
              <button
                className={`${styles.modeBtn} ${mode === "industry" ? styles.modeBtnActive : ""}`}
                onClick={() => { setMode("industry"); setSelectedIndustry(""); setSelectedArtisanFromIndustry(null); }}
              >
                <span className="material-symbols-outlined">category</span>
                {t("extended.searchByIndustry")}
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}><Spinner label="Loading artisans..." /></div>
            ) : mode === "name" ? (
              <div className={styles.section}>
                <label className={styles.label}>{t("extended.artisanName")}</label>
                <div className={styles.searchWrapper}>
                  <span className="material-symbols-outlined">search</span>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={t("extended.typeArtisanName")}
                    value={nameQuery}
                    onChange={(e) => { setNameQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {nameSuggestions.length > 0 && showSuggestions && (
                    <ul className={styles.suggestions}>
                      {nameSuggestions.map((a) => (
                        <li key={a.id} className={styles.suggestionItem} onMouseDown={() => selectArtisan(a)}>
                          {a.avatar_url
                            ? <img src={a.avatar_url} alt={a.name} className={styles.suggestionAvatar} />
                            : <span className={styles.suggestionAvatarFallback}>{a.name.charAt(0)}</span>
                          }
                          <div>
                            <p className={styles.suggestionName}>{a.name}</p>
                            {a.industry && <p className={styles.suggestionIndustry}>{a.industry}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.section}>
                <label className={styles.label}>{t("extended.industry")}</label>
                <select
                  className={styles.select}
                  value={selectedIndustry}
                  onChange={(e) => { setSelectedIndustry(e.target.value); setSelectedArtisanFromIndustry(null); }}
                >
                  <option value="">{t("extended.selectIndustry")}</option>
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>

                {selectedIndustry && (
                  <>
                    <label className={styles.label} style={{ marginTop: "1rem" }}>{t("extended.artisan")}</label>
                    <select
                      className={styles.select}
                      value={selectedArtisanFromIndustry?.id ?? ""}
                      onChange={(e) => {
                        const found = artisansInIndustry.find((a) => a.id === e.target.value) ?? null;
                        setSelectedArtisanFromIndustry(found);
                      }}
                    >
                      <option value="">{t("extended.selectArtisan")}</option>
                      {artisansInIndustry.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <div className={styles.actions}>
                      <button className={styles.cancelBtn} onClick={onClose}>{t("extended.cancel")}</button>
                      <button
                        className={styles.okBtn}
                        disabled={!selectedArtisanFromIndustry}
                        onClick={handleOkFromIndustry}
                      >
                        {t("extended.seeProducts")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
      </div>
    </div>
  );
}
