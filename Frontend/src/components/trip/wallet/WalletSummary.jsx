// src/components/trip/wallet/WalletSummary.jsx
export default function WalletSummary({ wallet }) {
  const remaining = Math.max(wallet.budget - wallet.totalSpend, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Stat
        title="Total Budget"
        value={`₹${wallet.budget}`}
        icon="account_balance_wallet"
      />
      <Stat
        title="Total Spent"
        value={`₹${wallet.totalSpend}`}
        icon="shopping_cart"
      />
      <Stat title="Remaining" value={`₹${remaining}`} icon="savings" positive />
    </div>
  );
}

function Stat({ title, value, icon, positive }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
      <p className={`text-3xl font-bold ${positive ? "text-green-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}
