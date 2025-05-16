// host-app/src/pages/admin/products.tsx
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/layout/AdminLayout';

const ProductForm = dynamic(() => import('remoteApp/ProductForm'), { ssr: false });

export default function ProductsPage() {
  return (
    <AdminLayout>
      <ProductForm />
    </AdminLayout>
  );
}
