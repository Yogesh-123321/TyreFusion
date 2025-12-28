// controllers/orderController.js
import Order from "../models/Order.js";
import Tyre from "../models/Tyre.js";
import User from "../models/User.js";

// ✅ EXISTING
import { sendOrderConfirmationEmail } from "../utils/sendOrderEmail.js";

// ✅ NEW (ADD THIS)
import { sendUpiPendingEmail } from "../utils/sendUpiPendingEmail.js";

/* =========================================================
   CREATE NEW ORDER (USER)
========================================================= */
export const createOrder = async (req, res) => {
  try {
    const {
      items: rawItems,
      shippingAddress,
      paymentMode,
    } = req.body;

    if (!rawItems || rawItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (!paymentMode) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    /* -------- NORMALIZE ITEMS -------- */
    const normalizedItems = [];

    for (const item of rawItems) {
      const tyreObj = item.tyre || {};

      // Fill missing size
      if ((!tyreObj.size || tyreObj.size === "") && tyreObj._id) {
        try {
          const tyreFromDb = await Tyre.findById(String(tyreObj._id)).lean();
          if (tyreFromDb?.size) tyreObj.size = tyreFromDb.size;
        } catch (err) {
          console.warn("Tyre lookup failed:", err.message);
        }
      }

      // Fetch images from Tyre collection
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
          console.warn("Image fetch failed:", err.message);
        }
      }

      const safeTyre = {
        _id: tyreObj._id ? String(tyreObj._id) : "",
        brand: tyreObj.brand || "",
        title: tyreObj.title || "",
        size: tyreObj.size || "",
        price: tyreObj.price ?? item.price ?? 0,
        images: tyreImages,
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
        (acc, it) => acc + it.price * it.quantity,
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

    /* -------- FETCH USER -------- */
    const user = await User.findById(req.user._id).select("email name");

    /* =====================================================
       🔥 EMAIL LOGIC FIX (THIS IS THE MAIN CHANGE)
    ===================================================== */

    if (paymentMode === "COD") {
      // ✅ COD → send confirmation immediately
      sendOrderConfirmationEmail({
        to: user.email,
        order,
        user,
      }).catch((err) =>
        console.error("COD email failed:", err.message)
      );
    } else if (paymentMode === "UPI") {
      // ✅ UPI → send payment pending email ONLY
      sendUpiPendingEmail({
        to: user.email,
        order,
        user,
      }).catch((err) =>
        console.error("UPI pending email failed:", err.message)
      );
    }

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
    let orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    for (let o of orders) {
      o.items = await Promise.all(
        o.items.map(async (it) => {
          let tyre = { ...it.tyre };
          tyre.size = tyre.size || "";

          if (!tyre.images || tyre.images.length === 0) {
            try {
              const t = await Tyre.findById(tyre._id)
                .select("images")
                .lean();

              if (t?.images) tyre.images = t.images;
            } catch {}
          }

          return { ...it, tyre };
        })
      );
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user orders" });
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

    orders.forEach((o) => {
      o.items = o.items.map((it) => ({
        ...it,
        tyre: { ...it.tyre, size: it.tyre?.size || "" },
      }));
    });

    res.json(orders);
  } catch {
    res.status(500).json({ message: "Failed to fetch all orders" });
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
      return res.status(404).json({ message: "Order not found" });

    order.items = order.items.map((it) => ({
      ...it,
      tyre: { ...it.tyre, size: it.tyre?.size || "" },
    }));

    res.json(order);
  } catch {
    res.status(500).json({ message: "Failed to fetch order" });
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
      return res.status(404).json({ message: "Order not found" });

    order.status = status || order.status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/* =========================================================
   ADMIN: VERIFY UPI PAYMENT
========================================================= */
export const verifyUpiPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (order.paymentMode !== "UPI")
      return res.status(400).json({ message: "Not a UPI order" });

    if (order.paymentStatus === "PAID")
      return res.status(400).json({ message: "Already verified" });

    order.paymentStatus = "PAID";
    order.status = "Confirmed";
    await order.save();

    const user = await User.findById(order.user).select("email name");

    // ✅ FINAL CONFIRMATION EMAIL (ONLY ON VERIFY)
    sendOrderConfirmationEmail({
      to: user.email,
      order,
      user,
    }).catch((err) =>
      console.error("Final confirmation email failed:", err.message)
    );

    res.json({ message: "Payment verified & order confirmed" });
  } catch {
    res.status(500).json({ message: "Failed to verify payment" });
  }
};
