import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trash2, X, Plus, Link2, MapPin, Tag } from "lucide-react";

import { addTripPlace as addTripPlaceApi, deleteTripPlace } from "@/api/trip";
import { addTripPlace, removeTripPlace } from "@/redux/tripSlice";

const EMPTY_ARRAY = [];

export default function TripPlaces({ tripId, publicPlaces }) {
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const trip = useSelector((s) => s.trip.trips.byId[tripId]);
  const reduxPlaces =
    useSelector((s) => s.trip.tripPlaces[tripId]) ?? EMPTY_ARRAY;

  const tripPlaces = publicPlaces ?? reduxPlaces;

  const tripRoles = useSelector((s) => s.trip.tripRoles[tripId]) ?? EMPTY_ARRAY;
  const [previewImage, setPreviewImage] = useState(null);

  /* ---------------- PERMISSIONS ---------------- */
  const isCaptain = trip?.createdBy?._id === user?._id;
  const isPlanner = tripRoles.some(
    (r) => r.roleName === "Planner" && r.assignedTo === user?._id
  );
  const canManage = isCaptain || isPlanner;

  /* ---------------- MODAL STATE ---------------- */
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "other",
    locationName: "",
    links: [],
    image: null,
    preview: null,
  });

  /* ---------------- IMAGE ---------------- */
  const handleImageChange = (file) => {
    if (!file) return;
    setForm((f) => ({
      ...f,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  /* ---------------- LINKS ---------------- */
  const addLink = () => {
    setForm((f) => ({
      ...f,
      links: [...f.links, { label: "", url: "" }],
    }));
  };

  const updateLink = (i, key, value) => {
    const links = [...form.links];
    links[i][key] = value;
    setForm((f) => ({ ...f, links }));
  };

  const removeLink = (i) => {
    const links = form.links.filter((_, idx) => idx !== i);
    setForm((f) => ({ ...f, links }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category", form.category);

    if (form.locationName) {
      fd.append("location", JSON.stringify({ name: form.locationName }));
    }

    if (form.links.length > 0) {
      fd.append(
        "links",
        JSON.stringify(form.links.filter((l) => l.label && l.url))
      );
    }

    if (form.image) fd.append("image", form.image);

    try {
      setLoading(true);
      const res = await addTripPlaceApi(tripId, fd);
      dispatch(addTripPlace(res.data.data));
      setOpen(false);
      setForm({
        name: "",
        category: "other",
        locationName: "",
        links: [],
        image: null,
        preview: null,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (placeId) => {
    if (!confirm("Delete this place?")) return;
    await deleteTripPlace(tripId, placeId);
    dispatch(removeTripPlace({ tripId, placeId }));
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Famous Places</h3>

        {canManage && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 bg-primary px-3 py-1.5 rounded-md text-xs font-semibold"
          >
            <Plus size={14} /> Add Place
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {tripPlaces.length === 0 && (
        <div className="text-sm text-gray-400 border border-dashed rounded-xl p-6 text-center">
          No places added yet. Start by adding famous spots for this trip.
        </div>
      )}

      {/* PLACES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripPlaces.map((place) => (
          <div
            key={place._id}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
          >
            {/* IMAGE (compact, adaptive) */}
            {place.image?.url && (
              <div
                className="w-full max-h-40 overflow-hidden cursor-pointer"
                onClick={() => setPreviewImage(place.image.url)}
              >
                <img
                  src={place.image.url}
                  alt={place.name}
                  className="w-full h-full object-cover hover:scale-[1.02] transition"
                />
              </div>
            )}

            {/* CONTENT */}
            <div className="p-4 flex flex-col gap-2 text-xs flex-1">
              {/* TITLE ROW */}
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold leading-tight">
                  {place.name}
                </h4>

                {canManage && (
                  <button
                    onClick={() => handleDelete(place._id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* META ROW */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                {place.location?.name && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{place.location.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 capitalize">
                  <Tag size={12} />
                  <span>{place.category}</span>
                </div>
              </div>

              {/* LINKS */}
              {place.links?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {place.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] transition"
                    >
                      <Link2 size={12} />
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Add Place</h4>
              <button onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {/* IMAGE */}
            <label className="block cursor-pointer">
              <div className="border border-dashed rounded-lg h-40 flex items-center justify-center bg-gray-50 overflow-hidden">
                {form.preview ? (
                  <img
                    src={form.preview}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    Upload cover image
                  </span>
                )}
              </div>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
              />
            </label>

            {/* INPUTS */}
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Place name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {[
                "monument",
                "temple",
                "market",
                "nature",
                "museum",
                "food",
                "other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Location name (optional)"
              value={form.locationName}
              onChange={(e) =>
                setForm((f) => ({ ...f, locationName: e.target.value }))
              }
            />

            {/* LINKS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium">Links</p>
                <button onClick={addLink} className="text-xs text-primary">
                  + Add link
                </button>
              </div>

              {form.links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 border rounded-md px-2 py-1 text-xs"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                  />
                  <input
                    className="flex-1 border rounded-md px-2 py-1 text-xs"
                    placeholder="URL"
                    value={l.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                  />
                  <button
                    onClick={() => removeLink(i)}
                    className="text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary w-full py-2 rounded-md text-sm font-semibold"
            >
              {loading ? "Adding..." : "Add Place"}
            </button>
          </div>
        </div>
      )}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-lg animate-fadeIn"
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
}
