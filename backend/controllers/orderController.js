// controllers/orderController.js
import Order from "../models/Order.js";
import Tyre from "../models/Tyre.js"; // used to fetch canonical tyre size when missing

/* -------------------- CREATE NEW ORDER -------------------- */
export const createOrder = async (req, res) => {
  try {
    const { items: rawItems, shippingAddress } = req.body;

    if (!rawItems || rawItems.length === 0)
      return res.status(400).json({ message: "No order items" });

    // Normalize items: ensure tyre subdoc exists and size is filled (try DB lookup)
    const normalizedItems = [];
    for (const item of rawItems) {
      const tyreObj = item.tyre || {};

      // If size missing but frontend provided an _id, try to fetch from Tyre collection
      if ((!tyreObj.size || tyreObj.size === "") && tyreObj._id) {
        try {
          const tyreFromDb = await Tyre.findById(String(tyreObj._id)).lean();
          if (tyreFromDb && tyreFromDb.size) tyreObj.size = tyreFromDb.size;
        } catch (err) {
          // don't block order creation if lookup fails
          console.warn("Tyre lookup failed for size fill:", tyreObj._id, err.message);
        }
      }

      const safeTyre = {
        _id: tyreObj._id ? String(tyreObj._id) : "",
        brand: tyreObj.brand || "",
        title: tyreObj.title || "",
        size: tyreObj.size || "",
        price: tyreObj.price ?? item.price ?? 0,
      };

      normalizedItems.push({
        tyre: safeTyre,
        quantity: item.quantity || 1,
        price: item.price ?? safeTyre.price ?? 0,
      });
    }

    // Compute totalAmount (trusting normalized items)
    const totalAmount =
      normalizedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0) || 0;

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      totalAmount,
      shippingAddress,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order" });
  }
};

/* -------------------- GET USER'S OWN ORDERS -------------------- */
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: Missing user" });
    }

    // No populate needed for tyre since it's embedded, but ensure size exists
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();

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
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
};

/* -------------------- ADMIN: GET ALL ORDERS -------------------- */
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
    res.status(500).json({ message: "Failed to fetch all orders" });
  }
};

/* -------------------- ADMIN: GET SINGLE ORDER -------------------- */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email").lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.items = order.items.map((it) => ({
      ...it,
      tyre: { ...it.tyre, size: it.tyre?.size || "" },
    }));

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/* -------------------- ADMIN: UPDATE ORDER STATUS -------------------- */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status || order.status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
