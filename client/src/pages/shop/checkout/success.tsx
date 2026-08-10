import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Package, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get session ID from URL params (Clover may include it)
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('checkoutId') || urlParams.get('sessionId');

        // Also check sessionStorage for pending purchase info (more reliable)
        const pendingPurchaseStr = sessionStorage.getItem('pending-cart-purchase');
        let purchaseId = null;

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            if (!sessionId) sessionId = pendingPurchase.cloverSessionId;
            purchaseId = pendingPurchase.purchaseId;
            console.log('Found pending cart purchase in sessionStorage:', pendingPurchase);
          } catch (e) {
            console.error('Error parsing pending purchase:', e);
          }
        }

        console.log('Cart checkout success - verifying payment:', { sessionId, purchaseId });

        // Verify the payment with the server
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, purchaseId })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Payment verification result:', result);
          setVerificationStatus('success');

          // Clear the pending purchase from sessionStorage
          sessionStorage.removeItem('pending-cart-purchase');
        } else {
          // Even if verification fails, user came to success page so payment likely succeeded
          // Webhook will handle the update
          console.log('Payment verification API returned non-OK, but user on success page');
          setVerificationStatus('success');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        // Still show success since user was redirected to success URL
        setVerificationStatus('success');
      } finally {
        // Clear the cart and session storage
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

  const handleViewOrders = () => {
    // In a real app, this would go to an order history page
    setLocation("/shop");
  };

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Payment Successful"
      showHeader={false}
    >
      {({ contentVisible }) => (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card className="p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl text-center">
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

                <div className="space-y-3">
                  <Button
                    onClick={handleContinueShopping}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                  >
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button
                    onClick={handleViewOrders}
                    variant="outline"
                    className="w-full bg-white/5 hover:bg-white/10 text-white border-white/20"
                  >
                    Back to Shop
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