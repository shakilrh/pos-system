// next.config.js
const { withModuleFederation } = require('@module-federation/nextjs-mf');

module.exports = {
    webpack: (config, options) => {
        const { isServer } = options;

        config.plugins.push(
            new options.webpack.container.ModuleFederationPlugin({
                name: 'host',
                filename: 'static/chunks/remoteEntry.js',
                remotes: {
                    remoteApp: isServer
                        ? 'remoteApp@http://localhost:3001/_next/static/chunks/remoteEntry.js'
                        : 'remoteApp@http://localhost:3001/_next/static/chunks/remoteEntry.js',
                },
                shared: {
                    'next/router': {
                        singleton: true,
                        eager: true,
                        requiredVersion: false,
                    },
                    'next/link': {
                        singleton: true,
                        eager: true,
                        requiredVersion: false,
                    },
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