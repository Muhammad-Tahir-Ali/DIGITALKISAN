/**
 * Web stub for @stripe/stripe-react-native.
 * The Stripe RN SDK is a native-only module (TurboModules/JSI) and crashes
 * Metro on web. Metro resolves this file instead when bundling for the web
 * platform. Card payments on web should use Stripe Checkout / Elements
 * via a separate web flow, not this SDK.
 */
import React from 'react';

export const StripeProvider = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

const notSupported = async () => ({
  error: { code: 'WebUnsupported', message: 'Stripe payments are not available on web yet.' },
});

export const useStripe = () => ({
  initPaymentSheet: notSupported,
  presentPaymentSheet: notSupported,
  confirmPayment: notSupported,
  confirmSetupIntent: notSupported,
  retrievePaymentIntent: notSupported,
  retrieveSetupIntent: notSupported,
  handleNextAction: notSupported,
  createPaymentMethod: notSupported,
  createToken: notSupported,
});

export const useConfirmPayment = () => ({
  confirmPayment: notSupported,
  loading: false,
});

export const CardField = () => null;
export const CardForm = () => null;
export const AuBECSDebitForm = () => null;

export default { StripeProvider, useStripe };
