import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
                preserveModules: false,
                interop: 'auto',
            },
            onwarn(warning, warn) {
                // Suppress specific warnings
                if (
                    warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
                    warning.message.includes('dynamically imported') ||
                    warning.message.includes('statically imported')
                ) {
                    return;
                }
                warn(warning);
            }
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        target: 'es2020',
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@processors': resolve(__dirname, 'src/processors'),
            '@templates': resolve(__dirname, 'src/templates'),
        },
    },
});