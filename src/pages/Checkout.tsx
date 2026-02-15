import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Trash2, Lock, Check, AlertCircle, Copy, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
            {/* Coluna esquerda: Resumo do pedido */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 sticky top-24 shadow-xl">
                <h2 className="font-semibold text-lg mb-6 text-white">Resumo do Pedido</h2>

                {/* Itens */}
                <div className="space-y-4 mb-6 pb-6 border-b border-zinc-700 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-sm">
                        <h3 className="font-medium text-zinc-100">{item.name}</h3>
                        <p className="text-zinc-400">Qty: {item.quantity}</p>
                        <p className="font-bold text-sky-400 mt-1">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:bg-red-500/10 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal:</span>
                    <span className="font-medium text-zinc-100">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Frete:</span>
                    <span className="text-zinc-400">A cobrar</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-zinc-700">
                    <span className="text-white">Total:</span>
                    <span className="text-white">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Segurança */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/80 p-3 rounded-lg">
                  <Lock className="h-4 w-4" />
                  <span>Pagamento 100% seguro</span>
                </div>
              </div>
            </div>

            {/* Coluna direita: Formulário de pagamento */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {/* Dados do cliente + Endereço */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 mb-6 shadow-xl">
                <h2 className="font-semibold text-lg mb-5 text-white">Dados de Entrega</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Nome Completo</label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="Seu nome"
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Telefone</label>
                      <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="pt-4 border-t border-zinc-700">
                    <p className="text-sm font-medium text-zinc-300 mb-3">Endereço de entrega</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">CEP</label>
                        <input
                          type="text"
                          value={customerData.cep}
                          onChange={(e) => setCustomerData({ ...customerData, cep: formatCep(e.target.value) })}
                          onBlur={() => fetchAddressByCep(customerData.cep)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                        {loadingCep && <p className="text-xs text-sky-400 mt-1">Buscando...</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Rua</label>
                        <input
                          type="text"
                          value={customerData.street}
                          onChange={(e) => setCustomerData({ ...customerData, street: e.target.value })}
                          placeholder="Nome da rua"
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Número</label>
                        <input
                          type="text"
                          value={customerData.number}
                          onChange={(e) => setCustomerData({ ...customerData, number: e.target.value })}
                          placeholder="123"
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Complemento</label>
                        <input
                          type="text"
                          value={customerData.complement}
                          onChange={(e) => setCustomerData({ ...customerData, complement: e.target.value })}
                          placeholder="Apto, bloco..."
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Bairro</label>
                        <input
                          type="text"
                          value={customerData.neighborhood}
                          onChange={(e) => setCustomerData({ ...customerData, neighborhood: e.target.value })}
                          placeholder="Bairro"
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Cidade</label>
                        <input
                          type="text"
                          value={customerData.city}
                          onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                          placeholder="Cidade"
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Estado</label>
                        <input
                          type="text"
                          value={customerData.state}
                          onChange={(e) => setCustomerData({ ...customerData, state: e.target.value.toUpperCase().slice(0, 2) })}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métodos de pagamento - Abas */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 mb-6 shadow-xl">
                <h2 className="font-semibold text-lg mb-4 text-white">Método de Pagamento</h2>

                {/* Abas */}
                <div className="flex gap-4 mb-6 border-b border-zinc-700">
                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setError('');
                      setPixData(null);
                    }}
                    className={`pb-3 font-medium text-sm px-2 border-b-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    💳 Cartão de Crédito
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod('pix');
                      setError('');
                    }}
                    className={`pb-3 font-medium text-sm px-2 border-b-2 transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    🎯 Pix
                  </button>
                </div>

                {/* Alertas */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-2 text-sm text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex gap-2 text-sm text-green-400">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    <span>Pagamento realizado com sucesso!</span>
                  </div>
                )}

                {/* Conteúdo das abas */}
                {paymentMethod === 'card' && (
                  <form onSubmit={handleCardPayment} className="space-y-4">
                    {/* Número do cartão */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Número do Cartão</label>
                      <input
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCardData({ ...cardData, cardNumber: formatted });
                          if (cardErrors.cardNumber) {
                            setCardErrors({ ...cardErrors, cardNumber: '' });
                          }
                        }}
                        onBlur={fetchInstallments}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className={`w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-lg tracking-wider text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                          cardErrors.cardNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-600 focus:border-sky-500 focus:ring-sky-500/20'
                        }`}
                      />
                      {cardErrors.cardNumber && (
                        <p className="text-xs text-red-400 mt-1">{cardErrors.cardNumber}</p>
                      )}
                    </div>

                    {/* Nome do titular */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Nome do Titular</label>
                      <input
                        type="text"
                        value={cardData.cardholderName}
                        onChange={(e) => {
                          setCardData({ ...cardData, cardholderName: e.target.value });
                          if (cardErrors.cardholderName) {
                            setCardErrors({ ...cardErrors, cardholderName: '' });
                          }
                        }}
                        placeholder="NOME SOBRENOME"
                        className={`w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-sm uppercase text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                          cardErrors.cardholderName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-600 focus:border-sky-500 focus:ring-sky-500/20'
                        }`}
                      />
                      {cardErrors.cardholderName && (
                        <p className="text-xs text-red-400 mt-1">{cardErrors.cardholderName}</p>
                      )}
                    </div>

                    {/* Data de validade e CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Validade</label>
                        <input
                          type="text"
                          value={cardData.expiryDate}
                          onChange={(e) => {
                            const formatted = formatExpiryDate(e.target.value);
                            setCardData({ ...cardData, expiryDate: formatted });
                            if (cardErrors.expiryDate) {
                              setCardErrors({ ...cardErrors, expiryDate: '' });
                            }
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={`w-full px-4 py-2 rounded-lg bg-zinc-800 border text-lg tracking-wider text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                            cardErrors.expiryDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-600 focus:border-sky-500 focus:ring-sky-500/20'
                          }`}
                        />
                        {cardErrors.expiryDate && (
                          <p className="text-xs text-red-400 mt-1">{cardErrors.expiryDate}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">CVV</label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardData({ ...cardData, cvv: value });
                            if (cardErrors.cvv) {
                              setCardErrors({ ...cardErrors, cvv: '' });
                            }
                          }}
                          placeholder="000"
                          maxLength={4}
                          className={`w-full px-4 py-2 rounded-lg bg-zinc-800 border text-lg tracking-wider text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                            cardErrors.cvv ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-600 focus:border-sky-500 focus:ring-sky-500/20'
                          }`}
                        />
                        {cardErrors.cvv && (
                          <p className="text-xs text-red-400 mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    {/* Parcelamento */}
                    {installments.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Parcelamento</label>
                        <select
                          value={selectedInstallment?.recommended_message || ''}
                          onChange={(e) => {
                            const selected = installments.find(
                              (inst) => inst.recommended_message === e.target.value
                            );
                            setSelectedInstallment(selected);
                          }}
                          className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition-all"
                        >
                          {installments.map((inst, idx) => (
                            <option key={idx} value={inst.recommended_message}>
                              {inst.recommended_message}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Botão de pagamento */}
                    <button
                      type="submit"
                      disabled={isProcessing || success}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-base rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/20"
                    >
                      {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                      {isProcessing ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
                    </button>
                  </form>
                )}

                {paymentMethod === 'pix' && (
                  <div className="space-y-4">
                    {!pixData ? (
                      <>
                        <p className="text-sm text-zinc-400 mb-4">
                          Gere um código Pix para completar sua compra. Você terá 30 minutos para pagar.
                        </p>
                        <button
                          onClick={handlePixPayment}
                          disabled={isProcessing}
                          className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-base rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/20"
                        >
                          {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                          {isProcessing ? 'Gerando...' : '🎯 Gerar Código Pix'}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-600">
                        {/* QR Code */}
                        {pixData.qr_code_base64 && (
                          <div className="flex flex-col items-center gap-4">
                            <img
                              src={`data:image/png;base64,${pixData.qr_code_base64}`}
                              alt="QR Pix"
                              className="w-64 h-64 border-2 border-primary p-2 rounded-lg"
                            />
                            <p className="text-center text-sm text-zinc-400">
                              Escaneie o código com o seu banco ou app de Pix
                            </p>
                          </div>
                        )}

                        {/* Copia e Cola */}
                        {pixData.qr_copy_text && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium mb-2 text-zinc-300">Ou copie o código:</label>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={pixData.qr_copy_text}
                                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-mono"
                              />
                              <button
                                onClick={() => copyToClipboard(pixData.qr_copy_text)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                  pixCopied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                                }`}
                              >
                                <Copy className="h-4 w-4" />
                                {pixCopied ? 'Copiado!' : 'Copiar'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Timer e status */}
                        <div className="mt-4 p-3 bg-zinc-800/80 rounded-lg border border-zinc-600">
                          <p className="text-sm text-zinc-400">
                            ⏱️ Você tem 30 minutos para realizar o pagamento
                          </p>
                        </div>

                        {/* Botão para voltar */}
                        <button
                          onClick={() => {
                            setPixData(null);
                            setPaymentMethod('card');
                          }}
                          className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-all text-sm"
                        >
                          Voltar e escolher outro método
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
