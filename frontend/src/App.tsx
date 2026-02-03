import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DashboardLayout from "./layouts/DashboardLayout";
import EditProfile from "./pages/Edit-profile";
import Login from "./pages/Login";
import Courses from "./pages/dashboard/Courses";
import Craftsmen from "./pages/dashboard/Craftsmen";
import Products from "./pages/dashboard/Products";
import Dashboard from "./pages/dashboard/Dashboard";
import Notifications from "./pages/dashboard/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="craftsmen" element={<Craftsmen />} />
          <Route path="products" element={<Products />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
