import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { PrimaryButton, ThemedInput } from "@/components/ThemedComponents";
import { useCart, calculateCartTotals, SALES_TAX_RATE } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer } from "@/components/UniversalBlurComponents";
import { CloverCheckout } from "@/components/CloverCheckout";
import { createPaymentIntent } from "@/lib/api";

interface PaymentIntent {
  purchaseId?: string;
  orderId?: string;
  sessionId?: string;
  checkoutUrl?: string;
  amount?: number;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cartItems } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>("pickup");

  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomTeacher: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const submissionInFlight = useRef(false);

  const { subtotal, tax, total } = calculateCartTotals(cartItems);
  const taxPercentLabel = `${(SALES_TAX_RATE * 100).toFixed(2)}%`;

  const handleBackToCart = () => {
    setLocation("/shop/cart");
  };

  const handleInputChange = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submissionInFlight.current || showPayment) {
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    if (deliveryMethod === "delivery" && !formState.roomTeacher) {
      toast({
        title: "Missing Information",
        description: "Please provide room number and teacher name for delivery.",
        variant: "destructive",
      });
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      const intent: PaymentIntent = await createPaymentIntent({
        items: cartItems.map(item => ({
          productId: String(item.id),
          quantity: item.quantity,
          size: item.size
        })),
        customerEmail: formState.email,
        customerName: `${formState.firstName} ${formState.lastName}`,
        phone: formState.phone,
        deliveryMethod,
        deliveryDetails: deliveryMethod === 'delivery' ? {
          roomTeacher: formState.roomTeacher
        } : undefined
      });

      sessionStorage.setItem('pending-cart-purchase', JSON.stringify({
        purchaseId: intent.purchaseId,
        cloverSessionId: intent.sessionId,
        timestamp: Date.now()
      }));

      setPaymentIntent(intent);
      setShowPayment(true);
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      toast({
        title: "Could not start checkout",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCloverRedirect = (checkoutUrl: string) => {
    sessionStorage.setItem('checkout-form-data', JSON.stringify(formState));
    sessionStorage.setItem('checkout-cart-items', JSON.stringify(cartItems));

    window.location.href = checkoutUrl;
  };

  const handleCloverError = (error: string) => {
    toast({
      title: "Checkout Error",
      description: error,
      variant: "destructive",
    });
    setShowPayment(false);
    setIsSubmitting(false);
  };

  if (cartItems.length === 0 && !showPayment) {
    return (
      <UniversalPageLayout
        pageType="shop"
        title="Order Information"
        backButtonText="Back to Cart"
        onBackClick={handleBackToCart}
      >
        {({ contentVisible }) => (
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <BlurContainer contentVisible={contentVisible} delay="200ms" className="p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-300 mb-6">Add something to your cart before checking out.</p>
              <PrimaryButton onClick={() => setLocation("/shop")} className="min-h-11 py-3 px-6 font-semibold">
                Browse the Shop
              </PrimaryButton>
            </BlurContainer>
          </div>
        )}
      </UniversalPageLayout>
    );
  }

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Order Information"
      backButtonText="Back to Cart"
      onBackClick={handleBackToCart}
    >
      {({ contentVisible }) => (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '200ms'
                }}
              >
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">First Name *</Label>
                        <ThemedInput
                          id="firstName"
                          value={formState.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                        <ThemedInput
                          id="lastName"
                          value={formState.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <ThemedInput
                        id="email"
                        type="email"
                        value={formState.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white">Phone *</Label>
                      <ThemedInput
                        id="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-lg font-medium mb-4 block">Delivery Method *</Label>
                      <RadioGroup
                        value={deliveryMethod}
                        onValueChange={(value) => setDeliveryMethod(value === 'delivery' ? 'delivery' : 'pickup')}
                        className="space-y-4"
                      >
                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
                          <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="pickup" className="text-white font-medium cursor-pointer">
                              Pick Up at Activities Office at ESHS
                            </Label>
                            <p className="text-gray-300 text-sm mt-1">
                              Collect your order during school hours at the Activities Office
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
                          <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="delivery" className="text-white font-medium cursor-pointer">
                              Fourth Period Delivery For Students
                            </Label>
                            <p className="text-gray-300 text-sm mt-1 mb-3">
                              Have your order delivered to your fourth period classroom
                            </p>
                            {deliveryMethod === "delivery" && (
                              <div>
                                <Label htmlFor="roomTeacher" className="text-white text-sm">Room Number / Teacher Name *</Label>
                                <ThemedInput
                                  id="roomTeacher"
                                  value={formState.roomTeacher}
                                  onChange={(e) => handleInputChange('roomTeacher', e.target.value)}
                                  placeholder="e.g. Room 301 / Mr. Smith"
                                  required={deliveryMethod === "delivery"}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {!showPayment ? (
                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full min-h-11 py-3 px-6 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting || cartItems.length === 0}
                        >
                          {isSubmitting ? "Initializing Payment..." : "Proceed to Payment"}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4">
                        <CloverCheckout
                          amount={total}
                          checkoutUrl={paymentIntent?.checkoutUrl}
                          onRedirect={handleCloverRedirect}
                          onError={handleCloverError}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <BlurContainer contentVisible={contentVisible} delay="300ms" className="lg:sticky lg:top-8 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {cartItems.map(item => (
                      <div
                        key={`${item.id}-${item.size ?? ''}-${item.color ?? ''}`}
                        className="flex justify-between items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium break-words">{item.name}</h3>
                          {item.ticketType && <p className="text-gray-300 text-sm break-words">Ticket: {item.ticketType}</p>}
                          {item.size && <p className="text-gray-300 text-sm">Size: {item.size}</p>}
                          {item.color && <p className="text-gray-300 text-sm">Color: {item.color}</p>}
                          <p className="text-gray-300 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-white font-medium shrink-0 whitespace-nowrap">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/20">
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Subtotal</span>
                      <span className="shrink-0">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Tax ({taxPercentLabel})</span>
                      <span className="shrink-0">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-white font-semibold text-lg pt-2 border-t border-white/20">
                      <span>Total</span>
                      <span className="shrink-0">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-500/20 border border-amber-400/50 rounded-lg">
                    <p className="text-amber-200 text-sm">
                      <strong>Note:</strong> This is a pre-order system. You will be contacted when your items are ready for pickup or delivery.
                    </p>
                  </div>
                </div>
              </BlurContainer>
            </div>
          </div>
        </div>
      )}
    </UniversalPageLayout>
  );
}
