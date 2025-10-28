import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ Use the new API base URL
const WHEELSIZE_BASE = "https://api.wheel-size.com/v2";
const WHEELSIZE_KEY = process.env.WHEELSIZE_API_KEY;

// ✅ Fetch all makes
router.get("/makes", async (req, res) => {
  try {
    console.log("📡 Fetching makes from Wheel-Size API using key:", WHEELSIZE_KEY);

    const response = await axios.get(`${WHEELSIZE_BASE}/makes/`, {
      params: { user_key: WHEELSIZE_KEY },
    });

    console.log("✅ Wheel-Size makes fetched successfully");
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size makes error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch makes",
      details: err.response?.data || err.message,
    });
  }
});

// ✅ Fetch models by make
router.get("/models/:make", async (req, res) => {
  try {
    const { make } = req.params;
    const response = await axios.get(`${WHEELSIZE_BASE}/models/`, {
      params: { make, user_key: WHEELSIZE_KEY },
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size models error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// ✅ Fetch years by make+model
router.get("/years/:make/:model", async (req, res) => {
  try {
    const { make, model } = req.params;
    const response = await axios.get(`${WHEELSIZE_BASE}/generations/`, {
      params: { make, model, user_key: WHEELSIZE_KEY },
    });
    res.json(response.data);
  } catch (err) {
    console.error("❌ Wheel-Size years error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

export default router;
