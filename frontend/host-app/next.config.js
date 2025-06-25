const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, { isServer }) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          remoteApp: `remoteApp@http://localhost:3001/_next/static/${
            isServer ? 'ssr' : 'chunks'
          }/remoteEntry.js`,
        },
        exposes: {
          './AuthContext': './src/context/AuthContext.tsx', // Keep for other components if needed
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