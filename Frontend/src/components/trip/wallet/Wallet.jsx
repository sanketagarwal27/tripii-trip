// src/components/trip/wallet/Wallet.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { getTripWallet, getWalletExpenses } from "@/api/wallet";
import { setTripWallet } from "@/redux/tripWalletSlice";

import WalletSummary from "./WalletSummary";
import WalletProgress from "./WalletProgress";
import WalletExpenses from "./WalletExpenses";
import WalletSettlements from "./WalletSettlements";
import WalletContributions from "./WalletContributions";

export default function Wallet() {
  const { tripId } = useParams();
  const dispatch = useDispatch();

  const walletState = useSelector((s) => s.wallet.wallets[tripId]);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!tripId) return;

    (async () => {
      const walletRes = await getTripWallet(tripId);
      const expenseRes = await getWalletExpenses(tripId);

      dispatch(
        setTripWallet({
          tripId,
          wallet: walletRes.data.data.wallet,
          expenses: expenseRes.data.data,
          settlements: walletRes.data.data.settlements,
          permissions: walletRes.data.data.permissions,
        })
      );
    })();
  }, [tripId, dispatch]);

  if (!walletState) {
    return <div className="p-8 text-gray-500">Loading wallet…</div>;
  }

  const { wallet, expenses, settlements } = walletState;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        <WalletSummary wallet={wallet} />
        <WalletProgress wallet={wallet} />
        <WalletExpenses expenses={expenses} />
      </div>

      {/* RIGHT */}
      <div className="space-y-6">
        <WalletSettlements settlements={settlements} />
        <WalletContributions
          expenses={expenses}
          totalSpend={wallet.totalSpend}
        />
      </div>
    </div>
  );
}
