import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutFailurePage() {
  const [, setLocation] = useLocation();
  const { cartItems } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRetryPayment = () => {
    setLocation("/shop/checkout");
  };

  const handleBackToCart = () => {
    setLocation("/shop/cart");
  };

  const handleBackToShop = () => {
    setLocation("/shop");
  };

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Payment Failed"
      showBackButton={false}
    >
      {() => (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Card className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl text-center">
            {isProcessing ? (
              <div className="space-y-6">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Processing payment result...</h2>
                  <p className="text-gray-300">Please wait a moment.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-white" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
                  <p className="text-gray-300 mb-6">
                    We were unable to process your payment. Don't worry - no charges were made to your card.
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">What happened?</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Payment could not be completed due to:
                  </p>
                  <ul className="text-sm text-gray-300 mt-2 text-left max-w-md mx-auto list-disc list-inside space-y-1">
                    <li>Card was declined</li>
                    <li>Insufficient funds</li>
                    <li>Payment was cancelled</li>
                    <li>Network or technical issue</li>
                  </ul>
                </div>

                {cartItems.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-200">
                      <strong>Good news:</strong> Your cart items are still saved! You can try again with a different payment method.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {cartItems.length > 0 ? (
                    <>
                      <Button
                        onClick={handleRetryPayment}
                        className="w-full min-h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Payment Again
                      </Button>

                      <Button
                        onClick={handleBackToCart}
                        variant="outline"
                        className="w-full min-h-11 bg-white/5 hover:bg-white/10 text-white border-white/20"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Cart
                      </Button>

                      <Button
                        onClick={handleBackToShop}
                        variant="outline"
                        className="w-full min-h-11 bg-white/5 hover:bg-white/10 text-white border-white/20"
                      >
                        Back to Shop
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleBackToShop}
                      className="w-full min-h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    Need help? Contact us if you continue to experience issues with payment.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </UniversalPageLayout>
  );
}
