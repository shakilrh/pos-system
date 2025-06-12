import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { RemoteHeader, RemoteSidebar, RemoteFooter } from '../components/RemoteLoader';


// use <RemoteHeader /> instead of <Header />

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <RemoteHeader  />
      <RemoteSidebar />
      <Component {...pageProps} />
      <RemoteFooter />
    </>
  );
}

export default MyApp;
