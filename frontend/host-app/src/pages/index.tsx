import dynamic from 'next/dynamic';

// Disable SSR for this homepage
const HomeContent = dynamic(() => import('../components/HomeContent'), { ssr: false });

export default function Home() {
  return <HomeContent />;
}
