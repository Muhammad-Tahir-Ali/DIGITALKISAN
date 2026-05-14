import api from './api';

export interface StripeTopupIntent {
  clientSecret: string;
  publishableKey: string | null;
  depositId: string;
  amount: number;
}

const paymentService = {
  /**
   * Create a Stripe PaymentIntent for a wallet top-up. Returns the client_secret
   * which the mobile SDK uses to present the payment sheet.
   */
  createStripeTopupIntent: async (amount: number): Promise<StripeTopupIntent> => {
    const { data } = await api.post('/payments/topup/intent', { amount });
    return data.data;
  },

  /**
   * Fetch payment configuration (which gateways are enabled, publishable key).
   * Useful for showing or hiding payment method options based on server config.
   */
  getConfig: async (): Promise<{ stripePublishableKey: string | null; stripeEnabled: boolean }> => {
    const { data } = await api.get('/payments/config');
    return data.data;
  },
};

export default paymentService;
