import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

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

/* -------------------------------------------------------
   Helpers for colored badges
------------------------------------------------------- */
const statusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-500 text-black";
    case "Confirmed":
      return "bg-blue-500 text-white";
    case "Shipped":
      return "bg-indigo-500 text-white";
    case "Delivered":
      return "bg-green-600 text-white";
    case "Cancelled":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const paymentColor = (status) =>
  status === "PAID"
    ? "bg-green-600 text-white"
    : "bg-yellow-500 text-black";

const Orders = ({ darkMode }) => {
  const { token, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  /* =========================================================
     FETCH ALL ORDERS (ADMIN)
  ========================================================= */
  const fetchOrders = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UPDATE ORDER STATUS
  ========================================================= */
  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch {
      alert("Failed to update order status");
    }
  };

  /* =========================================================
     VERIFY UPI PAYMENT
  ========================================================= */
  const verifyUpiPayment = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE}/orders/${orderId}/verify-payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payment verified & confirmation email sent");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "UPI verification failed");
    }
  };

  useEffect(() => {
    if (!authLoading && token) fetchOrders();
  }, [authLoading, token]);

  if (authLoading || loading) {
    return (
      <p className="text-center mt-6 text-gray-400">
        Loading orders…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center mt-6 text-red-500">{error}</p>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2
        className={`text-xl sm:text-2xl font-semibold mb-4 ${
          darkMode ? "text-orange-400" : "text-orange-600"
        }`}
      >
        All Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-400 mt-6">
          No orders found.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const totalQty = (order.items || []).reduce(
              (sum, i) => sum + (i.quantity || 0),
              0
            );

            return (
              <Card
                key={order._id}
                className={`border ${
                  darkMode
                    ? "bg-black border-gray-700 text-gray-100"
                    : "bg-white border-orange-200 text-gray-900"
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:justify-between gap-4">
                  {/* LEFT */}
                  <div className="flex-1 space-y-1">
                    <p className="text-xs dark:text-gray-400 text-gray-500 break-all">
                      Order ID: {order._id}
                    </p>

                    <p className="font-medium">
                      User: {order.user?.email}
                    </p>

                    <p className="font-medium">
                      Total: ₹{order.totalAmount}
                    </p>

                    <p className="font-medium">
                      Qty: {totalQty}
                    </p>

                    <div className="flex gap-2 items-center flex-wrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${paymentColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentMode} / {order.paymentStatus}
                      </span>

                      <span
                        className={`px-2 py-1 rounded text-xs ${statusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs dark:text-gray-400 text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Select
                      onValueChange={(status) =>
                        updateStatus(order._id, status)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Pending",
                          "Confirmed",
                          "Shipped",
                          "Delivered",
                          "Cancelled",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {order.paymentMode === "UPI" &&
                      order.paymentStatus === "PENDING" && (
                        <Button
                          onClick={() =>
                            verifyUpiPayment(order._id)
                          }
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Verify UPI Payment
                        </Button>
                      )}

                    <button
  onClick={() => setSelectedOrder(order)}
  className={
    darkMode
      ? "px-4 py-2 rounded-md border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold"
      : "px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 font-semibold shadow"
  }
>
  View Details
</button>





                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent
          className={
            darkMode
              ? "bg-gray-950 text-gray-100"
              : "bg-white text-gray-900"
          }
        >
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete item breakdown
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalAmount}</p>

              <div className="border-t pt-2">
                <p className="font-semibold mb-1">Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs dark:text-gray-300"
                  >
                    <span>
                      {item.tyre?.brand} {item.tyre?.size}
                    </span>
                    <span>
                      Qty: {item.quantity} × ₹{item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
