import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { PrimaryButton } from "@/components/ThemedComponents";
import { useCart, calculateCartTotals, SALES_TAX_RATE, type CartItem } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";

const cartLineKey = (item: CartItem) => `${item.id}-${item.size ?? ''}-${item.color ?? ''}`;

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const handleRemoveItem = (item: CartItem) => {
    removeFromCart(item.id, item.size, item.color);
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    });
  };

  const handleContinueShopping = () => {
    const referrer = sessionStorage.getItem('cart-referrer');
    setLocation(referrer || "/shop");
    sessionStorage.removeItem('cart-referrer');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checking out",
        variant: "destructive"
      });
      return;
    }

    setLocation("/shop/checkout");
  };

  const { subtotal, tax, total } = calculateCartTotals(cartItems);
  const taxPercentLabel = `${(SALES_TAX_RATE * 100).toFixed(2)}%`;

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Your Shopping Cart"
      backButtonText="Back"
      onBackClick={handleContinueShopping}
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
                  {cartItems.length > 0 ? (
                    <div className="space-y-6">
                      {cartItems.map((item, index) => (
                        <div
                          key={cartLineKey(item)}
                          className="flex gap-3 sm:gap-4 pb-6 border-b border-white/10 last:border-b-0 last:pb-0 transform transition-all duration-500 ease-out"
                          style={{
                            opacity: contentVisible ? 1 : 0,
                            transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                            transitionDelay: `${300 + (index * 100)}ms`
                          }}
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-900 rounded-md overflow-hidden">
                            {item.type === 'event' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                            ) : (
                              <img
                                src={item.image || "/api/placeholder/100/100"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/100?text=Product";
                                }}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-white break-words">{item.name}</h3>
                                <div className="text-sm text-gray-300">
                                  {item.type === 'event' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-200 border border-blue-500/30 break-words">
                                      {item.ticketType ? `${item.ticketType} Ticket` : 'Event Ticket'}
                                    </span>
                                  ) : (
                                    <>
                                      {item.size && <span className="mr-2">Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="font-semibold text-white shrink-0 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</div>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
                              <div className="flex items-center">
                                <button
                                  aria-label={`Decrease quantity of ${item.name}`}
                                  className="h-11 w-11 rounded-r-none bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                  onClick={() => updateQuantity(item.id, -1, item.size, item.color)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <div className="h-11 w-12 flex items-center justify-center border-y border-white/10 bg-white/5 text-white">
                                  {item.quantity}
                                </div>
                                <button
                                  aria-label={`Increase quantity of ${item.name}`}
                                  className="h-11 w-11 rounded-l-none bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                  onClick={() => updateQuantity(item.id, 1, item.size, item.color)}
                                  disabled={typeof item.maxQuantity === 'number' && item.quantity >= item.maxQuantity}
                                >
                                  +
                                </button>
                              </div>

                              <PrimaryButton
                                onClick={() => handleRemoveItem(item)}
                                className="text-red-400 hover:text-red-300 min-h-11 py-2 px-3 text-sm flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                                Remove
                              </PrimaryButton>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="text-center">
                        <PrimaryButton
                          onClick={handleContinueShopping}
                          className="min-h-11 py-2 px-4"
                        >
                          Continue Shopping
                        </PrimaryButton>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-white">Your cart is empty</h3>
                      <p className="mt-1 text-gray-300">Looks like you haven't added anything to your cart yet.</p>
                      <div className="mt-6">
                        <PrimaryButton
                          onClick={handleContinueShopping}
                          className="min-h-11 py-3 px-6 font-semibold"
                        >
                          Start Shopping
                        </PrimaryButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '400ms'
                }}
              >
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white">Order Summary</h2>

                  <div className="space-y-4">
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Subtotal ({cartItems.reduce((count, item) => count + item.quantity, 0)} items)</span>
                      <span className="shrink-0">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Estimated Tax ({taxPercentLabel})</span>
                      <span className="shrink-0">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Shipping</span>
                      <span className="text-green-400 shrink-0">Free</span>
                    </div>

                    <Separator className="my-4 bg-white/10" />

                    <div className="flex justify-between gap-3 text-lg font-bold text-white">
                      <span>Total</span>
                      <span className="shrink-0">${total.toFixed(2)}</span>
                    </div>

                    <PrimaryButton
                      onClick={handleCheckout}
                      className="w-full min-h-11 mt-4 py-3 px-6 font-semibold"
                      disabled={cartItems.length === 0}
                    >
                      {cartItems.length === 0 ? 'Add Items to Cart' : 'Proceed to Checkout'}
                    </PrimaryButton>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-300">
                        Secure payment processing powered by Clover. Your order will be processed after payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 p-4 sm:p-6 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '500ms'
                }}
              >
                <div className="flex items-center mb-4">
                  <Badge className="bg-emerald-500">Supporting School Organizations</Badge>
                </div>
                <p className="text-sm text-gray-300">
                  Your purchase directly supports our school's organizations and activities.
                  Thank you for your contribution to our community!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </UniversalPageLayout>
  );
}
