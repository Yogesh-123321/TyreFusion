import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE;
  const UPI_ID = import.meta.env.VITE_UPI_ID;

  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(""); // COD | UPI

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  /* ----------------------------------------------------
     NORMALIZE TYRE SOURCE (single source of truth)
  ---------------------------------------------------- */
  const getTyreSource = (item) => {
    if (item.tyre && typeof item.tyre === "object") return item.tyre;
    return item;
  };

  /* ----------------------------------------------------
     SUBMIT ORDER
  ---------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (!paymentMode) {
      alert("Please select a payment method.");
      return;
    }

    setLoading(true);

    try {
      const formattedItems = cart.map((item) => {
        const tyre = getTyreSource(item);

        return {
          tyre: {
            _id: tyre._id, // ✅ REQUIRED FOR BACKEND IMAGE FETCH
            brand: tyre.brand || "",
            title: tyre.title || "",
            size: tyre.size || "",
            price: Number(tyre.price || 0),
            images: Array.isArray(tyre.images) ? tyre.images : [], // ✅ PASS IMAGES
          },
          quantity: Number(item.quantity || 1),
          price:
            Number(tyre.price || 0) *
            Number(item.quantity || 1),
        };
      });

      await axios.post(
        `${API_BASE}/orders`,
        {
          items: formattedItems,
          totalAmount: total,
          shippingAddress: form,
          paymentMode,
          paymentStatus: paymentMode === "COD" ? "PENDING" : "PAID",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      clearCart();
      navigate("/my-orders");
    } catch (err) {
      alert(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------
     EMPTY CART STATE
  ---------------------------------------------------- */
  if (cart.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-500 dark:text-gray-300">
        🛒 Your cart is empty
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-orange-500 text-center mb-6">
        Checkout
      </h1>

      {/* ORDER SUMMARY */}
      <div className="mb-6 p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-orange-500 mb-3">
          Order Summary
        </h2>

        <div className="space-y-4">
          {cart.map((item, idx) => {
            const tyre = getTyreSource(item);

            return (
              <div
                key={idx}
                className="flex items-center justify-between border-b pb-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      tyre.images?.[0] || "/tyre.png"
                    }
                    className="w-14 h-14 object-contain rounded-md bg-white dark:bg-gray-700 border"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {tyre.brand} {tyre.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Size: {tyre.size}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-gray-900 dark:text-gray-200">
                    ₹{tyre.price} × {item.quantity}
                  </p>
                  <p className="text-orange-500 font-semibold">
                    ₹{tyre.price * item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-right text-lg mt-3 font-bold text-orange-600">
          Total: ₹{total}
        </div>
      </div>

      {/* SHIPPING + PAYMENT */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 border p-6 rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-orange-500 text-center">
          Shipping Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(form).map((field) => (
            <input
              key={field}
              type="text"
              required
              placeholder={field.replace(/([A-Z])/g, " $1")}
              value={form[field]}
              onChange={(e) =>
                setForm({ ...form, [field]: e.target.value })
              }
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          ))}
        </div>

        {/* PAYMENT MODE */}
        <div>
          <h2 className="text-xl font-semibold text-orange-500 mb-3">
            Payment Method
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer dark:border-gray-700">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMode === "COD"}
                onChange={() => setPaymentMode("COD")}
              />
              <span className="font-medium text-gray-900 dark:text-white">
                Cash on Delivery
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer dark:border-gray-700">
              <input
                type="radio"
                name="payment"
                value="UPI"
                checked={paymentMode === "UPI"}
                onChange={() => setPaymentMode("UPI")}
              />
              <span className="font-medium text-gray-900 dark:text-white">
                Pay via UPI
              </span>
            </label>
          </div>
        </div>

        {/* UPI QR */}
        {paymentMode === "UPI" && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Scan to pay ₹{total}
            </p>

            <QRCodeCanvas
              value={`upi://pay?pa=${UPI_ID}&pn=TyreFusion&am=${total}&cu=INR`}
              size={200}
            />

            <p className="mt-2 text-xs text-gray-500">
              UPI ID: {UPI_ID}
            </p>
          </div>
        )}

        <div className="text-right">
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
          >
            {loading
              ? "Placing Order..."
              : paymentMode === "UPI"
              ? `Confirm UPI Order (₹${total})`
              : `Place Order (₹${total})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
