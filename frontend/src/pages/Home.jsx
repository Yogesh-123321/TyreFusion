// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

// API helpers you already have
import { fetchVariants, fetchFitments } from "@/api/wheelSize";
import { fetchMakes, fetchModels, fetchYears } from "@/api/wheelSizeBasic";

const API_BASE = "http://localhost:5000/api";

/* -------------------------
   Small reusable Combobox
--------------------------*/
function Combobox({
  items = [],
  itemToString = (it) => (it ? String(it) : ""),
  value,
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  ariaLabel = "combobox",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Filter items by query (case-insensitive)
  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((it) => itemToString(it).toLowerCase().includes(q));
  }, [items, query, itemToString]);

  useEffect(() => {
    // close dropdown when items changed to avoid stale selection
    // keep open if there is active query
  }, [items]);

  // STOP propagation helper for editable inputs inside pages that have global key handlers.
  const handleInputKeyDown = (e) => {
    // keys we want the input to handle itself (don't let global handlers intercept)
    const keysToKeep = new Set([
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "Home",
      "End",
    ]);

    if (keysToKeep.has(e.key)) {
      // Prevent global listeners from intercepting — allow normal input behavior.
      e.stopPropagation();
    }
  };

  // keyboard handling on wrapper: Escape closes
  return (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // slight delay so click to option registers
          setTimeout(() => setOpen(false), 120);
        }}
        value={value ? itemToString(value) : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          // when user types, we should consider selection cleared
          if (onChange && !items.includes(e.target.value)) {
            // do nothing here — keep typed text in query until user selects
          }
        }}
        onKeyDown={handleInputKeyDown} // <-- stop propagation for editing keys
      />

      {open && filtered?.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 w-full mt-1 max-h-56 overflow-auto rounded-md border bg-white dark:bg-gray-900 shadow-md"
        >
          {filtered.map((it, idx) => {
            const label = itemToString(it);
            return (
              <li
                key={idx}
                role="option"
                onMouseDown={(ev) => {
                  ev.preventDefault(); // prevent blur before click
                  onChange && onChange(it);
                  setQuery("");
                  setOpen(false);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}

      {open && filtered?.length === 0 && (
        <div className="absolute z-30 w-full mt-1 p-3 rounded-md border bg-white dark:bg-gray-900 text-sm text-gray-500">
          No results
        </div>
      )}
    </div>
  );
}

/* -------------------------
   The main Home component
--------------------------*/
export default function Home() {
  // UI tab state: "car" or "size"
  const [tab, setTab] = useState("car");

  // Car search states
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [selectedMake, setSelectedMake] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Tyre-size search states (Tab 2)
  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [rim, setRim] = useState("");

  // result set & UI
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { token } = useAuth();

  /* -------------------------
     Load makes on mount
  --------------------------*/
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMakes()
      .then((data) => {
        if (!mounted) return;
        setMakes(data || []);
      })
      .catch((e) => {
        console.error("Failed to fetch makes", e);
        setError("Failed to fetch car makes");
      })
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  /* -------------------------
     Handlers for Car tab (typeahead combobox)
  --------------------------*/
  async function onMakeSelect(make) {
    setSelectedMake(make);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedVariant(null);
    setSelectedSize(null);
    setModels([]);
    setYears([]);
    setVariants([]);
    setSizes([]);
    setTyres([]);

    if (!make) return;
    setLoading(true);
    try {
      const data = await fetchModels(make);
      setModels(data || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching models");
    } finally {
      setLoading(false);
    }
  }

  async function onModelSelect(model) {
    setSelectedModel(model);
    setSelectedYear(null);
    setSelectedVariant(null);
    setSelectedSize(null);
    setVariants([]);
    setSizes([]);
    setTyres([]);

    if (!selectedMake || !model) return;
    setLoading(true);
    try {
      const data = await fetchYears(selectedMake, model);
      setYears(Array.isArray(data) && data.length ? data : [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]);
    } catch (err) {
      console.error(err);
      setYears([2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]);
    } finally {
      setLoading(false);
    }
  }

  async function onYearSelect(year) {
    setSelectedYear(year);
    setSelectedVariant(null);
    setSelectedSize(null);
    setVariants([]);
    setSizes([]);
    setTyres([]);

    if (!selectedMake || !selectedModel || !year) return;
    setLoading(true);
    try {
      const data = await fetchVariants(selectedMake, selectedModel, year);
      setVariants(data || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching variants");
    } finally {
      setLoading(false);
    }
  }

  async function onVariantSelect(slug) {
    setSelectedVariant(slug);
    setSelectedSize(null);
    setSizes([]);
    setTyres([]);

    if (!selectedMake || !selectedModel || !selectedYear || !slug) return;
    setLoading(true);
    try {
      const fitments = await fetchFitments(selectedMake, selectedModel, selectedYear, slug);
      const sizeList = Array.isArray(fitments) ? fitments : fitments?.sizes || [];
      setSizes(sizeList || []);
      if (!Array.isArray(fitments) && fitments?.tyres) setTyres(fitments.tyres);
    } catch (err) {
      console.error(err);
      setError("Error fetching tyre sizes");
    } finally {
      setLoading(false);
    }
  }

  async function onSizeSelect(size) {
    setSelectedSize(size);
    setTyres([]);
    if (!size) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tyres?size=${encodeURIComponent(size)}`);
      const data = await res.json();
      setTyres(data || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching tyres");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
     Tab 2: search by separate width/aspect/rim
  --------------------------*/
  async function onSizeSearchClick() {
    const w = (width || "").trim();
    const a = (aspect || "").trim();
    const r = (rim || "").trim();
    if (!w || !a || !r) {
      setError("Please enter width, aspect ratio and rim size");
      return;
    }
    const sizeStr = `${w}/${a}R${r}`;
    setTab("size");
    setSelectedSize(sizeStr);
    setLoading(true);
    setTyres([]);
    try {
      const res = await fetch(`${API_BASE}/tyres?size=${encodeURIComponent(sizeStr)}`);
      const data = await res.json();
      setTyres(data || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching tyres");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
     Add to cart (same as before)
  --------------------------*/
  function handleAddToCart(tyre) {
    if (!tyre || !tyre._id) {
      alert("Invalid tyre data — please refresh and try again.");
      return;
    }
    addToCart({
      _id: tyre._id,
      brand: tyre.brand,
      title: tyre.title,
      price: tyre.price,
      quantity: 1,
    });
    alert(`${tyre.brand} ${tyre.title} added to cart 🛒`);
  }

  /* -------------------------
     Reset helpers
  --------------------------*/
  // Hard reload the entire page
  const resetPage = () => {
    window.location.reload();
  };

  // Soft reset: clear all local search state without reloading
  const resetForm = () => {
    setTab("car");

    // car search
    setSelectedMake(null);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedVariant(null);
    setSelectedSize(null);
    setModels([]);
    setYears([]);
    setVariants([]);
    setSizes([]);
    setTyres([]);

    // size search
    setWidth("");
    setAspect("");
    setRim("");

    // errors/loading
    setError("");
    setLoading(false);
  };

  /* -------------------------
     render
  --------------------------*/
  // stopPropagation helper for numeric inputs
  const handleNumericInputKeyDown = (e) => {
    const keysToKeep = new Set([
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "Home",
      "End",
    ]);
    if (keysToKeep.has(e.key)) e.stopPropagation();
  };

  return (
    <>
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Tyre Finder</h1>

      {/* Tabs + Reset buttons */}
      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={() => setTab("car")}
          className={`px-4 py-2 rounded-md ${tab === "car" ? "bg-orange-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}
        >
          Search by Car
        </button>
        <button
          onClick={() => setTab("size")}
          className={`px-4 py-2 rounded-md ${tab === "size" ? "bg-orange-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}
        >
          Search by Tyre Size
        </button>

        {/* Reset controls */}
        <div className="ml-4 flex items-center gap-2">
          <button
            onClick={resetForm}
            className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
            title="Reset form (no reload)"
          >
            Reset
          </button>

          <button
            onClick={resetPage}
            className="px-3 py-2 rounded-md bg-red-500 text-white text-sm"
            title="Reload page"
          >
            Reset & Reload
          </button>
        </div>
      </div>

      {/* Card container */}
      <Card className="p-6 bg-white dark:bg-gray-900 border shadow-sm">
        {loading && <div className="mb-4"><Loader /></div>}
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        {/* Tab Content */}
        {tab === "car" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make */}
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <Combobox
                items={makes}
                itemToString={(it) => (it ? it : "")}
                value={selectedMake}
                onChange={onMakeSelect}
                placeholder="Type to filter makes..."
                ariaLabel="Car make"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <Combobox
                items={models}
                itemToString={(it) => (it ? it : "")}
                value={selectedModel}
                onChange={onModelSelect}
                placeholder={selectedMake ? "Type to filter models..." : "Select a make first"}
                ariaLabel="Car model"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <Combobox
                items={years}
                itemToString={(it) => (it ? String(it) : "")}
                value={selectedYear}
                onChange={onYearSelect}
                placeholder={selectedModel ? "Type or select year..." : "Select a model first"}
                ariaLabel="Year"
              />
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium mb-1">Variant</label>
              <Combobox
                items={variants.map(v => ({ label: v.name + (v.fuel ? ` (${v.fuel})` : ""), value: v.slug }))}
                itemToString={(it) => (it ? it.label : "")}
                value={variants.find(v => v.slug === selectedVariant) || null}
                onChange={(sel) => {
                  // sel is the object chosen: {label, value}
                  const slug = sel ? sel.value : null;
                  onVariantSelect(slug);
                }}
                placeholder={selectedYear ? "Filter variants..." : "Select a year first"}
                ariaLabel="Variant"
              />
            </div>

            {/* Tyre Sizes (when available) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tyre Sizes</label>
              {sizes.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Select variant to view sizes</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSizeSelect(s)}
                      className={`px-3 py-1 rounded-md text-sm ${selectedSize === s ? "bg-orange-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Tab: Search by Tyre Size
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                placeholder="e.g. 195"
                onKeyDown={handleNumericInputKeyDown} // <-- stop propagation
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
              <input
                type="number"
                value={aspect}
                onChange={(e) => setAspect(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                placeholder="e.g. 60"
                onKeyDown={handleNumericInputKeyDown} // <-- stop propagation
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rim (inch)</label>
              <input
                type="number"
                value={rim}
                onChange={(e) => setRim(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                placeholder="e.g. 15"
                onKeyDown={handleNumericInputKeyDown} // <-- stop propagation
              />
            </div>
            <div>
              <Button className="w-full" onClick={onSizeSearchClick}>
                Find Tyres
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tyre Results */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Results {selectedSize ? `for ${selectedSize}` : ""}</h2>

        {!loading && tyres.length === 0 && (
          <div className="text-center text-gray-500 italic">No tyres to show — select a size or search by size above.</div>
        )}

        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 mt-4">
          {tyres.map((tyre, i) => (
            <Card key={tyre._id || i} className="p-4">
              <img src={tyre.image || "/tyre.png"} alt={tyre.title} className="w-full h-40 object-contain mb-3" />
              <h3 className="font-semibold text-lg">{tyre.brand} {tyre.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">{tyre.size}</div>
                <div className="text-lg font-semibold text-orange-600">₹{tyre.price}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => handleAddToCart(tyre)} className="bg-orange-600 text-white">Add to Cart</Button>
                <Button onClick={() => alert('View details not implemented')} variant="outline">Details</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
     {/* ✅ Floating WhatsApp Chat Button */}
    <FloatingWhatsAppButton />
    </>
  );
}
