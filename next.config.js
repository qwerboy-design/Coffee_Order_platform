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
}

module.exports = nextConfig



