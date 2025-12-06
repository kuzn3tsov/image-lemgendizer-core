import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src',
            outDir: 'dist/types',
            rollupTypes: false, // CHANGE THIS TO false
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'ImageLemgendizer',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
        },
        rollupOptions: {
            external: ['jszip'],
            output: {
                exports: 'named',
                globals: {
                    jszip: 'JSZip',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        target: 'es2020',
    },
});