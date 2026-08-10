import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, ExternalLink } from 'lucide-react';

const ACCEPTED_CARDS = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];

interface CloverCheckoutProps {
  amount: number;
  checkoutUrl?: string;
  onRedirect: (checkoutUrl: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function CloverCheckout({
  amount,
  checkoutUrl,
  onRedirect,
  onError,
  disabled
}: CloverCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!checkoutUrl) {
      onError('Checkout URL not available');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      onRedirect(checkoutUrl);
    } catch (error) {
      console.error('Checkout error:', error);
      onError(error instanceof Error ? error.message : 'Failed to initialize checkout');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-green-500" />
        <span className="text-sm text-gray-300">Secure payment powered by Clover</span>
      </div>

      <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
        <div className="space-y-4">
          <div className="text-center">
            <CreditCard className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Secure Checkout</h3>
            <p className="text-sm text-gray-300 mb-6">
              You'll be redirected to Clover's secure payment page to complete your purchase.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-medium">Total Amount:</span>
              <span className="text-white font-bold text-xl">
                ${amount.toFixed(2)}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isLoading || disabled}
              className="w-full min-h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting to Clover...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pay with Clover
                </>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              You'll be taken to Clover's secure payment page and returned here after payment.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {ACCEPTED_CARDS.map((card) => (
              <span
                key={card}
                className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-semibold tracking-wide text-gray-300"
              >
                {card}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
