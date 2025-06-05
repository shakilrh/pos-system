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
        shared: {
          react: { singleton: true, eager: true, requiredVersion: false },
          'react-dom': { singleton: true, eager: true, requiredVersion: false },
          'next/router': { singleton: true, eager: true, requiredVersion: false },
          'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: false },
          'react/jsx-dev-runtime': { singleton: true, eager: true, requiredVersion: false },
          'shared-tailwind': { singleton: true, eager: true, requiredVersion: false },
        },
      })
    );
    return config;
  },
};
