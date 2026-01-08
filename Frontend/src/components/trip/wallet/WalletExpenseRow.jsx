// src/components/trip/wallet/WalletExpenseRow.jsx
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

/* ---------------- CATEGORY ICON MAP ---------------- */

/* ---------------- CATEGORY ICON MAP ---------------- */

const CATEGORY_ICON = {
  transport: "directions_bus", // flights, cab, train, fuel
  stay: "hotel", // hotel, hostel, homestay
  food: "restaurant", // food & drinks
  activities: "local_activity", // tickets, adventures
  local_services: "support_agent", // guides, drivers, locals
  shopping: "shopping_bag", // shopping & souvenirs
  fees_and_taxes: "receipt_long", // platform fee, tax
  health_and_safety: "medical_services", // medical, insurance
  connectivity_and_utilities: "wifi", // sim, data, laundry
  tips_and_donations: "volunteer_activism", // tips, donations
  penalties_and_losses: "gavel", // fines, cancellations
  wallet_and_transfers: "account_balance_wallet", // settlements
  miscellaneous: "payments", // controlled fallback
};

/* ---------------- HELPERS ---------------- */

const formatMoney = (v) => `₹${Number(v).toFixed(2)}`;

/* ---------------- SETTLEMENT LOGIC ---------------- */

const calculateSettlements = (expense) => {
  const balance = {};

  expense.paidBy.forEach((p) => {
    balance[p.user] = (balance[p.user] || 0) + p.amount;
  });

  expense.splitAmong.forEach((s) => {
    balance[s.user] = (balance[s.user] || 0) - s.amount;
  });

  const creditors = [];
  const debtors = [];

  Object.entries(balance).forEach(([user, amt]) => {
    if (amt > 0) creditors.push({ user, amt });
    if (amt < 0) debtors.push({ user, amt: -amt });
  });

  const settlements = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);

    settlements.push({
      from: debtors[i].user,
      to: creditors[j].user,
      amount: pay,
    });

    debtors[i].amt -= pay;
    creditors[j].amt -= pay;

    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }

  return settlements;
};

export default function WalletExpenseRow({ expense, participants = [] }) {
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);

  if (!expense) return null;

  const nameOf = (id) =>
    participants.find((p) => p._id === id)?.username || "Someone";

  /* -------- WHO PAID -------- */

  const paidByText = expense.paidBy
    .map((p) => `${nameOf(p.user)} (${formatMoney(p.amount)})`)
    .join(", ");

  /* -------- MY NET POSITION -------- */

  const myNet = useMemo(() => {
    let paid = 0;
    let owed = 0;

    expense.paidBy.forEach((p) => {
      if (p.user === user._id) paid += p.amount;
    });

    expense.splitAmong.forEach((s) => {
      if (s.user === user._id) owed += s.amount;
    });

    return paid - owed;
  }, [expense, user._id]);

  const icon = CATEGORY_ICON[expense.category] || CATEGORY_ICON.miscellaneous;

  const settlements = useMemo(() => calculateSettlements(expense), [expense]);

  const splitAmongNames = expense.splitAmong
    .map((s) => nameOf(s.user))
    .join(", ");

  return (
    <>
      {/* ================= MAIN ROW ================= */}
      <div
        className="flex justify-between items-center py-4 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {/* LEFT */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-full">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
              {icon}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#111717] dark:text-white">
              {expense.description || "Expense"}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Paid by {paidByText}
            </p>

            {expense.location?.name && (
              <p className="text-xs text-gray-400">
                📍 {expense.location.name}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm font-bold text-[#111717] dark:text-white">
              {formatMoney(expense.amount)}
            </p>

            {myNet < 0 && (
              <p className="text-xs font-semibold text-red-500">
                You owe {formatMoney(Math.abs(myNet))}
              </p>
            )}

            {myNet > 0 && (
              <p className="text-xs font-semibold text-green-500">
                You’re owed {formatMoney(myNet)}
              </p>
            )}
          </div>

          <span className="material-symbols-outlined text-gray-400">
            {open ? "expand_less" : "expand_more"}
          </span>
        </div>
      </div>

      {/* ================= EXPANDED DETAILS ================= */}
      {open && (
        <div className="ml-14 mb-4 border-l pl-4 space-y-3 text-sm">
          {/* SPLIT AMONG */}
          <p className="text-gray-500 dark:text-gray-400">
            Split among: {splitAmongNames}
          </p>

          {/* WHO OWES WHOM */}
          {settlements.map((s, i) => {
            const fromMe = s.from === user._id;
            const toMe = s.to === user._id;

            return (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">
                  {nameOf(s.from)} owes {nameOf(s.to)}
                </span>

                <span
                  className={`font-semibold ${
                    fromMe
                      ? "text-red-500"
                      : toMe
                      ? "text-green-500"
                      : "text-primary"
                  }`}
                >
                  {formatMoney(s.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
