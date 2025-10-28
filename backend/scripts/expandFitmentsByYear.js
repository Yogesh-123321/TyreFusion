import mongoose from "mongoose";
import dotenv from "dotenv";
import Fitment from "../models/VehicleFitment.js";
import Car from "../models/carModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    const fitments = await Fitment.find({});
    console.log(`📦 Found ${fitments.length} existing fitments to process...\n`);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const f of fitments) {
      const match = await Car.findOne({
        make: new RegExp(`^${f.carMake}$`, "i"),
        model: new RegExp(`^${f.carModel}$`, "i"),
      }).lean();

      if (!match) {
        console.log(`⚠️ No matching car found for ${f.carMake} ${f.carModel}`);
        totalSkipped++;
        continue;
      }

      const years = Array.isArray(match.years)
        ? match.years
        : match.year
        ? [match.year]
        : [];

      if (!years.length) {
        console.log(`⚠️ No year data found for ${f.carMake} ${f.carModel}`);
        totalSkipped++;
        continue;
      }

      for (const y of years) {
        const exists = await Fitment.findOne({
          carMake: f.carMake,
          carModel: f.carModel,
          tyreSize: f.tyreSize,
          year: y,
        });

        if (!exists) {
          await Fitment.create({
            carMake: f.carMake,
            carModel: f.carModel,
            tyreBrand: f.tyreBrand,
            tyreSize: f.tyreSize,
            price: f.price,
            year: y,
          });
          totalInserted++;
        }
      }
    }

    console.log("\n✅ Fitment expansion complete!");
    console.log(`📈 New documents inserted: ${totalInserted}`);
    console.log(`⏭️ Skipped (already had or missing info): ${totalSkipped}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error expanding fitments:", err);
    process.exit(1);
  }
};

connectDB();
