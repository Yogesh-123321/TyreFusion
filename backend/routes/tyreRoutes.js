import express from "express";
import Tyre from "../models/Tyre.js";

const router = express.Router();

/**
 * GET /api/tyres?size=215/60R16
 * Returns matching tyres from MongoDB for a given tyre size.
 */
// GET /api/tyres/by-id/:id
router.get("/by-id/:id", async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id).lean();
    if (!tyre) return res.status(404).json({ message: "Tyre not found" });
    return res.json(tyre);
  } catch (err) {
    console.error("Error fetching tyre by id:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { size } = req.query;
    if (!size) return res.status(200).json([]); // Return empty if no query

    // 🔹 Step 1: Normalize incoming size
    const normalizeSize = (s = "") =>
      s.replace(/\s+/g, "").replace(/[^0-9A-Z/]/gi, "").toUpperCase();

    const normalized = normalizeSize(size); // e.g. "215/60R16"

    // Common alternate patterns
    const alt1 = normalized.replace("R", " R"); // "215/60 R16"
    const alt2 = normalized.replace("/", " /"); // "215 /60R16"
    const alt3 = normalized.replace(/R(\d+)/, " R $1"); // "215/60 R 16"

    // 🔹 Step 2: Build regexes for fuzzy matching
    const variants = [normalized, alt1, alt2, alt3];
    const regexes = variants.map(
      (v) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    );

    console.log(`🛞 /api/tyres - searching for: "${size}" → normalized: "${normalized}"`);

    // 🔹 Step 3: Find tyres that match any pattern
    const tyresRaw = await Tyre.find({
      $or: regexes.map((r) => ({ size: r })),
    })
      .select("sku brand title size price warranty_months stock image rating")
      .limit(200)
      .lean();

    // 🔹 Step 4: Deduplicate by SKU or brand|title|size
    const seen = new Set();
    const tyres = [];
    for (const t of tyresRaw) {
      const key = t.sku
        ? t.sku.toString()
        : `${(t.brand || "").toLowerCase()}|${(t.title || "").toLowerCase()}|${(t.size || "").toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        tyres.push(t);
      }
    }

    console.log(
      `✅ Found ${tyresRaw.length} raw, ${tyres.length} unique tyres for "${size}"`
    );

    return res.status(200).json(tyres);
  } catch (err) {
    console.error("❌ Error in /api/tyres route:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching tyres" });
  }
});
// ✅ New Dynamic Dropdown Endpoints
router.get("/distinct/widths", async (req, res) => {
  try {
    const tyres = await Tyre.find().select("size");
    const widths = [...new Set(
      tyres
        .map((t) => t.size?.split("/")[0])
        .filter(Boolean)
    )].sort((a, b) => Number(a) - Number(b));
    res.json(widths);
  } catch (err) {
    res.status(500).json({ error: "Failed to load widths" });
  }
});

router.get("/distinct/aspects", async (req, res) => {
  try {
    const { width } = req.query;
    if (!width) return res.json([]);

    const tyres = await Tyre.find({ size: { $regex: `^${width}/` } }).select("size");

    const aspects = [...new Set(
      tyres
        .map((t) => t.size?.split("/")[1]?.replace(/R.*/, ""))
        .filter(Boolean)
    )].sort((a, b) => Number(a) - Number(b));

    res.json(aspects);
  } catch (err) {
    res.status(500).json({ error: "Failed to load aspects" });
  }
});

router.get("/distinct/rims", async (req, res) => {
  try {
    const { width, aspect } = req.query;
    if (!width || !aspect) return res.json([]);

    const tyres = await Tyre.find({
      size: { $regex: `^${width}/${aspect}R` }
    }).select("size");

    const rims = [...new Set(
      tyres
        .map((t) => t.size?.match(/R(\d+)/)?.[1])
        .filter(Boolean)
    )].sort((a, b) => Number(a) - Number(b));

    res.json(rims);
  } catch (err) {
    res.status(500).json({ error: "Failed to load rims" });
  }
});


export default router;
