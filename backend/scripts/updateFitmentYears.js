import mongoose from "mongoose";
import dotenv from "dotenv";
import Fitment from "../models/VehicleFitment.js";
import Car from "../models/carModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const fitments = await Fitment.find({});
    let updated = 0;

    for (const f of fitments) {
      const match = await Car.findOne({
        make: new RegExp(`^${f.carMake}$`, "i"),
        model: new RegExp(`^${f.carModel}$`, "i"),
      }).lean();

      if (match && match.years && match.years.length) {
        // Choose the latest year or first one depending on data structure
        const assignedYear = Array.isArray(match.years)
          ? match.years[match.years.length - 1]
          : match.year;

        await Fitment.updateOne(
          { _id: f._id },
          { $set: { year: assignedYear } }
        );
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} fitments with year info.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating fitments:", err);
    process.exit(1);
  }
};

connectDB();
