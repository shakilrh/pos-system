const NextFederationPlugin = require('@module-federation/nextjs-mf');
const webpack = require('webpack');

module.exports = {
  basePath: '/pos-system',
  webpack(config, { isServer }) {
    if (!isServer) {
      const isProd = process.env.NODE_ENV === 'production';
      const remoteUrl = isProd
        ? '/pos-system/remote-app/_next/static/chunks/remoteEntry.js'
        : 'http://localhost:3001/_next/static/chunks/remoteEntry.js';

      config.plugins.push(
        new NextFederationPlugin({
          name: 'host',
          filename: 'static/chunks/remoteEntry.js',
          remotes: {
            remoteApp: `remoteApp@${remoteUrl}`,
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

      // Replace remote modules with stub during build
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^remoteApp\/(Header|Sidebar|Footer)$/,
          (resource) => {
            resource.request = resource.request.replace(
              /^remoteApp\/(Header|Sidebar|Footer)$/,
              './fallbacks/RemoteStub'
            );
          }
        )
      );
    }
    return config;
  },
};
