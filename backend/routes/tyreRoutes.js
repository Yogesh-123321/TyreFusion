import express from "express";
import Tyre from "../models/Tyre.js";

const router = express.Router();

/* ---------------------------------------------------------
   GET TYRE BY ID
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   GET TYRES BY SIZE  (PUBLIC)
--------------------------------------------------------- */
/* ---------------------------------------------------------
   GET TYRES (SIZE + BRAND SEARCH)
--------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { size, brand } = req.query;

    // If nothing provided — return empty
    if (!size && !brand) return res.status(200).json([]);

    let query = {};

    // SIZE FILTER (keep your normalization logic)
    if (size) {
      const normalizeSize = (s = "") =>
        s.replace(/\s+/g, "").replace(/[^0-9A-Z/]/gi, "").toUpperCase();

      const normalized = normalizeSize(size);

      const alt1 = normalized.replace("R", " R");
      const alt2 = normalized.replace("/", " /");
      const alt3 = normalized.replace(/R(\d+)/, " R $1");

      const variants = [normalized, alt1, alt2, alt3];
      const regexes = variants.map(
        (v) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      );

      query.$or = regexes.map((r) => ({ size: r }));
    }

    // BRAND FILTER (NEW)
    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    const tyresRaw = await Tyre.find(query)
      .select(
        "sku brand title size price warranty_months stock image images rating features"
      )
      .limit(200)
      .lean();

    // de-duplicate results
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

    return res.json(tyres);
  } catch (err) {
    console.error("❌ Error in /api/tyres:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching tyres" });
  }
});


/* ---------------------------------------------------------
   GET ALL DISTINCT WIDTHS
--------------------------------------------------------- */
router.get("/distinct/widths", async (req, res) => {
  try {
    const tyres = await Tyre.find().select("size");

    const widths = [
      ...new Set(
        tyres.map((t) => t.size?.split("/")[0]).filter(Boolean)
      ),
    ].sort((a, b) => Number(a) - Number(b));

    res.json(widths);
  } catch (err) {
    res.status(500).json({ error: "Failed to load widths" });
  }
});

/* ---------------------------------------------------------
   GET ALL DISTINCT ASPECT RATIOS (filtered by width)
--------------------------------------------------------- */
router.get("/distinct/aspects", async (req, res) => {
  try {
    const { width } = req.query;
    if (!width) return res.json([]);

    const tyres = await Tyre.find({
      size: { $regex: `^${width}/` },
    }).select("size");

    const aspects = [
      ...new Set(
        tyres
          .map((t) => t.size?.split("/")[1]?.replace(/R.*/, ""))
          .filter(Boolean)
      ),
    ].sort((a, b) => Number(a) - Number(b));

    res.json(aspects);
  } catch (err) {
    res.status(500).json({ error: "Failed to load aspects" });
  }
});

/* ---------------------------------------------------------
   GET ALL DISTINCT RIM SIZES (filtered by width + aspect)
--------------------------------------------------------- */
router.get("/distinct/rims", async (req, res) => {
  try {
    const { width, aspect } = req.query;
    if (!width || !aspect) return res.json([]);

    const tyres = await Tyre.find({
      size: { $regex: `^${width}/${aspect}R` },
    }).select("size");

    const rims = [
      ...new Set(
        tyres.map((t) => t.size?.match(/R(\d+)/)?.[1]).filter(Boolean)
      ),
    ].sort((a, b) => Number(a) - Number(b));

    res.json(rims);
  } catch (err) {
    res.status(500).json({ error: "Failed to load rims" });
  }
});

/* ---------------------------------------------------------
   STOCK CHECK ENDPOINT (used by cart)
--------------------------------------------------------- */
router.post("/stock-check", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs must be an array." });
    }

    const tyres = await Tyre.find({ _id: { $in: ids } })
      .select("_id stock")
      .lean();

    return res.json(tyres);
  } catch (err) {
    console.error("❌ Error in /stock-check:", err);
    return res.status(500).json({ error: "Failed to check stock" });
  }
});

export default router;
