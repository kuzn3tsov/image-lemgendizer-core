// build.js - Build script for LemGendary Image Processor
import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    try {
        console.log('🏗️  Building LemGendary Image Processor...');
        console.log('📁 Build script location:', __dirname);
        console.log('📁 Current directory contents:');

        // List files in current directory
        try {
            const files = readdirSync(__dirname);
            files.forEach(file => {
                console.log(`  📄 ${file}`);
            });
        } catch (e) {
            console.error('Cannot list directory:', e.message);
        }

        // Project root - where build.js is located
        const projectRoot = __dirname;

        // Source directory is src/ relative to project root
        const srcDir = resolve(projectRoot, 'src');
        const entryFile = resolve(srcDir, 'index.js');

        console.log('\n🔍 Checking project structure:');
        console.log('  Project root:', projectRoot);
        console.log('  Source directory:', srcDir);
        console.log('  Entry file:', entryFile);
        console.log('  Entry file exists:', existsSync(entryFile));

        if (!existsSync(entryFile)) {
            console.error('❌ ERROR: Entry file not found!');
            console.error('Expected: ' + entryFile);

            // List what's actually in src/
            if (existsSync(srcDir)) {
                console.error('\nActual files in src/:');
                try {
                    const files = readdirSync(srcDir);
                    if (files.length === 0) {
                        console.error('  (empty directory)');
                    } else {
                        files.forEach(file => {
                            console.error(`  ${file}`);
                        });
                    }
                } catch (e) {
                    console.error('Cannot read src/ directory:', e.message);
                }
            } else {
                console.error('src/ directory does not exist!');
                console.error('Creating src/ directory...');
                mkdirSync(srcDir, { recursive: true });
            }

            process.exit(1);
        }

        // Check for vite config
        const viteConfigPath = resolve(projectRoot, 'vite.config.js');

        if (!existsSync(viteConfigPath)) {
            console.error('❌ ERROR: vite.config.js not found!');
            console.error('Expected at: ' + viteConfigPath);
            console.error('Please create vite.config.js in the core/ directory.');
            process.exit(1);
        }

        console.log('✅ Vite config found:', viteConfigPath);

        // Clean dist directory
        const distDir = resolve(projectRoot, 'dist');
        if (existsSync(distDir)) {
            console.log('🧹 Cleaning dist directory...');
            try {
                execSync(`rm -rf ${distDir}`);
            } catch (e) {
                // Try alternative method
                const { rmSync } = await import('fs');
                rmSync(distDir, { recursive: true, force: true });
            }
        }
        mkdirSync(distDir, { recursive: true });

        // Build the main library from index.js
        console.log('\n📦 Building library (this may take a moment)...');

        const startTime = Date.now();

        await build({
            configFile: viteConfigPath,
            build: {
                outDir: distDir,
                emptyOutDir: false, // We already cleaned it
                lib: {
                    entry: entryFile,
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
                        generatedCode: {
                            reservedNamesAsProps: false
                        }
                    }
                },
                sourcemap: true,
                minify: false,
                reportCompressedSize: true
            }
        });

        const buildTime = Date.now() - startTime;
        console.log(`✅ Build completed in ${buildTime}ms`);

        // Verify the build
        console.log('\n🔍 Verifying build output:');

        const files = ['index.es.js', 'index.cjs.js'];
        let totalSize = 0;

        files.forEach(file => {
            const filePath = resolve(distDir, file);
            if (existsSync(filePath)) {
                const stats = statSync(filePath);
                const sizeKB = (stats.size / 1024).toFixed(2);
                totalSize += parseFloat(sizeKB);
                console.log(`  📄 ${file}: ${sizeKB} KB`);

                // Check if file has content
                const content = readFileSync(filePath, 'utf8');
                if (content.trim().length === 0) {
                    console.error(`  ❌ ${file} is empty!`);
                } else {
                    console.log(`  ✅ ${file} has ${content.length} characters`);
                }
            } else {
                console.error(`  ❌ ${file} not found in dist/`);
            }
        });

        console.log(`  📊 Total size: ${totalSize.toFixed(2)} KB`);

        // Create test file
        console.log('\n🧪 Creating test file...');
        const testContent = `
// Test the built library
async function test() {
    try {
        console.log('🧪 Testing LemGendary Image Processor build...');

        // Test ES module
        const esModule = await import('./index.es.js');
        console.log('✅ ES Module loaded');
        console.log('   Exports:', Object.keys(esModule).length);

        // Test CommonJS
        const commonjsModule = require('./index.cjs.js');
        console.log('✅ CommonJS Module loaded');
        console.log('   Exports:', Object.keys(commonjsModule).length);

        // Check for key exports
        const requiredExports = [
            'LemGendImage',
            'LemGendTask',
            'lemGendaryProcessBatch'
        ];

        let missing = [];
        requiredExports.forEach(exp => {
            if (!esModule[exp]) {
                missing.push(\`ES: \${exp}\`);
            }
            if (!commonjsModule[exp]) {
                missing.push(\`CJS: \${exp}\`);
            }
        });

        if (missing.length > 0) {
            console.error('❌ Missing exports:', missing);
            process.exit(1);
        } else {
            console.log('✅ All required exports present');
        }

        console.log('🎉 Build test passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
if (require.main === module) {
    test();
} else {
    module.exports = test;
}
`;

        writeFileSync(resolve(distDir, 'test-build.js'), testContent);
        console.log('📄 Created dist/test-build.js');

        // Create minimal package.json for dist
        const packageJson = {
            name: '@lemgenda/image-lemgendizer-core',
            version: '3.0.0',
            description: 'Client-side batch image processing library with intelligent operations',
            main: 'index.cjs.js',
            module: 'index.es.js',
            exports: {
                '.': {
                    import: './index.es.js',
                    require: './index.cjs.js'
                }
            },
            files: ['*.js', '*.d.ts', '*.md'],
            keywords: ['image', 'processing', 'optimization', 'resize', 'crop', 'batch'],
            author: 'LemGenda',
            license: 'MIT',
            repository: {
                type: 'git',
                url: 'git+https://github.com/lemgenda/image-lemgendizer-core.git'
            },
            bugs: {
                url: 'https://github.com/lemgenda/image-lemgendizer-core/issues'
            },
            homepage: 'https://github.com/lemgenda/image-lemgendizer-core#readme',
            dependencies: {
                jszip: '^3.10.1'
            },
            engines: {
                node: '>=14.0.0'
            }
        };

        writeFileSync(
            resolve(distDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        console.log('📄 Created dist/package.json');

        console.log('\n🎉 Build complete!');
        console.log('To test the build:');
        console.log('  cd dist');
        console.log('  node test-build.js');

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the build
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});