import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src/templates',
            outDir: 'dist/types/templates',
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: resolve(__dirname, 'src/templates/index.js'),
            name: 'Templates',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'templates/index.es.js' : 'templates/index.cjs.js',
        },
        rollupOptions: {
            external: ['../LemGendImage.js', '../utils/index.js'],
            output: {
                exports: 'named',
            },
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
    },
});