import express from "express";
import Car from "../models/carModel.js";
import Fitment from "../models/VehicleFitment.js";
import Tyre from "../models/Tyre.js";

const router = express.Router();

/* ------------------------------------------
   1️⃣ Get all car makes (unique)
------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const makes = await Car.distinct("make");
    res.json(makes.sort());
  } catch (err) {
    console.error("Error fetching car makes:", err);
    res.status(500).json({ message: "Error fetching car makes" });
  }
});

/* ------------------------------------------
   2️⃣ Get models for a make
------------------------------------------ */
router.get("/:make/models", async (req, res) => {
  try {
    const { make } = req.params;
    const models = await Car.find({ make }).distinct("model");
    res.json(models.sort());
  } catch (err) {
    console.error("Error fetching models:", err);
    res.status(500).json({ message: "Error fetching models" });
  }
});

/* ------------------------------------------
   3️⃣ Get available years for a make + model
------------------------------------------ */
router.get("/:make/:model/years", async (req, res) => {
  try {
    const { make, model } = req.params;
    const car = await Car.findOne({ make, model });
    if (!car) return res.json([]);
    res.json(car.years?.length ? car.years : [2022, 2023, 2024]);
  } catch (err) {
    console.error("Error fetching years:", err);
    res.status(500).json({ message: "Error fetching years" });
  }
});

/* ------------------------------------------
   4️⃣ Get recommended tyres for selected car
------------------------------------------ */
router.get("/:make/:model/:year/tyres", async (req, res) => {
  try {
    const { make = "", model = "", year = "" } = req.params;
    console.log("🔍 Searching tyres for:", make, model, year);

    const qMake = make.trim();
    const qModel = model.trim();
    const qYear = Number(year);

    // Step 1️⃣: Find fitments
    const fitments = await Fitment.find({
      $or: [
        { make: new RegExp(`^${qMake}$`, "i") },
        { carMake: new RegExp(`^${qMake}$`, "i") },
      ],
      $or: [
        { model: new RegExp(`^${qModel}$`, "i") },
        { carModel: new RegExp(`^${qModel}$`, "i") },
      ],
      year: qYear,
    }).lean();

    console.log("📊 Fitments found:", fitments.length);
    if (!fitments.length) return res.json([]);

    // Step 2️⃣: Collect and normalize sizes
    const normalize = (s = "") =>
      s.replace(/\s+/g, "").replace(/[^0-9A-Za-z/]/g, "").toUpperCase();

    const sizes = [
      ...new Set(
        fitments
          .flatMap((f) => [
            f.tyreSize,
            f.tyre_size,
            f.frontTyreSize,
            f.rearTyreSize,
            f.front_tyre_size,
            f.rear_tyre_size,
          ])
          .map(normalize)
          .filter(Boolean)
      ),
    ];

    console.log("📏 Normalized Sizes:", sizes);
    if (!sizes.length) return res.json([]);

    // Step 3️⃣: Build regex patterns
    const sizeRegexes = sizes.map((s) => {
      const spaced = s.replace(/\s+/g, "").replace(/([A-Z0-9/])/g, "$1\\s*");
      return new RegExp(spaced, "i");
    });

    // Step 4️⃣: Find tyres
    const tyres = await Tyre.find({
      $and: [
        { price: { $gt: 0 } },
        { $or: sizeRegexes.map((r) => ({ size: r })) },
      ],
    })
      .select("sku brand title size price warranty_months stock image rating")
      .limit(200)
      .lean();

    console.log("🛞 Tyres matched:", tyres.length);

    // Step 5️⃣: Deduplicate
    const unique = [];
    const seen = new Set();
    for (const t of tyres) {
      const key =
        t.sku ||
        `${(t.brand || "").toLowerCase()}|${(t.title || "").toLowerCase()}|${(t.size || "").toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(t);
      }
    }

    console.log("🔎 Tyres after dedupe:", unique.length);
    res.json(unique);
  } catch (err) {
    console.error("❌ Error fetching tyres:", err);
    res.status(500).json({ message: "Error fetching tyres" });
  }
});


export default router;
