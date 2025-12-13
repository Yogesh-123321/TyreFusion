import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ------------------------------------------------------------------
  //  CHECK IF ANY ITEM IS OUT OF STOCK → DISABLE CHECKOUT
  // ------------------------------------------------------------------
  const hasOutOfStock = cart.some((item) => Number(item.stock) === 0);

  const handleCheckout = () => {
    if (hasOutOfStock) {
      alert(
        "Some items in your cart are out of stock. Please remove or update them before checkout."
      );
      return;
    }

    if (!user) {
      alert("You must be logged in to proceed to checkout.");
      navigate("/login");
      return;
    }

    navigate("/checkout");
  };

  // ------------------------------------------------------------------
  //  EMPTY CART VIEW
  // ------------------------------------------------------------------
  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500 text-lg">
        🛒 Your cart is empty
      </div>
    );

  // ------------------------------------------------------------------
  //  MAIN CART VIEW
  // ------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Your Cart</h1>

      <div className="space-y-6">
        {cart.map((item) => {
          const stock = Number(item.stock ?? 0);

          return (
            <div
              key={item._id}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4"
            >
              {/* IMAGE */}
              <img
                src={
                  Array.isArray(item.images) && item.images.length > 0
                    ? item.images[0]
                    : item.image || "/tyre.png"
                }
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
                    <span className="font-medium">
                      {item.warranty_months} months
                    </span>
                  </p>
                )}

                {/* PRICE */}
                <p className="text-gray-900 font-semibold mt-2">
                  ₹{item.price} × {item.quantity}
                </p>

                {/* OUT OF STOCK MESSAGE */}
                {stock === 0 && (
                  <p className="text-red-600 font-semibold mt-2">
                    This item is now out of stock. Please remove it to continue.
                  </p>
                )}

                {/* QUANTITY CONTROLS */}
                {stock > 0 && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity - 1, stock)
                      }
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >
                      -
                    </button>

                    <span className="font-semibold">{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1, stock)
                      }
                      disabled={item.quantity >= stock}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* STOCK WARNING */}
                {stock > 0 && item.quantity >= stock && (
                  <p className="text-red-500 text-sm mt-1">
                    Maximum available stock reached ({stock})
                  </p>
                )}
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
          );
        })}
      </div>

      {/* TOTAL */}
      <div className="text-right mt-8 text-xl font-semibold">
        Total: ₹{total}
      </div>

      {/* CHECKOUT BUTTON */}
      <div className="text-right mt-6">
        <Button
          className={`px-6 py-2 text-white ${
            hasOutOfStock
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700"
          }`}
          disabled={hasOutOfStock}
          onClick={handleCheckout}
        >
          {hasOutOfStock
            ? "Remove Out-of-Stock Items to Checkout"
            : "Proceed to Checkout"}
        </Button>
      </div>
    </div>
  );
}
