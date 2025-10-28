import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export default function Navbar({ toggleTheme, isDarkMode }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-black via-gray-900 to-orange-800 text-white shadow-lg border-b border-orange-500">
      {/* LEFT SECTION — Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/tyrefusion-logo.png"
          alt="TyreFusion Logo"
          className="w-10 h-10 object-contain"
        />
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-wide text-orange-400 hover:text-orange-300 transition"
        >
          TyreFusion
        </Link>
      </div>

      {/* RIGHT SECTION — Navigation & Actions */}
      <div className="flex items-center gap-6">
        {/* Home Link */}
        <Link
          to="/"
          className="text-sm font-semibold hover:text-orange-400 transition"
        >
          Home
        </Link>

        {/* Auth Links */}
        {!user ? (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold hover:text-orange-400 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold hover:text-orange-400 transition"
            >
              Signup
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/my-orders"
              className="text-sm font-semibold hover:text-orange-400 transition"
            >
              My Orders
            </Link>
            <Button
              onClick={handleLogout}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-1"
            >
              Logout
            </Button>
          </>
        )}

        {/* Cart Button */}
        <Link to="/cart" className="relative cursor-pointer">
          <ShoppingCart className="w-6 h-6 text-orange-400 hover:text-orange-300 transition" />
          {cart.length > 0 && (
            <span
              key={cart.length} // re-render when count changes
              className="absolute -top-2 -right-2 bg-orange-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse"
            >
              {cart.length}
            </span>
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-orange-400" />
          ) : (
            <Moon className="w-5 h-5 text-orange-400" />
          )}
        </button>
      </div>
    </nav>
  );
}
