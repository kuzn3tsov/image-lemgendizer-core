import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src',
            outDir: 'dist/types',
            include: ['src/index.js', 'src/LemGendImage.js', 'src/tasks/**/*'],
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'ImageLemgendizer',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'index.es.js' : 'index.cjs.js',
        },
        rollupOptions: {
            external: ['sharp', 'jszip', 'mime-types', 'canvas'],
            output: {
                exports: 'named',
                globals: {
                    sharp: 'sharp',
                    jszip: 'JSZip',
                    'mime-types': 'mimeTypes',
                    canvas: 'canvas',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
    },
});