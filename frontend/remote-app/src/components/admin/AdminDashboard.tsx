import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesStats {
  today: number;
  week: number;
  month: number;
}

const AdminDashboard = () => {
  const [sales, setSales] = useState<SalesStats>({ today: 1245, week: 9200, month: 40200 });

  useEffect(() => {
    setTimeout(() => {
      setSales({ today: 1340, week: 9700, month: 42000 });
    }, 800);
  }, []);

  const chartData = [
    { name: 'Today', value: sales.today },
    { name: 'Week', value: sales.week },
    { name: 'Month', value: sales.month },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-6">📈 Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-blue-700">Today’s Sales</h2>
          <p className="text-3xl font-bold mt-2 text-gray-800">${sales.today.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-green-700">Weekly Sales</h2>
          <p className="text-3xl font-bold mt-2 text-gray-800">${sales.week.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold text-purple-700">Monthly Sales</h2>
          <p className="text-3xl font-bold mt-2 text-gray-800">${sales.month.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">📊 Sales Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
