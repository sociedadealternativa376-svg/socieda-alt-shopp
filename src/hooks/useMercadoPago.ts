import { useState, useEffect, useCallback } from "react";
import { initMercadoPago, getMercadoPago, MERCADOPAGO_PUBLIC_KEY } from "@/lib/mercadopago";

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
  installments: number;
}

interface Installment {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  recomended_message: string;
  installment_amount: number;
  total_amount: number;
  payment_method_option_id: string;
}

interface UseMercadoPagoReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  mp: any;
  publicKey: string;
  // Card methods
  getInstallments: (bin: string, amount: number) => Promise<Installment[]>;
  createCardToken: (cardData: CardFormData) => Promise<string>;
  getPaymentMethods: (bin: string) => Promise<any>;
  getIdentificationTypes: () => Promise<any[]>;
  // Pix methods
  createPixPayment: (amount: number, description: string, email: string) => Promise<any>;
}

export const useMercadoPago = (): UseMercadoPagoReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const instance = await initMercadoPago();
        setMp(instance);
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar Mercado Pago");
        setIsLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Get available installments for a card BIN
   */
  const getInstallments = useCallback(async (bin: string, amount: number): Promise<Installment[]> => {
    if (!mp) throw new Error("Mercado Pago não inicializado");
    
    try {
      const response = await mp.getInstallments({
        amount: String(amount),
        bin: bin,
      });
      
      if (response && response.length > 0) {
        return response[0].payer_costs || [];
      }
      return [];
    } catch (err) {
      console.error("Erro ao buscar parcelas:", err);
      throw err;
    }
  }, [mp]);

  /**
   * Get payment methods for a card BIN
   */
  const getPaymentMethods = useCallback(async (bin: string): Promise<any> => {
    if (!mp) throw new Error("Mercado Pago não inicializado");
    
    try {
      const response = await mp.getPaymentMethods({ bin });
      return response.results?.[0] || null;
    } catch (err) {
      console.error("Erro ao buscar métodos de pagamento:", err);
      throw err;
    }
  }, [mp]);

  /**
   * Get identification types (CPF, CNPJ, etc.)
   */
  const getIdentificationTypes = useCallback(async (): Promise<any[]> => {
    if (!mp) throw new Error("Mercado Pago não inicializado");
    
    try {
      const response = await mp.getIdentificationTypes();
      return response || [];
    } catch (err) {
      console.error("Erro ao buscar tipos de documento:", err);
      throw err;
    }
  }, [mp]);

  /**
   * Create a card token for processing payment
   */
  const createCardToken = useCallback(async (cardData: CardFormData): Promise<string> => {
    if (!mp) throw new Error("Mercado Pago não inicializado");
    
    try {
      const cardTokenResponse = await mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ""),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.cardExpirationMonth,
        cardExpirationYear: cardData.cardExpirationYear,
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber,
      });
      
      if (cardTokenResponse.error) {
        throw new Error(cardTokenResponse.message || "Erro ao criar token do cartão");
      }
      
      return cardTokenResponse.id;
    } catch (err) {
      console.error("Erro ao criar token do cartão:", err);
      throw err;
    }
  }, [mp]);

  /**
   * Create Pix payment data (to be processed by backend)
   */
  const createPixPayment = useCallback(async (
    amount: number, 
    description: string, 
    email: string
  ): Promise<any> => {
    // Note: Pix payment creation requires backend with Access Token
    // This returns the data structure needed for the backend
    return {
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: {
        email,
      },
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    mp,
    publicKey: MERCADOPAGO_PUBLIC_KEY,
    getInstallments,
    createCardToken,
    getPaymentMethods,
    getIdentificationTypes,
    createPixPayment,
  };
};

export default useMercadoPago;
