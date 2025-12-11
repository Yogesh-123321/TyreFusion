import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE;

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const resolveTyreId = (item) => {
    if (!item) return null;
    if (item._id) return item._id;
    if (item.tyre?. _id) return item.tyre._id;
    if (typeof item.tyre === "string") return item.tyre;
    if (item.id) return item.id;
    return null;
  };

  const fetchTyreById = async (id) => {
    if (!id) return null;
    try {
      const resp = await axios.get(`${API_BASE}/tyres/by-id/${id}`);
      return resp.data;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Please log in to place an order.");
      navigate("/login");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const formattedItems = await Promise.all(
        cart.map(async (item) => {
          const tyreId = resolveTyreId(item);
          let size = item.size || item.tyre?.size || "";

          if (!size && tyreId) {
            const tyreObj = await fetchTyreById(tyreId);
            size = tyreObj?.size || "";
          }

          return {
            tyre: {
              _id: tyreId,
              brand: item.brand || item.tyre?.brand || "",
              title: item.title || item.tyre?.title || "",
              size: size,
              price: Number(item.price || item.tyre?.price || 0),
            },
            quantity: Number(item.quantity || 1),
            price:
              Number(item.price || item.tyre?.price || 0) *
              Number(item.quantity || 1),
          };
        })
      );

      const invalid = formattedItems.some((it) => !it.tyre || !it.tyre._id);
      if (invalid) throw new Error("Invalid cart items — missing tyre ID");

      await axios.post(
        `${API_BASE}/orders`,
        {
          items: formattedItems,
          totalAmount: total,
          shippingAddress: form,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Order placed successfully!");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      alert(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500 dark:text-gray-300">
        🛒 Your cart is empty
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500 text-center">
        Checkout
      </h1>

      {/* ---------- ORDER SUMMARY ---------- */}
      <div className="mb-6 p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-orange-500 mb-3">
          Order Summary
        </h2>

        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between border-b pb-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image || item.tyre?.image || "/tyre.png"}
                  className="w-14 h-14 object-contain rounded-md bg-white dark:bg-gray-700 border"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {item.brand || item.tyre?.brand} {item.title || item.tyre?.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Size: {item.size || item.tyre?.size}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-gray-900 dark:text-gray-200 font-medium">
                  ₹{item.price} × {item.quantity}
                </p>
                <p className="text-orange-500 font-semibold">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-right text-lg mt-3 font-bold text-orange-600">
          Total: ₹{total}
        </div>
      </div>

      {/* ---------- CHECKOUT FORM ---------- */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 border p-6 rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-orange-500 text-center mb-4">
          Shipping Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(form).map((field) => (
            <input
              key={field}
              type="text"
              placeholder={field.replace(/([A-Z])/g, " $1")}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
              className="w-full p-2 border rounded-md bg-gray-50 
                         dark:bg-gray-800 dark:text-white 
                         border-gray-300 dark:border-gray-700
                         focus:ring-2 focus:ring-orange-500 outline-none"
            />
          ))}
        </div>

        <div className="text-right mt-6">
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
          >
            {loading ? "Placing Order..." : `Place Order (₹${total})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
