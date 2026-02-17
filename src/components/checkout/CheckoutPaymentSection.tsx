import { Copy, Loader2, Check, AlertCircle } from 'lucide-react';

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

interface FormErrors {
  [key: string]: string;
}

interface PixData {
  qr_code_base64?: string;
  qr_copy_text?: string;
}

interface CheckoutPaymentSectionProps {
  paymentMethod: 'card' | 'pix';
  setPaymentMethod: (m: 'card' | 'pix') => void;
  error: string;
  success: boolean;
  pixData: PixData | null;
  setPixData: (d: PixData | null) => void;
  pixCopied: boolean;
  copyToClipboard: (text: string) => void;
  cardData: CardFormData;
  setCardData: React.Dispatch<React.SetStateAction<CardFormData>>;
  cardErrors: FormErrors;
  setCardErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  formatCardNumber: (value: string) => string;
  formatExpiryDate: (value: string) => string;
  fetchInstallments: () => void;
  installments: any[];
  selectedInstallment: any;
  setSelectedInstallment: (i: any) => void;
  total: number;
  isProcessing: boolean;
  handleCardPayment: (e: React.FormEvent) => void;
  handlePixPayment: () => void;
}

export const CheckoutPaymentSection = ({
  paymentMethod,
  setPaymentMethod,
  error,
  success,
  pixData,
  setPixData,
  pixCopied,
  copyToClipboard,
  cardData,
  setCardData,
  cardErrors,
  setCardErrors,
  formatCardNumber,
  formatExpiryDate,
  fetchInstallments,
  installments,
  selectedInstallment,
  setSelectedInstallment,
  total,
  isProcessing,
  handleCardPayment,
  handlePixPayment,
}: CheckoutPaymentSectionProps) => {
  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-lg bg-zinc-800 border text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
      hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-600 focus:border-sky-500 focus:ring-sky-500/20'
    }`;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 mb-6 shadow-xl">
      <h2 className="font-semibold text-lg mb-4 text-white">Método de Pagamento</h2>

      <div className="flex gap-4 mb-6 border-b border-zinc-700">
        <button
          onClick={() => {
            setPaymentMethod('card');
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
          onClick={() => setPaymentMethod('pix')}
          className={`pb-3 font-medium text-sm px-2 border-b-2 transition-all ${
            paymentMethod === 'pix'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🎯 Pix
        </button>
      </div>

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

      {paymentMethod === 'card' && (
        <form onSubmit={handleCardPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">Número do Cartão</label>
            <input
              type="text"
              value={cardData.cardNumber}
              onChange={(e) => {
                setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) });
                if (cardErrors.cardNumber) setCardErrors({ ...cardErrors, cardNumber: '' });
              }}
              onBlur={fetchInstallments}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className={`${inputClass(!!cardErrors.cardNumber)} text-lg tracking-wider`}
            />
            {cardErrors.cardNumber && <p className="text-xs text-red-400 mt-1">{cardErrors.cardNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">Nome do Titular</label>
            <input
              type="text"
              value={cardData.cardholderName}
              onChange={(e) => {
                setCardData({ ...cardData, cardholderName: e.target.value });
                if (cardErrors.cardholderName) setCardErrors({ ...cardErrors, cardholderName: '' });
              }}
              placeholder="NOME SOBRENOME"
              className={`${inputClass(!!cardErrors.cardholderName)} text-sm uppercase`}
            />
            {cardErrors.cardholderName && <p className="text-xs text-red-400 mt-1">{cardErrors.cardholderName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Validade</label>
              <input
                type="text"
                value={cardData.expiryDate}
                onChange={(e) => {
                  setCardData({ ...cardData, expiryDate: formatExpiryDate(e.target.value) });
                  if (cardErrors.expiryDate) setCardErrors({ ...cardErrors, expiryDate: '' });
                }}
                placeholder="MM/YY"
                maxLength={5}
                className={`${inputClass(!!cardErrors.expiryDate)} text-lg tracking-wider`}
              />
              {cardErrors.expiryDate && <p className="text-xs text-red-400 mt-1">{cardErrors.expiryDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">CVV</label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => {
                  setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) });
                  if (cardErrors.cvv) setCardErrors({ ...cardErrors, cvv: '' });
                }}
                placeholder="000"
                maxLength={4}
                className={`${inputClass(!!cardErrors.cvv)} text-lg tracking-wider`}
              />
              {cardErrors.cvv && <p className="text-xs text-red-400 mt-1">{cardErrors.cvv}</p>}
            </div>
          </div>

          {installments.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Parcelamento</label>
              <select
                value={selectedInstallment?.recommended_message || ''}
                onChange={(e) =>
                  setSelectedInstallment(installments.find((i) => i.recommended_message === e.target.value))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
              >
                {installments.map((inst, idx) => (
                  <option key={idx} value={inst.recommended_message}>
                    {inst.recommended_message}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || success}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                {isProcessing ? 'Gerando...' : '🎯 Gerar Código Pix'}
              </button>
            </>
          ) : (
            <div className="space-y-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-600">
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
                      onClick={() => copyToClipboard(pixData.qr_copy_text!)}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        pixCopied ? 'bg-green-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'
                      }`}
                    >
                      <Copy className="h-4 w-4" />
                      {pixCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-zinc-800/80 rounded-lg border border-zinc-600">
                <p className="text-sm text-zinc-400">⏱️ Você tem 30 minutos para realizar o pagamento</p>
              </div>

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
  );
};
