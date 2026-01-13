import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExpense } from "@/api/wallet";
import { addWalletExpense } from "@/redux/tripWalletSlice";

/* ---------------- UTILS (PAISE SAFE) ---------------- */

const toPaise = (v) => Math.round(Number(v || 0) * 100);
const fromPaise = (v) => (v / 100).toFixed(2);

const splitEqualSafely = (total, userIds) => {
  const totalPaise = toPaise(total);
  const n = userIds.length;
  if (!n) return [];

  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise % n;

  return userIds.map((uid, idx) => ({
    user: uid,
    amount: Number(fromPaise(base + (idx < remainder ? 1 : 0))),
  }));
};

/* ---------------- SUBCATEGORY MAP ---------------- */

const SUBCATEGORY_MAP = {
  food: [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snacks",
    "Street Food",
    "Cafe",
    "Bar",
    "Alcohol",
    "Water",
    "Groceries",
    "Room Service",
  ],
  transport: [
    "Flight",
    "Train",
    "Bus",
    "Metro",
    "Cab / Taxi",
    "Auto Rickshaw",
    "Bike Rental",
    "Car Rental",
    "Fuel",
    "Toll",
    "Parking",
    "Ferry",
    "Local Transport",
    "Porter / Luggage",
  ],
  stay: [
    "Hotel",
    "Hostel",
    "Homestay",
    "Airbnb",
    "Guesthouse",
    "Resort",
    "Camping",
    "Room Upgrade",
    "Extra Bed",
    "Early Check-in",
    "Late Check-out",
    "Security Deposit",
  ],
  activities: [
    "Entry Ticket",
    "Sightseeing",
    "Adventure Activity",
    "Museum",
    "Theme Park",
    "Trekking",
    "Scuba Diving",
    "Skiing",
    "Boating",
    "Cultural Event",
    "Festival Pass",
    "Workshop",
  ],
  shopping: [
    "Souvenirs",
    "Clothes",
    "Gifts",
    "Local Products",
    "Accessories",
    "Duty Free",
    "Snack Packs",
  ],
  miscellaneous: [],
};

/* ---------------- CATEGORY OPTIONS ---------------- */

const CATEGORY_OPTIONS = [
  { value: "food", label: "🍔 Food & Drinks" },
  { value: "transport", label: "🚗 Transport" },
  { value: "stay", label: "🏨 Stay" },
  { value: "activities", label: "🎡 Activities" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "miscellaneous", label: "📦 Miscellaneous" },
];

/* =================================================== */

export default function AddExpenseModal({ tripId, onClose }) {
  const dispatch = useDispatch();
  const wallet = useSelector((s) => s.wallet.wallets?.[tripId]);
  const user = useSelector((s) => s.auth.user);

  const participants = wallet?.participants || [];

  /* ---------------- STATE ---------------- */

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [descriptionMode, setDescriptionMode] = useState("dropdown");
  const [subCategory, setSubCategory] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [location, setLocation] = useState("");

  const [splitMode, setSplitMode] = useState("equal");
  const [payers, setPayers] = useState({});
  const [splitters, setSplitters] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    setSubCategory("");
    if (descriptionMode === "dropdown") {
      setDescriptionMode("dropdown");
    }
  }, [category]);

  /* ---------------- DERIVED ---------------- */

  const selectedSplitterIds = Object.keys(splitters);
  const subCategoryOptions = SUBCATEGORY_MAP[category] || [];

  const description =
    descriptionMode === "dropdown" ? subCategory : manualDescription;

  const equalPreview = useMemo(() => {
    if (!amount || !selectedSplitterIds.length) return "0.00";
    return fromPaise(Math.floor(toPaise(amount) / selectedSplitterIds.length));
  }, [amount, selectedSplitterIds.length]);

  /* ---------------- HELPERS ---------------- */

  const toggleSplitter = (uid) => {
    setSplitters((prev) => {
      const copy = { ...prev };
      if (copy[uid] !== undefined) delete copy[uid];
      else copy[uid] = "";
      return copy;
    });
  };

  const selectAllSplitters = () => {
    const all = {};
    participants.forEach((p) => (all[p._id] = ""));
    setSplitters(all);
  };

  const clearAllSplitters = () => setSplitters({});

  /* ---------------- VALIDATION ---------------- */

  const totalPaidPaise = Object.values(payers).reduce(
    (sum, v) => sum + toPaise(v),
    0
  );

  const totalSplitPaise =
    splitMode === "equal"
      ? toPaise(amount)
      : Object.values(splitters).reduce((sum, v) => sum + toPaise(v), 0);

  const canSubmit =
    description.trim() &&
    amount &&
    totalPaidPaise === toPaise(amount) &&
    totalSplitPaise === toPaise(amount) &&
    selectedSplitterIds.length > 0 &&
    !isSubmitting;

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const paidBy = Object.entries(payers)
        .filter(([, amt]) => toPaise(amt) > 0)
        .map(([uid, amt]) => ({
          user: uid,
          amount: Number(amt),
        }));

      const splitAmong =
        splitMode === "equal"
          ? splitEqualSafely(amount, selectedSplitterIds)
          : Object.entries(splitters)
              .filter(([, amt]) => toPaise(amt) > 0)
              .map(([uid, amt]) => ({
                user: uid,
                amount: Number(amt),
              }));

      const payload = {
        description,
        amount: Number(amount),
        category,
        paidBy,
        splitAmong,
        splitType: splitMode,
      };

      if (location.trim()) {
        payload.location = { name: location };
      }

      if (descriptionMode === "dropdown" && subCategory) {
        payload.subCategory = subCategory;
      }

      const res = await addExpense(tripId, payload);
      onClose();
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center px-4 pt-16">
      <div className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#1c2e2c] rounded-2xl flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">Add Expense</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* CATEGORY - MOVED TO TOP */}
          <div>
            <p className="text-sm font-semibold mb-2">Category</p>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl border text-sm disabled:opacity-50"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* AMOUNT */}
          <div>
            <p className="text-sm font-semibold mb-2">Amount</p>
            <input
              type="number"
              placeholder="₹ 0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl border text-md font-semibold text-center disabled:opacity-50"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <p className="text-sm font-semibold mb-2">What is this for?</p>

            {/* Description Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDescriptionMode("dropdown")}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 ${
                  descriptionMode === "dropdown"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Choose from list
              </button>
              <button
                onClick={() => setDescriptionMode("manual")}
                disabled={isSubmitting}
                className={`px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 ${
                  descriptionMode === "manual"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                Type manually
              </button>
            </div>

            {/* Description Input */}
            {descriptionMode === "dropdown" ? (
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 rounded-xl border text-sm disabled:opacity-50"
              >
                <option value="">Select a specific type...</option>
                {subCategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter description..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 rounded-xl border text-sm font-medium disabled:opacity-50"
              />
            )}
          </div>

          {/* LOCATION */}
          <div>
            <p className="text-sm font-semibold mb-2">Location (optional)</p>
            <input
              placeholder="Where did this expense occur?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl border text-sm disabled:opacity-50"
            />
          </div>

          {/* PAID BY */}
          <div>
            <p className="text-sm font-semibold mb-2">Paid by</p>
            {participants.map((p) => (
              <div
                key={`payer-${p._id}`}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-sm">{p.username}</span>
                <input
                  type="number"
                  placeholder="₹0"
                  disabled={isSubmitting}
                  className="w-28 p-2 border rounded-lg text-sm text-right disabled:opacity-50"
                  onChange={(e) =>
                    setPayers({ ...payers, [p._id]: e.target.value })
                  }
                />
              </div>
            ))}
            <p className="text-xs mt-1">
              Paid total: ₹{fromPaise(totalPaidPaise)}
            </p>
          </div>

          {/* SPLIT */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">Split among</p>
              <div className="flex gap-3 text-xs">
                <button
                  onClick={selectAllSplitters}
                  disabled={isSubmitting}
                  className="text-primary font-semibold disabled:opacity-50"
                >
                  Select all
                </button>
                <button
                  onClick={clearAllSplitters}
                  disabled={isSubmitting}
                  className="text-gray-500 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              {["equal", "custom"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSplitMode(m)}
                  disabled={isSubmitting}
                  className={`px-3 py-1 rounded-full text-xs disabled:opacity-50 ${
                    splitMode === m
                      ? "bg-primary text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {m === "equal" ? "Equal Split" : "Custom Split"}
                </button>
              ))}
            </div>

            {participants.map((p) => {
              const checked = splitters[p._id] !== undefined;

              return (
                <div
                  key={`split-${p._id}`}
                  className="flex justify-between items-center mb-2"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSplitter(p._id)}
                      disabled={isSubmitting}
                      className="rounded disabled:opacity-50"
                    />
                    {p.username}
                  </label>

                  {checked && splitMode === "equal" && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      ₹{equalPreview}
                    </span>
                  )}

                  {checked && splitMode === "custom" && (
                    <input
                      type="number"
                      placeholder="₹0"
                      disabled={isSubmitting}
                      className="w-28 p-2 border rounded-lg text-sm text-right disabled:opacity-50"
                      onChange={(e) =>
                        setSplitters({
                          ...splitters,
                          [p._id]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              );
            })}

            <p className="text-xs mt-1">
              Split total: ₹{fromPaise(totalSplitPaise)}
            </p>
            <p
              className={`text-xs mt-1 ${
                totalPaidPaise === totalSplitPaise
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Balance: ₹{fromPaise(Math.abs(totalPaidPaise - totalSplitPaise))}
              {totalPaidPaise > totalSplitPaise
                ? " overpaid"
                : totalPaidPaise < totalSplitPaise
                ? " underpaid"
                : " ✓ balanced"}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`flex-1 py-3 rounded-xl font-bold ${
              canSubmit
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
