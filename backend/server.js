import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import otpAuthRoutes from "./routes/otpAuth.js";
import tyreRoutes from "./routes/tyreRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import wheelFitmentRoute from "./routes/wheelFitmentRoute.js";
import wheelSizeRoutes from "./routes/wheelsizeRoutes.js";
import aiSearchRoute from "./routes/aiSearch.js";

console.log("🔑 Loaded Wheel-Size key:", process.env.WHEELSIZE_API_KEY);
console.log("🔑 Loaded OpenRouter key:", process.env.OPENROUTER_API_KEY);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpAuthRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/makes", carRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wheels", wheelFitmentRoute);
app.use("/api/wheelsize", wheelSizeRoutes);
app.use("/api/ai-search", aiSearchRoute);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
