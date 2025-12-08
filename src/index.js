/**
 * LemGendary Image Processor - Main Entry Point
 * @module image-lemgendizer
 */

// ===== CORE CLASSES =====
export { LemGendImage } from './LemGendImage.js';
export { LemGendTask } from './tasks/LemGendTask.js';

// ===== PROCESSOR CLASSES =====
export { LemGendaryResize } from './processors/LemGendaryResize.js';
export { LemGendaryCrop } from './processors/LemGendaryCrop.js';
export { LemGendaryOptimize } from './processors/LemGendaryOptimize.js';
export { LemGendaryRename } from './processors/LemGendaryRename.js';

// ===== TEMPLATES =====
export { LemGendTemplates } from './templates/templateConfig.js';

// ===== UTILITIES =====
// ZIP Utilities
export {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createOptimizedZip,
    createCustomZip,
    createTemplateZip,
    createBatchZip
} from './utils/zipUtils.js';

// Image Utilities
export {
    getImageDimensions,
    formatFileSize,
    getFileExtension,
    validateImageFile,
    createThumbnail,
    analyzeForOptimization,
    resizeImage,
    cropImage,
    fileToDataURL,
    calculateAspectRatioFit,
    getOptimizationPreset,
    getRecommendedFormat,
    checkAICapabilities,
    getMimeTypeFromExtension,
    hasTransparency,
    dataURLtoFile,
    batchProcess,
    needsFormatConversion,
    getOptimizationStats,
    getFormatPriorities,
    createOptimizationPreview,
    generateOptimizationComparison,
    calculateOptimizationSavings,
    isLemGendImage
} from './utils/imageUtils.js';

// String Utilities
export {
    sanitizeFilename,
    applyPattern,
    getCommonRenamePatterns,
    calculateStringSimilarity,
    escapeRegExp,
    formatDatePattern,
    extractPatternVariables
} from './utils/stringUtils.js';

// Processing Utilities
export {
    processSingleFile,
    actuallyResizeImage,
    actuallyCropImage,
    applyOptimization,
    getImageOutputs
} from './utils/processingUtils.js';

// Validation Utilities
export {
    validateTask,
    validateImage,
    validateResizeOptions,
    validateCropOptions,
    validateOptimizationOptions,
    validateRenamePattern,
    ValidationErrors,
    ValidationWarnings,
    getValidationSummary,
    validateDimensions,
    validateResize,
    validateCrop,
    validateOptimization,
    validateSessionImage,
    validateFaviconOptions,
    validateTaskSteps,
    validateTaskLogic
} from './utils/validationUtils.js';

// Template Utilities
export {
    getTemplateById,
    getAllPlatforms,
    getTemplatesByCategory,
    getFlexibleTemplates,
    validateTemplateCompatibility,
    getTemplateAspectRatio,
    getTemplateAspectRatioString,
    getTemplateStats
} from './utils/templateUtils.js';

// Shared Utilities
export {
    parseDimension,
    isVariableDimension
} from './utils/sharedUtils.js';

// ===== MAIN PROCESSING FUNCTIONS =====
export async function lemGendaryProcessBatch(files, task, options = {}) {
    const {
        onProgress = null,
        onWarning = null,
        onError = null,
        parallel = false,
        maxParallel = 4
    } = options;

    const results = [];
    const totalFiles = files.length;

    console.log('=== lemGendaryProcessBatch START ===');
    console.log('Batch processing:', {
        totalFiles,
        hasTask: !!task,
        steps: task?.getEnabledSteps()?.length || 0,
        options
    });

    console.log('Validating task...');
    let taskValidation;
    try {
        if (files.length > 0) {
            let firstFile = files[0];
            if (!(firstFile instanceof LemGendImage)) {
                const lemGendImage = new LemGendImage(firstFile);
                await lemGendImage.load().catch(() => { });
                taskValidation = await validateTask(task, lemGendImage);
            } else {
                taskValidation = await validateTask(task, firstFile);
            }
        } else {
            taskValidation = await validateTask(task);
        }
    } catch (validationError) {
        console.error('Task validation threw an error:', validationError);
        taskValidation = {
            isValid: true,
            hasWarnings: true,
            errors: [],
            warnings: [{
                type: 'validation_error',
                message: `Validation error: ${validationError.message}`,
                severity: 'warning'
            }],
            summary: {
                canProceed: true,
                status: 'has_warnings'
            }
        };
    }

    if (taskValidation.errors && taskValidation.errors.length > 0) {
        const criticalErrors = taskValidation.errors.filter(e =>
            e.severity === 'error' &&
            !e.message.includes('missing file property') &&
            !e.message.includes('invalid file type')
        );

        if (criticalErrors.length > 0) {
            console.error('Critical validation errors:', criticalErrors);
            throw new Error(`Task validation failed: ${criticalErrors.map(e => e.message).join(', ')}`);
        } else {
            console.warn('Non-critical validation errors, proceeding...');
            if (onWarning) {
                taskValidation.errors.forEach(error => {
                    onWarning({
                        ...error,
                        severity: 'warning'
                    });
                });
            }
        }
    }

    if (taskValidation.hasWarnings && onWarning) {
        taskValidation.warnings.forEach(warning => onWarning(warning));
    }

    if (parallel) {
        const batches = [];
        for (let i = 0; i < files.length; i += maxParallel) {
            batches.push(files.slice(i, i + maxParallel));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchPromises = batch.map((file, fileIndex) =>
                processSingleFile(file, task, batchIndex * maxParallel + fileIndex)
            );

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    const errorResult = {
                        file: batch[index],
                        error: result.reason.message,
                        success: false
                    };
                    results.push(errorResult);
                    if (onError) onError(result.reason, batch[index]);
                }
            });

            if (onProgress) {
                const progress = results.length / totalFiles;
                onProgress(progress, results.length, totalFiles);
            }
        }
    } else {
        for (let i = 0; i < files.length; i++) {
            try {
                console.log(`\n=== Processing file ${i + 1}/${totalFiles} ===`);

                const file = files[i];
                console.log('File to process:', {
                    type: file?.constructor?.name,
                    name: file?.name || file?.originalName || file?.file?.name
                });

                const result = await processSingleFile(file, task, i);
                results.push(result);

                if (onProgress) {
                    const progress = (i + 1) / totalFiles;
                    onProgress(progress, i + 1, totalFiles);
                }
            } catch (error) {
                console.error(`Failed to process file ${i}:`, error);
                const errorResult = {
                    file: files[i],
                    error: error.message,
                    success: false
                };
                results.push(errorResult);
                if (onError) onError(error, files[i]);
            }
        }
    }

    console.log('\n=== Processing complete ===');
    console.log('Summary:', {
        totalFiles,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
    });

    return results;
}

// ===== TEMPLATE PROCESSING FUNCTIONS =====
export async function processWithTemplate(image, templateId, options = {}) {
    const template = getTemplateById(templateId);
    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    const compatibility = validateTemplateCompatibility(template, {
        width: image.width,
        height: image.height
    });

    if (!compatibility.compatible) {
        throw new Error(`Template incompatible: ${compatibility.errors.map(e => e.message).join(', ')}`);
    }

    let lemGendImage;
    if (image instanceof LemGendImage) {
        lemGendImage = image;
    } else {
        lemGendImage = new LemGendImage(image);
        await lemGendImage.load();
    }

    const task = new LemGendTask(`Template: ${template.displayName}`, template.description);

    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);

    if (!widthInfo.isVariable && !heightInfo.isVariable) {
        const aspect = widthInfo.value / heightInfo.value;
        const imageAspect = lemGendImage.width / lemGendImage.height;

        if (Math.abs(aspect - imageAspect) > 0.1) {
            task.addCrop(widthInfo.value, heightInfo.value, 'smart');
        } else {
            task.addResize(Math.max(widthInfo.value, heightInfo.value), 'longest');
        }
    } else if (widthInfo.isVariable && !heightInfo.isVariable) {
        task.addResize(heightInfo.value, 'height');
    } else if (!widthInfo.isVariable && heightInfo.isVariable) {
        task.addResize(widthInfo.value, 'width');
    }

    task.addOptimize(85, 'auto', {
        compressionMode: 'adaptive',
        preserveTransparency: template.recommendedFormats?.includes('png') || template.recommendedFormats?.includes('svg')
    });

    const results = await lemGendaryProcessBatch([lemGendImage], task);

    if (results.length === 0 || !results[0].success) {
        throw new Error('Template processing failed');
    }

    return {
        success: true,
        template,
        image: results[0].image,
        file: results[0].file,
        compatibility,
        warnings: compatibility.warnings
    };
}

export async function processFlexibleTemplate(image, template, options = {}) {
    let lemGendImage;
    if (image instanceof LemGendImage) {
        lemGendImage = image;
    } else {
        lemGendImage = new LemGendImage(image);
        await lemGendImage.load();
    }

    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);

    const task = new LemGendTask(`Flexible: ${template.displayName}`, template.description);

    if (widthInfo.isVariable && !heightInfo.isVariable) {
        task.addResize(heightInfo.value, 'height');
    } else if (!widthInfo.isVariable && heightInfo.isVariable) {
        task.addResize(widthInfo.value, 'width');
    } else if (widthInfo.isVariable && heightInfo.isVariable) {
        task.addOptimize(85, 'auto');
    }

    const results = await lemGendaryProcessBatch([lemGendImage], task);
    return results[0] || { success: false, error: 'Processing failed' };
}

export async function processFaviconSet(image, options = {}) {
    try {
        let lemGendImage;
        if (image instanceof LemGendImage) {
            lemGendImage = image;
        } else {
            lemGendImage = new LemGendImage(image);
            await lemGendImage.load();
        }

        const sizes = options.sizes || [16, 32, 48, 64];
        const format = options.format || 'png';

        const results = [];
        for (const size of sizes) {
            try {
                const faviconFile = await resizeImage(lemGendImage.file, size, size, format, 1.0);
                results.push({
                    size: `${size}x${size}`,
                    dimensions: { width: size, height: size },
                    file: faviconFile,
                    format,
                    name: `favicon-${size}x${size}.${format}`
                });
            } catch (error) {
                console.warn(`Failed to create ${size}x${size} favicon:`, error);
            }
        }

        return {
            success: results.length > 0,
            favicons: results,
            original: lemGendImage,
            summary: {
                totalRequested: sizes.length,
                created: results.length,
                formats: [...new Set(results.map(r => r.format))]
            },
            warnings: results.length < sizes.length ?
                `Created ${results.length} of ${sizes.length} favicons` :
                null
        };
    } catch (error) {
        console.error('Favicon processing failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== LIBRARY INFO =====
export function getLibraryInfo() {
    return {
        name: 'LemGendary Image Processor',
        version: '3.0.0',
        description: 'Batch image processing with intelligent operations, AI-powered smart cropping, and advanced optimization',
        author: 'LemGenda',
        license: 'MIT',
        homepage: 'https://github.com/lemgenda/image-lemgendizer-core',
        processors: {
            LemGendaryResize: {
                name: 'LemGendaryResize',
                description: 'Intelligent image resizing using longest dimension',
                version: '1.2.1'
            },
            LemGendaryCrop: {
                name: 'LemGendaryCrop',
                description: 'AI-powered smart cropping with face and object detection',
                version: '2.0.0'
            },
            LemGendaryOptimize: {
                name: 'LemGendaryOptimize',
                description: 'Advanced image optimization with intelligent format selection and adaptive compression',
                version: '2.0.0'
            },
            LemGendaryRename: {
                name: 'LemGendaryRename',
                description: 'Batch renaming'
            }
        },
        templateUtilities: {
            getTemplateById: 'Get template by ID',
            validateTemplateCompatibility: 'Validate template against image',
            parseDimension: 'Parse dimension strings',
            getAllPlatforms: 'Get all available platforms',
            getTemplateAspectRatio: 'Calculate template aspect ratio',
            getTemplateStats: 'Get template statistics (overall or specific)'
        },
        features: [
            'Smart AI cropping',
            'Face detection',
            'Object detection',
            'Content-aware resizing',
            'Advanced optimization',
            'Intelligent format selection',
            'Adaptive compression',
            'Batch processing',
            'Favicon generation',
            'Multiple format support',
            'Optimization-first ZIP creation',
            'Flexible dimension templates',
            'Variable height/width support'
        ]
    };
}