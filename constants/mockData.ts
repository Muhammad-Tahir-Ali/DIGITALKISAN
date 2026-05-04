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

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Grains',      emoji: '🌾', color: 'bg-amber-50',  border: 'border-amber-200' },
  { id: '2', name: 'Vegetables',  emoji: '🥦', color: 'bg-green-50',  border: 'border-green-200' },
  { id: '3', name: 'Fruits',      emoji: '🍎', color: 'bg-red-50',    border: 'border-red-200'   },
  { id: '4', name: 'Pulses',      emoji: '🥗', color: 'bg-orange-50', border: 'border-orange-200'},
];
