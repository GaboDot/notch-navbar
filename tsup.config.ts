import { defineConfig } from 'tsup';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.lib.json',
  clean: true,
  sourcemap: false,
  minify: false,
  target: 'es2017',
  external: ['react', 'react-dom', 'next', 'next/link'],
  esbuildOptions(options) {
    options.alias = {
      '@': resolve(__dirname, 'src'),
    };
    // Mark .module.scss as external — import stays in output as-is
    options.loader = {
      ...options.loader,
      '.scss': 'empty',
    };
  },
  esbuildPlugins: [
    {
      name: 'external-scss',
      setup(build) {
        // Treat all .scss imports as external (preserve the import statement)
        build.onResolve({ filter: /\.module\.scss$/ }, (args) => ({
          path: args.path,
          external: true,
        }));
      },
    },
  ],
  onSuccess: async () => {
    // Copy the SCSS module next to the built JS so relative import resolves
    try {
      mkdirSync('dist', { recursive: true });
      copyFileSync(
        resolve(__dirname, 'src/components/notch-navbar/notch-navbar.module.scss'),
        resolve(__dirname, 'dist/notch-navbar.module.scss'),
      );
      console.log('✓ Copied notch-navbar.module.scss → dist/');
    } catch (e) {
      console.error('✗ Failed to copy SCSS module:', e);
    }
  },
});
