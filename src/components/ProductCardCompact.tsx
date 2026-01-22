import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/product';
import { ShoppingBag, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardCompactProps {
  product: Product;
}

const ProductCardCompact = ({ product }: ProductCardCompactProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleViewProduct = () => {
    navigate(`/produto/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div 
      className="group relative bg-card rounded-lg overflow-hidden border border-border/50 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg h-full flex flex-col"
      onClick={handleViewProduct}
    >
      {/* Image Container - Fixed small height */}
      <div className="relative bg-secondary/50 p-2">
        <div className="aspect-square w-full flex items-center justify-center">
          <img 
            src={product.image} 
            alt={product.name}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Quick Add Button */}
        <button 
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      {/* Content - Compact */}
      <div className="p-2.5 flex flex-col flex-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide line-clamp-1">
          {product.subcategory || product.category}
        </span>
        
        <h3 className="text-xs font-medium text-foreground mt-1 line-clamp-2 leading-tight min-h-[2rem]">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-2">
          <span className="text-sm font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCardCompact;
