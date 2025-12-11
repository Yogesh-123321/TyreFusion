import mongoose from "mongoose";

const AiFitmentCacheSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  result: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AiFitmentCache || mongoose.model("AiFitmentCache", AiFitmentCacheSchema);
