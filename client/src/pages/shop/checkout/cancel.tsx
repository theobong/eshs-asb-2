import { useEffect } from "react";
import { useLocation } from "wouter";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { toast } from "@/hooks/use-toast";

export default function CheckoutCancelPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    toast({
      title: "Payment Cancelled",
      description: "Your payment was cancelled. You can try again or continue shopping.",
      variant: "destructive",
    });
  }, []);

  const handleRetryCheckout = () => {
    setLocation("/shop/checkout");
  };

  const handleContinueShopping = () => {
    setLocation("/shop");
  };

  const handleViewCart = () => {
    setLocation("/shop/cart");
  };

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Payment Cancelled"
      showBackButton={false}
    >
      {() => (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Card className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
                <p className="text-gray-300 mb-6">
                  Your payment was cancelled. Don't worry - your items are still in your cart and no charges were made.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">Need help?</span>
                </div>
                <p className="text-sm text-gray-300">
                  If you're experiencing issues with payment, try using a different payment method or contact support.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleRetryCheckout}
                  className="w-full min-h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Payment Again
                </Button>

                <Button
                  onClick={handleViewCart}
                  variant="outline"
                  className="w-full min-h-11 bg-white/5 hover:bg-white/10 text-white border-white/20"
                >
                  Review Cart
                </Button>

                <Button
                  onClick={handleContinueShopping}
                  variant="ghost"
                  className="w-full min-h-11 text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </UniversalPageLayout>
  );
}
