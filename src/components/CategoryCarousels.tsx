import { useMemo, useState } from 'react';
import { products, subcategoryLabels, categories } from '@/data/products';
import ProductCard from './ProductCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CategoryCarousels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  const subcategories = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        !searchTerm.trim() ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubcategory =
        !selectedSubcategory || (product.subcategory || product.category) === selectedSubcategory;
      return matchesSearch && matchesSubcategory;
    });

    const grouped: { [key: string]: { label: string; products: typeof products } } = {};
    filtered.forEach((product) => {
      const subcategory = product.subcategory || product.category;
      if (!grouped[subcategory]) {
        grouped[subcategory] = {
          label: subcategoryLabels[subcategory] || subcategory.charAt(0).toUpperCase() + subcategory.slice(1),
          products: [],
        };
      }
      grouped[subcategory].products.push(product);
    });

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.products.length - a.products.length)
      .reduce<Record<string, { label: string; products: typeof products }>>(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {}
      );
  }, [searchTerm, selectedSubcategory]);

  const allSubcategories = useMemo(() => {
    return categories.flatMap((c) => c.subcategories);
  }, []);

  return (
    <section id="produtos" className="py-8 md:py-16 bg-black">
      <div className="w-full">
        <div className="container mx-auto px-4 mb-12">
          <h2 className="text-3xl md:text-5xl font-display gradient-text text-center">
            EXPLORE NOSSOS PRODUTOS
          </h2>

          {/* Busca e filtro */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="Buscar por nome, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="px-4 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm"
            >
              <option value="">Todas as categorias</option>
              {allSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {subcategoryLabels[sub] || sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-16">
          {Object.keys(subcategories).length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Nenhum produto encontrado. Tente outros termos ou categorias.</p>
          ) : null}
          {Object.entries(subcategories).map(([subcategory, { label, products: items }]) => (
            <div key={subcategory} className="w-full">
              <div className="container mx-auto px-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-display text-white capitalize">
                    {label}
                  </h3>
                  <span className="text-sm text-zinc-400">
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

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-4">
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
