import express from "express";
import {
  requestOtp,
  verifyOtp
} from "../controllers/authController.js";

const router = express.Router();

// Request OTP (Signup or Login)
router.post("/request-otp", requestOtp);

// Verify OTP (Signup or Login)
router.post("/verify-otp", verifyOtp);

export default router;
