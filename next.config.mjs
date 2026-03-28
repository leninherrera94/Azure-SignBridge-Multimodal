/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection",      value: "1; mode=block" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key:   "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          // Allow embedding in Microsoft Teams iframes
          {
            key:   "Content-Security-Policy",
            value: "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.microsoft.com https://*.skype.com https://*.office.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
