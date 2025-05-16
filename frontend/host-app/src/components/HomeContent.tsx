// src/components/HomeContent.tsx
import Link from 'next/link';

export default function HomeContent() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/dashboard" className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold">📊 Sales Dashboard</h2>
          <p className="text-gray-500 mt-2">View all your daily, weekly and monthly sales metrics</p>
        </Link>
        <Link href="/admin/products" className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold">🍕 Product Management</h2>
          <p className="text-gray-500 mt-2">Create and update menu items like pizza, drinks, etc.</p>
        </Link>
        <Link href="/admin/orders" className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold">⏱️ Waiting Orders</h2>
          <p className="text-gray-500 mt-2">Monitor and fulfill customer orders in queue</p>
        </Link>
        <Link href="/admin/roles" className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold">👥 Role Management</h2>
          <p className="text-gray-500 mt-2">Assign roles to staff like cashier or product manager</p>
        </Link>
      </div>
    </div>
  );
}
