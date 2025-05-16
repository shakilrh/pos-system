const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, options) {
    const { isServer } = options;
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          remoteApp: `remoteApp@http://localhost:3001/_next/static/${isServer ? 'ssr' : 'chunks'}/remoteEntry.js`,
        },
        exposes: {},
        shared: {
          react: { singleton: true, eager: true, requiredVersion: false },
          'react-dom': { singleton: true, eager: true, requiredVersion: false },
          recharts: { singleton: true, eager: true, requiredVersion: false }, // <-- 🔥 ADD THIS
        },
      })
    );
    return config;
  },
};
