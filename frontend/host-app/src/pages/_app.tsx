// src/pages/_app.tsx
import dynamic from 'next/dynamic';
import { ReactElement } from 'react';
import 'shared-tailwind/styles';
import { AuthProvider } from './AuthContext';

const Header = dynamic(
  () => import('remoteApp/Header').catch(() => () => <div>Header failed to load</div>),
  { ssr: false }
);

const Sidebar = dynamic(
  () => import('remoteApp/Sidebar').catch(() => () => <div>Sidebar failed to load</div>),
  { ssr: false }
);

const Footer = dynamic(
  () => import('remoteApp/Footer').catch(() => () => <div>Footer failed to load</div>),
  { ssr: false }
);

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="fixed top-16 bottom-0 w-64" /> {/* Fixed Sidebar */}
          <main className="flex-1 ml-64"> {/* Offset for Sidebar */}
            <Component {...pageProps} />
          </main>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
