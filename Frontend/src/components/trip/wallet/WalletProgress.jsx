// src/components/trip/wallet/WalletProgress.jsx
export default function WalletProgress({ wallet }) {
  const percent =
    wallet.budget > 0
      ? Math.min((wallet.totalSpend / wallet.budget) * 100, 100)
      : 0;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-base font-semibold mb-2">Budget Progress</h3>

      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <span>₹0</span>
        <span>₹{wallet.budget}</span>
      </div>
    </div>
  );
}
