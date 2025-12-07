// build.js
import { build } from 'vite';
import { resolve } from 'path';

async function main() {
    try {
        console.log('Building LemGendary Image Processor...');

        // Build library
        await build({
            configFile: resolve(__dirname, '../vite.config.js'),
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                lib: {
                    entry: resolve(__dirname, 'index.js'),
                    name: 'ImageLemgendizer',
                    formats: ['es', 'cjs'],
                    fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
                }
            }
        });

        console.log('✅ Build completed successfully!');
        console.log('📦 Output files:');
        console.log('   - dist/index.es.js (ES Module)');
        console.log('   - dist/index.cjs.js (CommonJS)');

    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

main();