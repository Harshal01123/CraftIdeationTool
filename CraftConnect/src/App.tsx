// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Courses from "./pages/dashboard/Courses";
import Artisans from "./pages/dashboard/Artisans";
import Products from "./pages/dashboard/Products";
import Dashboard from "./pages/dashboard/Dashboard";
import Notifications from "./pages/dashboard/Notifications";
import Messages from "./pages/dashboard/Messages";
import ArtisanPortfolio from "./pages/ArtisanPortfolio";  // ← new import
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* All dashboard routes are protected — requires login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="artisans" element={<Artisans />} />
            <Route path="artisans/:id" element={<ArtisanPortfolio />} /> {/* ← portfolio route */}
            <Route path="products" element={<Products />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="messages" element={<Messages />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;