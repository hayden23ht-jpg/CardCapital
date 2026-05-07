/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol:'https', hostname:'images.pokemontcg.io' },
      { protocol:'https', hostname:'limitlesstcg.nyc3.cdn.digitaloceanspaces.com' },
      { protocol:'https', hostname:'assets.tcgdex.net' },
      { protocol:'https', hostname:'i.ebayimg.com' },
      { protocol:'https', hostname:'www.pricecharting.com' },
      { protocol:'https', hostname:'storage.googleapis.com' },
    ],
  },
}
export default nextConfig
