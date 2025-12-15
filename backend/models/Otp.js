import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["LOGIN", "SIGNUP"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL auto-delete
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
