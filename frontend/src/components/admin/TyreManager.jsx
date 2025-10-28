import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TyreManager({ darkMode }) {
  const { token } = useAuth();
  const [tyres, setTyres] = useState([]);
  const [newTyre, setNewTyre] = useState({
    brand: "",
    title: "",
    size: "",
    price: "",
    warranty_months: "",
  });
  const [editingTyre, setEditingTyre] = useState(null);

  // 🔸 Environment variable for API base URL
  const API_BASE = import.meta.env.VITE_API_BASE;

  // --- Search panel state
  const [sizeQuery, setSizeQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    refreshTyres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshTyres = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/tyres`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTyres(data || []);
    } catch (err) {
      console.error("Failed to fetch tyres", err);
    }
  };

  const handleAdd = async () => {
    try {
      await fetch(`${API_BASE}/admin/tyres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTyre),
      });
      setNewTyre({ brand: "", title: "", size: "", price: "", warranty_months: "" });
      refreshTyres();
    } catch (err) {
      console.error("Failed to add tyre", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this tyre?")) return;
    try {
      await fetch(`${API_BASE}/admin/tyres/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTyres((prev) => prev.filter((t) => t._id !== id));
      setSearchResults((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete tyre", err);
    }
  };

  const handleEditClick = (tyre) => setEditingTyre({ ...tyre });

  const handleEditSave = async () => {
    if (!editingTyre) return;
    try {
      await fetch(`${API_BASE}/admin/tyres/${editingTyre._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingTyre),
      });
      setEditingTyre(null);
      refreshTyres();
      setSearchResults((prev) =>
        prev.map((r) => (r._id === editingTyre._id ? editingTyre : r))
      );
    } catch (err) {
      console.error("Failed to update tyre", err);
    }
  };

  const runSearch = (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    fetch(`${API_BASE}/tyres?size=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Search failed", err);
        setSearchResults([]);
      })
      .finally(() => setSearchLoading(false));
  };

  const onSizeInput = (v) => {
    setSizeQuery(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(v.trim()), 450);
  };

  const handleSizeSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    runSearch(sizeQuery.trim());
  };

  return (
    <div className="flex flex-col w-full">
      <h3
        className={`text-2xl font-bold mb-4 ${
          darkMode ? "text-orange-400" : "text-orange-600"
        }`}
      >
        🛞 Manage Tyres
      </h3>

      {/* Search Panel */}
      <section className="mb-6">
        <form onSubmit={handleSizeSearchSubmit} className="flex gap-2 items-center">
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="Search tyres by size — e.g. 215/60R16 or 215/60 R16"
              value={sizeQuery}
              onChange={(e) => onSizeInput(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={handleSizeSearchSubmit}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Search
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSizeQuery("");
                setSearchResults([]);
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              }}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-3">
          {searchLoading && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}
          {!searchLoading &&
            searchResults.length === 0 &&
            sizeQuery.trim().length >= 3 && (
              <p className="text-sm text-muted-foreground">
                No tyres found for "{sizeQuery}".
              </p>
            )}
        </div>

        {searchResults.length > 0 && (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 mt-4">
            {searchResults.map((tyre) => (
              <div
                key={tyre._id || tyre.sku || tyre.title}
                className="p-4 rounded-lg border bg-white/5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={tyre.image || "/tyre.png"}
                    alt="tyre"
                    className="w-20 h-20 object-contain"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {tyre.brand} {tyre.title}
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {tyre.size}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="font-semibold">₹{tyre.price}</div>
                      <div className="text-xs">
                        Warranty: {tyre.warranty_months || "—"} mo
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => handleEditClick(tyre)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(tyre._id)}
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Tyre */}
      <section className="mb-6">
        <div className="flex flex-wrap gap-3 mb-3">
          {Object.keys(newTyre).map((key) => (
            <Input
              key={key}
              placeholder={key.replace("_", " ")}
              value={newTyre[key]}
              onChange={(e) =>
                setNewTyre({ ...newTyre, [key]: e.target.value })
              }
              className="w-48"
            />
          ))}
          <Button
            onClick={handleAdd}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            ➕ Add Tyre
          </Button>
        </div>
      </section>

      {/* Tyres Table */}
      <section>
        <div className="border border-orange-500 rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className={darkMode ? "bg-orange-800" : "bg-orange-200"}>
              <tr>
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Warranty</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tyres.map((tyre) => (
                <tr
                  key={tyre._id}
                  className={`border-b ${
                    darkMode ? "border-gray-700" : "border-gray-300"
                  } hover:bg-orange-900/10`}
                >
                  <td className="p-3">{tyre.brand}</td>
                  <td className="p-3">{tyre.title}</td>
                  <td className="p-3">{tyre.size}</td>
                  <td className="p-3">₹{tyre.price}</td>
                  <td className="p-3">{tyre.warranty_months} mo</td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <Button
                      onClick={() => handleEditClick(tyre)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(tyre._id)}
                      variant="destructive"
                    >
                      🗑️ Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {tyres.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No tyres in DB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Tyre Dialog */}
      {editingTyre && (
        <Dialog open={true} onOpenChange={() => setEditingTyre(null)}>
          <DialogContent className="sm:max-w-[520px] bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Tyre Details
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              {Object.keys(newTyre).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace("_", " ")}
                  </label>
                  <Input
                    value={editingTyre[key] || ""}
                    onChange={(e) =>
                      setEditingTyre({ ...editingTyre, [key]: e.target.value })
                    }
                    className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleEditSave}
              >
                💾 Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
