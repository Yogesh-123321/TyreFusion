import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  LogOut,
  BarChart2,
  Car,
  Package,
  Settings,
} from "lucide-react";
import CarManager from "@/components/admin/CarManager";
import TyreManager from "@/components/admin/TyreManager";
import Orders from "@/components/admin/Orders";

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(() => console.error("Failed to fetch admin stats"));
    }
  }, [token]);

  const chartData = [
    { name: "Tyres", value: stats?.totalTyres || 0 },
    { name: "Cars", value: stats?.totalCars || 0 },
    { name: "Orders", value: stats?.totalOrders || 0 },
    { name: "Sales", value: stats?.totalSales || 0 },
  ];

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`w-64 flex flex-col justify-between p-6 border-r backdrop-blur-xl bg-opacity-90 ${
          darkMode
            ? "bg-gradient-to-b from-black/70 via-gray-900/70 to-orange-900/60 border-orange-600"
            : "bg-gradient-to-b from-white/80 via-orange-50/70 to-orange-100/60 border-orange-300 text-gray-900"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <h1
            className={`text-2xl font-extrabold mb-8 text-center ${
              darkMode ? "text-orange-400" : "text-orange-600"
            }`}
          >
            TyreFusion Admin
          </h1>

          {/* Scrollable navigation section only */}
          <nav className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-1">
            <SidebarButton
              label="Dashboard"
              icon={<BarChart2 className="w-5 h-5" />}
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              darkMode={darkMode}
            />
            <SidebarButton
              label="Manage Cars"
              icon={<Car className="w-5 h-5" />}
              active={activeTab === "cars"}
              onClick={() => setActiveTab("cars")}
              darkMode={darkMode}
            />
            <SidebarButton
              label="Manage Tyres"
              icon={<Package className="w-5 h-5" />}
              active={activeTab === "tyres"}
              onClick={() => setActiveTab("tyres")}
              darkMode={darkMode}
            />
            <SidebarButton
              label="Orders"
              icon={<Settings className="w-5 h-5" />}
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
              darkMode={darkMode}
            />
          </nav>
        </div>

        {/* Fixed footer section */}
        <div className="space-y-4 mt-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center w-full py-2 rounded-lg backdrop-blur-md transition ${
              darkMode
                ? "bg-gray-800/60 hover:bg-gray-700/70 text-orange-400"
                : "bg-orange-200/70 hover:bg-orange-300/80 text-gray-800"
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout */}
          <Button
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 backdrop-blur-md ${
              darkMode
                ? "bg-orange-600/80 hover:bg-orange-700 text-white"
                : "bg-orange-500/80 hover:bg-orange-600 text-white"
            }`}
          >
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-visible p-10">
        <div className="pb-24">
          <h2
            className={`text-3xl font-bold mb-6 ${
              darkMode ? "text-orange-500" : "text-orange-600"
            }`}
          >
            {activeTab === "dashboard" && "📊 Dashboard Overview"}
            {activeTab === "cars" && "🚗 Manage Cars"}
            {activeTab === "tyres" && "🛞 Manage Tyres"}
            {activeTab === "orders" && "📦 Manage Orders"}
          </h2>

          {/* Dashboard Overview */}
          {activeTab === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                  title="Total Tyres"
                  value={stats?.totalTyres}
                  darkMode={darkMode}
                />
                <StatCard
                  title="Total Cars"
                  value={stats?.totalCars}
                  darkMode={darkMode}
                />
                <StatCard
                  title="Total Orders"
                  value={stats?.totalOrders}
                  darkMode={darkMode}
                />
                <StatCard
                  title="Total Sales (₹)"
                  value={stats?.totalSales}
                  darkMode={darkMode}
                />
              </div>

              {/* Chart */}
              <div
                className={`rounded-xl border p-6 shadow-lg transition ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-900 to-black border-orange-600"
                    : "bg-gradient-to-br from-orange-100 to-white border-orange-300"
                }`}
              >
                <h3
                  className={`text-xl font-semibold mb-4 ${
                    darkMode ? "text-orange-400" : "text-orange-600"
                  }`}
                >
                  Performance Chart
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ddd"} />
                    <XAxis dataKey="name" stroke={darkMode ? "#ccc" : "#555"} />
                    <YAxis stroke={darkMode ? "#ccc" : "#555"} />
                    <Tooltip />
                    <Bar dataKey="value" fill={darkMode ? "#f97316" : "#fb923c"} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Manage Cars */}
          {activeTab === "cars" && <CarManager darkMode={darkMode} />}

          {/* Manage Tyres */}
          {activeTab === "tyres" && <TyreManager darkMode={darkMode} />}

          {/* Orders */}
          {activeTab === "orders" && <Orders darkMode={darkMode} />}
        </div>
      </main>
    </div>
  );
}

/* ---------------------- Reusable Components ---------------------- */
const SidebarButton = ({ label, icon, active, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition ${
      active
        ? darkMode
          ? "bg-orange-600 text-white"
          : "bg-orange-500 text-white"
        : darkMode
        ? "hover:bg-orange-700/40 text-gray-200"
        : "hover:bg-orange-200 text-gray-800"
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatCard = ({ title, value, darkMode }) => (
  <div
    className={`p-6 rounded-xl shadow-lg text-center hover:scale-105 transition-transform duration-200 ${
      darkMode
        ? "bg-gradient-to-br from-orange-600 to-orange-800 text-white"
        : "bg-gradient-to-br from-orange-200 to-orange-400 text-gray-900"
    }`}
  >
    <h4 className="text-lg font-semibold">{title}</h4>
    <p className="text-3xl font-bold mt-2">{value ?? "--"}</p>
  </div>
);
