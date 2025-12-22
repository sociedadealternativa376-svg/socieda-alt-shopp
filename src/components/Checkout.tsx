import { useState } from 'react';
import { ArrowLeft, Check, CreditCard, QrCode, Tag, X, Loader2, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutProps {
  onBack: () => void;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

const Checkout = ({ onBack }: CheckoutProps) => {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    cep: '',
  });
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return (total * appliedCoupon.discount_value) / 100;
    }
    return appliedCoupon.discount_value;
  };

  const finalTotal = Math.max(0, total - calculateDiscount());

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código vazio",
        description: "Digite um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: "Cupom inválido",
          description: "Este cupom não existe ou está inativo.",
          variant: "destructive",
        });
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Cupom expirado",
          description: "Este cupom já expirou.",
          variant: "destructive",
        });
        return;
      }

      if (coupon.max_uses && coupon.used_count !== null && coupon.used_count >= coupon.max_uses) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom já atingiu o limite de uso.",
          variant: "destructive",
        });
        return;
      }

      if (coupon.min_purchase && total < coupon.min_purchase) {
        toast({
          title: "Valor mínimo não atingido",
          description: `Compra mínima de R$ ${coupon.min_purchase.toFixed(2)} para este cupom.`,
          variant: "destructive",
        });
        return;
      }

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      });

      toast({
        title: "Cupom aplicado!",
        description: coupon.discount_type === 'percentage' 
          ? `Desconto de ${coupon.discount_value}% aplicado.`
          : `Desconto de R$ ${coupon.discount_value.toFixed(2)} aplicado.`,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o cupom.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do pedido.",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      const formatted = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
      setCardData({ ...cardData, number: formatted });
    } else if (name === 'expiry') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      const formatted = cleaned.length >= 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
      setCardData({ ...cardData, expiry: formatted });
    } else if (name === 'cvv') {
      setCardData({ ...cardData, cvv: value.replace(/\D/g, '').slice(0, 4) });
    } else {
      setCardData({ ...cardData, [name]: value });
    }
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const incrementCouponUsage = async () => {
    if (!appliedCoupon) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ used_count: supabase.rpc ? undefined : undefined })
        .eq('id', appliedCoupon.id);

      // Use raw SQL via RPC or direct increment
      const { error: rpcError } = await supabase.rpc('has_role', { 
        _user_id: '00000000-0000-0000-0000-000000000000', 
        _role: 'admin' 
      });

      // Fallback: fetch current count and increment
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', appliedCoupon.id)
        .single();

      if (currentCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: (currentCoupon.used_count || 0) + 1 })
          .eq('id', appliedCoupon.id);
      }
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
    }
  };

  const handleFinishPurchase = async () => {
    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        toast({
          title: "Dados do cartão",
          description: "Preencha todos os dados do cartão.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    
    // Increment coupon usage
    await incrementCouponUsage();
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      setTimeout(() => {
        clearCart();
      }, 2000);
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Pedido Confirmado!</h3>
        <p className="text-muted-foreground text-center max-w-xs">
          Obrigado pela compra. Você receberá um email com os detalhes do pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </button>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`flex items-center gap-2 ${step === 'info' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'info' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className="text-sm font-medium hidden sm:block">Dados</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <span className="text-sm font-medium hidden sm:block">Pagamento</span>
        </div>
      </div>

      {step === 'info' && (
        <form onSubmit={handleSubmitInfo} className="flex-1 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm text-muted-foreground">Nome Completo *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Seu nome completo"
              className="h-12 bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              className="h-12 bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm text-muted-foreground">Telefone *</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
              className="h-12 bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-sm text-muted-foreground">Endereço</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, complemento"
              className="h-12 bg-background border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-sm text-muted-foreground">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Sua cidade"
                className="h-12 bg-background border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cep" className="text-sm text-muted-foreground">CEP</Label>
              <Input
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                placeholder="00000-000"
                className="h-12 bg-background border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit"
              className="w-full h-12 font-medium"
            >
              Continuar
            </Button>
          </div>
        </form>
      )}

      {step === 'payment' && (
        <div className="flex-1 flex flex-col">
          <div className="space-y-5 flex-1">
            {/* Coupon Section */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Cupom de desconto</span>
              </div>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{appliedCoupon.code}</span>
                    <span className="text-sm text-muted-foreground">
                      {appliedCoupon.discount_type === 'percentage' 
                        ? `${appliedCoupon.discount_value}% off`
                        : `R$ ${appliedCoupon.discount_value.toFixed(2)} off`}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código"
                    className="h-10 bg-background border-border/50 uppercase text-sm"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    variant="secondary"
                    size="sm"
                    className="h-10 px-4"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <span className="text-sm text-muted-foreground">Forma de pagamento</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <QrCode className={`h-6 w-6 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium text-foreground text-sm">PIX</p>
                    <p className="text-xs text-muted-foreground">Instantâneo</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className="font-medium text-foreground text-sm">Cartão</p>
                    <p className="text-xs text-muted-foreground">Até 12x</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Card Fields */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Número do cartão</Label>
                  <Input
                    name="number"
                    value={cardData.number}
                    onChange={handleCardInputChange}
                    placeholder="0000 0000 0000 0000"
                    className="h-11 bg-background border-border/50 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Nome no cartão</Label>
                  <Input
                    name="name"
                    value={cardData.name}
                    onChange={handleCardInputChange}
                    placeholder="Como está no cartão"
                    className="h-11 bg-background border-border/50 uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Validade</Label>
                    <Input
                      name="expiry"
                      value={cardData.expiry}
                      onChange={handleCardInputChange}
                      placeholder="MM/AA"
                      className="h-11 bg-background border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">CVV</Label>
                    <Input
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardInputChange}
                      placeholder="000"
                      type="password"
                      className="h-11 bg-background border-border/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'pix' && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  O QR Code será gerado após confirmar o pedido
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t border-border/50 pt-5 mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {total.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-primary">
                <span>Desconto</span>
                <span>- R$ {calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/50">
              <span className="font-medium text-foreground">Total</span>
              <span className="text-xl font-semibold text-foreground">R$ {finalTotal.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleFinishPurchase}
              disabled={isProcessing}
              className="w-full h-12 font-medium mt-4"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Confirmar Pedido
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Pagamento seguro e criptografado
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
