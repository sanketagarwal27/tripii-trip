// src/components/trip/wallet/WalletExpenseRow.jsx
export default function WalletExpenseRow({ expense }) {
  return (
    <div className="py-4 flex justify-between">
      <div>
        <p className="font-semibold">{expense.title}</p>
        <p className="text-sm text-gray-500">
          {expense.paidBy?.user?.username} paid ₹{expense.amount}
        </p>
      </div>
    </div>
  );
}
