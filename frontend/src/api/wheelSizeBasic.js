// ✅ Updated to use backend proxy instead of direct Wheel-Size API calls
// This avoids CORS + sandbox restrictions

const API_BASE = import.meta.env.VITE_API_BASE; // e.g. http://13.201.227.67:5000

// 1️⃣ Get all makes
export async function fetchMakes() {
  try {
    const res = await fetch(`${API_BASE}/api/wheelsize/makes`);
    if (!res.ok) throw new Error("Failed to fetch makes");
    const data = await res.json();
    // Handle both array and nested structure
    if (Array.isArray(data)) return data.map((m) => m.name || m);
    if (data.data) return data.data.map((m) => m.name || m);
    return data;
  } catch (err) {
    console.error("❌ Error in fetchMakes:", err);
    throw err;
  }
}

// 2️⃣ Get models for a given make
export async function fetchModels(make) {
  try {
    const res = await fetch(`${API_BASE}/api/wheelsize/models/${encodeURIComponent(make)}`);
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    if (Array.isArray(data)) return data.map((m) => m.name || m);
    if (data.data) return data.data.map((m) => m.name || m);
    return data;
  } catch (err) {
    console.error("❌ Error in fetchModels:", err);
    throw err;
  }
}

// 3️⃣ Get available years for make + model
export async function fetchYears(make, model) {
  try {
    const res = await fetch(
      `${API_BASE}/api/wheelsize/years/${encodeURIComponent(make)}/${encodeURIComponent(model)}`
    );
    if (!res.ok) throw new Error("Failed to fetch years");
    const data = await res.json();

    // Try to extract years array from different formats
    if (Array.isArray(data)) return data.sort((a, b) => b - a);
    if (data.data && Array.isArray(data.data)) {
      const years = new Set();
      (data.data || []).forEach((g) => {
        const start = g.start_year || 2020;
        const end = g.end_year || new Date().getFullYear();
        for (let y = start; y <= end; y++) years.add(y);
      });
      return Array.from(years).sort((a, b) => b - a);
    }

    return data;
  } catch (err) {
    console.error("❌ Error in fetchYears:", err);
    throw err;
  }
}
