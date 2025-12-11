import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Orders = ({ darkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const token = localStorage.getItem("token");

  const API_BASE = import.meta.env.VITE_API_BASE;

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE}/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading)
    return <p className="text-center mt-6 text-gray-400">Loading orders...</p>;

  if (error)
    return <p className="text-center mt-6 text-red-500">{error}</p>;

  return (
    <div className="p-4 sm:p-6">
      <h2
        className={`text-xl sm:text-2xl font-semibold mb-4 ${
          darkMode ? "text-orange-400" : "text-orange-600"
        }`}
      >
        All Orders
      </h2>

      {Array.isArray(orders) && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const sizes = Array.from(
              new Set(
                (order.items || [])
                  .map((it) => (it.tyre?.size || it.size || "").trim())
                  .filter(Boolean)
              )
            );

            return (
              <Card
                key={order._id}
                className={`border transition ${
                  darkMode
                    ? "bg-black border-gray-700 text-white"
                    : "bg-white border-orange-200 text-gray-900"
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* LEFT SECTION */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 break-all">
                      Order ID: {order._id}
                    </p>
                    <p className="text-sm sm:text-base">
                      User: {order.user?.name || "Guest"}
                    </p>
                    <p className="text-sm sm:text-base">
                      Total: ₹{order.totalAmount}
                    </p>

                    <p className="text-sm sm:text-base">
                      Status:{" "}
                      <span
                        className={`font-semibold ${
                          order.status === "Delivered"
                            ? "text-green-400"
                            : order.status === "Cancelled"
                            ? "text-red-400"
                            : "text-orange-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(order.createdAt).toLocaleString()}
                    </p>

                    <p className="mt-2 text-xs sm:text-sm text-gray-400">
                      <span className="font-semibold text-gray-300">
                        Sizes:
                      </span>{" "}
                      {sizes.length ? sizes.join(", ") : "—"}
                    </p>
                  </div>

                  {/* RIGHT SECTION — Responsive Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Select
                      onValueChange={(status) =>
                        updateStatus(order._id, status)
                      }
                    >
                      <SelectTrigger
                        className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm w-full sm:w-auto ${
                          darkMode
                            ? "bg-gray-900 text-white border-gray-700 hover:bg-gray-800 focus:ring-orange-500"
                            : "bg-white text-gray-900 border-gray-300 hover:bg-orange-50 focus:ring-orange-400"
                        }`}
                      >
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>

                      <SelectContent
                        className={`border rounded-md ${
                          darkMode
                            ? "bg-gray-900 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {["Pending", "Shipped", "Delivered", "Cancelled"].map(
                          (status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className={`cursor-pointer px-3 py-2 ${
                                darkMode
                                  ? "hover:bg-orange-600/20 text-white"
                                  : "hover:bg-orange-100 text-gray-900"
                              }`}
                            >
                              {status}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold border shadow-sm w-full sm:w-auto
                        ${
                          darkMode
                            ? "text-orange-400 border-orange-400 hover:bg-orange-500 hover:text-white"
                            : "text-orange-600 border-orange-500 hover:bg-orange-100 hover:text-orange-700"
                        }`}
                    >
                      View
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-6">No orders found.</p>
      )}

      {/* ORDER DETAILS DIALOG */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent
          className={`w-[90%] sm:max-w-lg ${
            darkMode ? "bg-gray-950 text-white" : "bg-white text-gray-900"
          }`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-orange-500">
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information for this order.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3 text-sm sm:text-base">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {selectedOrder._id}
              </p>
              <p>
                <span className="font-semibold">User:</span>{" "}
                {selectedOrder.user?.name || "Guest"}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {selectedOrder.user?.email || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedOrder.status}
              </p>
              <p>
                <span className="font-semibold">Total:</span> ₹
                {selectedOrder.totalAmount}
              </p>
              <p>
                <span className="font-semibold">Created:</span>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>

              {/* SHIPPING ADDRESS */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h4 className="font-semibold mt-3 text-orange-400">
                    Shipping Address
                  </h4>
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.phone}</p>
                  <p>{selectedOrder.shippingAddress.address}</p>
                  <p>
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    {selectedOrder.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {/* ITEMS */}
              {selectedOrder.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold mt-3 text-orange-400">Items</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedOrder.items.map((item, idx) => {
                      const size =
                        (item.tyre?.size || item.size || "").trim() || "—";

                      return (
                        <li key={idx} className="text-sm sm:text-base">
                          <span className="font-medium">
                            {item.tyre?.brand || ""}
                          </span>{" "}
                          {item.tyre?.title && `(${item.tyre.title})`}{" "}
                          <span className="text-gray-400">— Size: {size}</span>{" "}
                          × {item.quantity} — ₹{item.price}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setSelectedOrder(null)}
              className={`px-4 py-2 ${
                darkMode
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
