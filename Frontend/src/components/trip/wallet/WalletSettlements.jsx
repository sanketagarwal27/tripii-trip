// src/components/trip/wallet/WalletSettlements.jsx
export default function WalletSettlements({ settlements }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6">
      <h3 className="font-bold mb-4">Who Owes Who</h3>

      {settlements.length === 0 && (
        <p className="text-sm text-gray-500">No settlements yet</p>
      )}

      {settlements.map((s, i) => (
        <div key={i} className="flex justify-between text-sm mb-2">
          <span>
            {s.fromName} → {s.toName}
          </span>
          <span className="font-bold text-red-500">₹{s.amount}</span>
        </div>
      ))}
    </div>
  );
}
