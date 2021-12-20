const domainName = '<distribution-id>.cloudfront.net';

module.exports = (phase) => {
  const isExport = phase === 'phase-export';

  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    images: {
      loader: isExport ? 'custom' : 'default',
      domains: ['assets.vercel.com'],
      path: `https://${domainName}/_next/image`,
    },
  };
  return nextConfig;
};
