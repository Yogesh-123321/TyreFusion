import mongoose from "mongoose";

const FitmentCacheSchema = new mongoose.Schema({
  make: String,
  model: String,
  year: Number,
  modification: String,
  sizes: [String],
  createdAt: { type: Date, default: Date.now },
});

FitmentCacheSchema.index({ make: 1, model: 1, year: 1, modification: 1 }, { unique: true });
export default mongoose.model("FitmentCache", FitmentCacheSchema);
