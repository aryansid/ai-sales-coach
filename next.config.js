/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    
    // Force webpack to resolve these modules correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      'framer-motion': require.resolve('framer-motion'),
    };

    return config;
  },
  // Remove experimental features that might cause issues
  output: 'standalone'
}

module.exports = nextConfig