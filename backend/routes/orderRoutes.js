import express from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  verifyUpiPayment, // ✅ add this
} from "../controllers/orderController.js";

import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/* -------------------- USER ROUTES -------------------- */

// ✅ Create a new order (user)
router.post("/", auth, createOrder);

// ✅ Get orders for the logged-in user (user’s own)
router.get("/my-orders", auth, getUserOrders);


/* -------------------- ADMIN ROUTES -------------------- */

// ✅ Get all orders (admin only)
router.get("/", auth, adminOnly, getAllOrders);

// ✅ Get a specific order by ID (admin only)
router.get("/:id", auth, adminOnly, getOrderById);

// ✅ Update an order’s status (admin only)
router.put("/:id/status", auth, adminOnly, updateOrderStatus);
router.put("/:id/verify-payment", auth, adminOnly, verifyUpiPayment);

export default router;
