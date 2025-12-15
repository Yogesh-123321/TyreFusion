import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { isAdminEmail } from "../utils/isAdminEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || "tyrefusion_secret_key";

/**
 * STEP-2: Request OTP (Signup or Login)
 */
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    const purpose = user ? "LOGIN" : "SIGNUP";

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email: normalizedEmail });

    await Otp.create({
      email: normalizedEmail,
      otp,
      purpose,
      expiresAt,
    });

    await sendOtpEmail(normalizedEmail, otp);

    return res.json({
      success: true,
      action: purpose,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("requestOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * STEP-3: Verify OTP (Single-use)
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= 5) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ message: "OTP attempts exceeded" });
      }

      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 🔑 Determine role from ENV
    const role = isAdminEmail(normalizedEmail) ? "admin" : "user";

    let user;

    // ---------- SIGNUP FLOW ----------
    if (otpRecord.purpose === "SIGNUP") {
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        user = await User.create({
          email: normalizedEmail,
          role,
          isVerified: true,
        });
      } else {
        user.role = role;
        user.isVerified = true;
        await user.save();
      }
    }

    // ---------- LOGIN FLOW ----------
    if (otpRecord.purpose === "LOGIN") {
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(400).json({
          message: "User not found. Please sign up first.",
        });
      }

      // 🔄 Keep role synced with .env
      if (user.role !== role) {
        user.role = role;
        await user.save();
      }
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
