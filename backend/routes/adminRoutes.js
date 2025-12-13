import express from "express";
import Tyre from "../models/Tyre.js";
import Car from "../models/carModel.js";
import Order from "../models/Order.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/* -----------------------------------------
   GET ALL TYRES (ADMIN ONLY)
------------------------------------------ */
router.get("/tyres", auth, adminOnly, async (req, res) => {
  try {
    const tyres = await Tyre.find().sort({ createdAt: -1 });
    res.json(tyres);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tyres" });
  }
});

/* -----------------------------------------
   ADD NEW TYRE (features + images + stock)
------------------------------------------ */
router.post("/tyres", auth, adminOnly, async (req, res) => {
  try {
    const {
      brand,
      title,
      size,
      price,
      warranty_months,
      images,
      stock,
      features, // <<==== ADDED
    } = req.body;

    const tyre = new Tyre({
      brand,
      title,
      size,
      price: Number(price),
      warranty_months: Number(warranty_months),
      images: Array.isArray(images) ? images : [],
      stock: Number(stock) || 0,
      features: Array.isArray(features) ? features : [], // <<==== ADDED
    });

    await tyre.save();
    res.status(201).json(tyre);
  } catch (error) {
    console.error("Add tyre error:", error);
    res.status(400).json({ error: "Failed to add tyre" });
  }
});

/* -----------------------------------------
   UPDATE TYRE (features + images + stock)
------------------------------------------ */
router.put("/tyres/:id", auth, adminOnly, async (req, res) => {
  try {
    const {
      brand,
      title,
      size,
      price,
      warranty_months,
      images,
      stock,
      features, // <<==== ADDED
    } = req.body;

    const updateData = {
      brand,
      title,
      size,
      price: Number(price),
      warranty_months: Number(warranty_months),
    };

    if (Array.isArray(images)) updateData.images = images;

    if (stock !== undefined) updateData.stock = Number(stock);

    if (Array.isArray(features))
      updateData.features = features; // <<==== ADDED

    const tyre = await Tyre.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!tyre)
      return res.status(404).json({ error: "Tyre not found" });

    res.json(tyre);
  } catch (error) {
    console.error("Update tyre error:", error);
    res.status(400).json({ error: "Failed to update tyre" });
  }
});

/* -----------------------------------------
   QUICK STOCK UPDATE ROUTE
------------------------------------------ */
router.patch("/tyres/:id/stock", auth, adminOnly, async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined)
      return res.status(400).json({ error: "Stock is required" });

    const tyre = await Tyre.findByIdAndUpdate(
      req.params.id,
      { stock: Number(stock) },
      { new: true }
    );

    if (!tyre)
      return res.status(404).json({ error: "Tyre not found" });

    res.json({
      message: "Stock updated successfully",
      tyre,
    });
  } catch (err) {
    console.error("Stock update error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

/* -----------------------------------------
   ADMIN DASHBOARD STATS
------------------------------------------ */
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const totalTyres = await Tyre.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCars = await Car.countDocuments();

    const orders = await Order.find();
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingServices = orders.filter(o => o.status === "Pending").length;

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const salesByMonth = months.map((m) => {
      const monthOrders = orders.filter(
        (o) =>
          new Date(o.createdAt).toLocaleString("default", { month: "short" }) === m
      );
      return {
        month: m,
        sales: monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      };
    });

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
/* -----------------------------------------
   DELETE TYRE (ADMIN ONLY)
------------------------------------------ */
router.delete("/tyres/:id", auth, adminOnly, async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id);

    if (!tyre) {
      return res.status(404).json({ error: "Tyre not found" });
    }

    await tyre.deleteOne();

    res.json({
      message: "Tyre deleted successfully",
      tyreId: req.params.id,
    });
  } catch (error) {
    console.error("Delete tyre error:", error);
    res.status(500).json({ error: "Failed to delete tyre" });
  }
});


export default router;
