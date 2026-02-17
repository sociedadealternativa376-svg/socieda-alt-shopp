import { Trash2, Lock } from 'lucide-react';
import { CartItem } from '@/types/product';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  total: number;
  removeFromCart: (id: string) => void;
}

export const CheckoutOrderSummary = ({ items, total, removeFromCart }: CheckoutOrderSummaryProps) => (
  <div className="bg-zinc-900 rounded-xl border border-zinc-700/80 p-6 sticky top-24 shadow-xl">
    <h2 className="font-semibold text-lg mb-6 text-white">Resumo do Pedido</h2>

    <div className="space-y-4 mb-6 pb-6 border-b border-zinc-700 max-h-96 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
          <div className="flex-1 text-sm">
            <h3 className="font-medium text-zinc-100">{item.name}</h3>
            <p className="text-zinc-400">Qty: {item.quantity}</p>
            <p className="font-bold text-sky-400 mt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
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

    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/80 p-3 rounded-lg">
      <Lock className="h-4 w-4" />
      <span>Pagamento 100% seguro</span>
    </div>
  </div>
);
