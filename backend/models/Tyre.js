// backend/models/Tyre.js
import mongoose from "mongoose";

const tyreSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      default: () =>
        `TYR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    },

    brand: { type: String, required: true },
    title: { type: String }, // auto-generated if missing
    size: { type: String, required: true },
    price: { type: Number, required: true },

    warranty_months: { type: Number, default: 36 },

    // NEW: images array (Cloudinary URLs). Future-proof for multiple images.
    images: {
      type: [String],
      default: [],
    },

    // NEW: stock management field
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    type: { type: String, default: "Tubeless" },
    loadIndex: String,
    rating: String,

    // UPDATED FEATURES FIELD — max 3 features allowed
    features: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 3; // admin cannot save more than 3
        },
        message: "Maximum 3 features allowed.",
      },
      default: [],
    },
  },
  { timestamps: true }
);

// Auto-generate title if missing
tyreSchema.pre("save", function (next) {
  if (!this.title) {
    this.title = `${this.brand || "Tyre"} ${this.size || ""}`.trim();
  }
  next();
});

export default mongoose.model("Tyre", tyreSchema);
