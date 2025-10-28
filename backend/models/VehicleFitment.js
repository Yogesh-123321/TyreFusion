import mongoose from "mongoose";

const vehicleFitmentSchema = new mongoose.Schema({
  carMake: { type: String, required: true },
  carModel: { type: String, required: true },
  tyreBrand: { type: String },
  tyreSize: { type: String, required: true },
  price: { type: Number, default: 0 }
});

const Fitment = mongoose.model("Fitment", vehicleFitmentSchema);

export default Fitment;
