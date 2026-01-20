import {resolve} from 'path'
import tailwindcss from '@tailwindcss/vite'
import preserveDirectives from 'rollup-preserve-directives'
import glsl from 'vite-plugin-glsl'
import dts from 'vite-plugin-dts'
import {defineConfig} from 'vite'

export default defineConfig({
  base: '/thr2pxl/',
  server: {
    host: true,
  },
  build: {
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
      },
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      external: ['three', 'tweakpane', 'react', 'react-dom'],
    },
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  plugins: [
    tailwindcss(),
    glsl(),
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
      exclude: ['node_modules/**', 'dev/**'],
    }),
    preserveDirectives()
  ],
})
