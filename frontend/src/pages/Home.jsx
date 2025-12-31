// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

import { fetchVariants, fetchFitments } from "@/api/wheelSize";
import { fetchMakes, fetchModels, fetchYears } from "@/api/wheelSizeBasic";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const featureIconMap = {
  "Smooth Ride": "★",
  "Dry & Wet Grip": "🛞",
  "Excellent Braking": "🛑",
  "Low Noise": "🔇",
  "Fuel Efficient": "⚡",
};
function FeatureStamp({ icon, text }) {
  const getIcon = () => {
    if (text.includes("Grip")) return "🛞";
    if (text.includes("Brake")) return "🛑";
    if (text.includes("Noise")) return "🔇";
    if (text.includes("Fuel")) return "⛽";
    if (text.includes("Smooth")) return "★";
    return "⚡";
  };

  return (
    <div
      className="
        w-20 h-20
        flex flex-col items-center justify-center
        rounded-full
        border-2 border-red-600
        text-red-600
        text-[10px] font-bold
        uppercase text-center
        shadow-[0_0_10px_rgba(220,38,38,0.65)]
        bg-white
      "
    >
      <div className="text-2xl mb-1">{getIcon()}</div>
      <div className="leading-tight px-1">{text}</div>
    </div>
  );
}


/* -------------------------
   Tyre Image Gallery (Continuous Loop - C2)
   - One big slider (smooth loop)
   - Up to 2 thumbnails below (clickable)
   - Auto-cycle with continuous-feel using per-slide timing
   - Uses a cloned-slide trick to seamlessly loop
--------------------------*/
function TyreImageGallery({ images = [], title = "" }) {
  // Normalize images array, ensure at least one entry
  const normalized = (Array.isArray(images) ? images.filter(Boolean) : [])
    .map((i) => i || "/tyre.png");
  if (normalized.length === 0) normalized.push("/tyre.png");

  // For thumbnails we want at most 2 thumbnails (as requested)
  const thumbnailImages = normalized.slice(0, 2);

  // slider state
  const [index, setIndex] = useState(0); // current slide index (0..n-1)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const slidesCount = normalized.length;
  const totalCycleSec = 6; // S2 chosen: 6-second full cycle
  // time per slide
  const intervalMs = Math.max(6000 / Math.max(slidesCount, 1), 500);

  const sliderRef = useRef(null);
  const autoplayRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Build slides with clone of first slide appended to enable seamless loop
  const slides = normalized.concat(normalized[0]);

  // Advance to next slide (with transition)
  const goTo = (toIdx) => {
    // toIdx is index in 0..slidesCount-1
    setIndex(toIdx);
  };

  const next = () => {
    setIndex((prev) => prev + 1);
  };

  // Autoplay: advance at intervalMs
  useEffect(() => {
    // clear previous
    if (autoplayRef.current) clearInterval(autoplayRef.current);

    autoplayRef.current = setInterval(() => {
      next();
    }, intervalMs);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, slidesCount]);

  // Handle index wrap-around (we are using cloned slide at end)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Enable smooth transition
    setIsTransitioning(true);
    slider.style.transition = "transform 600ms ease";

    const handleTransitionEnd = () => {
      // when we land on the cloned slide (index === slidesCount), jump back to 0 without transition
      if (index >= slidesCount) {
        // jump
        slider.style.transition = "none";
        const resetTranslate = 0; // show first slide
        slider.style.transform = `translateX(${resetTranslate}px)`;
        // Force layout then re-enable transition and reset index to 0
        // We use requestAnimationFrame to ensure the browser applies the non-transition jump
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(false); // temporarily disable transition while resetting state
            setIndex(0);
            // re-enable transition for subsequent moves
            slider.style.transition = "transform 600ms ease";
            setIsTransitioning(true);
          });
        });
      }
    };

    slider.addEventListener("transitionend", handleTransitionEnd);

    return () => slider.removeEventListener("transitionend", handleTransitionEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slidesCount]);

  // Apply transform when index changes (or when resetting)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Each slide width will be equal to container width (we use CSS flex)
    // Compute translateX using element widths
    const container = slider.parentElement;
    if (!container) return;
    const slideWidth = container.clientWidth;
    const translateX = -slideWidth * index;
    // If we disabled transition above, ensure we don't animate
    if (!isTransitioning) {
      slider.style.transition = "none";
    } else {
      slider.style.transition = "transform 600ms ease";
    }
    slider.style.transform = `translateX(${translateX}px)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isTransitioning]);

  // When user clicks a thumbnail, jump to that slide and pause autoplay briefly
  const handleThumbnailClick = (i) => {
    // pause autoplay briefly
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);

    goTo(i);
    // restart autoplay after 4s
    pauseTimeoutRef.current = setTimeout(() => {
      // restart interval
      autoplayRef.current = setInterval(() => {
        next();
      }, intervalMs);
    }, 4000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // Render
  return (
    <div className="w-full">
      {/* MAIN SLIDER VIEWPORT */}
      <div className="w-full overflow-hidden rounded border bg-white dark:bg-gray-900">
        <div
          ref={sliderRef}
          className="flex"
          // inline styles set by effect for transform/transition
          style={{
            width: `${slides.length * 100}%`,
            // each child slide will be flex: 0 0 auto and width = parent / slides.length via CSS below
          }}
        >
          {slides.map((src, idx) => (
            <div
              key={idx}
              className="flex-shrink-0"
              style={{ width: `${100 / slides.length}%`, display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 0" }}
            >
              <img
                src={src}
                alt={`${title || "tyre"} - ${idx}`}
                className="max-h-40 object-contain"
                style={{ maxWidth: "90%" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* THUMBNAILS */}
      <div className="flex gap-2 justify-center mt-2">
        {thumbnailImages.map((t, i) => (
          <button
            key={i}
            onClick={() => handleThumbnailClick(i)}
            className={`p-0 border rounded overflow-hidden ${i === (index % slidesCount) ? "ring-2 ring-orange-600" : ""}`}
            style={{ width: 56, height: 56 }}
            aria-label={`Show image ${i + 1}`}
          >
            <img src={t} alt={`${title} thumb ${i}`} className="w-full h-full object-contain" />
          </button>
        ))}

        {/* If fewer than 2 thumbnails exist, fill with duplicates to maintain layout */}
        {thumbnailImages.length < 2 &&
          Array.from({ length: 2 - thumbnailImages.length }).map((_, j) => (
            <div key={`empty-${j}`} className="w-14 h-14 border rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
              &nbsp;
            </div>
          ))}
      </div>
    </div>
  );
}

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
  const [tab, setTab] = useState("size");
// quantity per tyre stored globally
const [quantities, setQuantities] = useState({});
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]);
  const [sizes, setSizes] = useState([]);

const navigate = useNavigate();
const [loginDialogOpen, setLoginDialogOpen] = useState(false);

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
      console.log("LOGIN BLOCK TRIGGERED");
  setLoginDialogOpen(true);
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

  // Brand filter
  if (brandFilter) {
    list = list.filter((t) => t.brand === brandFilter);
  }

  // Max price filter
  if (priceFilter) {
    const maxPrice = Number(priceFilter);
    if (!Number.isNaN(maxPrice)) {
      list = list.filter((t) => Number(t.price) <= maxPrice);
    }
  }

  // Warranty filter
  if (warrantyFilter) {
    const minWarranty = Number(warrantyFilter);
    if (!Number.isNaN(minWarranty)) {
      list = list.filter(
        (t) => Number(t.warrantyMonths || 0) >= minWarranty
      );
    }
  }

  // ⭐ SORT: LOW → HIGH (price)
  list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

  return list;
}, [tyres, brandFilter, priceFilter, warrantyFilter]);


  const brandOptions = useMemo(
    () => Array.from(new Set(tyres.map((t) => t.brand))).filter(Boolean),
    [tyres]
  );

  return (
    <>
{/* FULL-WIDTH TOP BANNER - FIXED HEIGHT ON DESKTOP */}
{/* FULL-WIDTH TOP BANNER - NATURAL HEIGHT (No Cropping) */}
<section className="w-full">
  <img
    src="/home-top.png"
    alt="Tyre promo banner"
    // w-full = Stretches to touch left and right edges
    // h-auto = Calculates the exact height needed to show the WHOLE image (Top to Bottom)
    className="w-full h-auto block"
  />
</section>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          Discover Compatible Tyres
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

          {/* -------------------------
    RESULTS SECTION
-------------------------- */}

{/* -------------------------
    RESULTS SECTION
-------------------------- */}
{/* -------------------------
    RESULTS SECTION
-------------------------- */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
  {filteredTyres.map((tyre, i) => {
    const stock = Number(tyre.stock ?? 0);

    // quantity logic preserved
    const qty = quantities[tyre._id] || 1;
    const setQty = (v) =>
      setQuantities((prev) => ({
        ...prev,
        [tyre._id]: v,
      }));

    const increaseQty = () => stock > qty && setQty(qty + 1);
    const decreaseQty = () => qty > 1 && setQty(qty - 1);

    const handleAdd = () => {
      if (stock > 0) handleAddToCart({ ...tyre, quantity: qty });
    };

    // STOCK BADGE
    let stockBadge = null;
    if (stock === 0)
      stockBadge = (
        <span className="text-red-600 text-sm font-semibold">OUT OF STOCK</span>
      );
    else if (stock < 10)
      stockBadge = (
        <span className="text-orange-600 text-sm font-semibold">
          Only {stock} left
        </span>
      );
    else
      stockBadge = (
        <span className="text-green-600 text-sm font-semibold">In Stock</span>
      );

    return (
 <Card
  key={tyre._id || i}
  className="
    relative p-4 rounded-xl overflow-visible
    border border-gray-200
    bg-gradient-to-br from-[#f6f7f8] via-[#fdfdfd] to-[#eef0f2]
    shadow-[0_10px_25px_rgba(0,0,0,0.08)]

    dark:border-gray-800
    dark:bg-gradient-to-br
    dark:from-[#12181e]
    dark:via-[#0f151b]
    dark:to-[#0b1116]
    dark:shadow-[0_12px_30px_rgba(0,0,0,0.75)]
  "
>

    {/* TITLE */}
    <div className="px-2 pb-2">
      <h3 className="font-bold text-lg uppercase text-gray-900 dark:text-gray-100">
        {tyre.brand} {tyre.title}
      </h3>
      <p className="text-sm text-gray-500">{tyre.size} Tubeless Tyre</p>
    </div>

    {/* IMAGE GALLERY (UNCHANGED) */}
    <TyreImageGallery
      images={
        Array.isArray(tyre.images) && tyre.images.length > 0
          ? tyre.images
          : tyre.image
          ? [tyre.image]
          : ["/tyre.png"]
      }
      title={tyre.title || `${tyre.brand} tyre`}
    />

    {/* WARRANTY */}
    <div className="mt-3 px-1">
      <span className="text-sm font-semibold text-white-700">
        {tyre.warranty_months
          ? `${Math.floor(tyre.warranty_months / 12)} Years Warranty`
          : "Warranty Details Available"}
      </span>
    </div>
{/* FEATURE BANNERS BELOW WARRANTY */}
{/* FEATURES — BELOW WARRANTY (SINGLE LINE) */}
{/* FEATURES — SIMPLE STAMPS */}
{tyre.features && tyre.features.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-2">
    {tyre.features.slice(0, 4).map((f, i) => (
      <FeatureStamp
        key={i}
        text={f}
        icon={featureIconMap[f] || "✔"}
      />
    ))}
  </div>
)}




    {/* PRICE */}
    <div className="px-1 mt-4">
      <p className="text-xl font-bold text-orange-700">₹{tyre.price}</p>
      <p className="text-xs text-gray-400">Incl. Taxes</p>
    </div>

    {/* STOCK */}
    <div className="px-1 mt-2">
      {stock === 0 ? (
        <span className="text-red-600 font-semibold text-sm">OUT OF STOCK</span>
      ) : stock < 10 ? (
        <span className="text-orange-500 font-semibold text-sm">
          Only {stock} left
        </span>
      ) : (
        <span className="text-green-600 font-semibold text-sm">In Stock</span>
      )}
    </div>

    {/* QUANTITY */}
    {stock > 0 && (
      <div className="flex items-center gap-3 mt-3 px-1">
        <button
          onClick={decreaseQty}
          className="px-3 py-1 bg-black-200 rounded"
          disabled={qty <= 1}
        >
          -
        </button>

        <span className="font-semibold">{qty}</span>

        <button
          onClick={increaseQty}
          className="px-3 py-1 bg-black-200 rounded"
          disabled={qty >= stock}
        >
          +
        </button>
      </div>
    )}

    {/* ADD TO CART */}
    <div className="px-1 mt-4">
      <Button
        className={`w-full bg-orange-600 text-white py-3 rounded-md shadow 
        hover:bg-orange-700 transition ${
          stock === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleAdd}
        disabled={stock === 0}
      >
        {stock === 0 ? "OUT OF STOCK" : "ADD TO CART"}
      </Button>
    </div>
  </Card>
);
  })}
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
<Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
  <DialogContent
  className="
    max-w-md
    border
    bg-white text-gray-900
    shadow-2xl
    rounded-xl

    dark:bg-gray-900
    dark:text-gray-100
    dark:border-gray-700
  "
>
    <DialogHeader>
      <DialogTitle className="text-xl">
        Login Required
      </DialogTitle>

      <DialogDescription className="text-gray-600 dark:text-gray-400">
        You need to be logged in to add items to your cart.
        Please continue to the login page.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="mt-4">
      <Button
        variant="outline"
        onClick={() => setLoginDialogOpen(false)}
      >
        Cancel
      </Button>

      <Button
        className="bg-orange-600 hover:bg-orange-700 text-white"
        onClick={() => {
          setLoginDialogOpen(false);
          navigate("/login");
        }}
      >
        Go to Login
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <FloatingWhatsAppButton />
    </>
  );
}
