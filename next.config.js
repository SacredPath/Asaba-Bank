/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable to avoid ESLint config issues
  },
  output: 'standalone',
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    // Exclude Supabase functions from webpack build
    config.resolve.alias = {
      ...config.resolve.alias,
      'supabase/functions': false,
    };
    
    // Fix Watchpack errors on Windows by ignoring system files
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/pagefile.sys',
          '**/hiberfil.sys',
          '**/swapfile.sys',
          '**/Thumbs.db',
          '**/.DS_Store',
          // Ignore root system files
          /^[A-Z]:\\pagefile\.sys$/i,
          /^[A-Z]:\\hiberfil\.sys$/i,
          /^[A-Z]:\\swapfile\.sys$/i,
        ],
        poll: false,
      };
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

