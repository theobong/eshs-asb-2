import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Ticket, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";
import type { Purchase } from "@/lib/api";

export default function TicketCheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Purchase | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        let submissionId = urlParams.get('submissionId');
        let sessionId = urlParams.get('checkoutId') || urlParams.get('sessionId');

        const pendingPurchaseStr = sessionStorage.getItem('pending-ticket-purchase');
        let purchaseId = null;

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            if (!submissionId) submissionId = pendingPurchase.submissionId;
            if (!sessionId) sessionId = pendingPurchase.cloverSessionId;
            purchaseId = pendingPurchase.purchaseId;
          } catch (e) {
            console.error('Error parsing pending purchase:', e);
          }
        }

        if (!sessionId) {
          console.error('No Clover checkout session id available to verify this ticket payment');
          setIsProcessing(false);
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
          setOrderDetails(result ?? null);
          sessionStorage.removeItem('pending-ticket-purchase');
        } else {
          console.error('Payment verification returned', response.status, result?.message);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, []);

  const handleViewActivities = () => {
    setLocation("/activities");
  };

  const handleReturnHome = () => {
    setLocation("/");
  };

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Payment Successful"
      showHeader={false}
    >
      {({ contentVisible }) => (
        <div className="min-h-screen py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <BlurCard contentVisible={contentVisible} className="p-5 sm:p-8">
              {isProcessing ? (
                <div className="space-y-6 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto" />
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Verifying your payment...</h2>
                    <p className="text-white/70">Please wait while we confirm your purchase.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-500/20 backdrop-blur-xl border border-green-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                    <p className="text-white/70 mb-6">
                      Thank you for your purchase. Your ticket order has been confirmed.
                    </p>
                  </div>

                  {orderDetails && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 text-left">
                      <h2 className="font-semibold text-lg text-white mb-4">Order Details</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                          <span className="text-white/60 shrink-0">Event:</span>
                          <span className="font-medium text-white text-right break-words">{orderDetails.productName || 'Event Ticket'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                          <span className="text-white/60 shrink-0">Quantity:</span>
                          <span className="font-medium text-white">{orderDetails.quantity || 1}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 py-2">
                          <span className="text-white/60 shrink-0">Total Paid:</span>
                          <span className="font-bold text-green-400 whitespace-nowrap">${(orderDetails.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isConfirmed && (
                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 mb-6 text-left">
                      <div className="flex items-start gap-2 text-amber-300 mb-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">We could not confirm your ticket automatically</span>
                      </div>
                      <p className="text-sm text-white/80 break-words">
                        Your payment went through with Clover, but our system has not confirmed it yet. It usually
                        catches up within a few minutes. If you do not get a confirmation email, contact the
                        Activities Office with the time of your purchase.
                      </p>
                    </div>
                  )}

                  <div className="bg-green-500/10 backdrop-blur-md border border-green-500/30 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                      <Ticket className="w-5 h-5" />
                      <span className="font-medium">What's next?</span>
                    </div>
                    <p className="text-sm text-white/80">
                      You'll receive a confirmation email shortly with your ticket details.
                      Please bring your ticket to the event.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <BlurActionButton
                      onClick={handleViewActivities}
                      contentVisible={contentVisible}
                      className="w-full min-h-11 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 text-white font-semibold py-3"
                    >
                      View Other Activities
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </BlurActionButton>

                    <Button
                      onClick={handleReturnHome}
                      variant="outline"
                      className="w-full min-h-11 bg-white/5 hover:bg-white/10 text-white border-white/20"
                    >
                      Return Home
                    </Button>
                  </div>
                </div>
              )}
            </BlurCard>
          </div>
        </div>
      )}
    </UniversalPageLayout>
  );
}
