/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['better-sqlite3'],
};

module.exports = nextConfig;
