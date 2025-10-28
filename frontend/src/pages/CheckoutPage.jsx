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

  // ✅ Use environment variable for API base
  const API_BASE = import.meta.env.VITE_API_BASE;

  // total (unit price * qty)
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  // helper to extract tyre id safely
  const resolveTyreId = (item) => {
    if (!item) return null;
    if (item._id) return item._id;
    if (item.tyre && typeof item.tyre === "string") return item.tyre;
    if (item.tyre && typeof item.tyre === "object")
      return item.tyre._id || item.tyre.id || null;
    if (item.id) return item.id;
    if (item.sku) return item.sku;
    return null;
  };

  // helper to fetch tyre by id for missing size
  const fetchTyreById = async (id) => {
    if (!id) return null;
    try {
      const resp = await axios.get(`${API_BASE}/tyres/by-id/${id}`);
      return resp.data;
    } catch (e) {
      console.warn(
        "Failed to fetch tyre by id for size resolution:",
        id,
        e.message
      );
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
      // Build formattedItems with best-effort size resolution
      const formattedItems = await Promise.all(
        cart.map(async (item) => {
          const tyreId = resolveTyreId(item);

          // First try from cart
          let size = item.size || item.tyre?.size || "";

          // If missing, fetch from DB by id
          if (!size && tyreId) {
            const tyreObj = await fetchTyreById(tyreId);
            size = tyreObj?.size || "";
          }

          return {
            tyre: {
              _id: tyreId,
              brand: item.brand || item.tyre?.brand || "",
              title: item.title || item.tyre?.title || "",
              size: size || "", // ensure size field exists
              price: Number(item.price || item.tyre?.price || 0),
            },
            quantity: Number(item.quantity || 1),
            price:
              Number(item.price || item.tyre?.price || 0) *
              Number(item.quantity || 1),
          };
        })
      );

      // debug: inspect payload
      console.log("ORDER PAYLOAD ITEMS:", formattedItems);

      // sanity check
      const hasInvalidItems = formattedItems.some(
        (it) => !it.tyre || !it.tyre._id
      );
      if (hasInvalidItems) {
        throw new Error("Invalid cart items — missing tyre ID");
      }

      // ✅ Create order via backend
      const res = await axios.post(
        `${API_BASE}/orders`,
        {
          items: formattedItems,
          totalAmount: total,
          shippingAddress: form,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Order placed successfully:", res.data);
      alert("🎉 Order placed successfully!");
      clearCart();
      navigate("/my-orders");
    } catch (err) {
      console.error("❌ Order failed:", err);
      alert(err.response?.data?.message || err.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500">
        🛒 Your cart is empty
      </div>
    );

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500 text-center">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(form).map((field) => (
          <input
            key={field}
            type="text"
            placeholder={
              field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")
            }
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        ))}

        <div className="text-right mt-6">
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? "Placing Order..." : `Place Order (₹${total})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
