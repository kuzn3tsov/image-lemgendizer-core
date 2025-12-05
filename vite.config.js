// core/vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src',
            outDir: 'dist/types',
            rollupTypes: false,
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.js'),
                templates: resolve(__dirname, 'src/templates/index.js'),
                processors: resolve(__dirname, 'src/processors/index.js'),
                utils: resolve(__dirname, 'src/utils/index.js'),
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => {
                if (entryName === 'index') {
                    return format === 'es' ? 'index.es.js' : 'index.cjs.js';
                }
                return format === 'es' ? `${entryName}/index.es.js` : `${entryName}/index.cjs.js`;
            },
        },
        rollupOptions: {
            external: ['sharp', 'jszip', 'mime-types'],
            output: {
                preserveModules: false,
                exports: 'named',
                globals: {
                    sharp: 'sharp',
                    jzip: 'JSZip',
                    'mime-types': 'mimeTypes',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: true,
        target: 'es2020',
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});