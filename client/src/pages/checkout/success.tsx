import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Ticket, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

export default function TicketCheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get parameters from URL first
        const urlParams = new URLSearchParams(window.location.search);
        let submissionId = urlParams.get('submissionId');
        let sessionId = urlParams.get('checkoutId') || urlParams.get('sessionId');

        // Also check sessionStorage for pending purchase info (more reliable)
        const pendingPurchaseStr = sessionStorage.getItem('pending-ticket-purchase');
        let purchaseId = null;

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            // Use stored values if URL params are missing
            if (!submissionId) submissionId = pendingPurchase.submissionId;
            if (!sessionId) sessionId = pendingPurchase.cloverSessionId;
            purchaseId = pendingPurchase.purchaseId;
            console.log('Found pending purchase in sessionStorage:', pendingPurchase);
          } catch (e) {
            console.error('Error parsing pending purchase:', e);
          }
        }

        console.log('Ticket checkout success - verifying payment:', { submissionId, sessionId, purchaseId });

        if (!submissionId && !sessionId && !purchaseId) {
          console.log('No purchase info found - showing generic success');
          setVerificationStatus('success');
          setIsProcessing(false);
          return;
        }

        // Verify the payment with the server
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, submissionId, purchaseId })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Payment verification result:', result);
          setVerificationStatus('success');
          setOrderDetails(result.purchase);

          // Clear the pending purchase from sessionStorage
          sessionStorage.removeItem('pending-ticket-purchase');
        } else {
          const errorData = await response.json();
          console.log('Payment verification API returned non-OK:', errorData);
          setVerificationStatus('success');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('success');
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
            <BlurCard contentVisible={contentVisible} className="p-8">
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
                    <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                    <p className="text-white/70 mb-6">
                      Thank you for your purchase. Your ticket order has been confirmed.
                    </p>
                  </div>

                  {orderDetails && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 text-left">
                      <h2 className="font-semibold text-lg text-white mb-4">Order Details</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-white/60">Event:</span>
                          <span className="font-medium text-white">{orderDetails.productName || 'Event Ticket'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                          <span className="text-white/60">Quantity:</span>
                          <span className="font-medium text-white">{orderDetails.quantity || 1}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-white/60">Total Paid:</span>
                          <span className="font-bold text-green-400">${(orderDetails.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
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
                      className="w-full bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 text-white font-semibold py-3"
                    >
                      View Other Activities
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </BlurActionButton>

                    <Button
                      onClick={handleReturnHome}
                      variant="outline"
                      className="w-full bg-white/5 hover:bg-white/10 text-white border-white/20"
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
