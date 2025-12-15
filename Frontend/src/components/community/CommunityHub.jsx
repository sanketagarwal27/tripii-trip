import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import CommunityCard from "@/components/community/CommunityCard";
import CreateCommunityOverlay from "@/components/community/CreateCommunityOverlay";
import { searchCommunities } from "@/api/community";
import { setSelectedCommunity } from "@/redux/communitySlice";

const TAGS = [
  "Adventure",
  "Backpacking",
  "Hiking",
  "Photography",
  "Food",
  "City",
  "State",
  "Friends",
  "Nature",
  "Sports",
  "Games",
  "Culture",
  "Tech",
  "Education",
  "Nightlife",
];

const CommunityHub = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { my, suggested } = useSelector((s) => s.community);

  const [showOverlay, setShowOverlay] = useState(false);

  // SEARCH SYSTEM
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState("name");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // FLEX GRID
  const GRID = "flex flex-wrap gap-5";

  // ENTER + DEBOUNCE SEARCH
  const handleSearchChange = (value) => {
    setSearch(value);
    if (!isSearching) setIsSearching(true);

    if (debounceTimer) clearTimeout(debounceTimer);

    setDebounceTimer(setTimeout(() => performSearch(value), 700));
  };

  // PERFORM BACKEND SEARCH
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const params = searchMode === "name" ? { q: query } : { tag: query };
      const res = await searchCommunities(params);
      setSearchResults(res.data.data.communities || []);
    } catch (e) {
      console.error("Search error:", e);
    }

    setSearchLoading(false);
  };

  // EXIT SEARCH MODE
  const handleBackFromSearch = () => {
    setIsSearching(false);
    setSearch("");
    setSearchResults([]);
  };

  // SORT SUGGESTED COMMUNITIES
  const topSuggested = [...suggested].sort(
    (a, b) => b.memberCount - a.memberCount
  );

  return (
    <div className="communityhub">
      {/* CREATE OVERLAY */}
      <CreateCommunityOverlay
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
      />

      {/* HEADER SECTION */}
      <div className="communityhub-header">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-3xl font-black tracking-tight">Community Hub</h1>

          <div className="communityhub-searchpart">
            <div className="flex items-center bg-card-light dark:bg-card-dark rounded-lg p-1">
              {isSearching && (
                <button
                  onClick={handleBackFromSearch}
                  className="communityhub-backbutton"
                >
                  Back
                </button>
              )}

              <button
                onClick={() => setSearchMode("name")}
                className={`px-3 py-2 text-xs rounded-md ${
                  searchMode === "name" ? "bg-primary text-white" : ""
                }`}
              >
                Name
              </button>

              <button
                onClick={() => setSearchMode("tag")}
                className={`px-3 py-2 text-xs rounded-md ${
                  searchMode === "tag" ? "bg-primary text-white" : ""
                }`}
              >
                Tag
              </button>
            </div>

            {searchMode === "tag" && (
              <select
                className="h-10 rounded-lg bg-card-light dark:bg-card-dark text-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  setSearch(val);
                  setIsSearching(true);
                  performSearch(val);
                }}
              >
                <option value="" style={{ backgroundColor: "grey" }}>
                  Select Tag
                </option>
                {TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}

            <label className="flex min-w-40 h-12 w-full sm:w-auto max-w-64">
              <div
                className="flex items-center px-3 w-full h-full rounded-lg bg-card-light dark:bg-card-dark 
                focus-within:ring-2 focus-within:ring-primary"
              >
                <span className="material-symbols-outlined text-text-light/60 text-base pr-2">
                  search
                </span>

                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={`Search by ${searchMode}...`}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </label>

            <button
              onClick={() => setShowOverlay(true)}
              className="flex items-center gap-2 h-12 px-4 bg-primary rounded-lg text-white text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-base">
                add_circle
              </span>
              Create
            </button>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH MODE UI */}
      {isSearching ? (
        <section>
          <h2 className="text-xl font-semibold mb-2">Search Results</h2>

          {searchLoading ? (
            <p className="opacity-70">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="opacity-70">No communities found.</p>
          ) : (
            <div className={GRID}>
              {searchResults.map((c) => {
                const isMember = my.some((m) => m._id === c._id);

                return (
                  <div key={c._id} className="communitycard">
                    <CommunityCard
                      community={c}
                      isMember={isMember}
                      onClick={() => {
                        dispatch(setSelectedCommunity(c));
                        navigate(`/community/${c._id}`);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* MY COMMUNITIES */}
          <section>
            <h2
              className="text-xl font-bold mb-2"
              style={{ marginBottom: "30px" }}
            >
              My Communities
            </h2>

            {my.length === 0 ? (
              <p className="opacity-70">
                You're not part of any communities yet.
              </p>
            ) : (
              <div className={GRID}>
                {my.map((c) => (
                  <div key={c._id} className="communitycard">
                    <CommunityCard
                      community={c}
                      onClick={() => {
                        dispatch(setSelectedCommunity(c));
                        navigate(`/community/${c._id}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SUGGESTED COMMUNITIES */}
          <section style={{ marginTop: "60px" }}>
            <h2
              className="text-xl font-bold mb-2"
              style={{ marginBottom: "30px" }}
            >
              Suggested Communities
            </h2>

            {topSuggested.length === 0 ? (
              <p className="opacity-70">No suggestions available.</p>
            ) : (
              <div className={GRID}>
                {topSuggested.map((c) => (
                  <div key={c._id} className="communitycard">
                    <CommunityCard
                      community={c}
                      onClick={() => {
                        dispatch(setSelectedCommunity(c));
                        navigate(`/community/${c._id}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default CommunityHub;
