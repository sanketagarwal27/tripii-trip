import { useState } from "react";
import { useSelector } from "react-redux";
import AddExpenseModal from "./AddExpenseModal";

export default function AddExpenseButton({ tripId }) {
  const [open, setOpen] = useState(false);

  const canAddExpense = useSelector(
    (s) => s.wallet.wallets?.[tripId]?.permissions?.canAddExpense
  );

  if (!canAddExpense) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-primary px-4 py-2 rounded-md text-sm font-semibold"
      >
        + Add Expense
      </button>

      {open && (
        <AddExpenseModal tripId={tripId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
