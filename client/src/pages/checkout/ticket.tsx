import { useRef, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getFormSubmission, createPaymentIntent, type FormSubmission } from "@/lib/api";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

interface PaymentIntent {
  purchaseId?: string;
  sessionId?: string;
  checkoutUrl?: string;
}

const getEventTitle = (submission: FormSubmission) => {
  const populatedEvent = submission.eventId as unknown as { title?: string } | string | undefined;
  return (typeof populatedEvent === 'object' && populatedEvent?.title) || 'Event';
};

export default function TicketCheckoutPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [, setLocation] = useLocation();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!submissionId) {
        setError('This ticket link is missing a request reference.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getFormSubmission(submissionId);

        if (data.status === 'paid' || data.purchaseStatus === 'completed') {
          setError('This ticket has already been purchased.');
          return;
        }

        if (data.status === 'rejected') {
          setError(data.rejectionReason || 'This ticket request was not approved.');
          return;
        }

        if (data.status !== 'approved') {
          setError('This ticket request has not been approved yet.');
          return;
        }

        if (!data.quantity || data.quantity < 1) {
          setError('This ticket request has no tickets on it. Please contact the Activities Office.');
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

    loadSubmission();
  }, [submissionId]);

  const pricePerTicket = submission && submission.quantity > 0
    ? submission.totalAmount / submission.quantity
    : 0;

  const handleCheckout = async () => {
    if (!submission || checkoutInFlight.current) return;

    checkoutInFlight.current = true;
    setProcessingPayment(true);

    try {
      const intent: PaymentIntent = await createPaymentIntent({
        customerEmail: submission.email,
        customerName: submission.studentName,
        submissionId: submission._id
      });

      sessionStorage.setItem('pending-ticket-purchase', JSON.stringify({
        purchaseId: intent.purchaseId,
        submissionId: submission._id,
        cloverSessionId: intent.sessionId,
        timestamp: Date.now()
      }));

      if (!intent.checkoutUrl) {
        throw new Error('No checkout URL received');
      }

      window.location.href = intent.checkoutUrl;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      checkoutInFlight.current = false;
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <UniversalPageLayout pageType="shop" title="Loading Ticket Information" showHeader={false}>
        {() => (
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
            <BlurCard contentVisible={contentVisible} className="p-5 sm:p-8 mb-6">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">Your Request Has Been Approved!</h1>
                <p className="text-white/70">Complete your payment to secure your ticket(s)</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
                <h2 className="font-semibold text-xl text-white mb-6">Order Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                    <span className="text-white/60 shrink-0">Event:</span>
                    <span className="font-medium text-white text-right break-words">{getEventTitle(submission)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                    <span className="text-white/60 shrink-0">Ticket Type:</span>
                    <span className="font-medium text-white text-right break-words">{submission.ticketType?.name || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                    <span className="text-white/60 shrink-0">Quantity:</span>
                    <span className="font-medium text-white">{submission.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 py-2 border-b border-white/10">
                    <span className="text-white/60 shrink-0">Price per Ticket:</span>
                    <span className="font-medium text-white">${pricePerTicket.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 mt-2">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-lg sm:text-xl font-semibold text-white">Total Amount:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
                        ${submission.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-white/80">
                  <strong className="text-white">Important:</strong> Please complete your payment within 48 hours to secure your ticket(s).
                  After payment, you will receive a confirmation email with your ticket details.
                </p>
              </div>

              <BlurActionButton
                onClick={handleCheckout}
                disabled={processingPayment}
                contentVisible={contentVisible}
                className="w-full min-h-11 py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 transition-all duration-200"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                    Redirecting to Payment...
                  </>
                ) : (
                  <>Complete Payment: ${submission.totalAmount.toFixed(2)}</>
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
