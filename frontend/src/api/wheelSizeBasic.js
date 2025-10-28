const BASE_URL = "https://api.wheel-size.com/v2";
const API_KEY = import.meta.env.VITE_WHEELSIZE_KEY;

// 1️⃣ Get all makes
export async function fetchMakes() {
  const res = await fetch(`${BASE_URL}/makes/?user_key=${API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch makes");
  const data = await res.json();
  return data.data.map((m) => m.name);
}

// 2️⃣ Get models for make
export async function fetchModels(make) {
  const res = await fetch(`${BASE_URL}/models/?make=${make}&user_key=${API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch models");
  const data = await res.json();
  return data.data.map((m) => m.name);
}

// 3️⃣ Get available years for make + model
export async function fetchYears(make, model) {
  // Normalize casing and spacing
  const safeMake = make.trim().toLowerCase();
  const safeModel = model.trim().toLowerCase();

  const res = await fetch(
    `${BASE_URL}/generations/?make=${encodeURIComponent(safeMake)}&model=${encodeURIComponent(
      safeModel
    )}&user_key=${API_KEY}`
  );

  if (!res.ok) throw new Error("Failed to fetch years");
  const data = await res.json();

  console.log("📜 Raw generations response:", data);

  const years = new Set();
  (data.data || []).forEach((g) => {
    const start = g.start_year || 2020;
    const end = g.end_year || new Date().getFullYear();
    for (let y = start; y <= end; y++) years.add(y);
  });

  console.log("📅 Years fetched:", Array.from(years));
  return Array.from(years).sort((a, b) => b - a);
}

