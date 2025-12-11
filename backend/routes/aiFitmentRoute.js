// routes/aiFitmentRoute.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Fitment from "../models/VehicleFitment.js"; // your DB model
import AiFitmentCache from "../models/AiFitmentCache.js"; // small cache model we add below

dotenv.config();
const router = express.Router();

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3.1:free";
const WHEELSIZE_BASE = "https://api.wheel-size.com/v2";
const WHEELSIZE_KEY = process.env.WHEELSIZE_API_KEY;

// ---------------------
// Helper: normalize size
// ---------------------
function normalizeSize(s) {
  if (!s || typeof s !== "string") return null;
  // remove whitespace and normalize common separators: e.g. "205 / 60 R 16" -> "205/60R16"
  let x = s.replace(/\s+/g, "").toUpperCase();
  // sometimes AI returns "205/60 R16" -> remove stray space after slash
  x = x.replace(/\/R/i, "/R");
  // ensure format like 205/60R16
  const m = x.match(/(\d{3})[\/\-](\d{2,3})R(\d{2})/i);
  if (!m) return null;
  return `${m[1]}/${m[2]}R${m[3]}`;
}

// ---------------------
// Helper: verify size in local DB (Fitment) or wheel-size API
// ---------------------
async function verifySize(make, model, year, size) {
  // 1) Check local Fitment DB (fast)
  const re = new RegExp(size.replace(/\//g, "\\/"), "i");
  const local = await Fitment.findOne({
    $or: [
      { tyreSize: re },
      { tyre_size: re },
      { frontTyreSize: re },
      { rearTyreSize: re },
      { front_tyre_size: re },
      { rear_tyre_size: re },
    ],
    $or: [
      { make: new RegExp(`^${make}$`, "i") },
      { carMake: new RegExp(`^${make}$`, "i") },
    ],
    $or: [
      { model: new RegExp(`^${model}$`, "i") },
      { carModel: new RegExp(`^${model}$`, "i") },
    ],
    year: Number(year),
  }).lean();

  if (local) return { verified: true, source: "local_fitment", sample: true };

  // 2) Fallback: Wheel-Size API modifications/search
  try {
    const res = await axios.get(`${WHEELSIZE_BASE}/modifications/`, {
      params: { make, model, year, user_key: WHEELSIZE_KEY },
      timeout: 8000,
    });
    const data = res.data && (res.data.data || []);
    // examine wheel / tire fields
    for (const item of data) {
      // check front/rear or wheels arrays for tyre text
      const candidates = [];
      if (item.front) {
        candidates.push(item.front.tire_full || item.front.tire);
      }
      if (item.rear) {
        candidates.push(item.rear.tire_full || item.rear.tire);
      }
      if (Array.isArray(item.wheels)) {
        item.wheels.forEach((w) => {
          if (w.front) candidates.push(w.front.tire_full || w.front.tire);
          if (w.rear) candidates.push(w.rear.tire_full || w.rear.tire);
        });
      }
      for (const c of candidates) {
        if (!c) continue;
        const norm = normalizeSize(c);
        if (norm === size) {
          return { verified: true, source: "wheel-size-api", sample: item };
        }
      }
    }
  } catch (e) {
    // ignore upstream failures; treat as unverifiable by wheel-size
  }

  // not found
  return { verified: false, source: null };
}

// ---------------------
// Cache model: simple mongoose schema
// ---------------------
// If you don't have this model, create it at models/AiFitmentCache.js
// const AiFitmentCacheSchema = new mongoose.Schema({
//   key: { type: String, unique: true },
//   result: { type: Object },
//   updatedAt: { type: Date, default: Date.now },
// });
// export default mongoose.model("AiFitmentCache", AiFitmentCacheSchema);

router.post("/fitment", async (req, res) => {
  try {
    const { make, model, year } = req.body;
    if (!make || !model || !year) {
      return res.status(400).json({ error: "Missing make/model/year" });
    }

    const key = `${make.toLowerCase()}|${model.toLowerCase()}|${String(year)}`;

    // 0) Check cache
    try {
      const cached = await AiFitmentCache.findOne({ key }).lean();
      if (cached && cached.result) {
        return res.json({ ...cached.result, source: "cache" });
      }
    } catch (e) {
      // caching optional - continue if missing
      console.warn("Cache lookup failed:", e.message);
    }

    // 1) Build strict prompt (explicit, deterministic)
    const prompt = `
You are an Indian automotive tyre fitment expert.

Given the following car details:
- Make: ${make}
- Model: ${model}
- Year: ${year}

List all **common OEM and safe upgrade tyre sizes** that are suitable for this car model and year in India.

The list must include:
- Factory-fitted OEM sizes.
- Popular upgrade sizes (for +1 or +2 inch rims), only if they are compatible without major modifications.

✅ Respond ONLY as a single JSON array of tyre sizes.
Example:
["195/65R15", "205/60R16", "215/55R17"]

Do not add any explanations, text, or formatting — just return the array.
`;


    // 2) Call OpenRouter (low creativity)
    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: "You are a tyre fitment expert. Be concise and factual." },
        { role: "user", content: prompt },
      ],
      // some routers accept temperature; include it if supported
      temperature: 0.0,
      max_tokens: 300,
    };

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const content = (response.data.choices?.[0]?.message?.content || "").trim();

    // 3) Parse -> normalize -> dedupe
    let parsed = [];
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      // fallback: regex extraction
      parsed = content.match(/\d{3}\/\d{2,3}R\d{2}/gi) || [];
    }
    parsed = parsed.map((s) => normalizeSize(String(s))).filter(Boolean);
    parsed = [...new Set(parsed)]; // dedupe

    // 4) Validate each size (local DB / wheel-size)
    const results = [];
    for (const size of parsed) {
      const verification = await verifySize(make, model, year, size);
      results.push({
        size,
        verified: !!verification.verified,
        verifiedBy: verification.source || null,
      });
    }

    // 5) If nothing validated, attempt intelligent fallback:
    //    - look for sizes in local fitments irrespective of AI output
    if (!results.length) {
      // gather sizes from Fitment DB for this car/year
      const fitments = await Fitment.find({
        $or: [
          { make: new RegExp(`^${make}$`, "i") },
          { carMake: new RegExp(`^${make}$`, "i") },
        ],
        $or: [
          { model: new RegExp(`^${model}$`, "i") },
          { carModel: new RegExp(`^${model}$`, "i") },
        ],
        year: Number(year),
      }).lean();

      const derived = new Set();
      fitments.forEach((f) => {
        [f.tyreSize, f.tyre_size, f.frontTyreSize, f.rearTyreSize, f.front_tyre_size, f.rear_tyre_size].forEach((v) => {
          if (v) {
            const n = normalizeSize(String(v));
            if (n) derived.add(n);
          }
        });
      });

      const arr = Array.from(derived);
      if (arr.length) {
        for (const s of arr) {
          results.push({ size: s, verified: true, verifiedBy: "local_fitment" });
        }
      }
    }

    // 6) Final: sort so verified sizes come first, then by common wheel diameters descending
    results.sort((a, b) => {
      if (a.verified === b.verified) {
        // prefer larger rims (17 > 16 > 15)
        const ra = Number(a.size.match(/R(\d+)/)?.[1] || 0);
        const rb = Number(b.size.match(/R(\d+)/)?.[1] || 0);
        return rb - ra;
      }
      return a.verified ? -1 : 1;
    });

    const out = { sizes: results, source: "ai+validation", modelUsed: MODEL };

    // 7) Cache result (best effort)
    try {
      await AiFitmentCache.updateOne({ key }, { key, result: out, updatedAt: new Date() }, { upsert: true });
    } catch (e) {
      console.warn("Cache save failed:", e.message);
    }

    return res.json(out);
  } catch (err) {
    console.error("❌ AI Fitment Error (Full):", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to generate tyre sizes", details: err.message });
  }
});

export default router;
