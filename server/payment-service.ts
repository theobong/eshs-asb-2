import axios from 'axios';
import crypto from 'crypto';

interface CheckoutLineItem {
  name: string;
  unitPrice: number;
  quantity: number;
}

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  paymentMethodTypes?: string[];
  lineItems: CheckoutLineItem[];
  metadata?: {
    orderId?: string;
    customerEmail?: string;
    customerName?: string;
    submissionId?: string;
  };
}

export interface PaymentVerification {
  checked: boolean;
  paid: boolean;
  amount?: number;
  reason: string;
}

class PaymentService {
  private privateToken: string;
  private merchantId: string;
  private v3ApiToken: string;
  private v3MerchantId: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;

  constructor() {
    this.privateToken = process.env.CLOVER_PRIVATE_TOKEN || '';
    this.merchantId = process.env.CLOVER_MERCHANT_ID || '';

    this.v3ApiToken = process.env.CLOVER_V3_API_TOKEN || '';
    this.v3MerchantId = process.env.CLOVER_V3_MERCHANT_ID || '';

    this.environment = (process.env.CLOVER_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    this.baseUrl = this.environment === 'production'
      ? 'https://api.clover.com'
      : 'https://apisandbox.dev.clover.com';

    if (!this.privateToken || !this.merchantId) {
      console.warn('Clover Hosted Checkout credentials not configured. Payment processing will not work.');
    }

    if (!this.v3ApiToken || !this.v3MerchantId) {
      console.warn('Clover v3 API credentials not configured. Order status checking will not work.');
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
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      const fullName = request.metadata?.customerName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const isTicketCheckout = request.metadata?.submissionId ? true : false;
      const successUrl = isTicketCheckout
        ? `${clientUrl}/checkout/success?type=ticket&submissionId=${request.metadata?.submissionId}`
        : `${clientUrl}/shop/checkout/success`;
      const failureUrl = isTicketCheckout
        ? `${clientUrl}/checkout/${request.metadata?.submissionId}?error=payment_failed`
        : `${clientUrl}/shop/checkout?error=payment_failed`;

      const checkoutPayload = {
        customer: {
          email: request.metadata?.customerEmail || '',
          firstName: firstName,
          lastName: lastName
        },
        shoppingCart: {
          lineItems: request.lineItems.map((item) => ({
            name: item.name,
            price: Math.round(item.unitPrice * 100),
            unitQty: item.quantity,
            note: `Item: ${item.name}`
          }))
        },
        redirectUrls: {
          success: successUrl,
          failure: failureUrl
        }
      };

      console.log('Creating Clover checkout session with payload:', JSON.stringify(checkoutPayload, null, 2));

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
        amount: response.data.amount / 100,
        paymentMethod: response.data.source?.brand || 'card',
        last4: response.data.source?.last4
      };
    } catch (error: any) {
      console.error('Payment processing failed:', error.response?.data || error.message);
      throw new Error('Payment processing failed');
    }
  }

  async verifyOrderPayment(cloverOrderId: string, expectedAmount?: number): Promise<PaymentVerification> {
    if (!cloverOrderId) {
      return { checked: false, paid: false, reason: 'no Clover order id recorded for this purchase' };
    }

    if (!this.v3ApiToken || !this.v3MerchantId) {
      return { checked: false, paid: false, reason: 'CLOVER_V3_API_TOKEN/CLOVER_V3_MERCHANT_ID not configured' };
    }

    try {
      const paymentsResponse = await axios.get(
        `${this.baseUrl}/v3/merchants/${this.v3MerchantId}/orders/${cloverOrderId}/payments`,
        { headers: this.getV3Headers() }
      );

      const payments = paymentsResponse.data?.elements || [];
      const successful = payments.filter((p: any) => p.result === 'SUCCESS' || p.state === 'CLOSED');

      if (successful.length === 0) {
        return { checked: true, paid: false, reason: 'Clover reports no successful payment on this order' };
      }

      const paidCents = successful.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const paidAmount = paidCents / 100;

      if (typeof expectedAmount === 'number') {
        const shortfall = expectedAmount - paidAmount;
        if (shortfall > 0.01) {
          return {
            checked: true,
            paid: false,
            amount: paidAmount,
            reason: `Clover payment of $${paidAmount.toFixed(2)} is short of the $${expectedAmount.toFixed(2)} owed`
          };
        }
      }

      return { checked: true, paid: true, amount: paidAmount, reason: 'confirmed by Clover' };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { checked: true, paid: false, reason: 'Clover does not know this order id' };
      }
      console.error('Clover payment verification call failed:', error.response?.data || error.message);
      return { checked: false, paid: false, reason: 'Clover API request failed' };
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

      const response = await axios.get(
        `${this.baseUrl}/v3/merchants/${this.v3MerchantId}/orders/${orderId}`,
        {
          headers: this.getV3Headers()
        }
      );

      if (response.data) {
        const order = response.data;
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
      console.log(`Order ${orderId} status check:`, error.response?.status === 404 ? 'Not found in Clover' : 'API Error');
      return {
        orderId: orderId,
        status: 'pending',
        amount: 0,
        paymentStatus: 'pending'
      };
    }
  }

  async syncOrderStatuses(orderIds: string[]): Promise<Map<string, string>> {
    const statusMap = new Map<string, string>();

    for (const orderId of orderIds) {
      if (!orderId) continue;

      try {
        const status = await this.getPaymentStatus(orderId);
        statusMap.set(orderId, status.paymentStatus);
      } catch {
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

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CLOVER_WEBHOOK_SECRET not configured - rejecting webhook, cannot prove it came from Clover');
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const receivedSignature = signature.startsWith('sha256=')
        ? signature.substring(7)
        : signature;

      const expected = Buffer.from(expectedSignature);
      const received = Buffer.from(receivedSignature);

      if (expected.length !== received.length) {
        return false;
      }

      return crypto.timingSafeEqual(expected, received);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();
