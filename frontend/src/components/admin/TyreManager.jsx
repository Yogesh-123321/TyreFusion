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

// Cloudinary setup
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_URL ||
  (CLOUD_NAME && UPLOAD_PRESET
    ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    : "");
// FRONTEND-ONLY: Deduplicate tyres by SKU / identity
const dedupeTyres = (list = []) => {
  const map = new Map();
  list.forEach((t) => {
    const key = t._id || `${t.brand}-${t.size}-${t.title}`;
    if (!map.has(key)) map.set(key, t);
  });
  return [...map.values()];
};

export default function TyreManager({ darkMode }) {
  const { token } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [tyres, setTyres] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const [sizeQuery, setSizeQuery] = useState("");

  // ADD TYRE STATE
  const [newTyre, setNewTyre] = useState({
    brand: "",
    title: "",
    size: "",
    price: "",
    warranty_months: "",
    stock: "",
    images: [],
  });

  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  // EDIT TYRE STATE
  const [editingTyre, setEditingTyre] = useState(null);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);

  // FEATURES
  const FEATURE_OPTIONS = [
    "Smooth ride",
    "Dry & Wet Grip",
    "Low noise",
    "Excellent braking",
    "Fuel efficient",
    "Long life",
  ];

  const [newFeatures, setNewFeatures] = useState([]);
  const [editFeatures, setEditFeatures] = useState([]);

  const toggleNewFeature = (feature) => {
    if (newFeatures.includes(feature)) {
      setNewFeatures(newFeatures.filter((f) => f !== feature));
    } else {
      if (newFeatures.length >= 3) {
        alert("You can select a maximum of 3 features.");
        return;
      }
      setNewFeatures([...newFeatures, feature]);
    }
  };

  const toggleEditFeature = (feature) => {
    if (editFeatures.includes(feature)) {
      setEditFeatures(editFeatures.filter((f) => f !== feature));
    } else {
      if (editFeatures.length >= 3) {
        alert("You can select a maximum of 3 features.");
        return;
      }
      setEditFeatures([...editFeatures, feature]);
    }
  };

  // Fetch Tyres
  useEffect(() => {
    if (token) refreshTyres();
  }, [token]);

  const refreshTyres = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/tyres`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTyres(dedupeTyres(Array.isArray(data) ? data : []));

    } catch (err) {
      console.error("Failed to fetch tyres", err);
    }
  };

  // Cloudinary upload
  const uploadToCloudinary = async (file) => {
    if (!file) return "";
    if (!CLOUDINARY_URL) return "";

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
      const data = await res.json();
      return data.secure_url || "";
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return "";
    }
  };

  // Image previews (add tyre)
  useEffect(() => {
    if (!newImageFiles.length) {
      setNewImagePreviews([]);
      return;
    }
    const urls = newImageFiles.map((f) => URL.createObjectURL(f));
    setNewImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newImageFiles]);

  // Image previews (edit tyre)
  useEffect(() => {
    if (!editNewFiles.length) {
      setEditNewPreviews([]);
      return;
    }
    const urls = editNewFiles.map((f) => URL.createObjectURL(f));
    setEditNewPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [editNewFiles]);

  // Add Tyre
  const handleAdd = async () => {
    if (!newTyre.brand || !newTyre.size || !newTyre.price) {
      alert("Brand, size and price are required.");
      return;
    }

    try {
      let uploadedUrls = [];
      if (newImageFiles.length > 0) {
        uploadedUrls = await Promise.all(newImageFiles.map(uploadToCloudinary));
        uploadedUrls = uploadedUrls.filter(Boolean);
      }

      const payload = {
        brand: newTyre.brand,
        title: newTyre.title,
        size: newTyre.size,
        price: Number(newTyre.price),
        warranty_months: Number(newTyre.warranty_months) || undefined,
        stock: Number(newTyre.stock) || 0,
        images: uploadedUrls,
        features: newFeatures,
      };

      const res = await fetch(`${API_BASE}/admin/tyres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add tyre");

      setNewTyre({
        brand: "",
        title: "",
        size: "",
        price: "",
        warranty_months: "",
        stock: "",
        images: [],
      });

      setNewImageFiles([]);
      setNewImagePreviews([]);
      setNewFeatures([]);

      await refreshTyres();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete tyre
  const handleDelete = async (id) => {
    if (!confirm("Delete this tyre?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/tyres/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete tyre");

      setTyres((prev) => prev.filter((t) => t._id !== id));
      setSearchResults((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit tyre
  const handleEditClick = (tyre) => {
    setEditingTyre({
      ...tyre,
      images: Array.isArray(tyre.images) ? [...tyre.images] : [],
    });
    setEditFeatures(tyre.features || []);
    setEditNewFiles([]);
    setEditNewPreviews([]);
  };

  const removeExistingImage = (i) => {
    setEditingTyre((prev) => {
      const updated = { ...prev, images: [...prev.images] };
      updated.images.splice(i, 1);
      return updated;
    });
  };

  const handleEditSave = async () => {
    if (!editingTyre) return;

    try {
      let uploadedUrls = [];
      if (editNewFiles.length > 0) {
        uploadedUrls = await Promise.all(editNewFiles.map(uploadToCloudinary));
        uploadedUrls = uploadedUrls.filter(Boolean);
      }

      const finalImages = [...editingTyre.images, ...uploadedUrls];

      const payload = {
        brand: editingTyre.brand,
        title: editingTyre.title,
        size: editingTyre.size,
        price: Number(editingTyre.price),
        warranty_months: Number(editingTyre.warranty_months) || undefined,
        stock: Number(editingTyre.stock) || 0,
        images: finalImages,
        features: editFeatures,
      };

      const res = await fetch(`${API_BASE}/admin/tyres/${editingTyre._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update tyre");

      setEditingTyre(null);
      setEditNewFiles([]);
      setEditNewPreviews([]);
      setEditFeatures([]);
      await refreshTyres();
    } catch (err) {
      alert(err.message);
    }
  };

  // Search tyres
  const runSearch = (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    fetch(`${API_BASE}/tyres?size=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) =>
  setSearchResults(dedupeTyres(Array.isArray(data) ? data : []))
)

      .finally(() => setSearchLoading(false));
  };

  const onSizeInput = (v) => {
    setSizeQuery(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(v.trim()), 450);
  };

  const handleSizeSearchSubmit = (e) => {
    e?.preventDefault();
    runSearch(sizeQuery.trim());
  };

  return (
    <div className="flex flex-col w-full">

      {/* Stock blink CSS */}
      <style>
        {`
        .blink-alert {
          width: 10px;
          height: 10px;
          background-color: red;
          border-radius: 50%;
          display: inline-block;
          margin-left: 6px;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        `}
      </style>

      <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-orange-600 dark:text-orange-400">
        🛞 Manage Tyres
      </h3>

      {/* SEARCH */}
      <section className="mb-6">
        <form
          onSubmit={handleSizeSearchSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            placeholder="Search tyres by size — e.g. 215/60R16"
            value={sizeQuery}
            onChange={(e) => onSizeInput(e.target.value)}
          />
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            Search
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {searchResults.map((tyre) => (
              <div
                key={tyre._id}
                className={`p-4 rounded-lg border ${darkMode
                    ? "bg-black/40 border-orange-700"
                    : "bg-white border-orange-200"
                  }`}
              >
                <img
                  src={tyre.images?.[0] || "/tyre.png"}
                  className="w-20 h-20 object-contain mb-2"
                />
                <h4 className="font-semibold">
                  {tyre.brand} {tyre.title}
                </h4>
                <div className="text-gray-400 text-sm">{tyre.size}</div>

                {/* FEATURES Display */}
                <div className="flex gap-1 flex-wrap mt-2">
                  {tyre.features?.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <p className="mt-2 font-bold">₹{tyre.price}</p>
                <div className="flex gap-2 mt-2">
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
            ))}
          </div>
        )}
      </section>

      {/* ADD TYRE */}
      <section className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Add New Tyre</h4>

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Brand"
            value={newTyre.brand}
            onChange={(e) =>
              setNewTyre({ ...newTyre, brand: e.target.value })
            }
            className="w-full sm:w-48"
          />

          <Input
            placeholder="Title"
            value={newTyre.title}
            onChange={(e) =>
              setNewTyre({ ...newTyre, title: e.target.value })
            }
            className="w-full sm:w-48"
          />

          <Input
            placeholder="Size"
            value={newTyre.size}
            onChange={(e) =>
              setNewTyre({ ...newTyre, size: e.target.value })
            }
            className="w-full sm:w-48"
          />

          <Input
            placeholder="Price"
            type="number"
            value={newTyre.price}
            onChange={(e) =>
              setNewTyre({ ...newTyre, price: e.target.value })
            }
            className="w-full sm:w-48"
          />

          <Input
            placeholder="Warranty Months"
            type="number"
            value={newTyre.warranty_months}
            onChange={(e) =>
              setNewTyre({
                ...newTyre,
                warranty_months: e.target.value,
              })
            }
            className="w-full sm:w-48"
          />

          <Input
            placeholder="Stock"
            type="number"
            value={newTyre.stock}
            onChange={(e) =>
              setNewTyre({ ...newTyre, stock: e.target.value })
            }
            className="w-full sm:w-48"
          />

          {/* FEATURES SECTION */}
          <div className="w-full">
            <label className="block mb-1 font-semibold text-sm">
              Select Features (max 3)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEATURE_OPTIONS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newFeatures.includes(f)}
                    onChange={() => toggleNewFeature(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {/* IMAGES */}
          <div className="w-full sm:w-60">
            <label className="block mb-1 text-sm">Images</label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setNewImageFiles(Array.from(e.target.files || []))
              }
            />
            {newImagePreviews.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {newImagePreviews.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleAdd}
            className="bg-orange-600 hover:bg-orange-700 text-white mt-2"
          >
            Add Tyre
          </Button>
        </div>
      </section>

      {/* TYRES LIST (MOBILE) */}
      <section>
        <div className="md:hidden flex flex-col gap-4">
          {tyres.map((tyre) => (
            <div
              key={tyre._id}
              className={`p-4 rounded-lg border shadow-sm ${darkMode ? "bg-black/60 border-orange-700" : "bg-white"
                }`}
            >
              <img
                src={tyre.images?.[0] || "/tyre.png"}
                className="w-16 h-16 object-contain"
              />
              <h4 className="font-bold mt-2">
                {tyre.brand} {tyre.title}
              </h4>
              <p className="text-sm text-gray-400">{tyre.size}</p>

              {/* FEATURES */}
              <div className="flex gap-1 flex-wrap mt-2">
                {tyre.features?.map((f, i) => (
                  <span
                    key={i}
                    className="text-xs bg-yellow-600 text-white px-2 py-1 rounded"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <p className="font-bold mt-2">₹{tyre.price}</p>

              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() => handleEditClick(tyre)}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(tyre._id)}
                  variant="destructive"
                  className="w-full"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TYRE LIST TABLE (DESKTOP) */}
      <div className="hidden md:block mt-6">
        <div className="border border-orange-500 rounded-lg overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className={darkMode ? "bg-orange-800" : "bg-orange-200"}>
              <tr>
                <th className="p-3 text-left">Images</th>
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Warranty</th>
                <th className="p-3 text-left">Stock</th>

                {/* NEW FEATURES COLUMN */}
                <th className="p-3 text-left">Features</th>

                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tyres.map((tyre) => (
                <tr key={tyre._id} className="border-b">
                  <td className="p-3">
  <div className="flex gap-1 max-w-[80px] overflow-hidden">
    {tyre.images?.slice(0, 2).map((img, i) => (
      <img
        key={i}
        src={img}
        className="w-8 h-8 object-contain rounded border"
      />
    ))}
  </div>
  {tyre.images?.length > 2 && (
    <div className="text-xs text-gray-500 mt-1">
      +{tyre.images.length - 2} more
    </div>
  )}
</td>



                  <td className="p-3">{tyre.brand}</td>
                  <td className="p-3">{tyre.title}</td>
                  <td className="p-3">{tyre.size}</td>
                  <td className="p-3">₹{tyre.price}</td>
                  <td className="p-3">{tyre.warranty_months || "--"}</td>

                  <td className="p-3 flex items-center">
                    {tyre.stock}
                    {tyre.stock < 10 && <span className="blink-alert"></span>}
                  </td>

                  {/* FEATURES COLUMN */}
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {tyre.features?.map((f, i) => (
                        <span
                          key={i}
                          className="text-xs bg-yellow-600 text-white px-2 py-1 rounded"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <Button
                      onClick={() => handleEditClick(tyre)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(tyre._id)}
                      variant="destructive"
                      className="px-3 py-1 ml-2"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {tyres.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    No tyres found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT TYRE DIALOG */}
      {editingTyre && (
        <Dialog open={true} onOpenChange={() => setEditingTyre(null)}>
          <DialogContent className="sm:max-w-[720px] bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>Edit Tyre Details</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
              <div>
                <label className="text-sm mb-1 block">Brand</label>
                <Input
                  value={editingTyre.brand}
                  onChange={(e) =>
                    setEditingTyre({ ...editingTyre, brand: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Title</label>
                <Input
                  value={editingTyre.title}
                  onChange={(e) =>
                    setEditingTyre({ ...editingTyre, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Size</label>
                <Input
                  value={editingTyre.size}
                  onChange={(e) =>
                    setEditingTyre({ ...editingTyre, size: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Price</label>
                <Input
                  type="number"
                  value={editingTyre.price}
                  onChange={(e) =>
                    setEditingTyre({ ...editingTyre, price: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Warranty Months</label>
                <Input
                  type="number"
                  value={editingTyre.warranty_months}
                  onChange={(e) =>
                    setEditingTyre({
                      ...editingTyre,
                      warranty_months: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">Stock</label>
                <Input
                  type="number"
                  value={editingTyre.stock}
                  onChange={(e) =>
                    setEditingTyre({ ...editingTyre, stock: e.target.value })
                  }
                />
              </div>

              {/* FEATURES (EDIT MODE) */}
              <div className="col-span-2">
                <label className="block mb-1 text-sm font-semibold">
                  Select Features (max 3)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEATURE_OPTIONS.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editFeatures.includes(f)}
                        onChange={() => toggleEditFeature(f)}
                      />
                      {f}
                    </label>
                  ))}
                </div>
              </div>

              {/* EXISTING IMAGES */}
              <div className="col-span-2">
                <label className="text-sm mb-1 block">Existing Images</label>
                <div className="flex gap-2 flex-wrap">
                  {editingTyre.images?.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeExistingImage(i)}
                        className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW IMAGES */}
              <div className="col-span-2">
                <label className="text-sm mb-1 block">Add Images</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setEditNewFiles(Array.from(e.target.files || []))
                  }
                />

                {editNewPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {editNewPreviews.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setEditingTyre(null);
                  setEditNewFiles([]);
                  setEditNewPreviews([]);
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleEditSave}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}