import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const WHEELSIZE_BASE = "https://sandbox.wheel-size.com/api/1.0";
const WHEELSIZE_KEY = process.env.WHEELSIZE_API_KEY;

// 🚀 Log API key load status
if (!WHEELSIZE_KEY) {
  console.warn("⚠️  WHEELSIZE_API_KEY not found in .env! Please set it.");
} else {
  console.log("✅ Wheel-Size API key loaded successfully.");
}

// ✅ Fetch all makes
router.get("/makes", async (req, res) => {
  console.log("📡 GET /api/wheelsize/makes triggered");
  try {
    const response = await axios.get(`${WHEELSIZE_BASE}/makes/`, {
      params: { user_key: WHEELSIZE_KEY },
    });
    console.log(`✅ ${response.data?.length || 0} makes fetched`);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size makes error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch makes" });
  }
});

// ✅ Fetch models by make
router.get("/models/:make", async (req, res) => {
  const { make } = req.params;
  console.log(`📡 GET /api/wheelsize/models/${make}`);
  try {
    const response = await axios.get(`${WHEELSIZE_BASE}/models/`, {
      params: { make, user_key: WHEELSIZE_KEY },
    });
    console.log(`✅ ${response.data?.length || 0} models fetched for ${make}`);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size models error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// ✅ Fetch years by make + model
router.get("/years/:make/:model", async (req, res) => {
  const { make, model } = req.params;
  console.log(`📡 GET /api/wheelsize/years/${make}/${model}`);
  try {
    const response = await axios.get(`${WHEELSIZE_BASE}/years/`, {
      params: { make, model, user_key: WHEELSIZE_KEY },
    });
    console.log(`✅ Years fetched for ${make} ${model}`);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size years error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

export default router;
