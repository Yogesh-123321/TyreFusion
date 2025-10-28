import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    years: [{ type: Number }], // optional: can keep this
    type: String,
    fuelType: String,
    transmission: String,
    tyreSize: String, // ✅ added for tyre linking
  },
  { timestamps: true }
);

export default mongoose.model("Car", carSchema);
