// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Courses from "./pages/dashboard/Courses";
import Artisans from "./pages/dashboard/Artisans";
import Products from "./pages/dashboard/Products";
import MyProducts from "./pages/dashboard/MyProducts";
import MyCourses from "./pages/dashboard/MyCourses";
import Dashboard from "./pages/dashboard/Dashboard";
import Notifications from "./pages/dashboard/Notifications";
import Messages from "./pages/dashboard/Messages";
import ArtisanPortfolio from "./pages/ArtisanPortfolio";
import ProductPortfolio from "./pages/ProductPortfolio";
import CoursePortfolio from "./pages/dashboard/CoursePortfolio";
import EditProfile from "./pages/dashboard/EditProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import { WishlistProvider } from "./hooks/useWishlist";
import { ModeProvider } from "./contexts/ModeContext";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* All dashboard routes are protected — requires login */}
        <Route element={<ProtectedRoute />}>
          <Route element={<WishlistProvider><ModeProvider><Outlet /></ModeProvider></WishlistProvider>}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CoursePortfolio />} />
              <Route path="artisans" element={<Artisans />} />
              <Route path="artisans/:id" element={<ArtisanPortfolio />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductPortfolio />} />
              <Route path="my-products" element={<MyProducts />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="profile" element={<EditProfile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="messages" element={<Messages />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
