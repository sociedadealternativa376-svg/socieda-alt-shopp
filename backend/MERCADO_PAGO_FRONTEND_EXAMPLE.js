// Exemplo de integração Mercado Pago no React/TypeScript
// Coloque este código no seu componente de checkout

import { useState } from 'react';

// Tipos para Mercado Pago
interface MercadoPagoPayment {
  success: boolean;
  id: string;
  status: string;
  message: string;
}

interface MercadoPagoPix {
  success: boolean;
  id: string;
  qr_code_base64: string;
  qr_code_text: string;
  expires_in: number;
}

// Hook customizado para Mercado Pago
export const useMercadoPago = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criar pagamento com cartão
  const createCardPayment = async (
    items: any[],
    payer: any,
    card: any,
    installments: number = 1
  ): Promise<MercadoPagoPayment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          payer,
          card,
          installments
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Erro ao processar pagamento');
        return null;
      }

      return data;
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Criar pagamento Pix
  const createPixPayment = async (
    items: any[],
    payer: any
  ): Promise<MercadoPagoPix | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          payer
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Erro ao gerar Pix');
        return null;
      }

      return data;
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar opções de parcelamento
  const fetchInstallments = async (bin: string, amount: number) => {
    try {
      const response = await fetch(
        `/api/installments?bin=${bin}&amount=${amount}`
      );
      const data = await response.json();

      if (data.success && data.data && data.data[0]?.payer_costs) {
        return data.data[0].payer_costs;
      }

      return [];
    } catch (err) {
      console.error('Erro ao buscar parcelamento:', err);
      return [];
    }
  };

  // Consultar status de pagamento
  const getPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payment/${paymentId}`);
      const data = await response.json();

      if (data.success) {
        return data;
      }

      return null;
    } catch (err) {
      console.error('Erro ao consultar pagamento:', err);
      return null;
    }
  };

  // Criar preferência (Checkout Pro)
  const createPreference = async (items: any[], payer: any) => {
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, payer })
      });

      const data = await response.json();

      if (data.success) {
        return data.init_point; // URL para redirecionamento
      }

      return null;
    } catch (err) {
      console.error('Erro ao criar preferência:', err);
      return null;
    }
  };

  return {
    isLoading,
    error,
    createCardPayment,
    createPixPayment,
    fetchInstallments,
    getPaymentStatus,
    createPreference
  };
};

// Exemplo de componente usando o hook
export const CheckoutMercadoPago = () => {
  const { createCardPayment, createPixPayment, isLoading, error } = useMercadoPago();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  const handleCardPayment = async () => {
    const result = await createCardPayment(
      [
        {
          id: '1',
          unit_price: 99.90,
          quantity: 2
        }
      ],
      {
        email: 'cliente@exemplo.com',
        name: 'João Silva',
        phone: '11999999999'
      },
      {
        number: '4111111111111111',
        holder_name: 'JOAO SILVA',
        expiration_month: 12,
        expiration_year: 25,
        security_code: '123'
      },
      1
    );

    if (result?.success) {
      alert('Pagamento aprovado!');
      // Redirecionar para página de sucesso
    }
  };

  const handlePixPayment = async () => {
    const result = await createPixPayment(
      [
        {
          unit_price: 199.80,
          quantity: 1
        }
      ],
      {
        email: 'cliente@exemplo.com',
        name: 'João Silva'
      }
    );

    if (result?.success) {
      // Exibir QR Code
      const img = new Image();
      img.src = `data:image/png;base64,${result.qr_code_base64}`;
      document.body.appendChild(img);

      // Copiar código para clipboard
      navigator.clipboard.writeText(result.qr_code_text);
      alert('QR Code copiado para clipboard!');
    }
  };

  return (
    <div className="payment-container">
      <h2>Escolha o método de pagamento</h2>

      {error && <div className="error">{error}</div>}

      <div className="payment-methods">
        <button
          onClick={() => setPaymentMethod('card')}
          className={paymentMethod === 'card' ? 'active' : ''}
        >
          💳 Cartão
        </button>
        <button
          onClick={() => setPaymentMethod('pix')}
          className={paymentMethod === 'pix' ? 'active' : ''}
        >
          🎯 Pix
        </button>
      </div>

      {paymentMethod === 'card' && (
        <button
          onClick={handleCardPayment}
          disabled={isLoading}
          className="pay-button"
        >
          {isLoading ? 'Processando...' : 'Pagar com Cartão'}
        </button>
      )}

      {paymentMethod === 'pix' && (
        <button
          onClick={handlePixPayment}
          disabled={isLoading}
          className="pay-button"
        >
          {isLoading ? 'Gerando...' : 'Gerar QR Code Pix'}
        </button>
      )}
    </div>
  );
};

export default CheckoutMercadoPago;
