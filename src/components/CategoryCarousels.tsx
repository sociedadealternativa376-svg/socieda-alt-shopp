import { useMemo } from 'react';
import { products } from '@/data/products';
import ProductCard from './ProductCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategoryCarousels = () => {
  const subcategories = useMemo(() => {
    const grouped: { [key: string]: { label: string; products: typeof products } } = {};

    products.forEach((product) => {
      const subcategory = product.subcategory || product.category;
      if (!grouped[subcategory]) {
        grouped[subcategory] = {
          label: subcategory,
          products: [],
        };
      }
      grouped[subcategory].products.push(product);
    });

    // Ordenar por quantidade de produtos (descendente)
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.products.length - a.products.length)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }, []);

  return (
    <section id="produtos" className="py-8 md:py-16 bg-background">
      <div className="w-full">
        <div className="container mx-auto px-4 mb-12">
          <h2 className="text-3xl md:text-5xl font-display gradient-text text-center">
            EXPLORE NOSSOS PRODUTOS
          </h2>
        </div>

        <div className="space-y-16">
          {Object.entries(subcategories).map(([subcategory, { label, products: items }]) => (
            <div key={subcategory} className="w-full">
              <div className="container mx-auto px-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-display text-foreground capitalize">
                    {label}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {items.length} {items.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
              </div>

              <div className="relative group px-4 md:px-8">
                <Carousel
                  opts={{
                    align: 'start',
                    loop: false,
                    dragFree: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {items.map((product) => (
                      <CarouselItem
                        key={product.id}
                        className="pl-2 md:pl-4 basis-[48%] sm:basis-[46%] md:basis-1/3 lg:basis-[22%] xl:basis-[19%]"
                      >
                        <ProductCard product={product} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {/* Setas visíveis no hover */}
                  <div className="hidden group-hover:flex absolute inset-y-0 left-0 items-center justify-center w-12 pointer-events-none z-10">
                    <CarouselPrevious className="pointer-events-auto relative left-0 translate-x-0 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground border-0 h-10 w-10 shadow-lg" />
                  </div>
                  <div className="hidden group-hover:flex absolute inset-y-0 right-0 items-center justify-center w-12 pointer-events-none z-10">
                    <CarouselNext className="pointer-events-auto relative right-0 translate-x-0 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground border-0 h-10 w-10 shadow-lg" />
                  </div>
                </Carousel>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ChevronLeft className="h-3 w-3" />
                <span>Arraste para explorar</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousels;
