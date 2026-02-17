import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckoutOrderSummary, CheckoutShippingForm, CheckoutPaymentSection } from '@/components/checkout';

type PaymentMethod = 'card' | 'pix';
type CheckoutStep = 'shipping' | 'payment';

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

interface FormErrors {
  [key: string]: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, total, clearCart } = useCart();

  // Step do checkout
  const [step, setStep] = useState<CheckoutStep>('shipping');

  // Estados de pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Dados do cliente + endereço
  const [customerData, setCustomerData] = useState({
    email: '',
    name: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [shippingErrors, setShippingErrors] = useState<FormErrors>({});
  const [loadingCep, setLoadingCep] = useState(false);

  // Cartão
  const [cardData, setCardData] = useState<CardFormData>({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState<FormErrors>({});
  const [mpLoaded, setMpLoaded] = useState(false);
  const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || '';
  // API Base URL - usa variável de ambiente ou fallback para localhost
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  // Pix
  const [pixData, setPixData] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items.length, navigate]);

  // Load Mercado Pago JS (v1) for tokenization (invisible checkout)
  useEffect(() => {
    if (!MP_PUBLIC_KEY) return;

    const id = 'mp-sdk-js';
    if (document.getElementById(id)) {
      // already loaded
      try {
        (window as any).Mercadopago.setPublishableKey(MP_PUBLIC_KEY);
        setMpLoaded(true);
      } catch (e) {
        // ignore
      }
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js';
    script.async = true;
    script.onload = () => {
      try {
        (window as any).Mercadopago.setPublishableKey(MP_PUBLIC_KEY);
        setMpLoaded(true);
      } catch (e) {
        console.error('Erro ao inicializar MercadoPago SDK:', e);
      }
    };
    script.onerror = (e) => console.error('Falha ao carregar SDK MercadoPago', e);
    document.head.appendChild(script);
  }, []);

  // Copiar para clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  // Buscar endereço pelo CEP (ViaCEP)
  const fetchAddressByCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCustomerData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // ignore
    } finally {
      setLoadingCep(false);
    }
  };

  const formatCep = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  // Handle Pix button: use Checkout Pro preference (opens Mercado Pago checkout)
  const handlePixPayment = async () => {
    // Validação dos dados do cliente e endereço
    if (!customerData.email || !customerData.name || !customerData.phone) {
      setError('Por favor, preencha todos os dados de entrega antes de gerar o PIX');
      return;
    }
    if (!customerData.cep || !customerData.street || !customerData.number || !customerData.city || !customerData.state) {
      setError('Por favor, preencha o endereço completo (CEP, rua, número, cidade e estado)');
      return;
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const resp = await fetch(`${API_BASE}/api/create-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          description: `Pagamento via PIX - ${items.length} item(ns)`,
          payer: {
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone
          }
        })
      })

      // Verificar se a resposta foi recebida
      if (!resp.ok) {
        // Tentar parsear erro do servidor
        try {
          const errorData = await resp.json()
          throw new Error(errorData.error || errorData.message || `Erro do servidor: ${resp.status}`)
        } catch (parseError) {
          if (resp.status === 0 || resp.status >= 500) {
            throw new Error(`Servidor não está respondendo em ${API_BASE}. Em produção, configure VITE_API_BASE_URL na Vercel.`)
          }
          if (resp.status === 405) {
            throw new Error(`Método não permitido (405). Confira na Vercel: variável VITE_API_BASE_URL (com underscore), URL do Railway sem barra no final. Depois faça Redeploy.`)
          }
          throw new Error(`Erro ao conectar com o servidor: ${resp.statusText}`)
        }
      }

      const data = await resp.json()
      
      if (data.success) {
        // Extract QR code data from backend response
        const qrCodeData = data.point_of_interaction?.transaction_data
        
        if (qrCodeData) {
          // Map backend response to frontend state format
          setPixData({
            qr_code_base64: qrCodeData.qr_code_base64,
            qr_copy_text: qrCodeData.qr_code || qrCodeData.qr_code_text,
            id: data.id,
            status: data.status,
            ticket_url: qrCodeData.ticket_url
          })
          setError('') // Limpar erros anteriores
        } else {
          setError('QR Code não disponível na resposta do servidor')
        }
      } else {
        setError(data.error || data.message || 'Erro ao criar pagamento PIX')
      }
    } catch (err: any) {
      console.error('Erro ao criar PIX:', err)
      
      // Mensagens de erro mais específicas
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
        setError(isProduction
          ? 'Não foi possível conectar à API de pagamento. Configure a variável VITE_API_BASE_URL na Vercel com a URL do seu backend.'
          : `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE}`)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Erro ao criar pagamento PIX. Tente novamente.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  // Formatar data de validade
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // Validar cartão (Luhn)
  const isValidCardNumber = (num: string) => {
    const digits = num.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits)) return false;

    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  // Validar formulário de cartão
  const validateCard = () => {
    const errors: FormErrors = {};

    if (!cardData.cardNumber.trim()) {
      errors.cardNumber = 'Número do cartão é obrigatório';
    } else if (!isValidCardNumber(cardData.cardNumber)) {
      errors.cardNumber = 'Número do cartão inválido';
    }

    if (!cardData.cardholderName.trim()) {
      errors.cardholderName = 'Nome do titular é obrigatório';
    }

    if (!cardData.expiryDate.trim()) {
      errors.expiryDate = 'Data de validade é obrigatória';
    } else {
      const [month, year] = cardData.expiryDate.split('/');
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      const expYear = parseInt(year, 10);
      const expMonth = parseInt(month, 10);

      if (isNaN(expMonth) || isNaN(expYear) || expMonth < 1 || expMonth > 12) {
        errors.expiryDate = 'Data inválida';
      } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.expiryDate = 'Cartão expirado';
      }
    }

    if (!cardData.cvv.trim()) {
      errors.cvv = 'CVV é obrigatório';
    } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
      errors.cvv = 'CVV inválido';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Buscar parcelamento
  const fetchInstallments = async () => {
    const cardNum = cardData.cardNumber.replace(/\s/g, '');
    const bin = cardNum.slice(0, 6);

    if (bin.length < 6) {
      setCardErrors({ ...cardErrors, cardNumber: 'Informe pelo menos 6 dígitos' });
      return;
    }

    try {
      const resp = await fetch(
        `${API_BASE}/api/installments?bin=${encodeURIComponent(bin)}&amount=${encodeURIComponent(String(total))}`
      );
      const data = await resp.json();

      if (data.success && data.data && data.data[0]?.payer_costs) {
        setInstallments(data.data[0].payer_costs);
        setSelectedInstallment(data.data[0].payer_costs[0]);
      } else {
        setInstallments([]);
        setSelectedInstallment(null);
      }
    } catch (err) {
      console.error('Erro ao buscar parcelamento:', err);
    }
  };

  // Processar pagamento com cartão
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.email || !customerData.name || !customerData.phone) {
      setError('Preencha todos os dados de entrega.');
      return;
    }
    if (!customerData.cep || !customerData.street || !customerData.number || !customerData.city || !customerData.state) {
      setError('Preencha o endereço completo (CEP, rua, número, cidade e estado).');
      return;
    }
    if (!validateCard()) return;

    setIsProcessing(true);
    setError('');

    try {
      // Tokenize card on client if SDK loaded
      let cardToken: string | undefined;
      if (mpLoaded && (window as any).Mercadopago) {
        const mp = (window as any).Mercadopago;
        // createToken expects card data object
        const payload = {
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          expirationMonth: String(cardData.expiryDate.split('/')[0]),
          expirationYear: String(cardData.expiryDate.split('/')[1]),
          securityCode: cardData.cvv,
          cardholderName: cardData.cardholderName,
        };

        cardToken = await new Promise<string | undefined>((resolve) => {
          try {
            mp.createToken(payload, (status: number, resp: any) => {
              if (status === 200 || status === 201) {
                resolve(resp.id);
              } else {
                console.error('Erro tokenizacao MP', status, resp);
                resolve(undefined);
              }
            });
          } catch (err) {
            console.error('Erro ao tokenizar cartão:', err);
            resolve(undefined);
          }
        });
      }

      const response = await fetch(`${API_BASE}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            id: it.id,
            title: it.name,
            quantity: it.quantity,
            unit_price: it.price,
          })),
          payer: customerData,
          installments: selectedInstallment?.installments || 1,
          card: cardToken ? { token: cardToken } : {
            number: cardData.cardNumber.replace(/\s/g, ''),
            holder_name: cardData.cardholderName,
            expiration_month: parseInt(cardData.expiryDate.split('/')[0]),
            expiration_year: parseInt(cardData.expiryDate.split('/')[1]),
            security_code: cardData.cvv,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        const orderItems = [...items];
        const orderTotal = total;
        clearCart();
        setTimeout(() => {
          navigate('/checkout/sucesso', {
            state: { orderId: result.orderId || 'success', total: orderTotal, items: orderItems },
          });
        }, 2000);
      } else {
        setError(result.message || 'Erro ao processar pagamento');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Criar preferência (Checkout Pro) para Pix / Checkout
  const handleCreatePreference = async () => {
    if (!customerData.email || !customerData.name || !customerData.phone) {
      setError('Preencha todos os dados antes de continuar');
      return;
    }
    if (!customerData.cep || !customerData.street || !customerData.number || !customerData.city || !customerData.state) {
      setError('Preencha o endereço completo antes de continuar');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const resp = await fetch(`${API_BASE}/api/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            id: it.id,
            title: it.name,
            quantity: it.quantity,
            unit_price: it.price,
          })),
          payer: customerData,
        }),
      });

      const data = await resp.json();

      if (data && (data.sandbox_init_point || data.init_point)) {
        const url = data.sandbox_init_point || data.init_point;
        // Abrir checkout em nova aba
        window.open(url, '_blank');
      } else {
        setError(data.message || 'Erro ao criar preferência de pagamento');
      }
    } catch (err) {
      console.error('Erro ao criar preferência:', err);
      setError('Erro ao criar preferência de pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="text-4xl font-display mb-4 text-white">Carrinho vazio</h1>
            <button
              onClick={() => navigate('/#produtos')}
              className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-medium"
            >
              Voltar aos produtos
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 bg-zinc-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 text-white">Finalizar Compra</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 order-2 lg:order-1">
              <CheckoutOrderSummary items={items} total={total} removeFromCart={removeFromCart} />
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2">
              <CheckoutShippingForm
                customerData={customerData}
                setCustomerData={setCustomerData}
                fetchAddressByCep={fetchAddressByCep}
                formatCep={formatCep}
                loadingCep={loadingCep}
              />

              <CheckoutPaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={(method) => {
                  setPaymentMethod(method);
                  setError('');
                }}
                error={error}
                success={success}
                pixData={pixData}
                setPixData={setPixData}
                pixCopied={pixCopied}
                copyToClipboard={copyToClipboard}
                cardData={cardData}
                setCardData={setCardData}
                cardErrors={cardErrors}
                setCardErrors={setCardErrors}
                formatCardNumber={formatCardNumber}
                formatExpiryDate={formatExpiryDate}
                fetchInstallments={fetchInstallments}
                installments={installments}
                selectedInstallment={selectedInstallment}
                setSelectedInstallment={setSelectedInstallment}
                total={total}
                isProcessing={isProcessing}
                handleCardPayment={handleCardPayment}
                handlePixPayment={handlePixPayment}
              />

              {/* Continuar comprando */}
              <button
                onClick={() => navigate('/#produtos')}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-600 transition-all text-sm"
              >
                ← Continuar comprando
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
