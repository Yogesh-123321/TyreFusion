import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function CarManager({ darkMode }) {
  const { token } = useAuth();
  const [cars, setCars] = useState([]);
  const [newCar, setNewCar] = useState({ make: "", model: "", year: "" });

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/cars", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCars)
      .catch(() => console.error("Failed to fetch cars"));
  }, [token]);

  const handleAdd = async () => {
    await fetch("http://localhost:5000/api/admin/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newCar),
    });
    window.location.reload();
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/admin/cars/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCars(cars.filter((c) => c._id !== id));
  };

  return (
    <div>
      <h3 className={`text-2xl font-bold mb-4 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>🚗 Manage Cars</h3>

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
        <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700 text-white">Add Car</Button>
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
              <tr key={car._id} className="border-b border-gray-700 hover:bg-orange-900/20">
                <td className="p-3">{car.make}</td>
                <td className="p-3">{car.model}</td>
                <td className="p-3">{car.year}</td>
                <td className="p-3 text-center">
                  <Button onClick={() => handleDelete(car._id)} variant="destructive">Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
