import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'

export default {
  root: 'dev',
  base: '/thr2pxl/',
  publicDir: '../dev/public',
  server: {
    host: true,
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: true,
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  plugins: [tailwindcss(), glsl()],
}
