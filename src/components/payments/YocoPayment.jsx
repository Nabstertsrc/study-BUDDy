import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function YocoPayment({ amount, currency = "ZAR", metadata, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const currentUrl = window.location.origin + window.location.pathname;
      
      const { data } = await base44.functions.invoke('createYocoCheckout', {
        amount: amount * 100, // Convert to cents
        currency,
        successUrl: `${currentUrl}?payment=success`,
        cancelUrl: `${currentUrl}?payment=cancelled`,
        failureUrl: `${currentUrl}?payment=failed`,
        metadata,
        externalId: `order_${Date.now()}`
      });

      if (data.success && data.checkout?.redirectUrl) {
        // Redirect to Yoco checkout page
        window.location.href = data.checkout.redirectUrl;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      toast.error("Payment error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-blue-600" />
        Payment Details
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b">
          <span className="text-slate-600">Amount</span>
          <span className="font-semibold text-xl">
            {currency} {(amount).toFixed(2)}
          </span>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with Yoco
            </>
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          Secure payment powered by Yoco
        </p>
      </div>
    </div>
  );
}