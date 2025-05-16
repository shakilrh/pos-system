// host-app/src/pages/admin/dashboard.tsx
import dynamic from 'next/dynamic';

// Dynamically load the federated AdminDashboard component
const AdminDashboard = dynamic(() => import('remoteApp/AdminDashboard'), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <AdminDashboard />
    </div>
  );
}
