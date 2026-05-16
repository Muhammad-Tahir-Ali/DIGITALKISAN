import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  _id: string;
  farmer: {
    _id: string;
    name: string;
    location?: { address: string };
    rating?: number;
  };
  title: string;
  description: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  availableQuantity: number;
  images: string[];
  status: 'active' | 'sold_out' | 'hidden' | 'pending_ai' | 'rejected';
  rejectionReason?: string;
  aiGrade?: 'N/A' | 'Grade C' | 'Grade B' | 'Grade A';
  rating: number;
  ratingsQuantity: number;
  createdAt: string;
}

export interface CreateProductPayload {
  title: string;
  description: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  availableQuantity: number;
  images?: string[];
  imageDatas?: string[];
  mimeTypes?: string[];
  imageData?: string;
  mimeType?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const productService = {
  /**
   * Get all active products — supports filtering
   * e.g. getAll({ category: 'grains', 'pricePerUnit[lte]': 500 })
   */
  getAll: async (filters?: Record<string, string | number>): Promise<Product[]> => {
    const { data } = await api.get('/products', { params: filters });
    return data.data.products;
  },

  /**
   * Get products for the logged in farmer
   */
  getMyProducts: async (): Promise<Product[]> => {
    const { data } = await api.get('/products/my-products');
    return data.data.products;
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data.product;
  },

  /**
   * Create a new product (Farmer only)
   */
  create: async (payload: CreateProductPayload): Promise<Product> => {
    // 90s timeout — base64 image upload can be slow on mobile connections
    const { data } = await api.post('/products', payload, { timeout: 90000 });
    return data.data.product;
  },

  /**
   * Update a product (Farmer only, must own it)
   */
  update: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
    const { data } = await api.patch(`/products/${id}`, payload);
    return data.data.product;
  },

  /**
   * Soft-delete a product (changes status to 'hidden')
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

export default productService;
