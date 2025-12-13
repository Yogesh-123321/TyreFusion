import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    passwordHash: { type: String, required: true }, // existing login stays

    // 🔽 ADD FOR WHATSAPP OTP LOGIN
    phone: { type: String, unique: true, sparse: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },

    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
