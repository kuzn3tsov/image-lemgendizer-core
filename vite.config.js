import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            formats: ['es', 'cjs'],
            fileName: (format) => {
                switch (format) {
                    case 'es': return 'index.es.js';
                    case 'cjs': return 'index.cjs.js';
                    default: return `index.${format}.js`;
                }
            }
        },
        rollupOptions: {
            external: ['jszip'],
            onwarn(warning, warn) {
                // Suppress dynamic import warnings
                if (warning.message.includes('dynamically imported')) return;
                warn(warning);
            },
            output: {
                exports: 'named'
            }
        },
        outDir: 'dist',
        sourcemap: true
    }
});