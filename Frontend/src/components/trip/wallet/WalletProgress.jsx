// src/components/trip/wallet/WalletProgress.jsx
export default function WalletProgress({ wallet }) {
  const percent =
    wallet.budget > 0
      ? Math.min((wallet.totalSpend / wallet.budget) * 100, 100)
      : 0;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      <h3 className="font-bold mb-4">Budget Progress</h3>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full">
        <div
          className="bg-primary h-4 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-sm mt-2 text-gray-500">
        <span>₹0</span>
        <span>₹{wallet.budget}</span>
      </div>
    </div>
  );
}
