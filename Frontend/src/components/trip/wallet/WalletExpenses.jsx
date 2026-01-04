// src/components/trip/wallet/WalletExpenses.jsx
import WalletExpenseRow from "./WalletExpenseRow";

export default function WalletExpenses({ expenses }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      <h3 className="font-bold mb-4">Recent Transactions</h3>

      <div className="divide-y dark:divide-gray-700">
        {expenses.length === 0 && (
          <p className="py-6 text-sm text-gray-500">No expenses yet</p>
        )}

        {expenses.map((e) => (
          <WalletExpenseRow key={e._id} expense={e} />
        ))}
      </div>
    </div>
  );
}
