import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'

export default {
  root: 'src/',
  base: '/thr2pxl/',
  publicDir: '../public/',
  server: {
    host: true,
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [tailwindcss(), glsl()],
}
