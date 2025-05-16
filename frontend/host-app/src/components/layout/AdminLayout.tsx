// host-app/src/components/layout/AdminLayout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Admin</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/admin/dashboard" className="text-blue-600 hover:underline">📊 Dashboard</Link>
          <Link href="/admin/products" className="text-blue-600 hover:underline">🍔 Products</Link>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">📦 Orders</Link>
          <Link href="/admin/roles" className="text-blue-600 hover:underline">👥 Roles</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
