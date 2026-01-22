import { useRef } from 'react';
import { Product } from '@/types/product';
import ProductCardCompact from './ProductCardCompact';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  onViewAll?: () => void;
}

const ProductCarousel = ({ title, products, onViewAll }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-8 md:mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 md:h-6 rounded-full bg-primary" />
          <h3 className="text-base md:text-xl font-semibold text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs md:text-sm text-primary hover:underline font-medium mr-2"
            >
              Ver todos
            </button>
          )}
          {/* Navigation Arrows */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex w-8 h-8 rounded-full border border-border bg-background hover:bg-secondary items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex w-8 h-8 rounded-full border border-border bg-background hover:bg-secondary items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Product Row */}
      <div 
        ref={scrollRef}
        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-[120px] md:w-[160px] lg:w-[180px]"
          >
            <ProductCardCompact product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
