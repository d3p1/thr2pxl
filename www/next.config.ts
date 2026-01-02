import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/thr2pxl',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
