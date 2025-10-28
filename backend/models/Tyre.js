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
    title: { type: String }, // ✅ not required now — we’ll auto-generate if missing
    size: { type: String, required: true },
    price: { type: Number, required: true },
    warranty_months: { type: Number, default: 36 },
    features: [{ type: String }],
    image: { type: String },
    stock: { type: Number, default: 0 },
    type: { type: String, default: "Tubeless" },
    loadIndex: { type: String },
    rating: { type: String },
  },
  { timestamps: true }
);

// ✅ Add a pre-save hook to auto-generate title if missing
tyreSchema.pre("save", function (next) {
  if (!this.title) {
    this.title = `${this.brand || "Tyre"} ${this.size || ""}`.trim();
  }
  next();
});

tyreSchema.index({ sku: 1 }, { unique: true, sparse: true });

const Tyre = mongoose.model("Tyre", tyreSchema);
export default Tyre;
