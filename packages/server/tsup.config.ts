import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  splitting: false,
  sourcemap: true,
  dts: {
    entry: 'src/index.ts',
    resolve: true,
  },
  treeshake: true,
  name: 'server',
  shims: true,
  target: 'esnext',
  format: ['cjs', 'esm'],
  clean: true,
  platform: 'node',
  publicDir: 'public',
  outDir: 'dist',
  metafile: true,
  keepNames: true,
})
