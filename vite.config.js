import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'

export default {
  base: '/thr2pxl/',
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
