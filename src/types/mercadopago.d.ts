// Type definitions for Mercado Pago SDK v2

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: MercadoPagoOptions) => MercadoPagoInstance;
  }
}

interface MercadoPagoOptions {
  locale?: "pt-BR" | "es-AR" | "es-MX" | "en-US";
}

interface MercadoPagoInstance {
  getInstallments: (options: GetInstallmentsOptions) => Promise<InstallmentsResponse[]>;
  getPaymentMethods: (options: GetPaymentMethodsOptions) => Promise<PaymentMethodsResponse>;
  getIdentificationTypes: () => Promise<IdentificationType[]>;
  createCardToken: (cardData: CardTokenData) => Promise<CardTokenResponse>;
  cardForm: (options: CardFormOptions) => CardFormInstance;
}

interface GetInstallmentsOptions {
  amount: string;
  bin: string;
  processingMode?: string;
}

interface InstallmentsResponse {
  payment_method_id: string;
  payment_type_id: string;
  issuer: {
    id: string;
    name: string;
  };
  payer_costs: PayerCost[];
}

interface PayerCost {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  recomended_message: string;
  installment_amount: number;
  total_amount: number;
  payment_method_option_id: string;
}

interface GetPaymentMethodsOptions {
  bin: string;
}

interface PaymentMethodsResponse {
  results: PaymentMethod[];
}

interface PaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  thumbnail: string;
  secure_thumbnail: string;
}

interface IdentificationType {
  id: string;
  name: string;
  type: string;
  min_length: number;
  max_length: number;
}

interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface CardTokenResponse {
  id: string;
  public_key: string;
  first_six_digits: string;
  last_four_digits: string;
  cardholder: {
    name: string;
    identification: {
      number: string;
      type: string;
    };
  };
  error?: boolean;
  message?: string;
}

interface CardFormOptions {
  amount: string;
  iframe: boolean;
  form: {
    id: string;
    cardNumber: { id: string; placeholder?: string };
    expirationDate: { id: string; placeholder?: string };
    securityCode: { id: string; placeholder?: string };
    cardholderName: { id: string; placeholder?: string };
    issuer: { id: string; placeholder?: string };
    installments: { id: string; placeholder?: string };
    identificationType: { id: string };
    identificationNumber: { id: string; placeholder?: string };
    cardholderEmail: { id: string; placeholder?: string };
  };
  callbacks: {
    onFormMounted: (error?: Error) => void;
    onSubmit: (event: Event) => void;
    onFetching: (resource: string) => () => void;
  };
}

interface CardFormInstance {
  mount: () => void;
  unmount: () => void;
  createCardToken: () => Promise<CardTokenResponse>;
  getCardFormData: () => any;
}

export {};
