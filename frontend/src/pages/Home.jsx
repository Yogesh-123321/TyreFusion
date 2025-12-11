// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

import { fetchVariants, fetchFitments } from "@/api/wheelSize";
import { fetchMakes, fetchModels, fetchYears } from "@/api/wheelSizeBasic";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

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

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((it) => itemToString(it).toLowerCase().includes(q));
  }, [items, query, itemToString]);

  const handleInputKeyDown = (e) => {
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
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        value={value ? itemToString(value) : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
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
                  ev.preventDefault();
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
   Main Home Component
--------------------------*/
export default function Home() {
  const [tab, setTab] = useState("car");

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

  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [rim, setRim] = useState("");

  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");

  // Filters (collapsible)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [warrantyFilter, setWarrantyFilter] = useState("");

  const { addToCart } = useCart();
  const { token } = useAuth();

  /* Add to cart helper */
  const handleAddToCart = (tyre) => {
    if (!token) {
      alert("Please login to add items to cart.");
      return;
    }
    addToCart(tyre);
  };

  /* Load Makes */
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMakes()
      .then((data) => {
        if (!mounted) return;
        setMakes(data || []);
      })
      .catch(() => setError("Failed to fetch car makes"))
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, []);

  /* Car Search Logic */
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
    setAiResult("");

    if (!make) return;

    setLoading(true);
    try {
      const data = await fetchModels(make);
      setModels(data || []);
    } catch {
      setError("Error fetching models");
    } finally {
      setLoading(false);
    }
  }

  async function onModelSelect(model) {
    setSelectedModel(model);
    setSelectedYear(null);
    setSelectedVariant(null);
    setVariants([]);
    setTyres([]);
    setAiResult("");

    if (!selectedMake || !model) return;

    setLoading(true);
    try {
      const data = await fetchYears(selectedMake, model);
      setYears(Array.isArray(data) && data.length ? data : []);
    } catch {
      setYears([]);
    } finally {
      setLoading(false);
    }
  }

  async function onYearSelect(year) {
    setSelectedYear(year);
    setSelectedVariant(null);
    setVariants([]);
    setTyres([]);
    setAiResult("");

    if (!selectedMake || !selectedModel || !year) return;

    setLoading(true);
    try {
      const data = await fetchVariants(selectedMake, selectedModel, year);
      setVariants(data || []);
    } catch {
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
    setAiResult("");

    if (!selectedMake || !selectedModel || !selectedYear || !slug) return;

    setLoading(true);
    try {
      const fitments = await fetchFitments(
        selectedMake,
        selectedModel,
        selectedYear,
        slug
      );
      const sizeList = Array.isArray(fitments)
        ? fitments
        : fitments?.sizes || [];

      setSizes(sizeList || []);
      if (!Array.isArray(fitments) && fitments?.tyres) {
        setTyres(fitments.tyres);
      }
    } catch {
      setError("Error fetching tyre sizes");
    } finally {
      setLoading(false);
    }
  }

  async function onSizeSelect(size) {
    setSelectedSize(size);
    setTyres([]);
    setAiResult("");

    if (!size) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/tyres?size=${encodeURIComponent(size)}`
      );
      const data = await res.json();
      setTyres(data || []);
    } catch {
      setError("Error fetching tyres");
    } finally {
      setLoading(false);
    }
  }

  /* Size Search */
  async function onSizeSearchClick() {
    const w = (width || "").trim();
    const a = (aspect || "").trim();
    const r = (rim || "").trim();
    if (!w || !a || !r) {
      setError("Please enter width, aspect ratio, and rim size");
      return;
    }

    const sizeStr = `${w}/${a}R${r}`;
    setSelectedSize(sizeStr);
    setAiResult("");

    setLoading(true);
    setTyres([]);

    try {
      const res = await fetch(
        `${API_BASE}/tyres?size=${encodeURIComponent(sizeStr)}`
      );
      const data = await res.json();
      setTyres(data || []);
    } catch {
      setError("Error fetching tyres");
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
     AI Search Handler
  --------------------------*/
  async function onAISearch() {
    if (!aiQuery.trim()) {
      setError("Please enter a car name or model.");
      return;
    }

    setLoading(true);
    setError("");
    setTyres([]);
    setSelectedSize(null);
    setAiResult("");

    try {
      const res = await fetch(`${API_BASE}/ai-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });

      const data = await res.json();
      console.log("AI FRONTEND RESULT:", data);

      if (data.error) {
        setAiResult("No size information available.");
        return;
      }

      if (Array.isArray(data.sizes)) {
        setAiResult(data.sizes);
      } else {
        setAiResult("No size information available.");
      }
    } catch (err) {
      console.error(err);
      setError("AI search failed");
    } finally {
      setLoading(false);
    }
  }

  /* Reset */
  const resetForm = () => {
    setTab("car");
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
    setWidth("");
    setAspect("");
    setRim("");
    setError("");
    setAiQuery("");
    setAiResult("");
    setLoading(false);
    setBrandFilter("");
    setPriceFilter("");
    setWarrantyFilter("");
  };

  /* -------------------------
     Filters & Derived Data
  --------------------------*/
  const filteredTyres = useMemo(() => {
    let list = [...tyres];

    if (brandFilter) {
      list = list.filter((t) => t.brand === brandFilter);
    }
    if (priceFilter) {
      const maxPrice = Number(priceFilter);
      if (!Number.isNaN(maxPrice)) {
        list = list.filter((t) => Number(t.price) <= maxPrice);
      }
    }
    if (warrantyFilter) {
      const minWarranty = Number(warrantyFilter);
      if (!Number.isNaN(minWarranty)) {
        list = list.filter(
          (t) => Number(t.warrantyMonths || 0) >= minWarranty
        );
      }
    }

    return list;
  }, [tyres, brandFilter, priceFilter, warrantyFilter]);

  const brandOptions = useMemo(
    () => Array.from(new Set(tyres.map((t) => t.brand))).filter(Boolean),
    [tyres]
  );

  return (
    <>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Tyre Finder
        </h1>

        {/* Tabs */}
        <div className="flex items-center gap-3 justify-start md:justify-center overflow-x-auto pb-2">
          <button
            onClick={() => setTab("car")}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${tab === "car"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
              }`}
          >
            Search by Car
          </button>

          <button
            onClick={() => setTab("size")}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${tab === "size"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
              }`}
          >
            Search by Tyre Size
          </button>

          <button
            onClick={() => setTab("ai")}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${tab === "ai"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
              }`}
          >
            Search by AI
          </button>

          <div className="ml-auto md:ml-4 flex items-center gap-2">
            <button
              onClick={resetForm}
              className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm whitespace-nowrap"
            >
              Reset
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 rounded-md bg-red-500 text-white text-sm whitespace-nowrap"
            >
              Reset & Reload
            </button>
          </div>
        </div>

        <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border shadow-sm">
          {loading && (
            <div className="mb-4">
              <Loader />
            </div>
          )}
          {error && (
            <div className="text-red-500 mb-4 text-center">{error}</div>
          )}

          {/* -------------------------
              CAR SEARCH
          -------------------------- */}
          {tab === "car" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Make</label>
                  <Combobox
                    items={makes}
                    value={selectedMake}
                    onChange={onMakeSelect}
                    placeholder="Select Make"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <Combobox
                    items={models}
                    value={selectedModel}
                    onChange={onModelSelect}
                    placeholder="Select Model"
                    disabled={!selectedMake}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <Combobox
                    items={years}
                    value={selectedYear}
                    onChange={onYearSelect}
                    placeholder="Select Year"
                    itemToString={(y) => String(y)}
                    disabled={!selectedModel}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Variant
                  </label>
                  <Combobox
                    items={variants.map((v) => ({
                      label: v.name + (v.fuel ? ` (${v.fuel})` : ""),
                      value: v.slug,
                    }))}
                    value={
                      variants.find((v) => v.slug === selectedVariant) || null
                    }
                    itemToString={(it) => (it ? it.label : "")}
                    onChange={(sel) => onVariantSelect(sel?.value)}
                    placeholder="Select Variant"
                    disabled={!selectedYear}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Tyre Sizes
                </label>
                {sizes.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    Select variant to view sizes
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => onSizeSelect(s)}
                        className={`px-3 py-1 rounded-md text-sm ${selectedSize === s
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -------------------------
              SIZE SEARCH
          -------------------------- */}
          {tab === "size" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) =>
                    setWidth(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                  placeholder="e.g. 195"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Aspect Ratio
                </label>
                <input
                  type="number"
                  value={aspect}
                  onChange={(e) =>
                    setAspect(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                  placeholder="e.g. 60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Rim (inch)
                </label>
                <input
                  type="number"
                  value={rim}
                  onChange={(e) =>
                    setRim(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800"
                  placeholder="e.g. 15"
                />
              </div>

              <div>
                <Button className="w-full" onClick={onSizeSearchClick}>
                  Find Tyres
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------
              AI SEARCH
          -------------------------- */}
          {tab === "ai" && (
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">
                Enter Car Model (AI will suggest correct tyre sizes used in
                India)
              </label>

              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. Maruti Swift 2019, Creta 2021, Baleno 2020"
                className="w-full border px-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-white"
              />

              <Button
                className="w-full bg-orange-600 text-white"
                onClick={onAISearch}
              >
                Find Tyre Size with AI
              </Button>

              {Array.isArray(aiResult) && aiResult.length > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <strong>Recommended Tyre Sizes:</strong>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {aiResult.map((item) => {
                      // item like: "205/65R16 (Factory Fitment)"
                      const pureSize = item.split(" ")[0];
                      return (
                        <button
                          key={item}
                          onClick={() => onSizeSelect(pureSize)}
                          className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-sm hover:bg-orange-600 hover:text-white transition"
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {typeof aiResult === "string" &&
                aiResult.includes("No size") && (
                  <div className="mt-4 text-center text-red-400">
                    {aiResult}
                  </div>
                )}
            </div>
          )}
        </Card>

        {/* -------------------------
            RESULTS + FILTER TRIGGER
        -------------------------- */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Results{" "}
              {selectedSize ? (
                <span className="text-base font-normal text-gray-500">
                  for {selectedSize}
                </span>
              ) : tyres.length > 0 ? (
                <span className="text-base font-normal text-gray-500">
                  ({tyres.length} tyres found)
                </span>
              ) : null}
            </h2>

            <Button
              variant="outline"
              className="border-orange-600 text-orange-600 w-full sm:w-auto"
              onClick={() => setFiltersOpen(true)}
              disabled={tyres.length === 0}
            >
              Filters
            </Button>
          </div>

          {!loading && filteredTyres.length === 0 && (
            <div className="text-center text-gray-500 italic">
              No tyres to show — select a size or search above.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredTyres.map((tyre, i) => (
              <Card key={tyre._id || i} className="p-4">
                <img
                  src={tyre.image || "/tyre.png"}
                  alt={tyre.title}
                  className="w-full h-40 object-contain mb-3"
                />
                <h3 className="font-semibold text-lg">
                  {tyre.brand} {tyre.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-gray-600">{tyre.size}</div>
                  <div className="text-lg font-semibold text-orange-600">
                    ₹{tyre.price}
                  </div>
                </div>
                {tyre.warrantyMonths && (
                  <div className="text-sm text-gray-500 mt-1">
                    Warranty: {tyre.warrantyMonths} months
                  </div>
                )}
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleAddToCart(tyre)}
                    className="bg-orange-600 text-white w-full sm:w-auto"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() =>
                      alert("View details page is not implemented yet.")
                    }
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* COLLAPSIBLE FILTER PANEL (RESPONSIVE) */}
      {filtersOpen && (
        <div className="fixed inset-0 md:top-16 top-0 z-40 flex md:flex-row flex-col">

          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 md:mt-16"
            onClick={() => setFiltersOpen(false)}
          />

          {/* Panel */}
          <div className="md:w-80 w-full md:max-w-full max-h-[90vh] bg-white dark:bg-gray-900 p-4 shadow-xl overflow-y-auto rounded-t-xl md:rounded-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>

            {/* Brand Filter */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full border px-2 py-1 rounded-md dark:bg-gray-800"
              >
                <option value="">All</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Max Price (₹)</label>
              <input
                type="number"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full border px-2 py-1 rounded-md dark:bg-gray-800"
                placeholder="e.g. 6000"
              />
            </div>

            {/* Warranty Filter */}
            <div className="mb-4">
              <label className="block text-sm mb-1">
                Min Warranty (Months)
              </label>
              <input
                type="number"
                value={warrantyFilter}
                onChange={(e) => setWarrantyFilter(e.target.value)}
                className="w-full border px-2 py-1 rounded-md dark:bg-gray-800"
                placeholder="e.g. 24"
              />
            </div>

            <Button
              className="w-full bg-orange-600 text-white mt-2"
              onClick={() => {
                setBrandFilter("");
                setPriceFilter("");
                setWarrantyFilter("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      <FloatingWhatsAppButton />
    </>
  );
}
