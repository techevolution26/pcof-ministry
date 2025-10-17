// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...other config
  images: {
    domains: ["your-api.example.com", "s3.amazonaws.com", "localhost"], // add hosts that serve images
    // or use remotePatterns for more control
    // remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' }]
  },
};

module.exports = nextConfig;
