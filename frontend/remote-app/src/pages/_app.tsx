import type { AppProps } from 'next/app';
import 'shared-tailwind/styles'; // Import shared styles


function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
