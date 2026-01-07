import { useState, useMemo } from "react";
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

/* =================================================== */

export default function AddExpenseModal({ tripId, onClose }) {
  const dispatch = useDispatch();
  const wallet = useSelector((s) => s.wallet.wallets?.[tripId]);
  const user = useSelector((s) => s.auth.user);

  const participants = wallet?.participants || [];

  /* ---------------- STATE ---------------- */

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [location, setLocation] = useState("");

  const [splitMode, setSplitMode] = useState("equal"); // equal | custom
  const [payers, setPayers] = useState({}); // { userId: amount }
  const [splitters, setSplitters] = useState({}); // { userId: amount }

  /* ---------------- DERIVED ---------------- */

  const selectedSplitterIds = Object.keys(splitters);

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
    selectedSplitterIds.length > 0;

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    if (!canSubmit) return;

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

    const res = await addExpense(tripId, payload);

    onClose();
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
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* DESCRIPTION */}
          <input
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm font-medium"
          />

          {/* AMOUNT */}
          <input
            type="number"
            placeholder="₹ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 rounded-xl border text-md font-semibold text-center"
          />

          {/* CATEGORY */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm"
          >
            <option value="food">🍔 Food</option>
            <option value="travel">🚕 Travel</option>
            <option value="stay">🏨 Stay</option>
            <option value="shopping">🛍 Shopping</option>
            <option value="other">📦 Other</option>
          </select>

          {/* LOCATION */}
          <input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm"
          />

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
                  className="w-28 p-2 border rounded-lg text-sm text-right"
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
                  className="text-primary font-semibold"
                >
                  Select all
                </button>
                <button onClick={clearAllSplitters} className="text-gray-500">
                  Clear
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              {["equal", "custom"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSplitMode(m)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    splitMode === m ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {m}
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
                    />
                    {p.username}
                  </label>

                  {checked && splitMode === "equal" && (
                    <span className="text-xs text-gray-400">
                      ₹{equalPreview}
                    </span>
                  )}

                  {checked && splitMode === "custom" && (
                    <input
                      type="number"
                      placeholder="₹0"
                      className="w-28 p-2 border rounded-lg text-sm text-right"
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
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`flex-1 py-3 rounded-xl font-bold ${
              canSubmit ? "bg-primary" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}
