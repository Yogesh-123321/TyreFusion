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

/* -------------------------------------------
   CLOUDINARY CONFIG (Frontend direct upload)
-------------------------------------------- */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;

export default function TyreManager({ darkMode }) {
  const { token } = useAuth();

  const [tyres, setTyres] = useState([]);
  const [newTyre, setNewTyre] = useState({
    brand: "",
    title: "",
    size: "",
    price: "",
    warranty_months: "",
    image: "",
  });

  const [newImageFile, setNewImageFile] = useState(null);
  const [editingTyre, setEditingTyre] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  // ---------------- Search ----------------
  const [sizeQuery, setSizeQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (token) {
      refreshTyres();
    }
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

  /* -------------------------------------------
      CLOUDINARY UPLOAD HANDLER (UNSIGNED)
  -------------------------------------------- */
  const uploadToCloudinary = async (file) => {
    if (!file) return "";

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        console.error("Cloudinary Upload Error: ", data);
        alert("Image upload failed!");
        return "";
      }
    } catch (err) {
      console.error("Cloudinary Upload Exception:", err);
      return "";
    }
  };

  /* -------------------------------------------
      ADD NEW TYRE
  -------------------------------------------- */
  const handleAdd = async () => {
    let imageUrl = "";

    if (newImageFile) {
      imageUrl = await uploadToCloudinary(newImageFile);
    }

    const payload = {
      ...newTyre,
      image: imageUrl || "",
    };

    try {
      await fetch(`${API_BASE}/admin/tyres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setNewTyre({
        brand: "",
        title: "",
        size: "",
        price: "",
        warranty_months: "",
        image: "",
      });
      setNewImageFile(null);

      refreshTyres();
    } catch (err) {
      console.error("Failed to add tyre", err);
    }
  };

  /* -------------------------------------------
      DELETE TYRE
  -------------------------------------------- */
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

  const handleEditClick = (tyre) => {
    setEditingTyre({ ...tyre });
    setEditImageFile(null);
  };

  /* -------------------------------------------
      SAVE EDITED TYRE
  -------------------------------------------- */
  const handleEditSave = async () => {
    if (!editingTyre) return;

    let updatedImage = editingTyre.image;

    if (editImageFile) {
      const uploaded = await uploadToCloudinary(editImageFile);
      if (uploaded) updatedImage = uploaded;
    }

    const payload = {
      ...editingTyre,
      image: updatedImage,
    };

    try {
      await fetch(`${API_BASE}/admin/tyres/${editingTyre._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setEditingTyre(null);
      setEditImageFile(null);
      refreshTyres();
    } catch (err) {
      console.error("Failed to update tyre", err);
    }
  };

  /* -------------------- SEARCH -------------------- */
  const runSearch = (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    fetch(`${API_BASE}/tyres?size=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(Array.isArray(data) ? data : []))
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

  /* -------------------------------------------
            UI STARTS HERE
  -------------------------------------------- */

  return (
    <div className="flex flex-col w-full">
      <h3
        className={`text-2xl sm:text-3xl font-bold mb-4 ${
          darkMode ? "text-orange-400" : "text-orange-600"
        }`}
      >
        🛞 Manage Tyres
      </h3>

      {/* ------------------ SEARCH PANEL ------------------ */}
      <section className="mb-6">
        <form
          onSubmit={handleSizeSearchSubmit}
          className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
        >
          <Input
            placeholder="Search tyres by size — e.g. 215/60R16"
            value={sizeQuery}
            onChange={(e) => onSizeInput(e.target.value)}
            className="w-full"
          />
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
          >
            Search
          </Button>
        </form>

        {searchLoading && (
          <p className="text-sm mt-2 text-gray-400">Searching...</p>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {searchResults.map((tyre) => (
              <div
                key={tyre._id}
                className={`p-4 rounded-lg border ${
                  darkMode
                    ? "bg-black/40 border-orange-700"
                    : "bg-white border-orange-200"
                }`}
              >
                <div className="flex gap-3 items-center mb-2">
                  <img
                    src={tyre.image || "/tyre.png"}
                    className="w-16 h-16 object-contain"
                    alt={tyre.title}
                  />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">
                      {tyre.brand} {tyre.title}
                    </h4>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {tyre.size}
                    </div>
                  </div>
                </div>

                <div className="mt-1 font-semibold text-sm sm:text-base">
                  ₹{tyre.price}
                </div>
                {tyre.warranty_months && (
                  <div className="text-xs sm:text-sm text-gray-400 mt-1">
                    Warranty: {tyre.warranty_months} months
                  </div>
                )}

                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleEditClick(tyre)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-1"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(tyre._id)}
                    variant="destructive"
                    className="text-xs sm:text-sm px-3 py-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------ ADD NEW TYRE ------------------ */}
      <section className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Add New Tyre</h4>

        <div className="flex flex-wrap gap-3 items-stretch">
          {Object.keys(newTyre).map((key) =>
            key === "image" ? null : (
              <Input
                key={key}
                placeholder={key.replace("_", " ")}
                value={newTyre[key]}
                onChange={(e) =>
                  setNewTyre({ ...newTyre, [key]: e.target.value })
                }
                className="w-full sm:w-48"
              />
            )
          )}

          {/* FILE UPLOAD */}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImageFile(e.target.files[0])}
            className="w-full sm:w-60"
          />

          <Button
            onClick={handleAdd}
            className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
          >
            ➕ Add Tyre
          </Button>
        </div>
      </section>

      {/* ------------------ TYRES LIST (CARDS + TABLE) ------------------ */}
      <section className="space-y-4">
        {/* Mobile / small screens: CARD VIEW */}
        <div className="md:hidden flex flex-col items-center gap-4">
          {tyres.map((tyre) => (
            <div
              key={tyre._id}
              className={`w-full max-w-[350px] rounded-xl border p-4 shadow-sm ${
                darkMode
                  ? "bg-black/60 border-orange-700"
                  : "bg-white border-orange-200"
              }`}
            >
              <div className="flex gap-3">
                <img
                  src={tyre.image || "/tyre.png"}
                  alt={tyre.title}
                  className="w-20 h-20 object-contain"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-base">
                    {tyre.brand} {tyre.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">{tyre.size}</p>
                  <p className="text-sm font-semibold mt-2">
                    ₹{tyre.price}{" "}
                    {tyre.warranty_months && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({tyre.warranty_months} months warranty)
                      </span>
                    )}
                  </p>
                </div>
              </div>

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

          {tyres.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No tyres found
            </p>
          )}
        </div>

        {/* Desktop / tablet: TABLE VIEW */}
        <div className="hidden md:block">
          <div className="border border-orange-500 rounded-lg overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className={darkMode ? "bg-orange-800" : "bg-orange-200"}>
                <tr>
                  <th className="p-3 text-left">Image</th>
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
                    className="border-b hover:bg-orange-900/10"
                  >
                    <td className="p-3">
                      <img
                        src={tyre.image || "/tyre.png"}
                        className="w-16 h-16 object-contain"
                        alt={tyre.title}
                      />
                    </td>
                    <td className="p-3">{tyre.brand}</td>
                    <td className="p-3">{tyre.title}</td>
                    <td className="p-3">{tyre.size}</td>
                    <td className="p-3">₹{tyre.price}</td>
                    <td className="p-3">
                      {tyre.warranty_months
                        ? `${tyre.warranty_months} mo`
                        : "--"}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleEditClick(tyre)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(tyre._id)}
                          variant="destructive"
                          className="px-3 py-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {tyres.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No tyres found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------ EDIT DIALOG ------------------ */}
      {editingTyre && (
        <Dialog open={true} onOpenChange={() => setEditingTyre(null)}>
          <DialogContent className="sm:max-w-[520px] bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>Edit Tyre Details</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              {Object.keys(newTyre).map((key) =>
                key === "image" ? null : (
                  <div key={key}>
                    <label className="block mb-1 capitalize text-sm">
                      {key.replace("_", " ")}
                    </label>
                    <Input
                      value={editingTyre[key] || ""}
                      onChange={(e) =>
                        setEditingTyre({
                          ...editingTyre,
                          [key]: e.target.value,
                        })
                      }
                    />
                  </div>
                )
              )}

              {/* EDIT UPLOAD FIELD */}
              <div className="col-span-1 sm:col-span-2 mt-2">
                <label className="block mb-1 text-sm">Replace Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files[0])}
                />
              </div>
            </div>

            <DialogFooter>
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
