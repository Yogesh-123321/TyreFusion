import { useState } from "react";
import { fetchVariants, fetchFitments } from "../api/wheelSize";

export default function TyreSelector() {
  const [make, setMake] = useState("Kia");
  const [model, setModel] = useState("Sonet");
  const [year, setYear] = useState("2023");
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoadVariants = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchVariants(make, model, year);
      setVariants(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load variants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariant = async (slug) => {
    try {
      setSelectedVariant(slug);
      setLoading(true);
      setError("");
      const sizeData = await fetchFitments(make, model, year, slug);
      setSizes(sizeData);
    } catch (err) {
      console.error(err);
      setError("Failed to load tyre sizes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl space-y-4 shadow-lg">
      <h2 className="text-2xl font-semibold text-blue-400">Find Tyres by Car</h2>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Make"
          className="bg-gray-800 p-2 rounded text-sm w-32"
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Model"
          className="bg-gray-800 p-2 rounded text-sm w-32"
        />
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          className="bg-gray-800 p-2 rounded text-sm w-20"
        />

        <button
          onClick={handleLoadVariants}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Variants"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {variants.length > 0 && (
        <div>
          <h3 className="text-lg mt-3 font-medium text-gray-300">Select Variant</h3>
          <select
            onChange={(e) => handleSelectVariant(e.target.value)}
            className="bg-gray-800 p-2 rounded w-full mt-2 text-sm"
          >
            <option value="">-- Select Variant --</option>
            {variants.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name} ({v.power} hp {v.fuel})
              </option>
            ))}
          </select>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg mb-2 font-medium text-gray-300">
            Available Tyre Sizes
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-200">
            {sizes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
