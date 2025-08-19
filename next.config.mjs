/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://vercel.live/ https://vercel.com https://vercel.fides-cdn.ethyca.com/ https://va.vercel-scripts.com/v1/ https://js.stripe.com/ https://b.stripecdn.com/ https://*.stripecdn.com/ https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/ https://cdn.heapanalytics.com *.heapanalytics.com",
              "style-src 'self' 'unsafe-inline' blob: data:",
              "img-src 'self' blob: data: https: http:",
              "font-src 'self' blob: data:",
              "connect-src 'self' blob: data: https: wss: ws: https://api.stripe.com/ https://*.stripe.com/",
              "media-src 'self' blob: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
