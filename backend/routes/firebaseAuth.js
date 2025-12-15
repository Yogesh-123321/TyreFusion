import express from "express";
import admin from "../config/firebaseAdmin.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/**
 * Load admin phone numbers from ENV
 * Example:
 * ADMIN_PHONES=+917303692551,+919876543210
 */
const ADMIN_PHONES = process.env.ADMIN_PHONES
  ? process.env.ADMIN_PHONES.split(",").map((p) => p.trim())
  : [];

/**
 * POST /api/auth/firebase-login
 * Body: { idToken }
 */
router.post("/firebase-login", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token missing" });
    }

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    const phone = decoded.phone_number;

    if (!phone) {
      return res
        .status(400)
        .json({ message: "Phone number not found in Firebase token" });
    }

    const isAdmin = ADMIN_PHONES.includes(phone);

    // Find user
    let user = await User.findOne({ phone });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        phone,
        role: isAdmin ? "admin" : "user",
        isVerified: true,
      });
    }

    // Ensure admin role is synced from ENV
    if (isAdmin && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    // Issue JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Firebase login error:", error);
    return res.status(401).json({
      message: "Invalid or expired Firebase token",
    });
  }
});

export default router;
