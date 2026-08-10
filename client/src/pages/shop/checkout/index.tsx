import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ThemedPageWrapper, ThemedCard, PrimaryButton, OutlineButton, ThemedInput } from "@/components/ThemedComponents";
import { useCart } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";
import { CloverCheckout } from "@/components/CloverCheckout";
import { createPaymentIntent, createPurchase } from "@/lib/api";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cartItems, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomTeacher: "" // For fourth period delivery
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleBackToCart = () => {
    setLocation("/shop/cart");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate delivery details
    if (deliveryMethod === "delivery" && !formState.roomTeacher) {
      toast({
        title: "Missing Information",
        description: "Please provide room number and teacher name for delivery.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment intent with Clover
      const intent = await createPaymentIntent({
        amount: total,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        customerEmail: formState.email,
        customerName: `${formState.firstName} ${formState.lastName}`
      });

      // Create the purchase record first (with pending status)
      const purchaseData = {
        studentName: `${formState.firstName} ${formState.lastName}`,
        studentEmail: formState.email,
        phone: formState.phone,
        productName: cartItems.map(item => item.name).join(', '),
        quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        amount: total,
        paymentMethod: 'card',
        status: 'pending',
        cloverOrderId: intent.orderId,
        cloverSessionId: intent.sessionId, // Store the session ID for webhook lookup
        deliveryMethod,
        deliveryDetails: deliveryMethod === 'delivery' ? {
          roomTeacher: formState.roomTeacher
        } : undefined,
        notes: JSON.stringify(cartItems.map(item => ({
          ...item,
          productId: item.id // Ensure productId is included for stock updates
        }))) // Store cart items for later use
      };

      const purchase = await createPurchase(purchaseData);

      // Store purchase info for verification on return from Clover
      sessionStorage.setItem('pending-cart-purchase', JSON.stringify({
        purchaseId: purchase._id,
        cloverSessionId: intent.sessionId,
        timestamp: Date.now()
      }));

      setPaymentIntent(intent);
      setShowPayment(true);
      setIsSubmitting(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleCloverRedirect = (checkoutUrl: string) => {
    // Store current form data in session storage so we can clear cart on return
    sessionStorage.setItem('checkout-form-data', JSON.stringify(formState));
    sessionStorage.setItem('checkout-cart-items', JSON.stringify(cartItems));

    // Redirect to Clover checkout
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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0875; // 8.75% tax
  const total = subtotal + tax;

  return (
    <UniversalPageLayout 
      pageType="shop" 
      title="Order Information" 
      backButtonText="Back to Cart"
      onBackClick={handleBackToCart}
    >
      {({ contentVisible }) => (
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Form */}
            <div className="lg:col-span-2">
              <div 
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '200ms'
                }}
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Delivery Method */}
                    <div>
                      <Label className="text-white text-lg font-medium mb-4 block">Delivery Method *</Label>
                      <RadioGroup 
                        value={deliveryMethod} 
                        onValueChange={setDeliveryMethod}
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
                          onClick={handleSubmit}
                          className="w-full py-3 px-6 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <BlurContainer contentVisible={contentVisible} delay="300ms" className="sticky top-8 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{item.name}</h3>
                          {item.size && <p className="text-gray-300 text-sm">Size: {item.size}</p>}
                          {item.color && <p className="text-gray-300 text-sm">Color: {item.color}</p>}
                          <p className="text-gray-300 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-white font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax (8.75%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-white/20">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
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