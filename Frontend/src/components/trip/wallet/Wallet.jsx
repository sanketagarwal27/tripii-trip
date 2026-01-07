// src/components/trip/wallet/Wallet.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { getTripWallet, getWalletExpenses } from "@/api/wallet";
import { setTripWallet } from "@/redux/tripWalletSlice";

import WalletSummary from "./WalletSummary";
import WalletProgress from "./WalletProgress";
import WalletExpenses from "./WalletExpenses";
import WalletSettlements from "./WalletSettlements";
import WalletContributions from "./WalletContributions";
import SetBudgetModal from "./SetBudgetModal";
import AddExpenseButton from "./AddExpenseButton";

const selectTripWallet = (tripId) => (state) =>
  state.wallet.wallets?.[tripId] ?? null;
console.log("🔥 REAL Wallet.jsx FILE LOADED");

export default function Wallet() {
  const { tripId } = useParams();
  const user = useSelector((s) => s.auth?.user);
  const dispatch = useDispatch();
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const walletState = useSelector(selectTripWallet(tripId));

  /* ---------------- FETCH (MUST RUN ON FIRST RENDER) ---------------- */
  useEffect(() => {
    if (!tripId) return;

    console.log("Wallet useEffect fired, tripId:", tripId);

    (async () => {
      const walletRes = await getTripWallet(tripId);
      const wallet = walletRes.data.data.wallet;
      const expenseRes = await getWalletExpenses(tripId);

      dispatch(
        setTripWallet({
          tripId,
          wallet,
          expenses: expenseRes.data.data,
          settlements: wallet?.summary?.settlements || [],
          participants: walletRes.data.data.participants,
          permissions: {
            isAdmin: wallet.manager?.toString() === user._id,
            canAddExpense: wallet.settings?.expensePermission === "all",
          },
        })
      );
    })();
  }, [tripId, dispatch]);

  /* ---------------- LOADING STATE (AFTER EFFECT) ---------------- */
  if (!walletState || !walletState.wallet) {
    return <div className="p-0 text-gray-500">Loading wallet…</div>;
  }

  const { wallet, expenses = [], settlements = [] } = walletState;

  console.log("Wallet mounted, tripId:", tripId);
  console.log("Wallet Redux:", walletState);

  return (
    <div className="relative">
      {/* Action buttons */}
      <div className="absolute top-1 right-2 z-20 flex gap-2">
        <AddExpenseButton
          tripId={tripId}
          className="bg-primary px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap"
        />
        <button
          onClick={() => setShowBudgetModal(true)}
          className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
        >
          Set Budget
        </button>
      </div>

      {/* Wallet layout */}
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div
          className="lg:col-span-2 space-y-4"
          style={{ marginTop: "-30px", width: "70%" }}
        >
          <WalletSummary
            wallet={wallet}
            participants={walletState.participants}
          />

          <WalletProgress wallet={wallet} />
          <WalletExpenses
            expenses={expenses}
            participants={walletState.participants}
          />
        </div>

        <div
          className="space-y-4 pt-6 w-full lg:max-w-[260px] xl:max-w-[280px]"
          style={{ marginTop: "30px" }}
        >
          <WalletSettlements
            expenses={expenses}
            participants={walletState.participants}
          />

          <WalletContributions
            expenses={expenses}
            participants={walletState.participants}
            totalSpend={wallet.totalSpend}
          />
        </div>
      </div>

      {showBudgetModal && (
        <SetBudgetModal
          tripId={tripId}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
    </div>
  );
}
