/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 is a native module — must be excluded from bundling
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
