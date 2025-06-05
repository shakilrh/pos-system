const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, { isServer }) {
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
          react: {
            singleton: true,
            eager: true,
            requiredVersion: require('react/package.json').version,
          },
          'react-dom': {
            singleton: true,
            eager: true,
            requiredVersion: require('react-dom/package.json').version,
          },
          'next/router': {
            singleton: true,
            eager: true,
            requiredVersion: require('next/package.json').version,
          },
          'shared-tailwind': { singleton: true, eager: true, requiredVersion: false },
        },
      })
    );
    return config;
  },
};
