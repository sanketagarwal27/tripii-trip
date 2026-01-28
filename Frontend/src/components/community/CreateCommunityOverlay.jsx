import { useState } from "react";
import { createCommunity } from "@/api/community";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setMyCommunities } from "@/redux/communitySlice";

const TAG_OPTIONS = [
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

const CreateCommunityOverlay = ({ isOpen, onClose }) => {
  const { my } = useSelector((state) => state.community);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("private_group");
  const [tags, setTags] = useState([]);
  const [rules, setRules] = useState([{ title: "", description: "" }]);

  const [cover, setCover] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    setCover(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const addRule = () => {
    if (rules.length < 20) {
      setRules([...rules, { title: "", description: "" }]);
    } else {
      toast.error("Maximum 20 rules allowed");
    }
  };

  const removeRule = (index) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Community name is required.");

    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("type", type);
    form.append("tags", JSON.stringify(tags));

    // Filter out empty rules and add to form data
    const validRules = rules.filter((rule) => rule.title.trim());
    form.append("rules", JSON.stringify(validRules));

    if (cover) form.append("coverImage", cover);

    setLoading(true);
    try {
      const res = await createCommunity(form);
      toast.success("Community created!");
      console.log("responses:", res);
      dispatch(setMyCommunities([res?.data.data, ...my]));
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* DIM BACKGROUND */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* MODAL OUTER WRAPPER (fixed, centered) */}
      <div
        className="fixed inset-0 z-50 flex justify-center items-start pt-10 px-4 createcommunity"
        style={{ marginTop: "80px" }}
      >
        {/* WHITE MODAL — shorter height, scrollable inside */}
        <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
          {/* INNER SCROLLABLE AREA */}
          <div className="max-h-[75vh] overflow-y-auto p-4 space-y-4">
            {/* HEADER */}
            <div className="flex justify-between items-center pb-1">
              <h2 className="text-lg font-bold">Create Community</h2>
              <button
                className="material-symbols-outlined text-lg"
                onClick={onClose}
              >
                close
              </button>
            </div>

            {/* NAME */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Community Name *</label>
              <input
                className="w-full p-2.5 rounded-lg text-sm border bg-white dark:bg-background-dark"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekend Hikers Club"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Short Description</label>
              <textarea
                rows={2}
                className="w-full p-2.5 text-sm rounded-lg resize-none border bg-white dark:bg-background-dark"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* RULES SECTION */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Community Rules</label>

              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="space-y-2 p-3 rounded-lg border border-border-light dark:border-border-dark"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">
                      Rule {index + 1}
                    </span>
                    {rules.length > 1 && (
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    className="w-full p-2 rounded-lg text-sm border bg-white dark:bg-background-dark"
                    value={rule.title}
                    onChange={(e) =>
                      handleRuleChange(index, "title", e.target.value)
                    }
                    placeholder="Rule title (e.g., Be respectful)"
                  />

                  <textarea
                    rows={2}
                    className="w-full p-2 text-sm rounded-lg resize-none border bg-white dark:bg-background-dark"
                    value={rule.description}
                    onChange={(e) =>
                      handleRuleChange(index, "description", e.target.value)
                    }
                    placeholder="Rule description (optional)"
                  />
                </div>
              ))}

              {rules.length < 20 && (
                <button
                  onClick={addRule}
                  className="w-full py-2 px-3 rounded-lg text-sm border border-dashed border-primary text-primary hover:bg-primary/5 transition flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Add Rule
                </button>
              )}
            </div>

            {/* TAGS */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Tags</label>

              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs border transition
                      ${
                        tags.includes(tag)
                          ? "bg-primary text-white border-primary"
                          : "bg-white dark:bg-background-dark"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* TYPE */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Community Type</label>

              {[
                {
                  value: "private_group",
                  label: "Private Group",
                  desc: "Only invited users can join.",
                },
                {
                  value: "public_group",
                  label: "Public Community",
                  desc: "Visible to everyone. Anyone can request to join.",
                },
                {
                  value: "regional_hub",
                  label: "Regional Hub",
                  desc: "For people from the same region.",
                },
                {
                  value: "global_hub",
                  label: "Global Hub",
                  desc: "Open to all countries and cultures.",
                },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition
                    ${
                      type === t.value
                        ? "border-primary bg-primary/10"
                        : "border-border-light dark:border-border-dark"
                    }`}
                >
                  <input
                    type="radio"
                    name="ctype"
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                  />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs opacity-70">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* COVER IMAGE */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
              />

              {preview && (
                <img
                  src={preview}
                  className="w-full h-32 object-cover rounded-lg mt-2"
                />
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-10 bg-primary text-white rounded-lg text-sm font-semibold"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCommunityOverlay;
