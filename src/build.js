// build.js - Build script for LemGendary Image Processor
import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    try {
        console.log('Building LemGendary Image Processor...');
        console.log('Current directory (build.js location):', __dirname);

        // Since build.js is in src/, go up one level to get project root
        const projectRoot = resolve(__dirname, '..');
        const srcDir = __dirname; // build.js is in src/
        const entryFile = resolve(srcDir, 'index.js');

        console.log('Project root:', projectRoot);
        console.log('Source directory:', srcDir);
        console.log('Entry file path:', entryFile);
        console.log('Entry file exists:', existsSync(entryFile));

        if (!existsSync(entryFile)) {
            console.error('❌ Entry file not found:', entryFile);
            console.error('Please check that index.js exists in the src/ directory');
            process.exit(1);
        }

        // Build the main library from index.js (includes all exports)
        console.log('\n📦 Building main library (index.js)...');
        await build({
            configFile: resolve(projectRoot, 'vite.config.js'),
            build: {
                outDir: resolve(projectRoot, 'dist'),
                emptyOutDir: true,
                lib: {
                    entry: entryFile,
                    name: 'ImageLemgendizer',
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
                    external: ['jszip'], // Mark jszip as external
                    output: {
                        exports: 'named', // Important: named exports for all functions
                        generatedCode: {
                            reservedNamesAsProps: false
                        }
                    }
                },
                sourcemap: true,
                minify: false, // DISABLE MINIFICATION
                reportCompressedSize: true
            }
        });

        console.log('\n✅ Build completed successfully!');
        console.log('📦 Output files in dist/:');
        console.log('   - index.es.js (ES Module - Main library with all exports)');
        console.log('   - index.cjs.js (CommonJS - Main library with all exports)');

        // Verify exports in built files
        console.log('\n🧪 Verifying exports...');

        // Check file sizes
        const distDir = resolve(projectRoot, 'dist');
        const files = ['index.es.js', 'index.cjs.js'];
        files.forEach(file => {
            const filePath = resolve(distDir, file);
            if (existsSync(filePath)) {
                const stats = statSync(filePath);
                console.log(`   ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
            }
        });

        // Create a simple test to verify exports
        const testExports = `
// Test file to verify exports
import * as lib from './index.es.js';

console.log('✅ Total exports in index.es.js:', Object.keys(lib).length);

// Count different types of exports
const exportCategories = {
    coreFunctions: 0,
    zipUtilities: 0,
    imageUtilities: 0,
    stringUtilities: 0,
    processingUtilities: 0,
    validationUtilities: 0,
    mainFunctions: 0,
    other: 0
};

const exportNames = Object.keys(lib).filter(k => !k.startsWith('_') && k !== 'default');

exportNames.forEach(name => {
    if (name.includes('getLemGend') || name.includes('getAllProcessors')) {
        exportCategories.coreFunctions++;
    } else if (name.includes('Zip') || name.includes('zip')) {
        exportCategories.zipUtilities++;
    } else if (name.includes('Image') || name.includes('image') || name.includes('resize') || name.includes('crop') || name.includes('thumbnail')) {
        exportCategories.imageUtilities++;
    } else if (name.includes('validate') || name.includes('Validation')) {
        exportCategories.validationUtilities++;
    } else if (name.includes('process') && !name.includes('processWith')) {
        exportCategories.processingUtilities++;
    } else if (name.includes('lemGendary') || name.includes('processWith') || name.includes('getLibrary')) {
        exportCategories.mainFunctions++;
    } else if (name.includes('sanitize') || name.includes('format') || name.includes('escape') || name.includes('apply')) {
        exportCategories.stringUtilities++;
    } else {
        exportCategories.other++;
    }
});

console.log('📋 Export breakdown:');
console.log('   Core Functions:', exportCategories.coreFunctions);
console.log('   Main Functions:', exportCategories.mainFunctions);
console.log('   ZIP Utilities:', exportCategories.zipUtilities);
console.log('   Image Utilities:', exportCategories.imageUtilities);
console.log('   String Utilities:', exportCategories.stringUtilities);
console.log('   Processing Utilities:', exportCategories.processingUtilities);
console.log('   Validation Utilities:', exportCategories.validationUtilities);
console.log('   Other:', exportCategories.other);
console.log('   Total:', exportNames.length);

// Check for critical exports
const criticalExports = [
    'getLemGendTask',
    'getLemGendImage',
    'getLemGendaryResize',
    'getLemGendaryCrop',
    'getLemGendaryOptimize',
    'getLemGendaryRename',
    'lemGendaryProcessBatch',
    'createLemGendaryZip',
    'getImageDimensions',
    'validateTask',
    'getAllProcessors'
];

const missingExports = criticalExports.filter(exp => !exportNames.includes(exp));
if (missingExports.length > 0) {
    console.error('❌ Missing critical exports:', missingExports);
} else {
    console.log('✅ All critical exports present');
}

// Test actual function calls
console.log('\\n🧪 Testing function availability:');
try {
    if (typeof lib.getLemGendImage === 'function') {
        console.log('✅ getLemGendImage is a function');
    } else {
        console.log('❌ getLemGendImage is not a function');
    }

    if (typeof lib.lemGendaryProcessBatch === 'function') {
        console.log('✅ lemGendaryProcessBatch is a function');
    } else {
        console.log('❌ lemGendaryProcessBatch is not a function');
    }

    if (typeof lib.createLemGendaryZip === 'function') {
        console.log('✅ createLemGendaryZip is a function');
    } else {
        console.log('❌ createLemGendaryZip is not a function');
    }
} catch (error) {
    console.error('❌ Error testing functions:', error.message);
}
`;

        writeFileSync(
            resolve(distDir, 'test-exports.js'),
            testExports
        );

        console.log('📄 Created dist/test-exports.js for verification');

        // Create a simple package.json for the dist folder - FIXED: removed non-existent exports
        const packageJson = {
            name: 'image-lemgendizer-core',
            version: '3.0.0',
            description: 'Batch image processing with intelligent operations',
            main: 'index.cjs.js',
            module: 'index.es.js',
            types: 'index.d.ts',
            exports: {
                '.': {
                    import: './index.es.js',
                    require: './index.cjs.js'
                }
                // Removed non-existent exports:
                // './utils': './utils/index.js',
                // './processors': './processors/index.js',
                // './templates': './templates/index.js'
            },
            files: ['dist/**/*'],
            keywords: ['image', 'processing', 'optimization', 'resize', 'crop', 'batch'],
            author: 'LemGenda',
            license: 'MIT',
            repository: {
                type: 'git',
                url: 'https://github.com/lemgenda/image-lemgendizer-core'
            },
            bugs: {
                url: 'https://github.com/lemgenda/image-lemgendizer-core/issues'
            },
            homepage: 'https://github.com/lemgenda/image-lemgendizer-core',
            dependencies: {
                jszip: '^3.10.1'
            }
        };

        writeFileSync(
            resolve(distDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        console.log('📄 Created dist/package.json');

        // Create a simple README for the dist folder
        const readme = `# LemGendary Image Processor - Distribution

This is the built distribution of the LemGendary Image Processor.

## Usage

### ES Modules (Modern)
\`\`\`javascript
// Import specific functions
import {
    getLemGendTask,
    getLemGendImage,
    getLemGendaryResize,
    getLemGendaryCrop,
    getLemGendaryOptimize,
    getLemGendaryRename,
    lemGendaryProcessBatch,
    createLemGendaryZip,
    getImageDimensions,
    validateTask
} from 'image-lemgendizer-core';

// Or import everything
import * as ImageLemgendizer from 'image-lemgendizer-core';
\`\`\`

### CommonJS (Node.js)
\`\`\`javascript
// Import specific functions
const {
    getLemGendTask,
    lemGendaryProcessBatch,
    createLemGendaryZip
} = require('image-lemgendizer-core');

// Or import everything
const ImageLemgendizer = require('image-lemgendizer-core');
\`\`\`

## Available Exports

### Core Functions
- \`getLemGendTask()\` - Get LemGendTask class
- \`getLemGendImage()\` - Get LemGendImage class
- \`getLemGendaryResize()\` - Get resize processor
- \`getLemGendaryCrop()\` - Get crop processor
- \`getLemGendaryOptimize()\` - Get optimize processor
- \`getLemGendaryRename()\` - Get rename processor
- \`getAllProcessors()\` - Get all processors at once

### Main Functions
- \`lemGendaryProcessBatch\` - Batch processing
- \`processWithTemplate\` - Template processing
- \`processFlexibleTemplate\` - Flexible template processing
- \`getLibraryInfo\` - Library information

### ZIP Utilities
- \`createLemGendaryZip\`, \`createSimpleZip\`, \`extractZip\`
- \`getZipInfo\`, \`createZipWithProgress\`, \`createOptimizedZip\`
- \`createCustomZip\`, \`createTemplateZip\`, \`createBatchZip\`

### Image Utilities
- \`getImageDimensions\`, \`formatFileSize\`, \`getFileExtension\`
- \`validateImageFile\`, \`createThumbnail\`, \`analyzeForOptimization\`
- \`resizeImage\`, \`cropImage\`, \`fileToDataURL\`
- \`calculateAspectRatioFit\`, \`getOptimizationPreset\`
- \`getRecommendedFormat\`, \`checkAICapabilities\`
- \`getMimeTypeFromExtension\`, \`hasTransparency\`, \`dataURLtoFile\`
- \`batchProcess\`, \`needsFormatConversion\`, \`getOptimizationStats\`
- \`getFormatPriorities\`, \`createOptimizationPreview\`
- \`generateOptimizationComparison\`, \`calculateOptimizationSavings\`
- \`isLemGendImage\`

### String Utilities
- \`sanitizeFilename\`, \`applyPattern\`, \`getCommonRenamePatterns\`
- \`calculateStringSimilarity\`, \`escapeRegExp\`
- \`formatDatePattern\`, \`extractPatternVariables\`

### Processing Utilities
- \`processSingleFile\`, \`actuallyResizeImage\`, \`actuallyCropImage\`
- \`applyOptimization\`, \`getImageOutputs\`

### Validation Utilities
- \`validateTask\`, \`validateImage\`, \`parseDimension\`
- \`validateResizeOptions\`, \`validateCropOptions\`, \`validateOptimizationOptions\`
- \`validateTemplateCompatibility\`, \`validateRenamePattern\`
- \`ValidationErrors\`, \`ValidationWarnings\`, \`isVariableDimension\`
- \`getFlexibleTemplates\`, \`getValidationSummary\`, \`validateDimensions\`
- \`validateResize\`, \`validateCrop\`, \`validateOptimization\`
- \`validateSessionImage\`, \`validateFaviconOptions\`
- \`validateTaskSteps\`, \`validateTaskLogic\`

### Template Utilities
- \`getTemplateById\`, \`getAllPlatforms\`, \`getTemplatesByCategory\`
- \`getFlexibleTemplates\`, \`validateTemplateCompatibility\`
- \`getTemplateAspectRatio\`, \`getTemplateAspectRatioString\`, \`getTemplateStats\`

## Features

- 📐 Intelligent image resizing
- ✂️ AI-powered smart cropping
- 📦 Advanced optimization with WebP/AVIF support
- 🏷️ Batch renaming with patterns
- 📁 Template system for common use cases
- 🗜️ ZIP creation with organized structure
- 🔄 Batch processing with progress tracking
- 🎯 Validation and error handling
- 🌐 Browser and Node.js support

## Dependencies

- \`jszip\` - For ZIP file creation/extraction

## License

MIT © LemGenda
`;

        writeFileSync(
            resolve(distDir, 'README.md'),
            readme
        );

        console.log('📖 Created dist/README.md');

        console.log('\n🎉 Build process complete!');
        console.log('To test the build, run:');
        console.log('   cd dist && node test-exports.js');
        console.log('   or');
        console.log('   cd dist && node -e "const m = require(\'./index.cjs.js\'); console.log(\'Exports:\', Object.keys(m).length)"');

    } catch (error) {
        console.error('❌ Build failed:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the build
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});