/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
          domains: ['images.unsplash.com'],
    },
    typescript: {
          ignoreBuildErrors: true,
    },
    eslint: {
          ignoreDuringBuilds: true,
    },
    transpilePackages: ['cheerio', 'parse5', 'domhandler', 'undici'],
    experimental: {
          serverComponentsExternalPackages: ['cheerio'],
    },
}

module.exports = nextConfig
