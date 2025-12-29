import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Moon, Sun, Menu, X, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export default function Navbar({ toggleTheme, isDarkMode }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const HELPLINE =
    import.meta.env.VITE_HELPLINE_NUMBER || "+91XXXXXXXXXX";

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const navbarClasses = isDarkMode
    ? "bg-gradient-to-r from-black via-gray-900 to-orange-800 text-white border-orange-500"
    : "bg-gradient-to-r from-white via-gray-200 to-orange-100 text-gray-900 border-orange-300";

  const drawerClasses = isDarkMode
    ? "bg-gradient-to-b from-black via-gray-900 to-orange-900 text-white"
    : "bg-gradient-to-b from-white via-orange-50 to-orange-200 text-gray-900";

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`flex items-center justify-between px-6 sm:px-8 py-4 shadow-lg border-b sticky top-0 z-50 ${navbarClasses}`}
      >
        {/* LEFT — LOGO */}
        <div className="flex items-center gap-3">
          <img
            src={
              isDarkMode
                ? "/tyrefusion-logo-dark.png"
                : "/tyrefusion-logo-light.png"
            }
            alt="TyreFusion Logo"
            className="w-10 h-10 object-contain transition-all"
          />

          <Link
            to="/"
            className={`text-2xl font-extrabold tracking-wide ${
              isDarkMode ? "text-orange-400" : "text-orange-600"
            } hover:opacity-80 transition`}
          >
            TyreFusion
          </Link>
        </div>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-semibold hover:text-orange-500 transition"
          >
            Home
          </Link>

          {!user ? (
            <Link
              to="/login"
              className="text-sm font-semibold hover:text-orange-500 transition"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/my-orders"
                className="text-sm font-semibold hover:text-orange-500 transition"
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

          {/* HELP ICON (CALL) */}
          <button
            onClick={() => (window.location.href = `tel:${HELPLINE}`)}
            className="flex items-center gap-2 text-sm font-semibold hover:text-orange-500 transition"
            title="Call Support"
          >
            <Phone className="w-5 h-5 text-orange-500" />
            <span>Help</span>
          </button>

          {/* CART */}
          <Link to="/cart" className="relative cursor-pointer">
            <ShoppingCart
              className={`w-6 h-6 ${
                isDarkMode ? "text-orange-400" : "text-orange-600"
              } hover:opacity-80 transition`}
            />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode ? "bg-gray-800" : "bg-gray-200"
            } hover:opacity-80 transition`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-orange-400" />
            ) : (
              <Moon className="w-5 h-5 text-orange-600" />
            )}
          </button>
        </div>

        {/* MOBILE RIGHT SECTION (CART + MENU) */}
        <div className="flex items-center gap-3 md:hidden">
          {/* MOBILE CART */}
          <Link to="/cart" className="relative">
            <ShoppingCart
              className={`w-7 h-7 ${
                isDarkMode ? "text-orange-400" : "text-orange-600"
              }`}
            />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            className={`p-2 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-gray-200"
            } hover:opacity-80 transition`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu
              className={`w-6 h-6 ${
                isDarkMode ? "text-orange-400" : "text-orange-600"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className={`w-72 shadow-xl p-6 animate-slideInRight ${drawerClasses}`}
          >
            <button
              className={`mb-6 p-2 rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-300"
              } hover:opacity-80 transition`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <X
                className={`w-6 h-6 ${
                  isDarkMode ? "text-orange-400" : "text-orange-600"
                }`}
              />
            </button>

            <div className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-semibold hover:text-orange-500 transition"
              >
                Home
              </Link>

              {!user ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-semibold hover:text-orange-500 transition"
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-semibold hover:text-orange-500 transition"
                  >
                    My Orders
                  </Link>
                  <Button
                    onClick={handleLogout}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-1 w-fit"
                  >
                    Logout
                  </Button>
                </>
              )}

              {/* HELPLINE INSIDE MOBILE DRAWER */}
              <button
                onClick={() => (window.location.href = `tel:${HELPLINE}`)}
                className="flex items-center gap-3 mt-4 text-lg font-semibold hover:text-orange-500 transition"
              >
                <Phone className="w-5 h-5 text-orange-500" />
                <span>Help</span>
              </button>

              {/* THEME TOGGLE */}
              <button
                onClick={toggleTheme}
                className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-300"
                } hover:opacity-80 transition`}
              >
                {isDarkMode ? (
                  <Sun className="w-6 h-6 text-orange-400" />
                ) : (
                  <Moon className="w-6 h-6 text-orange-600" />
                )}
                <span className="text-lg">Toggle Theme</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
