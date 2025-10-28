import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500">
        🛒 Your cart is empty
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Your Cart</h1>
      {cart.map((item) => (
        <div
          key={item._id|| item.tyre || item.name}
          className="flex justify-between items-center border-b py-3"
        >
          <div>
            <h3 className="font-semibold">{item.brand || "Tyre"}</h3>
            <p>₹{item.price} × {item.quantity}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => removeFromCart(item._id)}
          >
            Remove
          </Button>
        </div>
      ))}

      <div className="text-right mt-6 text-lg">
        <strong>Total: ₹{total}</strong>
      </div>

      <div className="text-right mt-6">
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate("/checkout")}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
