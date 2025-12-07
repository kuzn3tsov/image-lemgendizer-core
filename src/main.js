// src/main.js - Simplified entry point for Vite
// Re-export everything from main index
export * from './index.js';

// Simple default export
import {
    LemGendImage,
    LemGendTask,
    lemGendaryProcessBatch,
    getLibraryInfo,
    processWithTemplate,
    processFlexibleTemplate
} from './index.js';

const ImageLemgendizer = {
    // Core
    LemGendImage,
    LemGendTask,

    // Main functions
    lemGendaryProcessBatch,
    getLibraryInfo,
    processWithTemplate,
    processFlexibleTemplate,

    // Utilities will be imported dynamically when needed
    async createZip(images, options) {
        const { createLemGendaryZip } = await import('./utils/zipUtils.js');
        return createLemGendaryZip(images, options);
    },

    async processSingleFile(file, task, index) {
        const { processSingleFile } = await import('./utils/processingUtils.js');
        return processSingleFile(file, task, index);
    }
};

export default ImageLemgendizer;