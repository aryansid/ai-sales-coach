/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // If you need to ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // If you need to ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Force webpack to resolve json files
    config.resolve.extensions.push('.json');
    
    // Add fallback for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        'process/browser': require.resolve('process/browser'),
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
