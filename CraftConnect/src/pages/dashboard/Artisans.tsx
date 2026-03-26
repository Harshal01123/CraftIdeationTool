import { useEffect, useState } from "react";
import styles from "./Artisans.module.css";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/chat";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useOutletContext } from "react-router-dom";
import ContactDialog from "../../components/chat/ContactDialog";
import { startConversation } from "../../lib/chatUtils";

function Artisans() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [artisans, setArtisans] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  // Filter & Sort state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  // Dialog State
  const [showDialog, setShowDialog] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Profile | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchArtisans() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "artisan");

      if (!error && data) {
        setArtisans(data as Profile[]);
      }
      setLoading(false);
    }

    fetchArtisans();
  }, []);

  function handleMessageClick(artisan: Profile) {
    if (!profile) return alert("Please log in to chat.");
    setSelectedArtisan(artisan);
    setShowDialog(true);
  }

  async function handleStartChat(messageText: string) {
    if (!selectedArtisan || !profile) return;
    setProcessing(true);

    const result = await startConversation({
      customerId: profile.id,
      artisanId: selectedArtisan.id,
      title: `Chat with ${selectedArtisan.name}`,
      messageText,
      isOrder: false,
    });

    setProcessing(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setShowDialog(false);
    navigate(`/dashboard/messages?conversation=${result.conversationId}`);
  }

  // Pick one artisan based on week number
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const spotlightArtisan =
    artisans.length > 0 ? artisans[weekNumber % artisans.length] : null;

  return (
    <div className={styles.page}>
      <div className={styles.contentWrap}>
        {/* Featured Spotlight Section */}
        {spotlightArtisan && (
          <section className={styles.spotlight}>
            <div className={styles.spotlightCard}>
              <div className={styles.spotlightImgWrapper}>
                <img
                  src={
                    spotlightArtisan.avatar_url ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBG93m86mlZdkVgiZSmuZsyX4X5baxI7jZuneP-tYDKYp08y0h0tO58pjT5FV_h8xLmeTKAFEkvXFogSVVngSnmDrjtuMZsIzrsaaEFR9gd16IwqmYrVOfaydeS7-gvrMTDwKP3y-qMh1ChztY51rissfh9kNVK1dNoBwsNUsc7zcA6Nzfu6EAMDAJW6XvjSLcjPjNgYwosDaHlRSiK1RTmQvqCG6R7UIvbVjvRlZN8SL0WXLOUu8KWNXoWTT8WCvzPS2UxtRvRlZ8"
                  }
                  alt={spotlightArtisan.name}
                  className={styles.spotlightImg}
                />
                <div className={styles.imgOverlay}></div>
              </div>

              <div className={styles.spotlightContent}>
                <div className={styles.decoTopRight}></div>
                <div className={styles.decoBottomLeft}></div>

                <span className={styles.spotlightTag}>Featured Artisan</span>
                <h3 className={styles.spotlightTitle}>
                  {spotlightArtisan.name}
                </h3>
                <p className={styles.spotlightQuote}>
                  "
                  {(spotlightArtisan as any).description ||
                    "The clay speaks to me in rhythms of my ancestors. Every vessel is a bridge between the earth and our shared memory."}
                  "
                </p>

                <div className={styles.spotlightMeta}>
                  <span className={styles.masterGrade}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    4.9 Master Grade
                  </span>
                </div>

                <div className={styles.spotlightActions}>
                  <button
                    className={styles.btnPrimary}
                    onClick={() =>
                      navigate(`/dashboard/artisans/${spotlightArtisan.id}`)
                    }
                  >
                    Read Story
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter Bar */}
        <div className={styles.filterBar} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>tune</span>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Advanced Filters:</span>
          
          <select 
            className={styles.filterPill} 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as any)}
            style={{ backgroundColor: 'transparent', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}
          >
            <option value="">Sort by Name</option>
            <option value="asc">A to Z</option>
            <option value="desc">Z to A</option>
          </select>

          <select 
            className={styles.filterPill} 
            value={selectedIndustry} 
            onChange={(e) => setSelectedIndustry(e.target.value)}
            style={{ backgroundColor: 'transparent', cursor: 'pointer', border: '1px solid var(--outline-variant)' }}
          >
            <option value="">All Industries</option>
            {Array.from(new Set(artisans.map(a => a.industry).filter(Boolean))).map(ind => (
              <option key={ind as string} value={ind as string}>{ind}</option>
            ))}
          </select>
          
          {(sortOrder || selectedIndustry) && (
             <button 
               className={styles.advancedFilter} 
               onClick={() => { setSortOrder(""); setSelectedIndustry(""); }}
             >
               Clear Filters
             </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loader}>
            <Spinner label="Loading artisans..." />
          </div>
        ) : (
          (() => {
            let filteredArtisans = [...artisans];

            if (selectedIndustry) {
              filteredArtisans = filteredArtisans.filter(a => a.industry === selectedIndustry);
            }

            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              filteredArtisans = filteredArtisans.filter(
                (a) =>
                  a.name.toLowerCase().includes(q) ||
                  (a.industry && a.industry.toLowerCase().includes(q)),
              );
            }

            if (sortOrder === "asc") {
              filteredArtisans.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortOrder === "desc") {
              filteredArtisans.sort((a, b) => b.name.localeCompare(a.name));
            }

            // If no search and no strict filter, truncate to 9 elements
            if (!searchQuery && !selectedIndustry && !sortOrder) {
              // "don't show all the artisans at once"
              filteredArtisans = filteredArtisans.slice(0, 9); // Only show first 9 when not searching
            }

            if (filteredArtisans.length === 0) {
              return <p className={styles.emptyText}>No artisans found.</p>;
            }

            return (
              <div className={styles.grid}>
                {filteredArtisans.map((artisan) => (
                  <div key={artisan.id} className={styles.artisanCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarWrapper}>
                        <img
                          src={
                            artisan.avatar_url ||
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
                          }
                          alt={artisan.name}
                          className={styles.avatarImg}
                        />
                        <div className={styles.verifiedBadge}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                        </div>
                      </div>
                      <div className={styles.headerInfo}>
                        <h4 className={styles.artisanName}>{artisan.name}</h4>
                        <p className={styles.artisanIndustry}>
                          {artisan.industry || "Master Artisan"}
                        </p>
                        <p className={styles.artisanLocation}>
                          <span className="material-symbols-outlined">
                            location_on
                          </span>
                          {artisan.location || "Chhattisgarh"}
                        </p>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <p className={styles.artisanBio}>
                        {artisan.description ||
                          "Traditional artisan preserving ancient heritage crafts with skills passed down for generations."}
                      </p>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewProfileBtn}
                        onClick={() =>
                          navigate(`/dashboard/artisans/${artisan.id}`)
                        }
                      >
                        View Profile
                      </button>
                      <button
                        className={styles.mailBtn}
                        onClick={() => handleMessageClick(artisan)}
                      >
                        <span className="material-symbols-outlined">mail</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      <ContactDialog
        isOpen={showDialog && selectedArtisan !== null}
        onClose={() => setShowDialog(false)}
        artisanName={selectedArtisan?.name}
        isProcessing={processing}
        onSubmit={handleStartChat}
        mode="chat"
      />
    </div>
  );
}

export default Artisans;
