import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Tyre from "./models/Tyre.js";
import Fitment from "./models/VehicleFitment.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB");

    // ------------------ VEHICLE FITMENTS ------------------
    const fitments = [
      { make: "Maruti", model: "Swift", years: [2016, 2017, 2018, 2019, 2020, 2021, 2022], sizes: ["165/80R14", "185/65R15"] },
      { make: "Hyundai", model: "i20", years: [2015, 2016, 2017, 2018, 2019, 2020, 2021], sizes: ["185/65R15"] },
      { make: "Tata", model: "Nexon", years: [2017, 2018, 2019, 2020, 2021, 2022], sizes: ["195/60R16"] },
      { make: "Kia", model: "Seltos", years: [2019, 2020, 2021, 2022], sizes: ["215/60R17"] },
    ];
    await Fitment.deleteMany({});
    await Fitment.insertMany(fitments);
    console.log("✅ Seeded fitments");

    // ------------------ TYRES ------------------
    const tyres = [
      { sku: "AP-16580R14-1", brand: "Apollo", title: "Apollo Amazer 165/80R14", size: "165/80R14", price: 4500, warranty_months: 36, features: ["All-season", "Comfort"], image: "/images/tyre-placeholder.png", stock: 20 },
      { sku: "JK-18565R15-1", brand: "JK Tyre", title: "JK Tyre 185/65R15", size: "185/65R15", price: 4800, warranty_months: 36, features: ["All-season"], image: "/images/tyre-placeholder.png", stock: 15 },
      { sku: "MRF-19560R16-1", brand: "MRF", title: "MRF 195/60R16", size: "195/60R16", price: 6900, warranty_months: 36, features: ["Performance"], image: "/images/tyre-placeholder.png", stock: 10 }
    ];
    await Tyre.deleteMany({});
    await Tyre.insertMany(tyres);
    console.log("✅ Seeded tyres");

    // ------------------ ADMIN USER ------------------
    const adminEmail = process.env.ADMIN_EMAIL || "admin@tyrefusion.com";
    const adminPass = process.env.ADMIN_PASS || "admin123";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword, // ✅ use password field
        role: "admin",
      });
      console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
    } else {
      console.log("ℹ️ Admin already exists");
    }

    console.log("🌱 Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
})();
