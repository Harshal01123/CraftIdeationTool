import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
    });

    // Also listen for logout events so dashboard auto-redirects
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // While checking session, render nothing to prevent flash
  if (isAuthenticated === null) return null;

  // If not logged in, redirect to login page
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If logged in, render the protected child routes
  return <Outlet />;
}

export default ProtectedRoute;
