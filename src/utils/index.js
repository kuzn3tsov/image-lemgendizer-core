/**
 * Central utility exports
 * @module utils
 */

// Re-export all utility functions
export * from './imageUtils.js';
export * from './stringUtils.js';
export * from './validationUtils.js';
export * from './processingUtils.js';
export * from './zipUtils.js';

// Helper to dynamically import any utility module
export async function importUtils(moduleName) {
    switch (moduleName) {
        case 'imageUtils':
            return import('./imageUtils.js');
        case 'stringUtils':
            return import('./stringUtils.js');
        case 'validationUtils':
            return import('./validationUtils.js');
        case 'processingUtils':
            return import('./processingUtils.js');
        case 'zipUtils':
            return import('./zipUtils.js');
        default:
            throw new Error(`Unknown utility module: ${moduleName}`);
    }
}

// Export common utility functions as named exports
export {
    getFileExtension,
    formatFileSize,
    getMimeTypeFromExtension,
    validateImageFile,
    calculateAspectRatioFit
} from './imageUtils.js';

export {
    sanitizeFilename,
    applyPattern,
    formatDatePattern,
    getCommonRenamePatterns
} from './stringUtils.js';

export {
    ValidationErrors,
    ValidationWarnings,
    validateImage,
    validateSessionImage,
    validateTask,
    validateResizeOptions,
    validateCropOptions,
    validateOptimizationOptions
} from './validationUtils.js';

export {
    actuallyResizeImage,
    actuallyCropImage,
    applyOptimization,
    processSingleFile
} from './processingUtils.js';

export {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createBatchZip
} from './zipUtils.js';