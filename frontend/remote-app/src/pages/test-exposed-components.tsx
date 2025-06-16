// src/pages/test-exposed-components.tsx
import dynamic from 'next/dynamic';
import Head from 'next/head';


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

    </div>
  );
}
