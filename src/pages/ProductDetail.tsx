import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Shield, Truck, RotateCcw } from 'lucide-react';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useEffect } from 'react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display text-foreground mb-4">Produto não encontrado</h1>
          <button 
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleBuy = () => {
    addToCart(product);
    navigate('/checkout');
  };

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de saber mais sobre o produto:\n\n*${product.name}*\nCódigo: ${product.id.toUpperCase()}\nPreço: R$ ${product.price.toFixed(2)}\n\nPor favor, me envie mais informações!`
    );
    window.open(`https://wa.me/5511952222008?text=${message}`, '_blank');
  };

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const breadcrumbItems = [
    { label: 'Produtos', href: '/#produtos' },
    { label: product.category.charAt(0).toUpperCase() + product.category.slice(1) },
    { label: product.name }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24 pb-16 animate-fade-in">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <div className="product-detail-image-container aspect-square w-full rounded-xl bg-neutral-900/95 border border-white/5 shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <img
                src={product.image}
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="product-detail-image w-full h-full object-cover object-center"
              />
            </div>
            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="text-primary font-medium uppercase tracking-wider text-sm">
                  {product.category} {product.subcategory && `• ${product.subcategory}`}
                </span>
                <h1 className="text-4xl md:text-5xl font-display text-foreground mt-2">
                  {product.name}
                </h1>
              </div>

              <p className="text-3xl font-bold gradient-text">
                R$ {product.price.toFixed(2)}
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Garantia de qualidade</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Envio para todo Brasil</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Troca em 7 dias</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleBuy}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-warm-yellow via-warm-orange to-warm-red hover:opacity-90 text-white font-display text-lg tracking-wider transition-all hover:scale-[1.02] hover:shadow-lg animate-pulse-glow"
                >
                  <ShoppingBag className="h-6 w-6" />
                  COMPRAR AGORA
                </button>
                <button 
                  onClick={handleWhatsAppOrder}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-display text-lg tracking-wider transition-all hover:scale-[1.02] border border-border"
                  title="Fale conosco no WhatsApp para dúvidas"
                >
                  <MessageCircle className="h-6 w-6" />
                  CONVERSAR
                </button>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {product.inStock ? 'Disponível' : 'Indisponível'}
                </span>
              </div>

              {/* Product Details */}
              <div className="bg-card rounded-lg p-6 gradient-border">
                <h3 className="font-display text-xl text-foreground mb-4">DETALHES DO PRODUTO</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Categoria:</span>
                    <span className="text-foreground capitalize">{product.category}</span>
                  </li>
                  {product.subcategory && (
                    <li className="flex justify-between">
                      <span>Tipo:</span>
                      <span className="text-foreground capitalize">{product.subcategory}</span>
                    </li>
                  )}
                  <li className="flex justify-between">
                    <span>Código:</span>
                    <span className="text-foreground">{product.id.toUpperCase()}</span>
                  </li>
                  {product.category === 'joia' && (
                    <>
                      <li className="flex justify-between">
                        <span>Material:</span>
                        <span className="text-foreground">Aço Cirúrgico 316L</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Hipoalergênico:</span>
                        <span className="text-foreground">Sim</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-3xl font-display gradient-text mb-8">PRODUTOS RELACIONADOS</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <button
                    key={relatedProduct.id}
                    onClick={() => navigate(`/produto/${relatedProduct.id}`)}
                    className="group bg-card rounded-lg overflow-hidden hover-glow gradient-border text-left"
                  >
                    <div className="h-28 lg:h-24 overflow-hidden">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-2 md:p-3">
                      <h3 className="font-display text-xs md:text-sm text-foreground line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-primary font-bold text-xs md:text-sm mt-1">
                        R$ {relatedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
