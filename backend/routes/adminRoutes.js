import express from "express";
import Tyre from "../models/Tyre.js";
import Car from "../models/carModel.js";
import Order from "../models/Order.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// 🛞 Get all tyres
router.get("/tyres", auth, adminOnly, async (req, res) => {
  try {
    const tyres = await Tyre.find();
    res.json(tyres);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tyres" });
  }
});

// ➕ Add new tyre
router.post("/tyres", auth, adminOnly, async (req, res) => {
  try {
    const tyre = new Tyre(req.body);
    await tyre.save();
    res.status(201).json(tyre);
  } catch (error) {
    res.status(400).json({ error: "Failed to add tyre" });
  }
});

// ✏️ Edit tyre
router.put("/tyres/:id", auth, adminOnly, async (req, res) => {
  try {
    const tyre = await Tyre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(tyre);
  } catch (error) {
    res.status(400).json({ error: "Failed to update tyre" });
  }
});
router.put("/tyres/:id", async (req, res) => {
  try {
    const updated = await Tyre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Tyre not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating tyre:", err);
    res.status(500).json({ message: "Failed to update tyre" });
  }
});
// 📊 Admin Dashboard Stats (used by frontend)
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    // Counts
    const totalTyres = await Tyre.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCars = await Car.countDocuments();

    // Calculate total sales and pending services
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingServices = orders.filter(o => o.status === "Pending").length;

    // Monthly sales chart data
    const salesByMonth = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach(month => {
      const monthOrders = orders.filter(
        o => new Date(o.createdAt).toLocaleString("default", { month: "short" }) === month
      );
      const total = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      salesByMonth.push({ month, sales: total });
    });

    // Send response
    res.json({
      totalTyres,
      totalOrders,
      totalCars,
      totalSales,
      pendingServices,
      salesByMonth,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

export default router;
