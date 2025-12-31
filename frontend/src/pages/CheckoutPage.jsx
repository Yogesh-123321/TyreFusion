import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";

import RAW_CITIES from "@/data/indianCities.json";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE;
  const UPI_ID = import.meta.env.VITE_UPI_ID;

  // ---------- CITY LIST (normalized + unique) ----------
  const CITY_LIST = Array.from(
    new Set(
      RAW_CITIES
        .map((c) => (c.city || "").trim())
        .filter(Boolean)
    )
  ).sort();

  const SERVICE_CITIES = new Set([
    "Faridabad",
    "Delhi",
    "Gurgaon",
    "Ghaziabad",
    "Palwal",
  ]);

  const EXTRA_DELIVERY_FEE = 200;

  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityList, setShowCityList] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  // ---------- CART TOTAL ----------
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const total = subtotal + deliveryFee;

  const getTyreSource = (item) => {
    if (item.tyre && typeof item.tyre === "object") return item.tyre;
    return item;
  };

  // ---------- CITY AUTOCOMPLETE ----------
  function handleCityChange(e) {
    const value = e.target.value;
    setForm({ ...form, city: value });

    if (!value) {
      setFilteredCities([]);
      return;
    }

    const matches = CITY_LIST.filter((c) =>
      c.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 20);

    setFilteredCities(matches);
    setShowCityList(true);
  }

  function selectCity(name) {
    setForm({ ...form, city: name });
    setShowCityList(false);
  }

  // ---------- DELIVERY FEE LOGIC ----------
  useEffect(() => {
    if (!form.city) return;

    const cityNormalized = form.city.trim().toLowerCase();

    if (!Array.from(SERVICE_CITIES).map(c => c.toLowerCase()).includes(cityNormalized)) {
      setDeliveryFee(EXTRA_DELIVERY_FEE);
      setShowPopup(true);
    } else {
      setDeliveryFee(0);
      setShowPopup(false);
    }

  }, [form.city]);

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return navigate("/login");

    if (!cart.length) return alert("Your cart is empty.");
    if (!paymentMode) return alert("Please select a payment method.");

    setLoading(true);

    try {
      const formattedItems = cart.map((item) => {
        const tyre = getTyreSource(item);

        return {
          tyre: {
            _id: tyre._id,
            brand: tyre.brand || "",
            title: tyre.title || "",
            size: tyre.size || "",
            price: Number(tyre.price || 0),
            images: Array.isArray(tyre.images)
              ? tyre.images
              : [],
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
          subtotal,
          deliveryFee,
          totalAmount: total,
          shippingAddress: form,
          paymentMode,
          paymentStatus:
            paymentMode === "COD" ? "PENDING" : "PAID",
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

      {/* POPUP */}
      {showPopup && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm text-gray-800">
          Delivery outside service area — additional ₹200 delivery fee applies.
        </div>
      )}

      {/* SUMMARY */}
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
                    <div className="font-semibold">
                      {tyre.brand} {tyre.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      Size: {tyre.size}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p>
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

        <div className="text-right mt-3">
          <div>Subtotal: ₹{subtotal}</div>
          <div>Delivery Fee: ₹{deliveryFee}</div>
          <div className="text-lg font-bold text-orange-600">
            Total: ₹{total}
          </div>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 border p-6 rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-orange-500 text-center">
          Shipping Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <input
            type="text"
            required
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
            className="w-full p-2 border rounded-md"
          />

          {/* Phone */}
          <input
            type="text"
            required
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="w-full p-2 border rounded-md"
          />

          {/* Address */}
          <input
            type="text"
            required
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="w-full p-2 border rounded-md"
          />

          {/* CITY AUTOCOMPLETE */}
          <div className="relative">
            <input
              type="text"
              required
              placeholder="City"
              value={form.city}
              onChange={handleCityChange}
              onFocus={() =>
                form.city && setShowCityList(true)
              }
              className="w-full p-2 border rounded-md"
            />

            {showCityList && filteredCities.length > 0 && (
              <ul className="absolute bg-white border w-full max-h-48 overflow-y-auto rounded shadow z-50">
                {filteredCities.map((c) => (
                  <li
                    key={c}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => selectCity(c)}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* State */}
          <input
            type="text"
            required
            placeholder="State"
            value={form.state}
            onChange={(e) =>
              setForm({ ...form, state: e.target.value })
            }
            className="w-full p-2 border rounded-md"
          />

          {/* Pincode */}
          <input
            type="text"
            required
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) =>
              setForm({ ...form, pincode: e.target.value })
            }
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* PAYMENT MODE */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-orange-500">
            Payment Method
          </h2>

          <label className="flex gap-3 p-3 border rounded-md">
            <input
              type="radio"
              value="COD"
              checked={paymentMode === "COD"}
              onChange={() => setPaymentMode("COD")}
            />
            Cash on Delivery
          </label>

          <label className="flex gap-3 p-3 border rounded-md mt-2">
            <input
              type="radio"
              value="UPI"
              checked={paymentMode === "UPI"}
              onChange={() => setPaymentMode("UPI")}
            />
            Pay via UPI
          </label>
        </div>

        {/* QR */}
        {paymentMode === "UPI" && (
          <div className="p-4 border rounded-lg bg-gray-50 text-center">
            <p className="text-sm mb-2">
              Scan to pay ₹{total}
            </p>

            <QRCodeCanvas
              value={`upi://pay?pa=${UPI_ID}&pn=TyreFusion&am=${total}&cu=INR`}
              size={200}
            />

            <p className="mt-2 text-xs">
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
