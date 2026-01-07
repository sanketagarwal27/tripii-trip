// src/components/trip/wallet/WalletExpenses.jsx
import WalletExpenseRow from "./WalletExpenseRow";

export default function WalletExpenses({ expenses = [], participants = [] }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#111717] dark:text-white">
          Recent Transactions
        </h3>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {expenses.length === 0 ? (
          <p className="py-6 text-sm text-gray-500 text-center">
            No expenses yet
          </p>
        ) : (
          expenses.map((expense) => (
            <WalletExpenseRow
              key={expense._id}
              expense={expense}
              participants={participants}
            />
          ))
        )}
      </div>
    </div>
  );
}
