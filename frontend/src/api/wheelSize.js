const BASE_URL = "https://api.wheel-size.com/v2";
const API_KEY = import.meta.env.VITE_WHEELSIZE_KEY;

// ✅ Fetch variants
export async function fetchVariants(make, model, year) {
  const res = await fetch(`${BASE_URL}/modifications/?make=${make}&model=${model}&year=${year}&user_key=${API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch variants");
  const data = await res.json();
  return (data.data || []).map((v) => ({
    name: v.name || v.trim || "Unknown",
    slug: v.slug,
    fuel: v.engine?.fuel,
    power: v.engine?.power?.hp,
  }));
}

// ✅ Fetch tyre sizes (fitments)
export async function fetchFitments(make, model, year, mod) {
  const safeMake = make.trim().toLowerCase();
  const safeModel = model.trim().toLowerCase();

  console.log("🚗 Fetching fitments for:", safeMake, safeModel, year, mod);

  const url = `${BASE_URL}/search/by_model/?make=${encodeURIComponent(
    safeMake
  )}&model=${encodeURIComponent(safeModel)}&year=${year}&modification=${mod}&user_key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch fitments");
  const data = await res.json();

  console.log("📦 Raw fitment response:", data);

  const sizes = new Set();

  // ✅ Some responses use item.front/rear
  (data.data || []).forEach((item) => {
    const front = item.front?.tire_full || item.front?.tire;
    const rear = item.rear?.tire_full || item.rear?.tire;
    if (front) sizes.add(front.split(" ")[0].toUpperCase());
    if (rear) sizes.add(rear.split(" ")[0].toUpperCase());

    // ✅ But most store inside item.wheels[]
    if (Array.isArray(item.wheels)) {
      item.wheels.forEach((wheel) => {
        const f = wheel.front?.tire_full || wheel.front?.tire;
        const r = wheel.rear?.tire_full || wheel.rear?.tire;
        if (f) sizes.add(f.split(" ")[0].toUpperCase());
        if (r) sizes.add(r.split(" ")[0].toUpperCase());
      });
    }
  });

  console.log("🛞 Sizes fetched:", Array.from(sizes));

  // ✅ Retry without modification if still empty (some cars have no mod-specific data)
  if (!sizes.size) {
    console.warn("⚠️ No tyres found for variant, retrying without modification...");
    const res2 = await fetch(
      `${BASE_URL}/search/by_model/?make=${safeMake}&model=${safeModel}&year=${year}&user_key=${API_KEY}`
    );
    const altData = await res2.json();
    (altData.data || []).forEach((item) => {
      if (Array.isArray(item.wheels)) {
        item.wheels.forEach((wheel) => {
          const f = wheel.front?.tire_full || wheel.front?.tire;
          const r = wheel.rear?.tire_full || wheel.rear?.tire;
          if (f) sizes.add(f.split(" ")[0].toUpperCase());
          if (r) sizes.add(r.split(" ")[0].toUpperCase());
        });
      }
    });
    console.log("🛞 Sizes fetched after fallback:", Array.from(sizes));
  }

  return Array.from(sizes);
}

