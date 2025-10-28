import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function CarManager({ darkMode }) {
  const { token } = useAuth();
  const [cars, setCars] = useState([]);
  const [newCar, setNewCar] = useState({ make: "", model: "", year: "" });

  // ✅ Use environment variable for API base
  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/admin/cars`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCars)
      .catch(() => console.error("Failed to fetch cars"));
  }, [token, API_BASE]);

  const handleAdd = async () => {
    try {
      await fetch(`${API_BASE}/admin/cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCar),
      });
      setNewCar({ make: "", model: "", year: "" });
      window.location.reload();
    } catch (err) {
      console.error("Failed to add car", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/admin/cars/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(cars.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Failed to delete car", err);
    }
  };

  return (
    <div>
      <h3
        className={`text-2xl font-bold mb-4 ${
          darkMode ? "text-orange-400" : "text-orange-600"
        }`}
      >
        🚗 Manage Cars
      </h3>

      {/* Add New Car */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(newCar).map((key) => (
          <Input
            key={key}
            placeholder={key}
            value={newCar[key]}
            onChange={(e) => setNewCar({ ...newCar, [key]: e.target.value })}
            className="w-40"
          />
        ))}
        <Button
          onClick={handleAdd}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Add Car
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-orange-500">
        <table className="w-full border-collapse">
          <thead className={darkMode ? "bg-orange-800" : "bg-orange-200"}>
            <tr>
              <th className="p-3 text-left">Make</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Year</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr
                key={car._id}
                className="border-b border-gray-700 hover:bg-orange-900/20"
              >
                <td className="p-3">{car.make}</td>
                <td className="p-3">{car.model}</td>
                <td className="p-3">{car.year}</td>
                <td className="p-3 text-center">
                  <Button
                    onClick={() => handleDelete(car._id)}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
