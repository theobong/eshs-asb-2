import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('checkoutId') || urlParams.get('sessionId');

        const pendingPurchaseStr = sessionStorage.getItem('pending-cart-purchase');

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            if (!sessionId) sessionId = pendingPurchase.cloverSessionId;
          } catch (e) {
            console.error('Error parsing pending purchase:', e);
          }
        }

        if (!sessionId) {
          console.error('No Clover checkout session id available to verify against');
          return;
        }

        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const result = await response.json().catch(() => null);

        if (response.ok) {
          setIsConfirmed(Boolean(result?.confirmed));
          sessionStorage.removeItem('pending-cart-purchase');
        } else {
          console.error('Payment verification returned', response.status, result?.message);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      } finally {
        clearCart();
        sessionStorage.removeItem('checkout-form-data');
        sessionStorage.removeItem('checkout-cart-items');
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, [clearCart]);

  const handleContinueShopping = () => {
    setLocation("/shop");
  };

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Payment Successful"
      showHeader={false}
    >
      {() => (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Card className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl text-center">
            {isProcessing ? (
              <div className="space-y-6">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Processing your order...</h2>
                  <p className="text-gray-300">Please wait while we confirm your payment.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                  <p className="text-gray-300 mb-6">
                    Thank you for your purchase. Your order has been confirmed and is being processed.
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">What's next?</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    You'll receive a confirmation email shortly. Your order will be prepared according to your selected delivery method.
                  </p>
                </div>

                {!isConfirmed && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-start gap-2 text-amber-300 mb-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="font-medium">We could not confirm your order automatically</span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">
                      Your payment went through with Clover, but our system has not confirmed it yet. It usually
                      catches up within a few minutes. If you do not get a confirmation email, contact the
                      Activities Office with the time of your purchase.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleContinueShopping}
                    className="w-full min-h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                  >
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </UniversalPageLayout>
  );
}
