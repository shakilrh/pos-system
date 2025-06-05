// src/pages/test-exposed-components.tsx
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Header = dynamic(
  () => import('../components/Header').catch(() => () => <div>Header failed to load</div>),
  { ssr: false }
);

const Sidebar = dynamic(
  () => import('../components/Sidebar').catch(() => () => <div>Sidebar failed to load</div>),
  { ssr: false }
);

const Footer = dynamic(
  () => import('../components/Footer').catch(() => () => <div>Footer failed to load</div>),
  { ssr: false }
);

export default function TestPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head>
        <title>Remote App Test Page</title>
        <meta name="description" content="Testing remote components" />
      </Head>
      <main className="ml-64 pt-16 pb-16 flex-1 flex justify-center items-center">
        <h1 className="text-3xl font-bold text-gray-800">Remote App Component Test</h1>
      </main>
      <Header />
      <Sidebar />
      <Footer />
    </div>
  );
}
