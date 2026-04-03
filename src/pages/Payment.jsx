import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Zap, CreditCard, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { localApi } from "@/api/localApi";
import { toast } from "sonner";

const PRICING_TIERS = [
  {
    id: "test",
    name: "Micro Test",
    price: 1,
    credits: 10,
    description: "Quick $1 test to try the platform",
    popular: false,
    paypalUrl: "https://www.paypal.com/ncp/payment/BSLN4YNSY3WH2", // Reuse starter URL for now or dummy
    yocoUrl: "https://pay.yoco.com/r/7XPopK", // Reuse starter URL for now or dummy
  },
  {
    id: "basic",
    name: "Starter Bundle",
    price: 5,
    credits: 50,
    description: "Perfect for single subject deep-dives",
    popular: false,
    paypalUrl: "https://www.paypal.com/ncp/payment/BSLN4YNSY3WH2",
    yocoUrl: "https://pay.yoco.com/r/7XPopK",
  },
  {
    id: "pro",
    name: "Pro Learner",
    price: 10,
    credits: 100,
    description: "Best for comprehensive exam prep",
    popular: true,
    paypalUrl: "https://www.paypal.com/ncp/payment/Z88FF3R39WB44",
    yocoUrl: "https://pay.yoco.com/r/mEq5we",
  },
  {
    id: "master",
    name: "Master Suite",
    price: 15,
    credits: 150,
    description: "Full semester coverage for power users",
    popular: false,
    paypalUrl: "https://www.paypal.com/ncp/payment/VVUM4GNPHPJTG",
    yocoUrl: "https://pay.yoco.com/r/4gzxbB",
  },
];

export default function PaymentPage() {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedTier, setSelectedTier] = useState(PRICING_TIERS[1]);
  const [balance, setBalance] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);
  const [purchasedCredits, setPurchasedCredits] = useState(0);

  const refreshBalance = async () => {
    const b = await localApi.wallet.getBalance();
    setBalance(b);
    setFreeCredits(localApi.wallet.getFreeCreditsRemaining());
    setPurchasedCredits(localApi.wallet.getPurchasedBalance());
  };

  useEffect(() => {
    // Clear stale unlimited-mode keys so returning users get real balances
    const staleBalance = localStorage.getItem('credit_balance');
    if (staleBalance && parseInt(staleBalance, 10) > 9000) {
      localStorage.removeItem('credit_balance');
      localStorage.removeItem('purchased_credit_balance');
      localStorage.removeItem('free_credits_this_month');
      localStorage.removeItem('last_credit_reset_month');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('payment');
    const tierIdFromUrl = urlParams.get('tier');

    if (status) {
      setPaymentStatus(status);
      if (status === 'success') {
        const targetTierId = tierIdFromUrl || localStorage.getItem('last_selected_tier');
        const tierToCredit = PRICING_TIERS.find(t => t.id === targetTierId) || PRICING_TIERS[1];

        localApi.wallet.addCredits(tierToCredit.credits, {
          amount: tierToCredit.price,
          currency: 'USD',
          note: `Purchase of ${tierToCredit.name}`
        })
          .then(newBalance => {
            setBalance(newBalance);
            setFreeCredits(localApi.wallet.getFreeCreditsRemaining());
            setPurchasedCredits(localApi.wallet.getPurchasedBalance());
            toast.success(`🎉 ${tierToCredit.credits} credits added to your wallet!`);
            localStorage.removeItem('last_selected_tier');
          });
      }
    }

    refreshBalance();
  }, []);

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
    localStorage.setItem('last_selected_tier', tier.id);
  };

  const handlePaymentVerification = () => {
    // Temporary workaround for local testing without a server webhook
    setTimeout(() => {
      if (window.confirm("Payment Verification: Have you completed your payment? (This is an honor-system check for testing)")) {
        localApi.wallet.addCredits(selectedTier.credits, {
          amount: selectedTier.price,
          currency: 'USD',
          note: `Purchase of ${selectedTier.name}`
        }).then(newBalance => {
          setBalance(newBalance);
          setFreeCredits(localApi.wallet.getFreeCreditsRemaining());
          setPurchasedCredits(localApi.wallet.getPurchasedBalance());
          setPaymentStatus('success');
          toast.success(`🎉 ${selectedTier.credits} credits added to your wallet!`);
        });
      }
    }, 2000);
  };

  const openPayPal = () => {
    window.open(selectedTier.paypalUrl, '_blank');
    toast.info("Opening PayPal... Please complete the payment and return.");
    handlePaymentVerification();
  };

  const openYoco = () => {
    window.open(selectedTier.yocoUrl, '_blank');
    toast.info("Opening Secure Card Checkout... Please complete the payment and return.");
    handlePaymentVerification();
  };

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100/50">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Payment Successful!</h2>
          <p className="text-slate-600 mb-8">Your credits have been added to your local wallet. You're ready to use premium AI features!</p>
          <div className="p-4 bg-slate-50 rounded-2xl mb-8 flex justify-between items-center">
            <span className="text-slate-500 font-medium text-sm">New Balance</span>
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <Zap className="w-4 h-4 fill-current" /> {balance} Credits
            </span>
          </div>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="w-full py-6 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/25">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Level Up Your Learning</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Add Learning Credits to your wallet to unlock deep-dive AI analysis, unlimited summaries, and personalized study paths.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            Free Plan: 10 Credits / Month
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold text-sm">
            <Zap className="w-4 h-4 fill-current" />
            Balance: {balance} Credits
          </div>
        </div>

        {/* Credit breakdown */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full border border-violet-100 text-xs font-bold">
            🎁 Free this month: {freeCredits} / 10
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-xs font-bold">
            💳 Purchased: {purchasedCredits}
          </div>
          <button onClick={refreshBalance} className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 text-xs font-bold hover:text-slate-800 transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {balance === 0 && (
          <div className="mt-4 mx-auto max-w-md flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-left">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-bold text-sm">You're out of credits!</p>
              <p className="text-red-600 text-xs mt-0.5">Purchase a pack below to keep using AI features. Your free credits reset on {localApi.wallet.getNextResetDate()}.</p>
            </div>
          </div>
        )}
        {balance > 0 && balance <= 3 && (
          <div className="mt-4 mx-auto max-w-md flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-700 font-bold text-sm">Running low on credits!</p>
              <p className="text-amber-600 text-xs mt-0.5">Only {balance} credit{balance !== 1 ? 's' : ''} left. Top up to avoid interruptions.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-8">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.id}
            onClick={() => handleSelectTier(tier)}
            className={`relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer group ${selectedTier.id === tier.id
              ? "border-blue-500 bg-white ring-4 ring-blue-50 shadow-2xl scale-105 z-10"
              : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                MOST POPULAR
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">{tier.name}</h3>
                  <p className="text-slate-500 text-sm">{tier.description}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">${tier.price}</span>
                <span className="text-slate-400 font-medium">one-time</span>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-blue-700 font-bold text-2xl">{tier.credits}</span>
                  <span className="text-blue-600/70 text-xs uppercase font-bold tracking-widest leading-none">Credits</span>
                </div>
                <Zap className={`w-8 h-8 ${selectedTier.id === tier.id ? "text-blue-600 animate-pulse" : "text-blue-300"}`} />
              </div>

              <ul className="space-y-3 pt-4">
                {[
                  "Instant Delivery",
                  "Non-expiring Credits",
                  "AI Personalization",
                  "Priority Support"
                ].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-200/50">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-bold text-xl">
                {selectedTier.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-2xl">Confirm Purchase</h3>
                <p className="text-slate-500">{selectedTier.name} — {selectedTier.credits} Credits</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Pack Price</span>
                <span>${selectedTier.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t">
                <span>Total Due</span>
                <span>${selectedTier.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                onClick={openPayPal}
                className="w-full py-8 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-lg shadow-lg shadow-amber-200/50 flex items-center justify-center gap-3"
              >
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-6" />
                Pay with PayPal
              </Button>

              <Button
                onClick={openYoco}
                className="w-full py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200/50 flex items-center justify-center gap-3"
              >
                <CreditCard className="w-6 h-6" />
                Pay with Card (Yoco)
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 space-y-6 border border-slate-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900">Secure Checkout</h4>
                <p className="text-sm text-slate-500">Your payments are processed securely. We never store your credit card information on our servers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900">Instant Activation</h4>
                <p className="text-sm text-slate-500">Credits are added to your local wallet immediately after a successful transaction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
