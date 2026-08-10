import axios from 'axios';
import crypto from 'crypto';

interface CloverPaymentRequest {
  amount: number;
  currency: string;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CloverPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: 'succeeded' | 'pending' | 'failed';
  source: any;
  metadata?: Record<string, any>;
}

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  paymentMethodTypes?: string[];
  metadata?: {
    orderId?: string;
    customerEmail?: string;
    customerName?: string;
    items?: string;
  };
}

class PaymentService {
  private privateToken: string;
  private merchantId: string;
  private v3ApiToken: string;
  private v3MerchantId: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;

  constructor() {
    // Hosted Checkout credentials
    this.privateToken = process.env.CLOVER_PRIVATE_TOKEN || '';
    this.merchantId = process.env.CLOVER_MERCHANT_ID || '';
    
    // v3 API credentials (for order status checking)
    this.v3ApiToken = process.env.CLOVER_V3_API_TOKEN || '';
    this.v3MerchantId = process.env.CLOVER_V3_MERCHANT_ID || '';
    
    this.environment = (process.env.CLOVER_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.clover.com'
      : 'https://apisandbox.dev.clover.com';

    if (!this.privateToken || !this.merchantId) {
      console.warn('⚠️ Clover Hosted Checkout credentials not configured. Payment processing will not work.');
    }
    
    if (!this.v3ApiToken || !this.v3MerchantId) {
      console.warn('⚠️ Clover v3 API credentials not configured. Order status checking will not work.');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.privateToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private getV3Headers() {
    return {
      'Authorization': `Bearer ${this.v3ApiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<any> {
    // Remove trailing slash from CLIENT_URL if present
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

    try {
      // Generate unique order ID for tracking
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Parse customer name
      const fullName = request.metadata?.customerName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Parse items from metadata
      const items = JSON.parse(request.metadata?.items || '[]');

      // Determine the return URL type (cart checkout or ticket checkout)
      const isTicketCheckout = request.metadata?.submissionId ? true : false;
      const successUrl = isTicketCheckout
        ? `${clientUrl}/checkout/success?type=ticket&submissionId=${request.metadata?.submissionId}`
        : `${clientUrl}/shop/checkout/success`;
      const failureUrl = isTicketCheckout
        ? `${clientUrl}/checkout/${request.metadata?.submissionId}?error=payment_failed`
        : `${clientUrl}/shop/checkout?error=payment_failed`;

      // Create checkout session payload according to Clover API
      const checkoutPayload = {
        customer: {
          email: request.metadata?.customerEmail || '',
          firstName: firstName,
          lastName: lastName
        },
        shoppingCart: {
          lineItems: items.map((item: any) => ({
            name: item.name,
            price: Math.round(item.price * 100), // Convert to cents
            unitQty: item.quantity || 1,
            note: `Item: ${item.name}`
          }))
        },
        redirectUrls: {
          success: successUrl,
          failure: failureUrl
        }
      };

      console.log('Creating Clover checkout session with payload:', JSON.stringify(checkoutPayload, null, 2));

      // Use the correct Clover Hosted Checkout API endpoint
      const apiUrl = this.environment === 'production'
        ? 'https://api.clover.com/invoicingcheckoutservice/v1/checkouts'
        : 'https://apisandbox.dev.clover.com/invoicingcheckoutservice/v1/checkouts';

      const response = await axios.post(apiUrl, checkoutPayload, {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-Clover-Merchant-Id': this.merchantId,
          'authorization': `Bearer ${this.privateToken}`
        }
      });

      console.log('Clover checkout session response:', response.data);

      // Extract the checkout URL from response
      const checkoutUrl = response.data.href;
      const sessionId = response.data.id;

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from Clover API');
      }

      return {
        orderId: orderId,
        sessionId: sessionId,
        amount: request.amount,
        currency: request.currency || 'USD',
        checkoutUrl: checkoutUrl,
        status: 'pending'
      };
    } catch (error: any) {
      console.error('Failed to create Clover checkout session:', error.response?.data || error.message);
      
      // Log the full error for debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
      }
      
      throw new Error(`Failed to create checkout session: ${error.response?.data?.message || error.message}`);
    }
  }

  async processPayment(paymentToken: string, orderId: string): Promise<any> {
    try {
      // Process payment with Clover
      const response = await axios.post(
        `${this.baseUrl}/v1/orders/${orderId}/pay`,
        {
          source: paymentToken,
          receipt_email: true
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        transactionId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100, // Convert from cents
        paymentMethod: response.data.source?.brand || 'card',
        last4: response.data.source?.last4
      };
    } catch (error: any) {
      console.error('Payment processing failed:', error.response?.data || error.message);
      throw new Error('Payment processing failed');
    }
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      if (!this.v3ApiToken || !this.v3MerchantId) {
        console.warn('v3 API credentials not configured');
        return {
          orderId: orderId,
          status: 'pending',
          amount: 0,
          paymentStatus: 'pending'
        };
      }

      // Check using Clover's v3 Orders API with v3 credentials
      const response = await axios.get(
        `${this.baseUrl}/v3/merchants/${this.v3MerchantId}/orders/${orderId}`,
        { 
          headers: this.getV3Headers()
        }
      );

      if (response.data) {
        const order = response.data;
        // Check if order has payments
        const paymentsResponse = await axios.get(
          `${this.baseUrl}/v3/merchants/${this.v3MerchantId}/orders/${orderId}/payments`,
          { headers: this.getV3Headers() }
        );
        
        const payments = paymentsResponse.data?.elements || [];
        const isPaid = payments.some((p: any) => p.result === 'SUCCESS' || p.state === 'CLOSED');
        
        return {
          orderId: orderId,
          status: isPaid ? 'paid' : 'pending',
          amount: order.total ? order.total / 100 : 0,
          paymentStatus: isPaid ? 'paid' : 'pending',
          payments: payments
        };
      }

      return {
        orderId: orderId,
        status: 'pending',
        amount: 0,
        paymentStatus: 'pending'
      };
    } catch (error: any) {
      // If order not found in Clover, return pending
      console.log(`Order ${orderId} status check:`, error.response?.status === 404 ? 'Not found in Clover' : 'API Error');
      return {
        orderId: orderId,
        status: 'pending',
        amount: 0,
        paymentStatus: 'pending'
      };
    }
  }

  // New method to sync all pending orders with Clover
  async syncOrderStatuses(orderIds: string[]): Promise<Map<string, string>> {
    const statusMap = new Map<string, string>();
    
    for (const orderId of orderIds) {
      if (!orderId) continue;
      
      try {
        const status = await this.getPaymentStatus(orderId);
        statusMap.set(orderId, status.paymentStatus);
      } catch (error) {
        statusMap.set(orderId, 'pending');
      }
    }
    
    return statusMap;
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/refunds`,
        {
          charge: transactionId,
          amount: amount ? Math.round(amount * 100) : undefined
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        refundId: response.data.id,
        amount: response.data.amount / 100,
        status: response.data.status
      };
    } catch (error: any) {
      console.error('Refund failed:', error.response?.data || error.message);
      throw new Error('Refund processing failed');
    }
  }

  // Generate a secure payment token for client-side use
  generateClientToken(orderId: string): string {
    const timestamp = Date.now();
    const data = `${this.merchantId}:${orderId}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.privateToken)
      .update(data)
      .digest('hex');
    
    return Buffer.from(JSON.stringify({
      merchantId: this.merchantId,
      orderId,
      timestamp,
      signature,
      environment: this.environment
    })).toString('base64');
  }

  // Verify webhook signature from Clover
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️ CLOVER_WEBHOOK_SECRET not configured - webhook signature verification disabled');
      return true; // Allow webhook in development if secret not configured
    }

    try {
      // Clover typically sends signatures in the format "sha256=<hash>"
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
      
      // Handle different signature formats
      const receivedSignature = signature.startsWith('sha256=') 
        ? signature.substring(7) 
        : signature;
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();