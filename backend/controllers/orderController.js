// controllers/orderController.js
import Order from "../models/Order.js";
import Tyre from "../models/Tyre.js"; // used to fetch canonical tyre size when missing
import User from "../models/User.js";
import { sendOrderConfirmationEmail } from "../utils/sendOrderEmail.js";

/* =========================================================
   CREATE NEW ORDER (USER)
========================================================= */
export const createOrder = async (req, res) => {
  try {
    const {
      items: rawItems,
      shippingAddress,
      paymentMode,
      paymentStatus,
    } = req.body;

    if (!rawItems || rawItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (!paymentMode) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    /* -------- NORMALIZE ITEMS (PRESERVED LOGIC) -------- */
    const normalizedItems = [];

    for (const item of rawItems) {
      const tyreObj = item.tyre || {};

      // Fill missing size from Tyre collection if possible
      if ((!tyreObj.size || tyreObj.size === "") && tyreObj._id) {
        try {
          const tyreFromDb = await Tyre.findById(
            String(tyreObj._id)
          ).lean();
          if (tyreFromDb?.size) tyreObj.size = tyreFromDb.size;
        } catch (err) {
          console.warn(
            "Tyre lookup failed for size fill:",
            tyreObj._id,
            err.message
          );
        }
      }

      // ✅ Fetch tyre images from Tyre collection (authoritative source)
let tyreImages = [];

if (tyreObj._id) {
  try {
    const tyreFromDb = await Tyre.findById(tyreObj._id)
      .select("images")
      .lean();

    if (Array.isArray(tyreFromDb?.images)) {
      tyreImages = tyreFromDb.images;
    }
  } catch (err) {
    console.warn(
      "Failed to fetch tyre images:",
      tyreObj._id,
      err.message
    );
  }
}

const safeTyre = {
  _id: tyreObj._id ? String(tyreObj._id) : "",
  brand: tyreObj.brand || "",
  title: tyreObj.title || "",
  size: tyreObj.size || "",
  price: tyreObj.price ?? item.price ?? 0,
  images: tyreImages, // ✅ THIS IS THE KEY FIX
};


      normalizedItems.push({
        tyre: safeTyre,
        quantity: item.quantity || 1,
        price: item.price ?? safeTyre.price ?? 0,
      });
    }

    /* -------- CALCULATE TOTAL -------- */
    const totalAmount =
      normalizedItems.reduce(
        (acc, it) =>
          acc + (it.price || 0) * (it.quantity || 1),
        0
      ) || 0;

    /* -------- CREATE ORDER -------- */
    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      totalAmount,
      shippingAddress,
      paymentMode,
      paymentStatus: "PENDING",
    });

    /* -------- FETCH USER FOR EMAIL -------- */
    const user = await User.findById(req.user._id).select(
      "email name"
    );

    /* -------- SEND EMAIL (NON-BLOCKING) -------- */
    sendOrderConfirmationEmail({
      to: user.email,
      order,
      user,
    }).catch((err) => {
      console.error(
        "Order confirmation email failed:",
        err.message
      );
    });

    res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order" });
  }
};

/* =========================================================
   GET USER'S OWN ORDERS
========================================================= */
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing user" });
    }

    const orders = await Order.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const normalized = orders.map((o) => {
      o.items = o.items.map((it) => ({
        ...it,
        tyre: { ...it.tyre, size: it.tyre?.size || "" },
      }));
      return o;
    });

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch user orders" });
  }
};

/* =========================================================
   ADMIN: GET ALL ORDERS
========================================================= */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = orders.map((o) => {
      o.items = o.items.map((it) => ({
        ...it,
        tyre: { ...it.tyre, size: it.tyre?.size || "" },
      }));
      return o;
    });

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch all orders" });
  }
};

/* =========================================================
   ADMIN: GET SINGLE ORDER
========================================================= */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .lean();

    if (!order)
      return res
        .status(404)
        .json({ message: "Order not found" });

    order.items = order.items.map((it) => ({
      ...it,
      tyre: { ...it.tyre, size: it.tyre?.size || "" },
    }));

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch order" });
  }
};

/* =========================================================
   ADMIN: UPDATE ORDER STATUS
========================================================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order)
      return res
        .status(404)
        .json({ message: "Order not found" });

    order.status = status || order.status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res
      .status(500)
      .json({ message: "Failed to update order status" });
  }
};
/* =========================================================
   ADMIN: VERIFY UPI PAYMENT
========================================================= */
export const verifyUpiPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMode !== "UPI") {
      return res
        .status(400)
        .json({ message: "This order is not a UPI order" });
    }

    if (order.paymentStatus === "PAID") {
      return res
        .status(400)
        .json({ message: "Payment already verified" });
    }

    // ✅ Update statuses
    order.paymentStatus = "PAID";
    order.status = "Confirmed";
    await order.save();

    // ✅ Send confirmation email
    const user = await User.findById(order.user).select("email name");

    sendOrderConfirmationEmail({
      to: user.email,
      order,
      user,
    }).catch((err) => {
      console.error("Confirmation email failed:", err.message);
    });

    res.json({
      message: "Payment verified and order confirmed",
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};
