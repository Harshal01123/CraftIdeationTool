import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/Spinner";
import ArtisanDashboard from "./ArtisanDashboard";
import LearnerDashboard from "./LearnerDashboard";
import CustomerDashboard from "./CustomerDashboard";

function Dashboard() {
  const { profile, authLoading } = useAuth();

  if (authLoading)
    return (
      <div style={{ padding: "2rem" }}>
        <Spinner label="Loading..." />
      </div>
    );
  if (profile?.role === "artisan")
    return <ArtisanDashboard artisanId={profile.id} />;
  if (profile?.role === "customer")
    return <CustomerDashboard customerId={profile.id} />;
  return <LearnerDashboard />;
}

export default Dashboard;
