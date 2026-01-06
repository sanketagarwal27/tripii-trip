import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPersonalBudget, setTripBudget } from "@/api/wallet";
import {
  updatePersonalBudget,
  updateWalletSettings,
} from "@/redux/tripWalletSlice";

export default function SetBudgetModal({ tripId, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [personalBudget, setPersonal] = useState("");
  const [tripBudget, setTrip] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = useSelector(
    (s) => s.wallet.wallets?.[tripId]?.permissions?.isAdmin
  );

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      /* ---------------- PERSONAL BUDGET ---------------- */
      if (personalBudget !== "") {
        const value = Number(personalBudget || 0);

        // ✅ OPTIMISTIC UI UPDATE
        dispatch(
          updatePersonalBudget({
            tripId,
            userId: user._id,
            personalBudget: value,
          })
        );

        // 🔁 SERVER UPDATE
        await setPersonalBudget(tripId, value);
      }

      /* ---------------- TRIP BUDGET (ADMIN ONLY) ---------------- */
      if (isAdmin && tripBudget !== "") {
        // ✅ OPTIMISTIC UI UPDATE
        dispatch(
          updateWalletSettings({
            tripId,
            budget: Number(tripBudget || 0),
          })
        );

        // 🔁 SERVER UPDATE
        await setTripBudget(tripId, Number(tripBudget || 0));
      }

      onClose();
    } catch (err) {
      console.error("Failed to update budget:", err);
      // ❗ Optional: rollback logic if API fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 w-full max-w-sm">
        <h3 className="text-base font-semibold mb-4">Set Budget</h3>

        {/* Personal Budget */}
        <label className="text-xs text-gray-500">Your Budget</label>
        <input
          type="number"
          value={personalBudget}
          onChange={(e) => setPersonal(e.target.value)}
          placeholder="₹0"
          className="w-full mt-1 mb-4 p-2 border rounded text-sm"
        />

        {/* Trip Budget (Admin Only) */}
        {isAdmin && (
          <>
            <label className="text-xs text-gray-500">Trip Budget</label>
            <input
              type="number"
              value={tripBudget}
              onChange={(e) => setTrip(e.target.value)}
              placeholder="₹0"
              className="w-full mt-1 mb-4 p-2 border rounded text-sm"
            />
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-primary font-semibold"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
