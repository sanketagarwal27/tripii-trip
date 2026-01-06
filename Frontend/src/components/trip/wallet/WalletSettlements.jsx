// src/components/trip/wallet/WalletSettlements.jsx
import { useMemo } from "react";
import { useSelector } from "react-redux";

/* ---------------- HELPERS ---------------- */

const formatMoney = (v) => `₹${Number(v).toFixed(2)}`;

/* ---------------- CORE LOGIC ---------------- */

function computeGlobalSettlements(expenses = []) {
  const balance = {};

  // 1️⃣ Build net balance per user
  expenses.forEach((expense) => {
    expense.paidBy?.forEach((p) => {
      balance[p.user] = (balance[p.user] || 0) + p.amount;
    });

    expense.splitAmong?.forEach((s) => {
      balance[s.user] = (balance[s.user] || 0) - s.amount;
    });
  });

  // 2️⃣ Separate creditors & debtors
  const creditors = [];
  const debtors = [];

  Object.entries(balance).forEach(([user, amt]) => {
    if (amt > 0) creditors.push({ user, amt });
    if (amt < 0) debtors.push({ user, amt: -amt });
  });

  // 3️⃣ Resolve settlements
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
}

/* ---------------- COMPONENT ---------------- */

export default function WalletSettlements({
  expenses = [],
  participants = [],
}) {
  const user = useSelector((s) => s.auth.user);

  const settlements = useMemo(
    () => computeGlobalSettlements(expenses),
    [expenses]
  );

  const nameOf = (id) =>
    participants.find((p) => p._id === id)?.username || "User";

  if (settlements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-base font-semibold mb-2">Who Owes Who</h3>
        <p className="text-xs text-gray-500">All settled 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-base font-semibold mb-3">Who Owes Who</h3>

      <div className="space-y-2">
        {settlements.map((s, i) => {
          const fromMe = s.from === user._id;
          const toMe = s.to === user._id;

          return (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {s.from === user._id ? "You" : nameOf(s.from)} owes{" "}
                {s.to === user._id ? "You" : nameOf(s.to)}
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
    </div>
  );
}
