// host-app/src/components/RemoteLoader.tsx
import dynamic from 'next/dynamic';

export const RemoteHeader = dynamic(
  () => import('remoteApp/Header').catch(() => () => <div>Header failed to load</div>),
  { ssr: false }
);

export const RemoteSidebar = dynamic(
  () => import('remoteApp/Sidebar').catch(() => () => <div>Sidebar failed to load</div>),
  { ssr: false }
);

export const RemoteFooter = dynamic(
  () => import('remoteApp/Footer').catch(() => () => <div>Footer failed to load</div>),
  { ssr: false }
);
