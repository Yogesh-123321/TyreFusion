import React, { useState } from "react";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  /* -----------------------------
     reCAPTCHA helpers (IMPORTANT)
  ------------------------------ */

  const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const setupRecaptcha = () => {
    clearRecaptcha();

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
  };

  /* -----------------------------
     Send OTP
  ------------------------------ */
  const sendOTP = async () => {
    try {
      if (!phone.startsWith("+")) {
        alert("Enter phone number in +91XXXXXXXXXX format");
        return;
      }

      setLoading(true);
      setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );

      setConfirmation(result);
      alert("OTP sent");
    } catch (err) {
      console.error("OTP send error:", err);
      alert(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Verify OTP + Backend Login
  ------------------------------ */
  const verifyOTP = async () => {
    try {
      if (!confirmation) {
        alert("Please request OTP first");
        return;
      }

      setLoading(true);

      // Verify OTP with Firebase
      const result = await confirmation.confirm(otp);

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send token to backend
      const response = await fetch(
        "http://localhost:5000/api/auth/firebase-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Backend login failed");
      }

      // Store JWT + user using existing AuthContext
      login(data.user, data.token);

      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      alert("Invalid or expired OTP");
    } finally {
      clearRecaptcha();
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-6 border rounded-lg shadow bg-background">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Login with Phone
        </h2>

        {/* Phone input */}
        <input
          type="text"
          placeholder="+919999999999"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
          className="w-full border p-2 mb-3 rounded"
        />

        <button
          onClick={sendOTP}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded mb-4"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {/* OTP input */}
        {confirmation && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            />

            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {/* Required for Firebase reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
