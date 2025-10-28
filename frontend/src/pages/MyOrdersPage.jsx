import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export default function MyOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5000/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data))
      .catch(() => console.error("Failed to fetch user orders"))
      .finally(() => setLoading(false));
  }, [token]);

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
        <p className="text-gray-500 dark:text-gray-400 text-center">No orders found.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            // OUTER WRAPPER controls the visible background so it always matches theme
            <div
              key={order._id}
              className="rounded-lg overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700 border border-orange-200"
            >
              {/* Keep Card inside but make it transparent so wrapper shows through */}
              <Card className="bg-transparent shadow-none">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-400 dark:text-gray-400">Order ID: {order._id}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Total: ₹{order.totalAmount}</p>
                  <p className="text-gray-700 dark:text-gray-300">Status: {order.status}</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Date: {new Date(order.createdAt).toLocaleString()}
                  </p>

                  {order.items && (
                    <ul className="list-disc ml-6 mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {order.items.map((item, idx) => {
                        const displaySize =
                          (item.tyre?.size || item.size || "").trim() || "—";
                        const brand = item.tyre?.brand || "Tyre";
                        const title = item.tyre?.title || "";
                        const key = item._id || `${order._id}-item-${idx}`;

                        return (
                          <li key={key} className="mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{brand}</span>{" "}
                            {title ? `(${title})` : ""}{" "}
                            <span className="text-sm text-gray-500 dark:text-gray-400">— Size: {displaySize}</span>{" "}
                            × <span className="text-gray-700 dark:text-gray-300">{item.quantity}</span> —{" "}
                            <span className="text-gray-700 dark:text-gray-300">₹{item.price}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
