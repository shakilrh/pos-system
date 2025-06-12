'use client'
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

type RemoteComponentType = React.ComponentType<any>;

function loadRemoteComponent(scope: string, module: string): Promise<RemoteComponentType> {
  return new Promise((resolve, reject) => {
    const remote = (window as any)[scope];
    if (!remote || !remote.get) return reject('Remote not available: ' + scope);

    remote.get(module).then((factory: any) => {
      const Module = factory().default;
      resolve(Module);
    }).catch(reject);
  });
}

export function RemoteHeader() {
  const [Component, setComponent] = useState<RemoteComponentType | null>(null);

  useEffect(() => {
    loadRemoteComponent('remoteApp', './Header').then(setComponent);
  }, []);

  if (!Component) return <div>Loading Header...</div>;
  return <Component />;
}

export function RemoteSidebar() {
  const [Component, setComponent] = useState<RemoteComponentType | null>(null);

  useEffect(() => {
    loadRemoteComponent('remoteApp', './Sidebar').then(setComponent);
  }, []);

  if (!Component) return <div>Loading Sidebar...</div>;
  return <Component />;
}

export function RemoteFooter() {
  const [Component, setComponent] = useState<RemoteComponentType | null>(null);

  useEffect(() => {
    loadRemoteComponent('remoteApp', './Footer').then(setComponent);
  }, []);

  if (!Component) return <div>Loading Footer...</div>;
  return <Component />;
}
