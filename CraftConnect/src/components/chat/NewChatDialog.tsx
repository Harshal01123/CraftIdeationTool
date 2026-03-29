import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { startProductConversation } from "../../lib/chatUtils";
import type { Profile, Product } from "../../types/chat";
import Spinner from "../Spinner";
import ArtisanProductPicker from "./ArtisanProductPicker";
import styles from "./NewChatDialog.module.css";

interface Props {
  currentProfile: Profile;
  onClose: () => void;
  onConversationStarted: (conversationId: string) => void;
}

type SearchMode = "name" | "industry";
type Step = "search" | "products";

async function fetchArtisans(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").eq("role", "artisan");
  return (data as Profile[]) ?? [];
}

export default function NewChatDialog({ currentProfile, onClose, onConversationStarted }: Props) {
  const [mode, setMode] = useState<SearchMode>("name");
  const [step, setStep] = useState<Step>("search");
  const [allArtisans, setAllArtisans] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Profile | null>(null);

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
    setSelectedArtisan(artisan);
    setNameQuery(artisan.name);
    setShowSuggestions(false);
    setStep("products");
  }

  function handleOkFromIndustry() {
    if (selectedArtisanFromIndustry) selectArtisan(selectedArtisanFromIndustry);
  }

  async function handleOfferConfirmed(product: Product, price: number) {
    if (!selectedArtisan) return;
    setProcessing(true);

    const result = await startProductConversation({
      customerId: currentProfile.id,
      artisanId: selectedArtisan.id,
      payload: {
        productId: product.id,
        productName: product.name,
        imageUrl: product.image_url,
        listedPrice: product.price,
        offeredPrice: price,
      },
    });

    setProcessing(false);
    if (result.error) { alert(result.error); return; }
    onConversationStarted(result.conversationId!);
    onClose();
  }

  // ── Render ──
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {step === "products" && selectedArtisan ? "Choose a Product" : "New Conversation"}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Step 2: Product Picker */}
        {step === "products" && selectedArtisan ? (
          <ArtisanProductPicker
            artisan={selectedArtisan}
            onOfferConfirmed={handleOfferConfirmed}
            onBack={() => { setStep("search"); setSelectedArtisan(null); }}
            isProcessing={processing}
          />
        ) : (
          <>
            {/* Mode toggle */}
            <div className={styles.modeRow}>
              <button
                className={`${styles.modeBtn} ${mode === "name" ? styles.modeBtnActive : ""}`}
                onClick={() => { setMode("name"); setNameQuery(""); }}
              >
                <span className="material-symbols-outlined">person_search</span>
                Search by Name
              </button>
              <button
                className={`${styles.modeBtn} ${mode === "industry" ? styles.modeBtnActive : ""}`}
                onClick={() => { setMode("industry"); setSelectedIndustry(""); setSelectedArtisanFromIndustry(null); }}
              >
                <span className="material-symbols-outlined">category</span>
                Search by Industry
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}><Spinner label="Loading artisans..." /></div>
            ) : mode === "name" ? (
              <div className={styles.section}>
                <label className={styles.label}>Artisan Name</label>
                <div className={styles.searchWrapper}>
                  <span className="material-symbols-outlined">search</span>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Type an artisan name..."
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
                <label className={styles.label}>Industry</label>
                <select
                  className={styles.select}
                  value={selectedIndustry}
                  onChange={(e) => { setSelectedIndustry(e.target.value); setSelectedArtisanFromIndustry(null); }}
                >
                  <option value="">— Select an industry —</option>
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>

                {selectedIndustry && (
                  <>
                    <label className={styles.label} style={{ marginTop: "1rem" }}>Artisan</label>
                    <select
                      className={styles.select}
                      value={selectedArtisanFromIndustry?.id ?? ""}
                      onChange={(e) => {
                        const found = artisansInIndustry.find((a) => a.id === e.target.value) ?? null;
                        setSelectedArtisanFromIndustry(found);
                      }}
                    >
                      <option value="">— Select an artisan —</option>
                      {artisansInIndustry.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    <div className={styles.actions}>
                      <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                      <button
                        className={styles.okBtn}
                        disabled={!selectedArtisanFromIndustry}
                        onClick={handleOkFromIndustry}
                      >
                        See Products
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
