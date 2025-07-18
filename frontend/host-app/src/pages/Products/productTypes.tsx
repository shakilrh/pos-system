export interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string | null;
  pictureUrl: string | null;
  created_by?: string | null;
  createdAt?: string;
  updatedAt?: string;
  displayPrice: string;
  isActive: boolean;
  time_required: number;
}
