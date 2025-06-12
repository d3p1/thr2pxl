import {resolve} from 'path'
import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'
import dts from 'vite-plugin-dts'

export default {
  base: '/thr2pxl/',
  server: {
    host: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/thr2pxl.ts'),
      name: 'thr2pxl',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['three', 'tweakpane'],
    },
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  plugins: [tailwindcss(), glsl(), dts()],
}
