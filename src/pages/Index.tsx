import Header from '@/components/Header';
import Hero from '@/components/Hero';
import PromoBanner from '@/components/PromoBanner';
import CategoryCarousels from '@/components/CategoryCarousels';
import About from '@/components/About';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <PromoBanner />
        <CategoryCarousels />
        <About />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
