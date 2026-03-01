import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { useDeposits } from "@/hooks/useDeposits";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, Clock, XCircle, Loader2, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";

const paymentMethods = [
  { id: "bkash", name: "bKash", icon: "💳" },
  { id: "nagad", name: "Nagad", icon: "💰" },
  { id: "rocket", name: "Rocket", icon: "🚀" },
  { id: "binance", name: "Binance", icon: "₿" },
] as const;

const WithdrawPage = () => {
  const { profile, wallet } = useProfile();
  const { withdrawals, submitting, createWithdrawal } = useWithdrawals(
    profile?.id,
    wallet?.cash || 0
  );
  const { getSettingByMethod } = useDeposits(profile?.id);

  const [activeMethod, setActiveMethod] = useState<typeof paymentMethods[number]["id"]>("bkash");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const activeSetting = getSettingByMethod(activeMethod);
  const minWithdrawal = activeSetting?.min_withdrawal || 100;

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter your account number");
      return;
    }

    await createWithdrawal(activeMethod, amountNum, accountNumber.trim(), minWithdrawal);
    setAmount("");
    setAccountNumber("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Withdraw" description="Withdraw your cash winnings from Billo Battle Zone to bKash, Nagad, Rocket or Binance." />
      <DashboardNav />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display font-bold text-2xl">Withdraw</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Withdraw your cash to bKash, Nagad, Rocket, or Binance
          </p>
        </motion.div>

        {/* Balance Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Cash (Withdrawable)</p>
            <p className="font-display font-bold text-2xl text-green-400">
              ৳{wallet?.cash?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Credits (Play Only)</p>
            <p className="font-display font-bold text-2xl text-primary">
              {wallet?.credits?.toFixed(0) || "0"}
            </p>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-muted/50 rounded-xl p-4 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Withdrawal Rules</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Only Cash balance can be withdrawn</li>
              <li>Minimum withdrawal: ৳{minWithdrawal}</li>
              <li>Processing time: 24-48 hours</li>
              <li>Credits earned from tasks cannot be withdrawn</li>
            </ul>
          </div>
        </motion.div>

        {/* Payment Method Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(method.id)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
                activeMethod === method.id
                  ? "bg-primary text-primary-foreground shadow-neon"
                  : "glass hover:bg-muted"
              }`}
            >
              <span className="mr-2">{method.icon}</span>
              {method.name}
            </button>
          ))}
        </motion.div>

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-xl p-6 space-y-5"
        >
          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Amount</label>
            <Input
              type="number"
              placeholder={`Min: ৳${minWithdrawal}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Min: ৳{minWithdrawal}</span>
              <button
                onClick={() => setAmount(wallet?.cash?.toString() || "0")}
                className="text-primary hover:underline"
              >
                Withdraw All
              </button>
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your {activeMethod === "binance" ? "Wallet Address" : "Account Number"}
            </label>
            <Input
              type="text"
              placeholder={
                activeMethod === "binance"
                  ? "Enter your USDT (TRC20) address"
                  : "Enter your mobile number"
              }
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !wallet?.cash || wallet.cash < minWithdrawal}
            className="w-full h-12 font-display font-bold text-lg"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Request Withdrawal
          </Button>
        </motion.div>

        {/* Recent Withdrawals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display font-semibold text-lg mb-3">Recent Withdrawals</h2>
          {withdrawals.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-muted-foreground">No withdrawal history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="glass rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-medium">৳{withdrawal.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.payment_method.toUpperCase()} • {withdrawal.account_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        withdrawal.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : withdrawal.status === "rejected"
                          ? "bg-destructive/20 text-destructive"
                          : withdrawal.status === "processing"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default WithdrawPage;
