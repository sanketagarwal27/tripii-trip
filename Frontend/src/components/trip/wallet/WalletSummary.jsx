import { useSelector } from "react-redux";

export default function WalletSummary({ wallet, participants }) {
  const user = useSelector((s) => s.auth.user);

  if (!wallet || !Array.isArray(participants) || !user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <EmptyStat title="Total Budget" icon="account_balance_wallet" />
        <EmptyStat title="Your Budget" icon="savings" />
        <EmptyStat title="Total Spend" icon="shopping_cart" />
      </div>
    );
  }

  const me = participants.find((p) => p._id === user._id);

  const totalBudget = wallet.budget ?? 0;
  const yourBudget = me?.personalBudget ?? 0;
  const totalSpend = wallet.totalSpend ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <Stat
        title="Total Budget"
        value={totalBudget > 0 ? `₹${totalBudget}` : "Not set"}
        icon="account_balance_wallet"
      />

      <Stat
        title="Your Budget"
        value={yourBudget > 0 ? `₹${yourBudget}` : "Not set"}
        icon="savings"
        positive={yourBudget > 0}
      />

      <Stat title="Total Spend" value={`₹${totalSpend}`} icon="shopping_cart" />
    </div>
  );
}

/* ---------------- UI ---------------- */

function Stat({ title, value, icon, positive }) {
  return (
    <div className="bg-white dark:bg-gray-800/60 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="p-2 bg-primary/20 rounded-full">
          <span className="material-symbols-outlined text-primary text-xl">
            {icon}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
      </div>

      <p
        className={`text-2xl font-bold ${
          positive ? "text-green-500" : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyStat({ title, icon }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800/40 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="p-2 bg-gray-300/40 rounded-full">
          <span className="material-symbols-outlined text-gray-400 text-xl">
            {icon}
          </span>
        </div>
        <p className="text-xs text-gray-400">{title}</p>
      </div>

      <p className="text-lg font-semibold text-gray-300 mt-1">—</p>
    </div>
  );
}
