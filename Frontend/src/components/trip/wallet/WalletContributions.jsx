// src/components/trip/wallet/WalletContributions.jsx
import { useMemo } from "react";

const formatMoney = (v) => `₹${Number(v).toFixed(0)}`;

export default function WalletContributions({
  expenses = [],
  participants = [],
  totalSpend = 0,
}) {
  /* ---------------- BUILD USER MAP ---------------- */

  const contributionMap = useMemo(() => {
    const map = {};

    // init all participants (important for zero spend users)
    participants.forEach((p) => {
      map[p._id] = {
        userId: p._id,
        username: p.username,
        amount: 0,
      };
    });

    // aggregate payments
    expenses.forEach((e) => {
      e.paidBy?.forEach((p) => {
        if (!map[p.user]) {
          map[p.user] = {
            userId: p.user,
            username: "Unknown",
            amount: 0,
          };
        }
        map[p.user].amount += p.amount;
      });
    });

    return Object.values(map);
  }, [expenses, participants]);

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Member Contributions</h3>

      {contributionMap.length === 0 && (
        <p className="text-xs text-gray-500">No contributions yet</p>
      )}

      {contributionMap.map((u) => {
        const percent = totalSpend
          ? Math.min(Math.round((u.amount / totalSpend) * 100), 100)
          : 0;

        return (
          <div key={u.userId} className="mb-4">
            {/* Name + Amount */}
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {u.username}
              </span>
              <span className="text-gray-500">{formatMoney(u.amount)}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
