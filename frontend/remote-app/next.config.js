const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, options) {
    const { isServer } = options;
    config.plugins.push(
      new NextFederationPlugin({
        name: 'remoteApp',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './AdminDashboard': './src/components/admin/AdminDashboard.tsx',
              './ProductForm': './src/components/admin/ProductForm.tsx',
        },
        remotes: {},
        shared: {
          react: {
            singleton: true,
            eager: true,
            requiredVersion: false,
          },
          'react-dom': {
            singleton: true,
            eager: true,
            requiredVersion: false,
          },
        },
      })
    );
    return config;
  },
};
