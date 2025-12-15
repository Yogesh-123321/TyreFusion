import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export default function MyOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to fetch user orders:", err))
      .finally(() => setLoading(false));
  }, [token, API_BASE]);

  if (!token)
    return (
      <div className="text-center mt-20 text-gray-500 dark:text-gray-300">
        Please login to view your orders.
      </div>
    );

  if (loading)
    return (
      <div className="text-center mt-20 text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500 text-center">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No orders found.
        </p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card
              key={order._id}
              className="border border-orange-300 dark:border-orange-800 bg-white dark:bg-gray-900 rounded-xl shadow-sm"
            >
              <CardContent className="p-5 space-y-4">

                {/* ORDER HEADER */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order ID: {order._id}
                  </p>
                  <p className="font-semibold text-lg text-orange-500 mt-1">
                    Total: ₹{order.totalAmount}
                  </p>

                  <p
                    className={`font-semibold mt-1 ${
                      order.status === "Delivered"
                        ? "text-green-500"
                        : order.status === "Cancelled"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    Status: {order.status}
                  </p>

                  <p className="text-gray-600 dark:text-gray-400">
                    Date: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* SHIPPING ADDRESS IF AVAILABLE */}
                {order.shippingAddress && (
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-semibold text-orange-500 mb-2">
                      Shipping Address
                    </h3>
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.phone}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} —{" "}
                      {order.shippingAddress.pincode}
                    </p>
                  </div>
                )}

                {/* ORDERED ITEMS */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-orange-500">Items</h3>

                  {order.items.map((item, idx) => {
                    const tyre = item.tyre || {};
                    const key = item._id || `${order._id}-item-${idx}`;
                    const size = tyre.size || item.size || "—";
                    const image =
  Array.isArray(tyre.images) && tyre.images.length > 0
    ? tyre.images[0]
    : "/tyre.png";
console.log("ORDER ITEM:", item);
console.log("TYRE OBJECT:", item.tyre);


                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row gap-4 border rounded-lg p-4 bg-white dark:bg-gray-800"
                      >
                        {/* Tyre Image */}
                        <img
                          src={image}
                          alt={tyre.title}
                          className="w-28 h-28 object-contain border rounded-md bg-white"
                        />

                        {/* Details */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {tyre.brand || "Tyre"} {tyre.title || ""}
                          </h4>

                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Size: <span className="font-medium">{size}</span>
                          </p>

                          {tyre.warranty_months && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Warranty:{" "}
                              <span className="font-medium">
                                {tyre.warranty_months} months
                              </span>
                            </p>
                          )}

                          <p className="font-semibold mt-2 text-gray-900 dark:text-gray-200">
                            ₹{item.price} × {item.quantity}
                          </p>

                          <p className="text-orange-500 font-semibold mt-1">
                            Subtotal: ₹{item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
