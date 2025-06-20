interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string | null;
  pictureUrl: string | null;
  displayPrice: string;
  isActive: boolean;
}

export { Category, Product };
