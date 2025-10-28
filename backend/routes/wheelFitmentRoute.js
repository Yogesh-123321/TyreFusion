import express from "express";
import axios from "axios";
import Tyre from "../models/Tyre.js";
import FitmentCache from "../models/FitmentCache.js";

const router = express.Router();
const API_KEY = process.env.WHEELSIZE_API_KEY;
const BASE_URL = process.env.WHEELSIZE_API_BASE || "https://api.wheel-size.com/v2";
/* ---------------------------------------------------
   0️⃣  Get available years for make + model
--------------------------------------------------- */
router.get("/years", async (req, res) => {
  try {
    let { make, model } = req.query;
    if (!make || !model)
      return res.status(400).json({ message: "Missing make or model" });

    // 🧠 Normalize make/model for Wheel-Size API
    // Convert "Maruti" -> "Suzuki" (Wheel-Size uses Suzuki)
    if (/^maruti/i.test(make)) make = "Suzuki";

    // Replace spaces with dashes (e.g., "Alto 800" → "Alto-800")
    model = model.trim().replace(/\s+/g, "-");

    console.log(`🌍 Fetching available years for ${make} ${model}`);

    // Call Wheel-Size API
    const { data } = await axios.get(`${BASE_URL}/generations/`, {
      params: { make, model, user_key: API_KEY },
    });

    console.log("📜 Raw generations response:", data);

    // Extract unique years
    const years = Array.from(
      new Set(
        (data.data || []).flatMap((gen) => {
          if (gen.start && gen.end) {
            return Array.from({ length: gen.end - gen.start + 1 }, (_, i) => gen.start + i);
          }
          return gen.start ? [gen.start] : [];
        })
      )
    ).sort((a, b) => a - b);

    // 🛠️ Fallback if no year data
    if (!years.length) {
      console.warn(`⚠️ No year data for ${make} ${model}, using fallback`);
      return res.json([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    }

    console.log(`✅ Found years for ${make} ${model}:`, years);
    res.json(years);
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error("❌ Error fetching years:", errorMsg);
    res.status(404).json({ message: "Failed to fetch years" });
  }
});

/* ---------------------------------------------------
   1️⃣  Get variants (modifications) for make/model/year
--------------------------------------------------- */
router.get("/variants", async (req, res) => {
  try {
    const { make, model, year } = req.query;
    if (!make || !model || !year) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // ✅ Build safe URL with direct query string (prevents double encoding)
    const url = `${BASE_URL}/modifications/?make=${make}&model=${model}&year=${year}&user_key=${API_KEY}`;
    console.log("🌐 Requesting Variants:", url);

    const { data } = await axios.get(url);

    // ✅ Normalize structure
    const variantArray = data.data || data;
    const variants = (variantArray || []).map((m) => ({
      name: m.name || m.trim || "Unknown Variant",
      slug: m.slug,
      fuel: m.engine?.fuel || "N/A",
      power: m.engine?.power?.hp || "N/A",
      start_year: m.start_year,
      end_year: m.end_year,
    }));

    if (!variants.length) {
      return res.status(404).json({ message: "No variants found for this model/year" });
    }

    console.log(`✅ Found ${variants.length} variants for ${make} ${model} ${year}`);
    res.json(variants);
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error("❌ Error fetching variants:", errorMsg);
    res.status(500).json({
      message: "Failed to fetch variants",
      error: errorMsg,
    });
  }
});

/* ---------------------------------------------------
   2️⃣  Get fitments for selected variant and match tyres
--------------------------------------------------- */
router.get("/fitments/:make/:model/:year", async (req, res) => {
  try {
    const { make, model, year } = req.params;
    const { mod } = req.query;
    if (!mod) {
      return res.status(400).json({ message: "Variant (mod) required" });
    }

    console.log(`🚗 Fetching fitments for ${make} ${model} ${year}, variant: ${mod}`);

    // 🧠 Check cache first
    const cached = await FitmentCache.findOne({ make, model, year, modification: mod }).lean();
    if (cached) {
      console.log("✅ Returning cached fitments");
      const tyres = await Tyre.find({
        size: { $in: cached.sizes.map((s) => new RegExp(s.replace(/\s+/g, ""), "i")) },
      }).lean();
      return res.json({ source: "cache", sizes: cached.sizes, tyres });
    }

    // 🔗 Build request manually (avoid double encoding)
    const url = `${BASE_URL}/search/by_model/?make=${make}&model=${model}&year=${year}&modification=${mod}&user_key=${API_KEY}`;
    console.log("🌐 Requesting Fitments:", url);

    const { data } = await axios.get(url);
    const fitmentData = data.data || data; // normalize
    const sizes = new Set();

    // ✅ Extract tyre sizes
    fitmentData.forEach((item) => {
      const front = item.front?.tire_full || item.front?.tire;
      const rear = item.rear?.tire_full || item.rear?.tire;
      if (front) sizes.add(front.split(" ")[0].toUpperCase());
      if (rear) sizes.add(rear.split(" ")[0].toUpperCase());
    });

    const sizeList = [...sizes];
    if (!sizeList.length) {
      console.log("⚠️ No tyre sizes found for this variant");
      return res.status(404).json({ message: "No tyre sizes found for this variant" });
    }

    console.log("📏 Tyre sizes found:", sizeList);

    // 💾 Cache results
    await FitmentCache.updateOne(
      { make, model, year, modification: mod },
      { $set: { sizes: sizeList, createdAt: new Date() } },
      { upsert: true }
    );

    // 🛞 Match tyres in your local DB
    const tyres = await Tyre.find({
      size: { $in: sizeList.map((s) => new RegExp(s.replace(/\s+/g, ""), "i")) },
    })
      .select("brand title size price stock image rating")
      .limit(200)
      .lean();

    console.log(`✅ Matched ${tyres.length} tyres from local DB`);
    res.json({ source: "wheel-size", sizes: sizeList, tyres });
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error("❌ Error fetching fitments:", errorMsg);
    res.status(500).json({
      message: "Failed to fetch fitments",
      error: errorMsg,
    });
  }
});

export default router;
