import { deleteTripPhoto, likeTripPhoto, unlikeTripPhoto } from "@/api/trip";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMyLocalGallery,
  getGlobalTripGallery,
  pushPhotosToGlobal,
  uploadTripPhotosXHR,
} from "@/api/trip";
import {
  addTripPhotos,
  removeTripPhoto,
  updateTripPhoto,
  updateTripPhotoVisibility,
} from "@/redux/tripSlice";
import { usePhotoDownload } from "@/hooks/usePhotoDownload";
import {
  finishUpload,
  setMessage,
  setProgress,
  startUpload,
} from "@/redux/uploadSlice";
import { Download, Trash2 } from "lucide-react";

export default function TripGallery({ tripId }) {
  const dispatch = useDispatch();
  const { downloadPhoto } = usePhotoDownload();
  const myUserId = useSelector((s) => s.auth.userProfile?._id);

  const [activeTab, setActiveTab] = useState("local");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [location, setLocation] = useState("");
  const [previews, setPreviews] = useState([]);
  const [viewerPhoto, setViewerPhoto] = useState(null);

  const allPhotos = useSelector((s) => s.trip.tripPhotos[tripId]);

  const activeTrip = useSelector((s) =>
    tripId ? s.trip.trips.byId[tripId] : null
  );

  const tripOwnerId = activeTrip?.createdBy?._id;

  const photos = useMemo(() => {
    if (!Array.isArray(allPhotos)) return [];
    return allPhotos.filter((p) => p.visibility === activeTab);
  }, [allPhotos, activeTab, allPhotos?.length]);

  console.log("All Photos:", allPhotos);
  console.log("Photos:", photos);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!tripId) return;
    if (Array.isArray(allPhotos)) return;

    let isMounted = true;

    const fetchInitialGallery = async () => {
      try {
        setLoading(true);

        const [localRes, globalRes] = await Promise.all([
          getMyLocalGallery(tripId),
          getGlobalTripGallery(tripId),
        ]);

        console.log("LocalRes:", localRes);

        if (!isMounted) return;

        dispatch(
          addTripPhotos({
            tripId,
            photos: [
              ...localRes.data.data.photos,
              ...globalRes.data.data.photos,
            ],
            replace: true,
          })
        );
      } catch (e) {
        console.error("Gallery fetch failed", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialGallery();

    return () => {
      isMounted = false;
    };
  }, [tripId, allPhotos]);

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!stagedFiles.length) return;
    if (!location.trim()) {
      alert("Please enter a location");
      return;
    }

    const formData = new FormData();
    stagedFiles.forEach((f) => formData.append("photos", f));
    formData.append("location[name]", location.trim());

    setShowUploadForm(false);
    dispatch(startUpload({ totalFiles: stagedFiles.length }));

    try {
      const res = await uploadTripPhotosXHR(tripId, formData, (percent) => {
        const clamped = Math.min(percent, 95);
        dispatch(setProgress(clamped));

        if (percent >= 95) {
          dispatch(setMessage("Processing photos…"));
        }
      });

      dispatch(
        addTripPhotos({
          tripId,
          photos: res?.photos || res?.data?.photos || res?.data?.data?.photos,
        })
      );

      dispatch(finishUpload());

      setStagedFiles([]);
      setPreviews([]);
      setLocation("");
      setActiveTab("local");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
      dispatch(finishUpload());
    }
  };

  const toggleLike = async (photo, e) => {
    e.stopPropagation();

    const nextLiked = !photo.isLikedByMe;
    const nextCount = nextLiked
      ? (photo.likesCount || 0) + 1
      : Math.max((photo.likesCount || 1) - 1, 0);

    // 🔥 Optimistic update (correct field)
    dispatch(
      updateTripPhoto({
        tripId,
        photoId: photo._id,
        updates: {
          isLikedByMe: nextLiked,
          likesCount: nextCount,
        },
      })
    );

    try {
      nextLiked
        ? await likeTripPhoto(photo._id)
        : await unlikeTripPhoto(photo._id);
    } catch (err) {
      // ❌ rollback on failure
      dispatch(
        updateTripPhoto({
          tripId,
          photoId: photo._id,
          updates: {
            isLikedByMe: photo.isLikedByMe,
            likesCount: photo.likesCount,
          },
        })
      );
    }
  };

  /* ---------------- PUSH TO GLOBAL ---------------- */
  const handlePush = async () => {
    if (!selected.length) return;

    try {
      await pushPhotosToGlobal(tripId, {
        photoIds: selected,
      });
      selected.forEach((photoId) => {
        dispatch(
          updateTripPhotoVisibility({
            tripId,
            photoId,
            visibility: "global",
          })
        );
      });

      setSelected([]);
      setActiveTab("global");
    } catch (error) {
      console.error("Push to global failed:", error);
      alert("Failed to push photos. Please try again.");
    }
  };

  /* ---------------- FILE SELECTION ---------------- */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const previewData = files.map((file) => ({
      file,
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }));

    setStagedFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...previewData]);
    setShowUploadForm(true);

    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  //For deleting a photo

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation();

    const ok = window.confirm("Delete this photo permanently?");
    if (!ok) return;

    // Optimistic update
    dispatch(removeTripPhoto({ tripId, photoId }));

    try {
      await deleteTripPhoto(photoId);
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed.");
      // window.location.reload();
    }
  };

  if (!activeTrip) {
    return <div className="text-center py-12 text-gray-500">Loading trip…</div>;
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trip Gallery</h1>

        <label className="cursor-pointer bg-teal-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-600 transition">
          Add Photos
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6">
        {["local", "global"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-3 font-semibold transition ${
              activeTab === t
                ? "border-b-2 border-teal-500 text-teal-600"
                : "text-gray-500 hover:text-teal-500"
            }`}
          >
            {t === "local" ? "Private" : "Public"}
          </button>
        ))}
      </div>

      {/* Actions */}
      {activeTab === "local" && selected.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handlePush}
            className="bg-teal-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-teal-600 transition"
          >
            Push {selected.length} to Public
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading gallery...
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No photos yet</p>
          <p className="text-sm">
            {activeTab === "local"
              ? "Upload some photos to get started"
              : "No photos have been shared to the global gallery yet"}
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {!loading && photos.length > 0 && (
        <div
          key={`${activeTab}-${photos.length}`}
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 transition-opacity duration-300 ease-in-out opacity-100"
        >
          {photos.map((photo) => {
            const isMyPhoto = photo.uploadedBy?._id === myUserId;
            const isTripOwner = tripOwnerId === myUserId;
            const canDelete =
              photo.visibility === "local"
                ? isMyPhoto
                : isMyPhoto || isTripOwner;

            return (
              <div
                key={photo._id}
                className={`
        break-inside-avoid mb-4 bg-white rounded-lg overflow-hidden
        shadow-sm transition group
        ${
          activeTab === "global" && isMyPhoto
            ? "ring-3 ring-teal-400 shadow-md"
            : "hover:shadow-md"
        }
      `}
              >
                <div className="relative">
                  {activeTab === "local" && selected.includes(photo._id) && (
                    <div className="absolute top-2 left-2 z-10 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                      ✓ Selected
                    </div>
                  )}

                  {activeTab === "global" && isMyPhoto && (
                    <div className="absolute top-2 left-2 z-10 bg-teal-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow">
                      YOU
                    </div>
                  )}
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setViewerPhoto(photo)}
                  >
                    <img
                      src={photo.image?.url}
                      alt={photo.location?.name || "Trip photo"}
                      className="w-full object-cover min-h-[200px] md:min-h-[300px]"
                      loading="lazy"
                    />
                  </div>
                  {/* Hover Actions */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {/* dark layer (visual only) */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* buttons (interactive) */}
                    <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
                      {activeTab === "local" && (
                        <label
                          className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded cursor-pointer shadow"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(photo._id)}
                            className="accent-teal-500 w-4 h-4"
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelected((prev) =>
                                e.target.checked
                                  ? [...prev, photo._id]
                                  : prev.filter((id) => id !== photo._id)
                              );
                            }}
                          />
                          <span className="text-sm">Select</span>
                        </label>
                      )}

                      {photo.allowDownload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPhoto(photo._id);
                          }}
                          className="bg-white/90 hover:bg-white px-3 py-1.5 rounded shadow"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Like bar */}
                  {activeTab === "global" && (
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between pointer-events-none">
                      <div className="text-xs text-white bg-black/50 px-2 py-1 rounded-md">
                        @{photo.uploadedBy?.username}
                      </div>

                      <button
                        onClick={(e) => toggleLike(photo, e)}
                        className="pointer-events-auto flex items-center gap-1 bg-black/50 px-2 py-1 rounded-md"
                      >
                        <span>{photo.isLikedByMe ? "❤️" : "🤍"}</span>
                        <span className="text-xs text-white">
                          {photo.likesCount || 0}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {photo.location?.name && (
                  <div className="p-3">
                    <p className="text-sm text-gray-600 font-medium">
                      📍 {photo.location.name}
                    </p>
                  </div>
                )}

                {canDelete && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo._id, e)}
                    className="bg-white/90 hover:bg-red-50 px-3 py-1.5 rounded shadow text-red-600"
                    title="Delete photo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Upload Photos</h2>
            <>
              <div className="overflow-y-auto max-h-[45vh] pr-1 mb-4">
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={p.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPreviews((prev) =>
                            prev.filter((x) => x.id !== p.id)
                          );
                          setStagedFiles((prev) =>
                            prev.filter((f) => f !== p.file)
                          );
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add more */}
                  <label className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer text-gray-400 hover:border-teal-500 hover:text-teal-500 transition">
                    +
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Shibuya Crossing, Tokyo"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </>

            <p className="text-sm text-gray-500 mb-6">
              {stagedFiles.length} photo{stagedFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setStagedFiles([]);
                  setPreviews([]);
                  setLocation("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpload}
                disabled={!location.trim() || !previews.length}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Viewer */}
      {viewerPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewerPhoto(null)}
        >
          <img
            src={viewerPhoto.image?.url}
            alt="Full view"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 transition"
            onClick={() => setViewerPhoto(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
