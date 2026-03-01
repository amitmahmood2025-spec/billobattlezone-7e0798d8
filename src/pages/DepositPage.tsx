import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useDeposits, PaymentSetting } from "@/hooks/useDeposits";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";

const paymentMethods = [
  { id: "bkash", name: "bKash", color: "#E2136E", icon: "💳" },
  { id: "nagad", name: "Nagad", color: "#F6921E", icon: "💰" },
  { id: "rocket", name: "Rocket", color: "#8B3DFF", icon: "🚀" },
  { id: "binance", name: "Binance", color: "#F0B90B", icon: "₿" },
] as const;

const DepositPage = () => {
  const { profile, wallet } = useProfile();
  const { paymentSettings, deposits, submitting, createDeposit, getSettingByMethod } =
    useDeposits(profile?.id);
  
  const [activeMethod, setActiveMethod] = useState<typeof paymentMethods[number]["id"]>("bkash");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const activeSetting = getSettingByMethod(activeMethod);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!transactionId.trim()) {
      toast.error("Please enter the transaction ID");
      return;
    }

    await createDeposit(activeMethod, amountNum, transactionId.trim());
    setAmount("");
    setTransactionId("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEO title="Deposit" description="Add cash to your Billo Battle Zone wallet via bKash, Nagad, Rocket or Binance." />
      <DashboardNav />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display font-bold text-2xl">Deposit / Recharge</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add cash to your wallet using bKash, Nagad, Rocket, or Binance
          </p>
        </motion.div>

        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4 flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-muted-foreground">Cash Balance</p>
            <p className="font-display font-bold text-2xl text-green-400">
              ৳{wallet?.cash?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="text-4xl">💵</div>
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

        {/* Deposit Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMethod}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-xl p-6 space-y-5"
          >
            {/* Admin Account Number */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Send money to this {activeMethod === "binance" ? "wallet" : "number"}:
              </p>
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-lg font-bold text-primary flex-1 break-all">
                  {activeSetting?.account_number || "Loading..."}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => activeSetting && handleCopy(activeSetting.account_number)}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {activeSetting?.account_name && (
                <p className="text-sm text-muted-foreground mt-2">
                  Account: {activeSetting.account_name}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                placeholder={`Min: ৳${activeSetting?.min_deposit || 50}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-primary/20 transition-colors"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Transaction ID (TrxID)
              </label>
              <Input
                type="text"
                placeholder="Enter your transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive this after sending money
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 font-display font-bold text-lg"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Submit Deposit Request
            </Button>
          </motion.div>
        </AnimatePresence>

        {/* Recent Deposits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display font-semibold text-lg mb-3">Recent Deposits</h2>
          {deposits.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-muted-foreground">No deposit history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="glass rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deposit.status)}
                    <div>
                      <p className="font-medium">৳{deposit.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {deposit.payment_method.toUpperCase()} • {deposit.transaction_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        deposit.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : deposit.status === "rejected"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {deposit.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(deposit.created_at).toLocaleDateString()}
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

export default DepositPage;
