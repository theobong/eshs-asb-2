import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getFormSubmission, createPaymentIntent, createPurchase } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

interface FormSubmission {
  _id: string;
  studentName: string;
  email: string;
  eventId: any;
  quantity: number;
  totalAmount: number;
  status: string;
  ticketType?: {
    name: string;
    price: number;
    description: string;
  };
}

export default function TicketCheckoutPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [, setLocation] = useLocation();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await getFormSubmission(submissionId!);
      
      // Check if submission is approved
      if (data.status !== 'approved') {
        setError('This ticket request has not been approved yet.');
        return;
      }
      
      // Check if already purchased
      if (data.status === 'paid' || data.status === 'completed') {
        setError('This ticket has already been purchased.');
        return;
      }
      
      setSubmission(data);
    } catch (err) {
      console.error('Error loading submission:', err);
      setError('Failed to load ticket information. Please check your link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!submission) return;
    
    setProcessingPayment(true);
    
    try {
      // Create payment intent with Clover (same as cart checkout)
      const intent = await createPaymentIntent({
        amount: submission.totalAmount,
        items: [{
          name: `${submission.eventId?.title || 'Event'} - ${submission.ticketType?.name || 'Ticket'}`,
          quantity: submission.quantity,
          price: submission.totalAmount / submission.quantity
        }],
        customerEmail: submission.email,
        customerName: submission.studentName,
        submissionId: submission._id // For redirect URL construction
      });

      // Create a ticket purchase record
      const purchaseData = {
        submissionId: submission._id,
        studentName: submission.studentName,
        studentEmail: submission.email,
        productName: `${submission.eventId?.title || 'Event'} - ${submission.ticketType?.name || 'Ticket'}`, // Added productName field
        eventName: submission.eventId?.title || 'Event',
        ticketType: submission.ticketType?.name || 'Ticket',
        quantity: submission.quantity,
        amount: submission.totalAmount,
        paymentMethod: 'card',
        status: 'pending',
        cloverOrderId: intent.orderId,
        cloverSessionId: intent.sessionId
      };

      // Create the purchase record using the ticket-purchase endpoint
      const response = await fetch('/api/ticket-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ticket purchase');
      }

      const purchaseResult = await response.json();

      // Store purchase info in sessionStorage for verification on return
      sessionStorage.setItem('pending-ticket-purchase', JSON.stringify({
        purchaseId: purchaseResult._id,
        submissionId: submission._id,
        cloverSessionId: intent.sessionId,
        timestamp: Date.now()
      }));

      // Redirect to Clover checkout
      if (intent.checkoutUrl) {
        window.location.href = intent.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <UniversalPageLayout pageType="shop" title="Loading Ticket Information" showHeader={false}>
        {({ contentVisible }) => (
          <div className="min-h-screen flex items-center justify-center py-12 px-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
              <p className="text-white/70">Loading ticket information...</p>
            </div>
          </div>
        )}
      </UniversalPageLayout>
    );
  }

  if (error) {
    return (
      <UniversalPageLayout pageType="shop" title="Unable to Process" showHeader={false}>
        {({ contentVisible }) => (
          <div className="min-h-screen flex items-center justify-center py-12 px-4">
            <BlurCard contentVisible={contentVisible} className="max-w-md w-full p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-white">Unable to Process</h2>
                <p className="text-white/70 mb-6">{error}</p>
                <BlurActionButton
                  contentVisible={contentVisible}
                  onClick={() => setLocation('/')}
                  className="px-8 py-3"
                >
                  Return Home
                </BlurActionButton>
              </div>
            </BlurCard>
          </div>
        )}
      </UniversalPageLayout>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <UniversalPageLayout pageType="shop" title="Complete Your Purchase" showHeader={false}>
      {({ contentVisible }) => (
        <div className="min-h-screen py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <BlurCard contentVisible={contentVisible} className="p-8 mb-6">
              {/* Success Header */}
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Request Has Been Approved!</h1>
                <p className="text-white/70">Complete your payment to secure your ticket(s)</p>
              </div>

              {/* Order Details */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
                <h2 className="font-semibold text-xl text-white mb-6">Order Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Event:</span>
                    <span className="font-medium text-white">{submission.eventId?.title || 'Event'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Ticket Type:</span>
                    <span className="font-medium text-white">{submission.ticketType?.name || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Quantity:</span>
                    <span className="font-medium text-white">{submission.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Price per Ticket:</span>
                    <span className="font-medium text-white">${(submission.totalAmount / submission.quantity).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-white">Total Amount:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        ${submission.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-white/80">
                  <strong className="text-white">Important:</strong> Please complete your payment within 48 hours to secure your ticket(s). 
                  After payment, you will receive a confirmation email with your ticket details.
                </p>
              </div>

              {/* Payment Button */}
              <BlurActionButton
                onClick={handleCheckout}
                disabled={processingPayment}
                contentVisible={contentVisible}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 transition-all duration-200"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                    Redirecting to Payment...
                  </>
                ) : (
                  <>Complete Payment - ${submission.totalAmount.toFixed(2)}</>
                )}
              </BlurActionButton>

              <p className="text-center text-sm text-white/50 mt-4">
                You will be redirected to our secure payment processor (Clover)
              </p>
            </BlurCard>
          </div>
        </div>
      )}
    </UniversalPageLayout>
  );
}