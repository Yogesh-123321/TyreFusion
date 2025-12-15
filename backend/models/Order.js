import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        tyre: {
          _id: { type: String, required: true }, // from frontend cart
          brand: { type: String, required: true },
          title: { type: String, required: true },
          size: { type: String, required: true },
          price: { type: Number, required: true },
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // price * qty
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    /* ---------------- PAYMENT ---------------- */
    paymentMode: {
      type: String,
      enum: ["COD", "UPI"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },

    /* ---------------- ORDER STATUS ---------------- */
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
