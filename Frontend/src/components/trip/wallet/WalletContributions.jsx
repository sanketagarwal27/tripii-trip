// src/components/trip/wallet/WalletContributions.jsx
export default function WalletContributions({ expenses, totalSpend }) {
  const map = {};

  expenses.forEach((e) => {
    e.paidBy?.forEach((p) => {
      map[p.user.username] = (map[p.user.username] || 0) + p.amount;
    });
  });

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      <h3 className="font-bold mb-4">Member Contributions</h3>

      {Object.entries(map).map(([name, amount]) => {
        const percent = totalSpend
          ? Math.round((amount / totalSpend) * 100)
          : 0;

        return (
          <div key={name} className="mb-4">
            <div className="flex justify-between mb-1">
              <span>{name}</span>
              <span className="text-sm text-gray-500">₹{amount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
