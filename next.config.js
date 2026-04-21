/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow KIPRIS image domains for patent drawings
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'plus.kipris.or.kr' },
      { protocol: 'https', hostname: 'plus.kipris.or.kr' },
      { protocol: 'http', hostname: 'kipo-api.kipi.or.kr' },
    ],
  },
};

module.exports = nextConfig;
