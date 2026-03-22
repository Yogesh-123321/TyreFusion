import dotenv from "dotenv";
dotenv.config({ path: "./.env", override: true });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tyreRoutes from "./routes/tyreRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
// import wheelFitmentRoute from "./routes/wheelFitmentRoute.js";
// import wheelSizeRoutes from "./routes/wheelsizeRoutes.js";
import aiSearchRoute from "./routes/aiSearch.js";
import testEmailRoute from "./routes/testEmail.js";

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "SET" : "MISSING");
console.log("🔑 RESEND_API_KEY =", process.env.RESEND_API_KEY);

// console.log("🔑 Loaded Wheel-Size key:", process.env.WHEELSIZE_API_KEY);
console.log("🔑 Loaded OpenRouter key:", process.env.OPENROUTER_API_KEY);

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "https://www.tyrefusion.in",
  "https://tyrefusion.in",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Health check routes
app.get("/", (req, res) => {
  res.send("TyreFusion Backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tyres", tyreRoutes);
app.use("/api/makes", carRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
// app.use("/api/wheels", wheelFitmentRoute);
// app.use("/api/wheelsize", wheelSizeRoutes);
app.use("/api/ai-search", aiSearchRoute);
app.use("/api/test", testEmailRoute);

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
