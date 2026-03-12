import { useEffect, useState } from "react";
import ArtisanCategory from "../../components/artisans/ArtisanCategory";
import styles from "./Artisans.module.css";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/chat";

function Artisans() {
  const [artisans, setArtisans] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group artisans by industry
  const grouped = artisans.reduce<Record<string, Profile[]>>((acc, artisan) => {
    const key = artisan.industry ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(artisan);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={styles.page}>
        <p>Loading artisans...</p>
      </div>
    );
  }

  if (artisans.length === 0) {
    return (
      <div className={styles.page}>
        <p>No artisans found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Artisans</h2>
      {Object.entries(grouped).map(([industry, list]) => (
        <ArtisanCategory key={industry} title={industry} artisans={list} />
      ))}
    </div>
  );
}

export default Artisans;
