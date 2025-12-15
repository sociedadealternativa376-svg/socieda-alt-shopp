import promoBanner from '@/assets/promo-banner.png';

const PromoBanner = () => {
  return (
    <section className="w-full py-2 md:py-8 bg-background">
      <div className="container mx-auto px-2 md:px-4">
        <div className="relative overflow-hidden rounded-md md:rounded-lg shadow-xl md:shadow-2xl">
          <img 
            src={promoBanner} 
            alt="Promoção: Na compra de 3 piercings não paga a perfuração" 
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
