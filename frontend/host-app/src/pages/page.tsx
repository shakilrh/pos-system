import dynamic from 'next/dynamic';

// Dynamically import remote component
const RemoteHello = dynamic(() => import('remoteApp/Hello'), { ssr: false });

export default function HostHome() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Host App</h1>
      <RemoteHello />
    </div>
  );
}
