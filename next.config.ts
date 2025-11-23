import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Security headers
  async headers() {
    return [
      {
        source: '/storage/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
    ];
  },

  // Redirect private storage requests
  async redirects() {
    return [
      {
        source: '/storage/:path*',
        destination: '/404',
        permanent: true,
      },
    ];
  },

  // Rewrite rules to block direct access to storage
  async rewrites() {
    return {
      beforeFiles: [
        // Block any attempts to access storage directory
        {
          source: '/storage/:path*',
          destination: '/api/not-found',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // Webpack config for file handling
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side optimizations for file handling
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          fileHandling: {
            name: 'file-handling',
            chunks: 'all',
            test: /[\\/]lib[\\/](fileValidation|secureFileStorage|backupUtils)\.ts$/,
            priority: 10,
          },
        },
      };
    }
    return config;
  },

  // External packages for server components
  serverExternalPackages: ['formidable'],
  
  // Turbopack configuration
  turbopack: {
    root: '/Users/myagmarsurennyamkhuu/TSA/e-proof',
  },
};

export default nextConfig;
