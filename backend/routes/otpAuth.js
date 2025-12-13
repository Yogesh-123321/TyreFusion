import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Generates OTP and stores it in DB
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name: "OTP User",
        phone,
        email: `${phone}@otp.tyrefusion`, // dummy email for now
        passwordHash: "OTP_LOGIN",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // TEMP: return OTP in response (for testing only)
    return res.json({
      message: "OTP generated (testing mode)",
      otp,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
