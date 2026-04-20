// ─────────────────────────────────────────────────────────────────────────────
// Digital Kisan — Centralised Mock Data
// ─────────────────────────────────────────────────────────────────────────────

// AI Quality Grades: 'Grade A' = Premium | 'Grade B' = Standard | 'Grade C' = Low
export type AIGrade = 'Grade A' | 'Grade B' | 'Grade C';
export type ProductCategory = 'Grains' | 'Vegetables' | 'Fruits' | 'Pulses';

export interface Crop {
  id: string;
  name: string;
  emoji: string;
  price: number;       // PKR per unit
  unit: string;
  quality: AIGrade;
  aiScore: number;     // 0–100 confidence
  farmerName: string;
  farmerId: string;
  farmerCity: string;
  farmerRating: number;
  farmerReviews: number;
  distanceKm: number;
  stockKg: number;
  category: ProductCategory;
  description: string;
  images: string[];    // URLs (emoji used as fallback in UI)
}

export const MOCK_CROPS: Crop[] = [
  {
    id: '1',
    name: 'Premium Wheat',
    emoji: '🌾',
    price: 120,
    unit: 'kg',
    quality: 'Grade A',
    aiScore: 96,
    farmerName: 'Ali Raza',
    farmerId: 'f1',
    farmerCity: 'Okara',
    farmerRating: 4.8,
    farmerReviews: 134,
    distanceKm: 12,
    stockKg: 850,
    category: 'Grains',
    description:
      'Freshly harvested premium wheat from the fertile fields of Okara. Grown using organic practices, sorted & graded by our AI system. Ideal for flour mills and bulk buyers.',
    images: [require('../assets/images/crops/wheat_premium.png')],
  },
  {
    id: '2',
    name: 'Basmati Rice',
    emoji: '🍚',
    price: 350,
    unit: 'kg',
    quality: 'Grade A',
    aiScore: 92,
    farmerName: 'Kisan Farms',
    farmerId: 'f2',
    farmerCity: 'Sheikhupura',
    farmerRating: 4.7,
    farmerReviews: 89,
    distanceKm: 35,
    stockKg: 420,
    category: 'Grains',
    description:
      'Long-grain aromatic Basmati rice cultivated in Sheikhupura with traditional irrigation methods. AI-graded for consistent length and aroma.',
    images: [require('../assets/images/crops/rice_basmati.png')],
  },
  {
    id: '3',
    name: 'Fresh Tomatoes',
    emoji: '🍅',
    price: 80,
    unit: 'kg',
    quality: 'Grade B',
    aiScore: 78,
    farmerName: 'Choudhry Agros',
    farmerId: 'f3',
    farmerCity: 'Multan',
    farmerRating: 4.3,
    farmerReviews: 57,
    distanceKm: 60,
    stockKg: 200,
    category: 'Vegetables',
    description:
      'Vine-ripened tomatoes harvested at peak freshness. Standard grade with slightly varied sizes. Great for restaurants and bulk catering.',
    images: [require('../assets/images/crops/tomatoes_fresh.png')],
  },
  {
    id: '4',
    name: 'Mango (Sindhri)',
    emoji: '🥭',
    price: 250,
    unit: 'kg',
    quality: 'Grade A',
    aiScore: 94,
    farmerName: 'Asif Orchards',
    farmerId: 'f4',
    farmerCity: 'Mirpur Khas',
    farmerRating: 4.9,
    farmerReviews: 212,
    distanceKm: 90,
    stockKg: 300,
    category: 'Fruits',
    description:
      'King of mangoes! Sindhri mangoes from Mirpur Khas, hand-picked and AI-sorted for uniform size, sweetness, and zero blemishes.',
    images: [require('../assets/images/crops/mango_sindhri.png')],
  },
  {
    id: '5',
    name: 'Green Chilli',
    emoji: '🌶️',
    price: 60,
    unit: 'kg',
    quality: 'Grade B',
    aiScore: 81,
    farmerName: 'Hassan Vegetables',
    farmerId: 'f5',
    farmerCity: 'Faisalabad',
    farmerRating: 4.4,
    farmerReviews: 48,
    distanceKm: 20,
    stockKg: 150,
    category: 'Vegetables',
    description:
      'Hot and fresh green chillies sourced from Faisalabad region. Handpicked daily to ensure freshness. Standard grade.',
    images: [require('../assets/images/crops/chilli_green.png')],
  },
  {
    id: '6',
    name: 'Desi Moong Dal',
    emoji: '🫘',
    price: 200,
    unit: 'kg',
    quality: 'Grade A',
    aiScore: 89,
    farmerName: 'Punjab Pulses Co.',
    farmerId: 'f6',
    farmerCity: 'Sahiwal',
    farmerRating: 4.6,
    farmerReviews: 76,
    distanceKm: 45,
    stockKg: 600,
    category: 'Pulses',
    description:
      'Premium desi moong dal, naturally sun-dried and sorted. High protein content, ideal for households and grocery chains.',
    images: [require('../assets/images/crops/moong_dal.png')],
  },
  {
    id: '7',
    name: 'Bitter Gourd',
    emoji: '🥒',
    price: 70,
    unit: 'kg',
    quality: 'Grade C',
    aiScore: 61,
    farmerName: 'Baloch Farms',
    farmerId: 'f7',
    farmerCity: 'Quetta',
    farmerRating: 4.1,
    farmerReviews: 22,
    distanceKm: 110,
    stockKg: 80,
    category: 'Vegetables',
    description:
      'Sun-grown bitter gourd from the highlands of Quetta. Lower grade with cosmetic blemishes — same nutritional value. Best for wholesale.',
    images: [require('../assets/images/crops/bitter_gourd.png')],
  },
  {
    id: '8',
    name: 'Apple (Golden)',
    emoji: '🍎',
    price: 180,
    unit: 'kg',
    quality: 'Grade A',
    aiScore: 97,
    farmerName: 'Swat Valley Orchards',
    farmerId: 'f8',
    farmerCity: 'Swat',
    farmerRating: 5.0,
    farmerReviews: 345,
    distanceKm: 200,
    stockKg: 1200,
    category: 'Fruits',
    description:
      'Golden delicious apples from the pristine valleys of Swat. Crisp, sweet, and uniformly sized. AI score: top 5% of all apple listings.',
    images: [require('../assets/images/crops/apple_golden.png')],
  },
];

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Grains',      emoji: '🌾', color: 'bg-amber-50',  border: 'border-amber-200' },
  { id: '2', name: 'Vegetables',  emoji: '🥦', color: 'bg-green-50',  border: 'border-green-200' },
  { id: '3', name: 'Fruits',      emoji: '🍎', color: 'bg-red-50',    border: 'border-red-200'   },
  { id: '4', name: 'Pulses',      emoji: '🥗', color: 'bg-orange-50', border: 'border-orange-200'},
];

export const MOCK_FARMERS = [
  { id: 'f1', name: 'Ali Raza',            city: 'Okara',       rating: 4.8, listings: 12 },
  { id: 'f2', name: 'Zafar Iqbal',         city: 'Faisalabad',  rating: 4.5, listings: 8  },
  { id: 'f3', name: 'Malik Farms',         city: 'Multan',      rating: 4.9, listings: 24 },
  { id: 'f4', name: 'Swat Valley Orchards',city: 'Swat',        rating: 5.0, listings: 18 },
];

export const MOCK_ORDERS = [
  {
    id: 'ORD123450',
    date: 'Oct 10, 2024',
    status: 'Delivered',
    total: 320,
    farmName: 'Ali Raza Farms',
    farmerName: 'Ali Raza',
    farmerPhone: '+92 300 1234567',
    farmerRating: 4.8,
    items: [
      { id: '1', name: 'Premium Wheat',  qty: 2,    unit: 'kg', emoji: '🌾', price: 120 },
      { id: '3', name: 'Fresh Tomatoes', qty: 1,    unit: 'kg', emoji: '🍅', price: 80  },
    ],
    address: 'House #42, Street 5, Gulberg III, Lahore',
    paymentMethod: 'DigitalKisan Wallet',
    escrowStatus: 'Payment held in escrow 🔒',
    paymentReleased: false,
    deliveryProgress: 100,
  },
  {
    id: 'ORD123451',
    date: 'Oct 15, 2024',
    status: 'Active',
    total: 1250,
    farmName: 'Sindh Orchards',
    farmerName: 'Asif Ali',
    farmerPhone: '+92 321 7654321',
    farmerRating: 4.9,
    items: [
      { id: '4', name: 'Mango (Sindhri)', qty: 5, unit: 'kg', emoji: '🥭', price: 250 },
    ],
    address: 'Flat 204, Al-Hafeez Heights, Gulberg III, Lahore',
    paymentMethod: 'Cash on Delivery',
    escrowStatus: 'N/A',
    paymentReleased: false,
    deliveryProgress: 65,
  },
  {
    id: 'ORD123452',
    date: 'Oct 08, 2024',
    status: 'Cancelled',
    total: 450,
    farmName: 'Zafar Agri',
    farmerName: 'Zafar Iqbal',
    farmerPhone: '+92 333 9876543',
    farmerRating: 4.5,
    items: [
      { id: '2', name: 'Basmati Rice',   qty: 1,    unit: 'kg', emoji: '🍚', price: 350 },
      { id: '3', name: 'Fresh Tomatoes', qty: 1.25, unit: 'kg', emoji: '🍅', price: 80  },
    ],
    address: 'Commercial Area, Phase 5, DHA, Lahore',
    paymentMethod: 'Credit Card',
    escrowStatus: 'Refunded',
    paymentReleased: false,
    deliveryProgress: 0,
  },
];
