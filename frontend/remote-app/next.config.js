const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  basePath: '/pos-system',
  webpack(config, { isServer }) {
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'remoteApp',
          filename: 'static/chunks/remoteEntry.js',
          exposes: {
            './Header': './src/components/Header.tsx',
            './Sidebar': './src/components/Sidebar.tsx',
            './Footer': './src/components/Footer.tsx',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^18.2.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^18.2.0', eager: true },
            'next/router': { singleton: true, requiredVersion: '^13.4.0', eager: true },
            'react/jsx-runtime': { singleton: true, requiredVersion: '^18.2.0', eager: true },
            'react/jsx-dev-runtime': { singleton: true, requiredVersion: '^18.2.0', eager: true },
            'shared-tailwind': { singleton: true, requiredVersion: false, eager: true },
          },
        })
      );
    }
    return config;
  },
};
