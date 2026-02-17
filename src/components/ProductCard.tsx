import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/product';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleViewProduct = () => {
    navigate(`/produto/${product.id}`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <div 
      className="group relative bg-card rounded-xl overflow-hidden gradient-border cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.2)] hover:-translate-y-1 h-full flex flex-col"
      onClick={handleViewProduct}
    >
      <div className="w-full h-[220px] md:h-[240px] overflow-hidden relative flex-shrink-0 bg-zinc-900">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="product-card-image w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-2.5 md:p-4 flex flex-col flex-1">
        <span className="text-[9px] md:text-xs text-primary/90 font-medium uppercase tracking-widest line-clamp-1">
          {product.subcategory || product.category}
        </span>
        <h3 className="font-display text-sm md:text-base text-zinc-100 mt-1 mb-1.5 line-clamp-2 leading-snug tracking-tight">
          {product.name}
        </h3>
        
        <div className="flex flex-col gap-1.5 md:gap-2 mt-auto">
          <span className="text-sm md:text-base font-semibold text-amber-400/95 tabular-nums">
            R$ {product.price.toFixed(2)}
          </span>
          <button 
            onClick={handleBuy}
            className="w-full flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:opacity-90 text-black font-semibold text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="h-3 w-3 md:h-4 md:w-4" />
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
