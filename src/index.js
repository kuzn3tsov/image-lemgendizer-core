/**
 * LemGendary Image Processor - Main Entry Point
 * @module image-lemgendizer
 * @version 3.0.0
 */

// ===== ALL PROCESSING FUNCTIONS =====
export {
    // Main processing functions
    lemGendaryProcessBatch,
    processWithTemplate,
    processFlexibleTemplate,
    processFaviconSet,

    // Single file processing
    processSingleFile,
    applyOptimization,

    // Helper functions
    createResize,
    createCrop,
    createOptimize,
    createRename,

    // Quick process helpers
    QuickProcess
} from './utils/processingUtils.js';

// ===== CORE CLASSES =====
export { LemGendImage } from './LemGendImage.js';
export { LemGendTask } from './tasks/LemGendTask.js';

// ===== PROCESSOR CLASSES =====
export {
    LemGendaryResize,
    createResizeProcessor,
    quickResize
} from './processors/LemGendaryResize.js';

export {
    LemGendaryCrop,
    createCropProcessor,
    quickCrop
} from './processors/LemGendaryCrop.js';

export {
    LemGendaryOptimize,
    createOptimizationProcessor,
    quickOptimize
} from './processors/LemGendaryOptimize.js';

export {
    LemGendaryRename,
    createRenameProcessor,
    quickRename
} from './processors/LemGendaryRename.js';

export {
    LemGendaryPDF,
    createPDFProcessor,
    quickPDF
} from './processors/LemGendaryPDF.js';

// ===== TEMPLATES =====
export { LemGendTemplates } from './templates/templateConfig.js';

// ===== UTILITIES =====
export * from './utils/zipUtils.js';
export * from './utils/imageUtils.js';
export * from './utils/stringUtils.js';
export * from './utils/validationUtils.js';
export * from './utils/templateUtils.js';
export * from './utils/sharedUtils.js';

// ===== CONSTANTS =====
export * from './constants/sharedConstants.js';