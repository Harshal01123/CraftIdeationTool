import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { type Profile } from "../types/chat";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Get the current logged-in session on page load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        fetchProfile(data.session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for login/logout events in real time
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user?.id) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setAuthLoading(false);
        }
      },
    );

    // Cleanup listener when component unmounts
    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    setAuthLoading(false);
  }

  return { session, profile, authLoading };
}
