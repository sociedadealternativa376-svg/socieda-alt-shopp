import { Product } from '@/types/product';

export interface ProductWithGallery extends Product {
  gallery: string[];
}

const img = (name: string) => `/products/tragus/${name}.png`;

const premiumNames = [
  'Piercing Escorpião Premium',
  'Piercing Flores Duplas Zircônia',
  'Piercing Flores Grandes Cristal',
  'Piercing Coruja Elegante',
  'Piercing Borboleta Cravejada',
  'Piercing Bruxinha Magic',
  'Piercing Cavalo Dourado',
  'Piercing Caveira Mexicana',
  'Piercing Pantera Wild',
  'Piercing Nossa Senhora Devotion',
  'Piercing Abelha Honey',
  'Piercing Barbie Glam Gold',
  'Piercing Barbie Glam Prata',
  'Piercing Trio Borboletas Crystal',
  'Piercing Trio Borboletas Luxo',
  'Piercing Asa Anjo Divine',
  'Piercing Cifrão Dourado',
  'Piercing Três Flores Bloom',
  'Piercing Mão de Fátima Hamsa',
  'Piercing Flores Duplas Elegance',
  'Piercing Olho Grego Mystic',
  'Piercing Coração Crystal',
  'Piercing Lua Prata',
  'Piercing Estrela Cravejada',
  'Piercing Borboleta Delicate',
  'Piercing Cristal Redondo',
  'Piercing Flor Pérola Pearl',
  'Piercing Mini Cristal Sparkle',
  'Piercing Golfinho Ocean',
  'Piercing Diamond Cut',
  'Piercing Gold Leaf',
  'Piercing Silver Dream',
  'Piercing Cruz Minimalista',
  'Piercing Hélice Cravejado',
  'Piercing Maçã Luxo',
  'Piercing Snake Dourado',
  'Piercing Coração Brilhante',
  'Piercing Argola Deluxe',
  'Piercing Gatinho Dourado',
  'Piercing Midnight Black',
];

const productEntries = Array.from({ length: 40 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  const id = `produto-${num}`;
  return {
    id,
    name: premiumNames[i] || `Piercing Premium ${num}`,
    price: 70.0,
    image: img(`produto-${num}`),
    gallery: [img(`produto-${num}`)],
    category: 'joia' as const,
    subcategory: 'orelha',
    description: `${premiumNames[i] || `Piercing ${num}`} - Aço cirúrgico hipoalergênico`,
    inStock: true,
  };
});

export const products: ProductWithGallery[] = productEntries;

export const categories = [
  {
    id: 'joia',
    name: 'Joias',
    subcategories: ['orelha'],
  },
];

export const subcategoryLabels: Record<string, string> = {
  orelha: 'Piercing de Orelha',
};
