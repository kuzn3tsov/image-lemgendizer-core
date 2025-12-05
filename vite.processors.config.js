import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src/processors',
            outDir: 'dist/types/processors',
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: resolve(__dirname, 'src/processors/index.js'),
            name: 'Processors',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'processors/index.es.js' : 'processors/index.cjs.js',
        },
        rollupOptions: {
            external: ['../LemGendImage.js', '../utils/index.js', 'sharp'],
            output: {
                exports: 'named',
                globals: {
                    sharp: 'sharp',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
    },
});