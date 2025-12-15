import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { requestOtp, verifyOtp } from "@/services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("EMAIL"); // EMAIL | OTP
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1: Request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await requestOtp(email);
      setMessage(res.data.message);
      setStep("OTP");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await verifyOtp(email, otp);

      // ✅ CORRECT LOGIN PAYLOAD (THIS WAS THE BUG)
      login({
        token: res.data.token,
        user: res.data.user,
      });

      // ✅ ROLE-BASED REDIRECT (OPTION A)
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-orange-300 dark:from-gray-900 dark:to-black p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400 mb-6">
          {step === "EMAIL" ? "Login / Signup" : "Enter OTP"}
        </h1>

        {message && (
          <p className="text-center mb-4 text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}

        {step === "EMAIL" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Continue"}
            </Button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
