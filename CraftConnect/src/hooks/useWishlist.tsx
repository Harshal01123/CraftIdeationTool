import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

interface WishlistContextType {
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    async function fetchWishlist() {
      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", profile!.id);
      
      if (data) {
        setWishlistIds(new Set(data.map((item) => item.product_id)));
      }
      setLoading(false);
    }
    
    fetchWishlist();
  }, [profile]);

  async function toggleWishlist(productId: string) {
    if (!profile) return;
    
    // Optimistic update
    const isWishlisted = wishlistIds.has(productId);
    
    setWishlistIds((prev) => {
      const newSet = new Set(prev);
      if (isWishlisted) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .match({ user_id: profile.id, product_id: productId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: profile.id, product_id: productId });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
      // Revert optimistic update on error
      setWishlistIds((prev) => {
        const newSet = new Set(prev);
        if (isWishlisted) newSet.add(productId);
        else newSet.delete(productId);
        return newSet;
      });
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
