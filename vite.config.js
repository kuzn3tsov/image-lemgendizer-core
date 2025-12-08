// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'ImageLemgendizer',
            formats: ['es', 'cjs'],
            fileName: (format) => {
                if (format === 'es') return 'index.es.js';
                if (format === 'cjs') return 'index.cjs.js';
                return `index.${format}.js`;
            }
        },
        rollupOptions: {
            external: ['jszip'],
            output: {
                exports: 'named',
                preserveModules: false, // Bundle everything into single files
                globals: {
                    jszip: 'JSZip'
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
});