import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Login from "@/pages/Login"; // ✅ OTP-based login
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import Orders from "@/components/admin/Orders";
import { useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

// Wrapper to safely use useLocation
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();
  const location = useLocation();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {!isAdminRoute && (
        <Navbar
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          cartCount={cartCount}
        />
      )}

      <main className="pt-6">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* Global WhatsApp Button */}
        <FloatingWhatsAppButton />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}
