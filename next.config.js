/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['dl.airtable.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.airtable.com',
      },
    ],
  },
  // 配置文件監視器，忽略 Windows 系統目錄以避免權限錯誤
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/AppData/**',
          '**/INetCache/**',
          '**/Content.IE5/**',
          '**/Local Settings/**',
          '**/Temp/**',
          '**/Windows/**',
        ],
        // 使用輪詢模式以避免文件系統監視器問題
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
}

module.exports = nextConfig



