"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Bundle = {
  id: string;
  title: string;
  description: string | null;
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  eventId: string;
  photos: Array<{
    id: string;
    photoId: string;
    photo: {
      id: string;
      name: string;
      price: number;
    };
  }>;
  createdAt: string;
};

export default function AdminPackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bundlePrice: 0,
    photoIds: [] as string[],
  });

  useEffect(() => {
    if (!eventId) return;
    fetchBundles();
  }, [eventId]);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages?eventId=${eventId}`);
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.bundlePrice || !formData.photoIds.length) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ...formData,
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      setFormData({
        title: "",
        description: "",
        bundlePrice: 0,
        photoIds: [],
      });

      fetchBundles();
    } catch (err) {
      console.error("Create error:", err);
      alert("Failed to create bundle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;

    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchBundles();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete bundle");
    }
  };

  if (!eventId) {
    return <div className="p-8">Select event first</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Manage Bundles</h1>

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <h2 className="text-xl font-bold mb-4">New Bundle</h2>

        <input
          type="text"
          placeholder="Bundle title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <input
          type="number"
          placeholder="Bundle price"
          step="0.01"
          value={formData.bundlePrice}
          onChange={(e) =>
            setFormData({
              ...formData,
              bundlePrice: parseFloat(e.target.value),
            })
          }
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <input
          type="text"
          placeholder="Photo IDs (comma-separated)"
          onChange={(e) =>
            setFormData({
              ...formData,
              photoIds: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-[#09419b] text-white px-4 py-2 rounded font-semibold hover:bg-opacity-90"
        >
          Create Bundle
        </button>
      </form>

      {/* Bundles List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Existing Bundles</h2>
        {loading ? (
          <p>Loading...</p>
        ) : bundles.length === 0 ? (
          <p className="text-gray-600">No bundles yet</p>
        ) : (
          bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-bold">{bundle.title}</h3>
              <p className="text-gray-600 mb-2">{bundle.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-semibold">Original:</span> €
                  {bundle.originalPrice.toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold">Bundle:</span> €
                  {bundle.bundlePrice.toFixed(2)}
                </div>
                <div className="text-[#ff2f92]">
                  <span className="font-semibold">Saves:</span> €
                  {bundle.discount.toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold">Photos:</span>{" "}
                  {bundle.photos.length}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(bundle.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
