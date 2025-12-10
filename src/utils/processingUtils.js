/**
 * Image processing utilities
 * @module utils/processingUtils
 * @version 3.0.0
 */

// Import core utilities
import {
    getFileExtension,
    formatFileSize,
    isLemGendImage,
    resizeImage,
    cropImage,
    getImageOutputs
} from './imageUtils.js';

// Import shared constants
import {
    ProcessorTypes,
    OptimizationFormats,
    FileExtensions,
    ImageMimeTypes,
    Defaults
} from '../constants/sharedConstants.js';

// Import template utilities
import { getTemplateById, validateTemplateCompatibility } from './templateUtils.js';
import { parseDimension } from './sharedUtils.js';
import { validateTask } from './validationUtils.js';

// Import core classes
import { LemGendImage } from '../LemGendImage.js';
import { LemGendTask } from '../tasks/LemGendTask.js';

// Cache for dynamically loaded modules
let cachedModules = null;

/**
 * Load required modules dynamically
 */
async function loadModules() {
    if (cachedModules) return cachedModules;

    try {
        const [
            LemGendImageModule,
            LemGendTaskModule,
            LemGendaryResizeModule,
            LemGendaryCropModule,
            LemGendaryOptimizeModule,
            LemGendaryRenameModule
        ] = await Promise.all([
            import('../LemGendImage.js'),
            import('../tasks/LemGendTask.js'),
            import('../processors/LemGendaryResize.js'),
            import('../processors/LemGendaryCrop.js'),
            import('../processors/LemGendaryOptimize.js'),
            import('../processors/LemGendaryRename.js')
        ]);

        cachedModules = {
            LemGendImage: LemGendImageModule.LemGendImage,
            LemGendTask: LemGendTaskModule.LemGendTask,
            LemGendaryResize: LemGendaryResizeModule.LemGendaryResize,
            LemGendaryCrop: LemGendaryCropModule.LemGendaryCrop,
            LemGendaryOptimize: LemGendaryOptimizeModule.LemGendaryOptimize,
            LemGendaryRename: LemGendaryRenameModule.LemGendaryRename
        };

        return cachedModules;
    } catch (error) {
        console.error('Failed to load processing modules:', error);
        throw new Error(`Failed to load processing modules: ${error.message}`);
    }
}

/**
 * Apply optimization to file
 */
export async function applyOptimization(file, dimensions, options, hasTransparency) {
    const { quality, format } = options;

    if (format === OptimizationFormats.ORIGINAL) {
        return file;
    }

    // Use resizeImage with current dimensions for optimization
    const outputFormat = format.toLowerCase();
    const qualityValue = Math.max(0.1, Math.min(1, quality / 100));

    return await resizeImage(
        file,
        dimensions.width,
        dimensions.height,
        outputFormat,
        qualityValue
    );
}

/**
 * Process single file through task pipeline
 */
export async function processSingleFile(file, task, index) {
    console.log('processSingleFile called with:', {
        fileType: file?.constructor?.name,
        isLemGendImage: isLemGendImage(file)
    });

    let lemGendImage;

    try {
        // Load all required modules
        const modules = await loadModules();
        const {
            LemGendImage: LemGendImageClass,
            LemGendaryResize,
            LemGendaryCrop,
            LemGendaryOptimize,
            LemGendaryRename
        } = modules;

        // Create or validate LemGendImage instance
        if (isLemGendImage(file)) {
            lemGendImage = file;
            console.log('Using existing LemGendImage:', {
                originalName: lemGendImage.originalName,
                width: lemGendImage.width,
                height: lemGendImage.height
            });
        } else if (file instanceof File || file instanceof Blob) {
            console.log('Creating new LemGendImage from File/Blob...');
            lemGendImage = new LemGendImageClass(file);
            try {
                await lemGendImage.load();
            } catch (loadError) {
                console.warn('Failed to load image, using defaults:', loadError);
                lemGendImage.width = lemGendImage.width || Defaults.DEFAULT_DIMENSION;
                lemGendImage.height = lemGendImage.height || Defaults.DEFAULT_DIMENSION;
            }
        } else {
            throw new Error(`Invalid file type provided. Got: ${typeof file}, constructor: ${file?.constructor?.name}`);
        }

        // Validate the instance
        if (!lemGendImage || !isLemGendImage(lemGendImage)) {
            throw new Error('Failed to create valid LemGendImage instance');
        }

        // Ensure file property exists
        if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
            console.warn('LemGendImage missing file property, creating placeholder...');
            const placeholderBlob = new Blob([''], { type: ImageMimeTypes.JPEG });
            lemGendImage.file = new File(
                [placeholderBlob],
                lemGendImage.originalName || 'image.jpg',
                { type: ImageMimeTypes.JPEG, lastModified: Date.now() }
            );
        }

        // Ensure dimensions exist
        if (!lemGendImage.width || !lemGendImage.height) {
            console.warn('LemGendImage missing dimensions, setting defaults...');
            lemGendImage.width = lemGendImage.width || Defaults.DEFAULT_DIMENSION;
            lemGendImage.height = lemGendImage.height || Defaults.DEFAULT_DIMENSION;
        }

        console.log('Validating task with LemGendImage...', {
            originalName: lemGendImage.originalName,
            width: lemGendImage.width,
            height: lemGendImage.height
        });

        const enabledSteps = task.getEnabledSteps();
        let currentFile = lemGendImage.file;
        let currentDimensions = {
            width: lemGendImage.width,
            height: lemGendImage.height
        };

        const processingOrder = [
            ProcessorTypes.RESIZE,
            ProcessorTypes.CROP,
            ProcessorTypes.OPTIMIZE,
            ProcessorTypes.RENAME
        ];
        const sortedSteps = enabledSteps.sort((a, b) => {
            const indexA = processingOrder.indexOf(a.processor);
            const indexB = processingOrder.indexOf(b.processor);
            return indexA - indexB;
        });

        console.log('Processing steps in order:', sortedSteps.map(s => `${s.order}.${s.processor}`));
        console.log('Starting image dimensions:', currentDimensions);

        for (const step of sortedSteps) {
            try {
                console.log(`\n=== Processing step ${step.order}: ${step.processor} ===`);

                switch (step.processor) {
                    case ProcessorTypes.RESIZE:
                        const resizeProcessor = new LemGendaryResize(step.options);
                        const resizeResult = await resizeProcessor.process(lemGendImage);

                        console.log('Resize result:', {
                            original: `${resizeResult.originalDimensions.width}x${resizeResult.originalDimensions.height}`,
                            target: `${resizeResult.newDimensions.width}x${resizeResult.newDimensions.height}`,
                            mode: step.options.mode,
                            dimension: step.options.dimension
                        });

                        currentFile = await resizeImage(
                            currentFile,
                            resizeResult.newDimensions.width,
                            resizeResult.newDimensions.height,
                            FileExtensions.WEBP,
                            step.options.quality || 0.95
                        );

                        currentDimensions = resizeResult.newDimensions;
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
                        lemGendImage.addOperation(ProcessorTypes.RESIZE, resizeResult);

                        console.log(`✓ Resized to: ${currentDimensions.width}x${currentDimensions.height}`);
                        break;

                    case ProcessorTypes.CROP:
                        const cropProcessor = new LemGendaryCrop(step.options);
                        const cropResult = await cropProcessor.process(lemGendImage, currentDimensions);

                        console.log('Crop result:', {
                            current: `${currentDimensions.width}x${currentDimensions.height}`,
                            target: `${cropResult.finalDimensions.width}x${cropResult.finalDimensions.height}`,
                            mode: step.options.mode,
                            smartCrop: cropResult.smartCrop
                        });

                        currentFile = await cropImage(
                            currentFile,
                            cropResult.cropOffsets.x,
                            cropResult.cropOffsets.y,
                            cropResult.cropOffsets.width,
                            cropResult.cropOffsets.height,
                            FileExtensions.WEBP,
                            step.options.quality || 0.95
                        );

                        currentDimensions = cropResult.finalDimensions;
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
                        lemGendImage.addOperation(ProcessorTypes.CROP, cropResult);

                        console.log(`✓ Cropped to: ${currentDimensions.width}x${currentDimensions.height}`);
                        break;

                    case ProcessorTypes.OPTIMIZE:
                        const optimizeProcessor = new LemGendaryOptimize(step.options);
                        const optimizeResult = await optimizeProcessor.process(lemGendImage);

                        console.log('Optimize result:', {
                            format: step.options.format,
                            quality: step.options.quality,
                            originalFormat: optimizeResult.originalInfo.format,
                            transparency: optimizeResult.originalInfo.transparency,
                            savings: optimizeResult.savings
                        });

                        const optimizedFile = await resizeImage(
                            currentFile,
                            currentDimensions.width,
                            currentDimensions.height,
                            step.options.format || FileExtensions.WEBP,
                            (step.options.quality || Defaults.OPTIMIZATION_QUALITY) / 100
                        );

                        currentFile = optimizedFile;
                        lemGendImage.addOperation(ProcessorTypes.OPTIMIZE, optimizeResult);
                        console.log(`✓ Optimized to: ${step.options.format} at ${step.options.quality}%`);
                        break;

                    case ProcessorTypes.RENAME:
                        const renameProcessor = new LemGendaryRename(step.options);
                        const renameResult = await renameProcessor.process(lemGendImage, index, task.steps.length);

                        const extension = getFileExtension(currentFile);
                        const renamedFile = new File(
                            [currentFile],
                            `${renameResult.newName}.${extension}`,
                            { type: currentFile.type }
                        );

                        currentFile = renamedFile;
                        lemGendImage.addOperation(ProcessorTypes.RENAME, renameResult);
                        console.log(`✓ Renamed to: ${renameResult.newName}.${extension}`);
                        break;

                    default:
                        console.warn(`Unknown processor: ${step.processor}`);
                }
            } catch (error) {
                console.error(`Error in step ${step.order} (${step.processor}):`, error);
                throw new Error(`Step ${step.order} (${step.processor}) failed: ${error.message}`);
            }
        }

        const outputFormat = getFileExtension(currentFile);
        lemGendImage.addOutput(outputFormat, currentFile, null);

        console.log('\n=== Processing Complete ===');
        console.log('Final result:', {
            originalName: lemGendImage.originalName,
            finalName: currentFile.name,
            originalSize: lemGendImage.originalSize,
            finalSize: currentFile.size,
            dimensions: `${currentDimensions.width}x${currentDimensions.height}`,
            format: outputFormat,
            sizeReduction: `${((lemGendImage.originalSize - currentFile.size) / lemGendImage.originalSize * 100).toFixed(1)}%`
        });

        return {
            image: lemGendImage,
            file: currentFile,
            success: true,
            metadata: lemGendImage.getInfo()
        };

    } catch (error) {
        console.error('Error in processSingleFile:', error);
        return {
            image: lemGendImage || file,
            file: lemGendImage?.file || file,
            error: error.message,
            success: false
        };
    }
}

// ===== MAIN PROCESSING FUNCTIONS =====

/**
 * Process batch of files through a task
 */
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

/**
 * Process image with a template
 */
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

/**
 * Process with flexible template
 */
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

/**
 * Process favicon set
 */
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

// ===== HELPER FUNCTIONS =====

/**
 * Create a resize processor with options
 */
export async function createResize(options = {}) {
    const { createResizeProcessor } = await import('../processors/LemGendaryResize.js');
    return createResizeProcessor(options);
}

/**
 * Create a crop processor with options
 */
export async function createCrop(options = {}) {
    const { createCropProcessor } = await import('../processors/LemGendaryCrop.js');
    return createCropProcessor(options);
}

/**
 * Create an optimization processor with options
 */
export async function createOptimize(options = {}) {
    const { createOptimizationProcessor } = await import('../processors/LemGendaryOptimize.js');
    return createOptimizationProcessor(options);
}

/**
 * Create a rename processor with options
 */
export async function createRename(options = {}) {
    const { createRenameProcessor } = await import('../processors/LemGendaryRename.js');
    return createRenameProcessor(options);
}

// ===== QUICK PROCESS HELPERS =====
export const QuickProcess = {
    resize: async (image, dimension, mode = 'longest', options = {}) => {
        const { quickResize } = await import('../processors/LemGendaryResize.js');
        return quickResize(image, dimension, mode, options);
    },
    crop: async (image, width, height, mode = 'center', options = {}) => {
        const { quickCrop } = await import('../processors/LemGendaryCrop.js');
        return quickCrop(image, width, height, mode, options);
    },
    optimize: async (image, quality = 85, format = 'auto', options = {}) => {
        const { quickOptimize } = await import('../processors/LemGendaryOptimize.js');
        return quickOptimize(image, quality, format, options);
    },
    rename: async (filename, pattern = '{name}-{index}', variables = {}, options = {}) => {
        const { quickRename } = await import('../processors/LemGendaryRename.js');
        return quickRename(filename, pattern, variables, options);
    },
    pdf: async (file, options = {}) => {
        const { quickPDF } = await import('../processors/LemGendaryPDF.js');
        return quickPDF(file, options);
    }
};