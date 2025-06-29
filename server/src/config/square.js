import { SquareClient, SquareEnvironment } from "square";
import { config } from "./env.js";

// Initialize Square client
const environment =
  config.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

export const squareClient = new SquareClient({
  accessToken: config.SQUARE_ACCESS_TOKEN,
  environment: environment,
});

// Get Square API instances
export const paymentsApi = squareClient.paymentsApi;
export const customersApi = squareClient.customersApi;
export const subscriptionsApi = squareClient.subscriptionsApi;
export const catalogApi = squareClient.catalogApi;
export const ordersApi = squareClient.ordersApi;
export const refundsApi = squareClient.refundsApi;
export const webhooksApi = squareClient.webhooksApi;

// Square configuration constants
export const SQUARE_CONFIG = {
  applicationId: config.SQUARE_APPLICATION_ID,
  locationId: config.SQUARE_LOCATION_ID,
  environment: config.SQUARE_ENVIRONMENT,
  webhookSignatureKey: config.SQUARE_WEBHOOK_SIGNATURE_KEY,
};

// Helper function to format money from Square (cents to dollars)
export const formatMoneyFromSquare = (amountMoney) => {
  if (!amountMoney || !amountMoney.amount) return 0;
  return parseFloat(amountMoney.amount) / 100;
};

// Helper function to create Square money object (dollars to cents)
export const formatMoney = (amount, currency = "USD") => {
  return {
    amount: Math.round(amount * 100),
    currency: currency,
  };
};

// Error handler for Square API errors
export const handleSquareError = (error) => {
  console.error("Square API Error:", error);

  if (error.result && error.result.errors) {
    const squareErrors = error.result.errors;
    const errorMessages = squareErrors
      .map((err) => err.detail || err.code)
      .join(", ");
    return { message: `Square Payment Error: ${errorMessages}` };
  }

  return { message: "Payment processing failed. Please try again." };
};

export default squareClient;
