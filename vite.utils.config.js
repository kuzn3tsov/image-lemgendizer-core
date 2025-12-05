import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            entryRoot: 'src/utils',
            outDir: 'dist/types/utils',
            exclude: ['**/*.test.js', '**/*.spec.js'],
        }),
    ],

    build: {
        lib: {
            entry: resolve(__dirname, 'src/utils/index.js'),
            name: 'Utils',
            formats: ['es', 'cjs'],
            fileName: (format) => format === 'es' ? 'utils/index.es.js' : 'utils/index.cjs.js',
        },
        rollupOptions: {
            external: ['jszip', 'mime-types'],
            output: {
                exports: 'named',
                globals: {
                    jszip: 'JSZip',
                    'mime-types': 'mimeTypes',
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
    },
});