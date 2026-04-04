const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => {
    return [
      {
        source: '/compare',
        destination: '/result',
        permanent: true
      },
      {
        source: '/compare/:path*',
        destination: '/result',
        permanent: true
      }
    ];
  }
};

module.exports = withNextIntl(nextConfig);
