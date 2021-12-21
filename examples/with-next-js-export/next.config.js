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
      formats: ['image/avif', 'image/webp'],
      path: `https://${domainName}/_next/image`,
    },

    /**
     * Using the tailingSlash option is recommended when exporting it to S3
     * since S3 is only able to rewrite routes to /index.html
     */
    trailingSlash: true,
  };
  return nextConfig;
};
