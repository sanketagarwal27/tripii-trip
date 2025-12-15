import React, { useEffect, useState } from "react";
import axios from "axios";

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

export default function GifPickerOverlay({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  /* -------------------------------
     FETCH GIFS (TRENDING / SEARCH)
  -------------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    const fetchGifs = async () => {
      try {
        setLoading(true);

        const endpoint = query.trim()
          ? "https://api.giphy.com/v1/gifs/search"
          : "https://api.giphy.com/v1/gifs/trending";

        const res = await axios.get(endpoint, {
          signal: controller.signal,
          params: {
            api_key: GIPHY_API_KEY,
            q: query || undefined, // 🔥 important
            limit: 24,
            rating: "pg",
          },
        });

        setGifs(res.data.data || []);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("GIF fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchGifs, 300); // debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-surface-dark w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-4">
        {/* HEADER */}
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {["Happy", "Sad", "Love", "Angry", "Party", "Holy"].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs"
            className="flex-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-border-light rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="col-span-3 text-center text-sm text-text-muted-light">
              Loading GIFs…
            </div>
          )}

          {!loading && gifs.length === 0 && (
            <div className="col-span-3 text-center text-sm text-text-muted-light">
              No GIFs found
            </div>
          )}

          {gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onSelect(gif.images.fixed_height.url)}
              className="overflow-hidden rounded-lg hover:scale-[1.02] transition"
            >
              <img
                src={gif.images.fixed_height.url}
                alt={gif.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
