import { useAuth } from "../../hooks/useAuth";
import { useMode } from "../../contexts/ModeContext";
import Spinner from "../../components/Spinner";
import ArtisanDashboard from "./ArtisanDashboard";
import LearnerDashboard from "./LearnerDashboard";
import CustomerDashboard from "./CustomerDashboard";

function Dashboard() {
  const { profile, authLoading } = useAuth();
  const { activeMode } = useMode();

  if (authLoading)
    return (
      <div style={{ padding: "2rem" }}>
        <Spinner label="Loading..." />
      </div>
    );
  if (activeMode === "artisan" && profile?.id)
    return <ArtisanDashboard artisanId={profile.id} />;
  if (activeMode === "customer" && profile?.id)
    return <CustomerDashboard customerId={profile.id} />;
  return <LearnerDashboard />;
}

export default Dashboard;
