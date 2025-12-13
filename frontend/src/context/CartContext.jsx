import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const API_BASE = import.meta.env.VITE_API_BASE || "/api";

  /* -----------------------------------------------------
     AUTO-SYNC CART STOCK WITH BACKEND
  ------------------------------------------------------ */
  useEffect(() => {
    if (cart.length === 0) return;

    async function syncStock() {
      try {
        const ids = cart.map((item) => item._id);

        const res = await fetch(`${API_BASE}/tyres/stock-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        const serverStock = await res.json();
        if (!Array.isArray(serverStock)) return;

        setCart((prev) =>
          prev
            .map((item) => {
              const updated = serverStock.find((s) => s._id === item._id);
              if (!updated) return null; // tyre no longer exists

              const stock = Number(updated.stock ?? 0);
              const qty = Math.min(item.quantity, stock);

              return { ...item, stock, quantity: qty };
            })
            .filter(Boolean)
        );
      } catch (err) {
        console.error("Stock sync failed:", err);
      }
    }

    syncStock();
  }, []); // run on page load / refresh


  /* -----------------------------------------------------
     ADD TO CART (with stock safety)
  ------------------------------------------------------ */
  const addToCart = (tyre) => {
    const qtyToAdd = tyre.quantity ? Number(tyre.quantity) : 1;
    const stock = Number(tyre.stock ?? 0);

    setCart((prev) => {
      const existing = prev.find((item) => item._id === tyre._id);

      if (existing) {
        const newQty = existing.quantity + qtyToAdd;

        if (newQty > stock) {
          alert(`Only ${stock} units available in stock.`);
          return prev.map((item) =>
            item._id === tyre._id ? { ...item, quantity: stock } : item
          );
        }

        return prev.map((item) =>
          item._id === tyre._id ? { ...item, quantity: newQty } : item
        );
      }

      const initialQty = Math.min(qtyToAdd, stock);
      return [...prev, { ...tyre, quantity: initialQty }];
    });
  };

  /* -----------------------------------------------------
     UPDATE QUANTITY
  ------------------------------------------------------ */
  const updateQuantity = (id, newQty, stock) => {
    if (newQty < 1) newQty = 1;
    if (newQty > stock) newQty = stock;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
