import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { cart, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      alert("You must be logged in to proceed to checkout.");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500 text-lg">
        🛒 Your cart is empty
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Your Cart</h1>

      <div className="space-y-6">
        {cart.map((item) => (
          <div
            key={item._id || item.name}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4"
          >
            {/* IMAGE */}
            <img
              src={item.image || "/tyre.png"}
              alt={item.title}
              className="w-28 h-28 object-contain border rounded-md bg-white"
            />

            {/* DETAILS */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {item.brand} {item.title}
              </h3>

              <p className="text-gray-600 text-sm mt-1">
                Size: <span className="font-medium">{item.size}</span>
              </p>

              {item.warranty_months && (
                <p className="text-gray-600 text-sm">
                  Warranty:{" "}
                  <span className="font-medium">{item.warranty_months} months</span>
                </p>
              )}

              <p className="text-gray-800 font-semibold mt-2">
                ₹{item.price} × {item.quantity}
              </p>
            </div>

            {/* REMOVE BUTTON */}
            <div>
              <Button
                variant="destructive"
                onClick={() => removeFromCart(item._id)}
                className="w-full"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="text-right mt-8 text-xl font-semibold">
        Total: ₹{total}
      </div>

      {/* CHECKOUT BUTTON */}
      <div className="text-right mt-6">
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
          onClick={handleCheckout}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
