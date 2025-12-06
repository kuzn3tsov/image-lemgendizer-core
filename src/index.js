/**
 * LemGendary Image Processor - Main Entry Point
 * @module image-lemgendizer
 */

// Core classes
import { LemGendImage } from './LemGendImage.js'
import { LemGendTask } from './tasks/LemGendTask.js'

// Processors
import { LemGendaryResize } from './processors/LemGendaryResize.js'
import { LemGendaryCrop } from './processors/LemGendaryCrop.js'
import { LemGendaryOptimize } from './processors/LemGendaryOptimize.js'
import { LemGendaryRename } from './processors/LemGendaryRename.js'

// Templates
import {
    LemGendTemplates,
    TEMPLATE_CATEGORIES,
    PLATFORMS,
    getTemplatesByPlatform,
    getTemplatesByCategory,
    getTemplateById,
    getTemplatesByDimensions,
    getRecommendedTemplates,
    getTemplateStats,
    exportTemplates,
    validateTemplate,
    addCustomTemplate,
    getAllPlatforms,
    getTemplatesGroupedByPlatform,
    searchTemplates,
    getTemplateAspectRatio,
    getFlexibleTemplates,
    getTemplatesForImage,
    isVariableDimension,
    parseDimension
} from './templates/index.js'

// String utilities
import {
    calculateStringSimilarity,
    escapeRegExp,
    formatDatePattern,
    sanitizeFilename,
    getCommonRenamePatterns,
    extractPatternVariables,
    applyPattern
} from './utils/stringUtils.js'

// ZIP utilities
import {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createOptimizedZip,
    lemGendBuildZip,
    createCustomZip,
    createTemplateZip,
    createBatchZip
} from './utils/zipUtils.js'

// Image utilities
import {
    getImageDimensions,
    getMimeTypeFromExtension,
    hasTransparency,
    fileToDataURL,
    dataURLtoFile,
    resizeImage,
    cropImage,
    calculateAspectRatioFit,
    formatFileSize,
    getFileExtension,
    validateImageFile,
    createThumbnail,
    batchProcess,
    analyzeForOptimization,
    getOptimizationPreset,
    calculateOptimizationSavings,
    createOptimizationPreview,
    generateOptimizationComparison,
    needsFormatConversion,
    getRecommendedFormat,
    getOptimizationStats,
    getFormatPriorities,
    checkAICapabilities,
    isLemGendImage
} from './utils/imageUtils.js'

// Processing utilities
import {
    actuallyResizeImage,
    actuallyCropImage,
    applyOptimization,
    processSingleFile
} from './utils/processingUtils.js'

// Validation utilities
import {
    ValidationErrors,
    ValidationWarnings,
    validateResizeOptions,
    validateCropOptions,
    validateOptimizationOptions,
    validateTemplateCompatibility,
    validateImage,
    validateSessionImage,
    validateTask,
    validateTaskSteps,
    validateTaskLogic,
    validateFaviconOptions,
    getValidationSummary,
    validateDimensions,
    validateResize,
    validateCrop,
    validateOptimization,
    validateRenamePattern
} from './utils/validationUtils.js'

// Re-export everything as named exports
export {
    // Core classes
    LemGendImage,
    LemGendTask,

    // Processors
    LemGendaryResize,
    LemGendaryCrop,
    LemGendaryOptimize,
    LemGendaryRename,

    // Templates
    LemGendTemplates,
    TEMPLATE_CATEGORIES,
    PLATFORMS,
    getTemplatesByPlatform,
    getTemplatesByCategory,
    getTemplateById,
    getTemplatesByDimensions,
    getRecommendedTemplates,
    getTemplateStats,
    exportTemplates,
    validateTemplate,
    addCustomTemplate,
    getAllPlatforms,
    getTemplatesGroupedByPlatform,
    searchTemplates,
    getTemplateAspectRatio,
    getFlexibleTemplates,
    getTemplatesForImage,
    isVariableDimension,
    parseDimension,

    // String utilities
    calculateStringSimilarity,
    escapeRegExp,
    formatDatePattern,
    sanitizeFilename,
    getCommonRenamePatterns,
    extractPatternVariables,
    applyPattern,

    // ZIP utilities
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createCustomZip,
    createTemplateZip,
    createBatchZip,
    createOptimizedZip,
    lemGendBuildZip,

    // Image utilities
    getImageDimensions,
    getMimeTypeFromExtension,
    hasTransparency,
    fileToDataURL,
    dataURLtoFile,
    resizeImage,
    cropImage,
    calculateAspectRatioFit,
    formatFileSize,
    getFileExtension,
    validateImageFile,
    createThumbnail,
    batchProcess,
    analyzeForOptimization,
    getOptimizationPreset,
    calculateOptimizationSavings,
    createOptimizationPreview,
    generateOptimizationComparison,
    needsFormatConversion,
    getRecommendedFormat,
    getOptimizationStats,
    getFormatPriorities,
    checkAICapabilities,
    isLemGendImage,

    // Processing utilities
    actuallyResizeImage,
    actuallyCropImage,
    applyOptimization,
    processSingleFile,

    // Validation utilities
    ValidationErrors,
    ValidationWarnings,
    validateImage,
    validateDimensions,
    validateResize,
    validateCrop,
    validateOptimization,
    validateRenamePattern,
    getValidationSummary,
    validateOptimizationOptions,
    validateTemplateCompatibility,
    validateTask,
    validateSessionImage
}

/**
 * Main processing function
 * @param {Array<File|LemGendImage|Object>} files - Image files, LemGendImage instances, or objects with file/lemGendImage properties
 * @param {LemGendTask} task - Processing task
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed images
 */
export async function lemGendaryProcessBatch(files, task, options = {}) {
    const {
        onProgress = null,
        onWarning = null,
        onError = null,
        parallel = false,
        maxParallel = 4
    } = options

    const results = []
    const totalFiles = files.length

    console.log('=== lemGendaryProcessBatch START ===')
    console.log('Batch processing:', {
        totalFiles,
        hasTask: !!task,
        steps: task?.getEnabledSteps()?.length || 0,
        options
    })

    console.log('Validating task...')
    let taskValidation
    try {
        if (files.length > 0) {
            taskValidation = await validateTask(task, files[0])
        } else {
            taskValidation = await validateTask(task)
        }
    } catch (validationError) {
        console.error('Task validation threw an error:', validationError)
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
        }
    }

    if (taskValidation.errors && taskValidation.errors.length > 0) {
        const criticalErrors = taskValidation.errors.filter(e =>
            e.severity === 'error' &&
            !e.message.includes('missing file property') &&
            !e.message.includes('invalid file type')
        )

        if (criticalErrors.length > 0) {
            console.error('Critical validation errors:', criticalErrors)
            throw new Error(`Task validation failed: ${criticalErrors.map(e => e.message).join(', ')}`)
        } else {
            console.warn('Non-critical validation errors, proceeding...')
            if (onWarning) {
                taskValidation.errors.forEach(error => {
                    onWarning({
                        ...error,
                        severity: 'warning'
                    })
                })
            }
        }
    }

    if (taskValidation.hasWarnings && onWarning) {
        taskValidation.warnings.forEach(warning => onWarning(warning))
    }

    if (parallel) {
        const batches = []
        for (let i = 0; i < files.length; i += maxParallel) {
            batches.push(files.slice(i, i + maxParallel))
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            const batchPromises = batch.map((file, fileIndex) =>
                processSingleFile(file, task, batchIndex * maxParallel + fileIndex)
            )

            const batchResults = await Promise.allSettled(batchPromises)

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value)
                } else {
                    const errorResult = {
                        file: batch[index],
                        error: result.reason.message,
                        success: false
                    }
                    results.push(errorResult)
                    if (onError) onError(result.reason, batch[index])
                }
            })

            if (onProgress) {
                const progress = results.length / totalFiles
                onProgress(progress, results.length, totalFiles)
            }
        }
    } else {
        for (let i = 0; i < files.length; i++) {
            try {
                console.log(`\n=== Processing file ${i + 1}/${totalFiles} ===`)

                const file = files[i]
                console.log('File to process:', {
                    type: file?.constructor?.name,
                    isLemGendImage: file instanceof LemGendImage,
                    name: file?.name || file?.originalName || file?.file?.name
                })

                const result = await processSingleFile(file, task, i)
                results.push(result)

                if (onProgress) {
                    const progress = (i + 1) / totalFiles
                    onProgress(progress, i + 1, totalFiles)
                }
            } catch (error) {
                console.error(`Failed to process file ${i}:`, error)
                const errorResult = {
                    file: files[i],
                    error: error.message,
                    success: false
                }
                results.push(errorResult)
                if (onError) onError(error, files[i])
            }
        }
    }

    console.log('\n=== Processing complete ===')
    console.log('Summary:', {
        totalFiles,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
    })

    results.forEach((result, index) => {
        if (result.success) {
            console.log(`✓ File ${index + 1}: ${result.image?.originalName || 'Unknown'}`, {
                success: true,
                size: result.file?.size,
                dimensions: result.image ? `${result.image.width}x${result.image.height}` : 'N/A'
            })
        } else {
            console.log(`✗ File ${index + 1}: Failed`, {
                error: result.error,
                fileName: result.file?.name || 'Unknown'
            })
        }
    })

    return results
}

/**
 * Optimize images for ZIP with advanced optimization
 * @param {Array<File|LemGendImage>} images - Images to optimize
 * @param {Object} optimizationOptions - Optimization options
 * @returns {Promise<Array>} Optimized images with results
 */
export async function optimizeForZip(images, optimizationOptions = {}) {
    const optimizer = new LemGendaryOptimize(optimizationOptions)
    const results = []

    for (const image of images) {
        try {
            let lemGendImage

            if (image instanceof LemGendImage) {
                lemGendImage = image
            } else {
                lemGendImage = new LemGendImage(image)
                await lemGendImage.load()
            }

            const optimizationResult = await optimizer.process(lemGendImage)
            const optimizedFile = await optimizer.applyOptimization(lemGendImage)

            const optimizedLemGendImage = new LemGendImage(optimizedFile)
            await optimizedLemGendImage.load()

            results.push({
                original: lemGendImage,
                optimized: optimizedLemGendImage,
                result: optimizationResult,
                success: true
            })
        } catch (error) {
            console.error('Optimization failed:', error)
            results.push({
                original: image,
                error: error.message,
                success: false
            })
        }
    }

    return results
}

/**
 * Create favicon set
 */
export async function processFaviconSet(file, options = {}) {
    const {
        sizes = [16, 32, 48, 64, 128, 256],
        formats = ['png', 'ico'],
        includeManifest = true,
        includeHTML = true
    } = options

    const results = []
    const lemGendImage = new LemGendImage(file)
    await lemGendImage.load()

    for (const size of sizes) {
        for (const format of formats) {
            const processed = await generateFaviconVariant(lemGendImage, size, format)
            results.push(processed)
        }
    }

    if (includeManifest) {
        results.push(generateManifest(lemGendImage, sizes))
    }

    if (includeHTML) {
        results.push(generateFaviconHTML(lemGendImage, sizes, formats))
    }

    return results
}

async function generateFaviconVariant(image, size, format) {
    return {
        size,
        format,
        width: size,
        height: size,
        name: `favicon-${size}x${size}.${format}`
    }
}

function generateManifest(image, sizes) {
    return {
        type: 'json',
        name: 'manifest.json',
        content: JSON.stringify({
            name: 'App Icon',
            icons: sizes.map(size => ({
                src: `/favicon-${size}x${size}.png`,
                sizes: `${size}x${size}`,
                type: 'image/png'
            }))
        }, null, 2)
    }
}

function generateFaviconHTML(image, sizes, formats) {
    const htmlLines = [
        '<!-- Favicon tags for HTML -->',
        '<link rel="icon" href="/favicon.ico" sizes="any">'
    ]

    for (const size of sizes) {
        for (const format of formats) {
            if (format === 'png') {
                htmlLines.push(`<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">`)
            }
        }
    }

    htmlLines.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">')
    htmlLines.push('<link rel="manifest" href="/manifest.json">')

    return {
        type: 'html',
        name: 'favicon-tags.html',
        content: htmlLines.join('\n')
    }
}

/**
 * Process images using a template
 */
export async function processWithTemplate(image, templateId, options = {}) {
    try {
        const template = getTemplateById(templateId)
        if (!template) {
            throw new Error(`Template not found: ${templateId}`)
        }

        const compatibility = validateTemplateCompatibility(template, {
            width: image.width,
            height: image.height
        })

        if (!compatibility.compatible) {
            throw new Error(`Template incompatible: ${compatibility.errors.map(e => e.message).join(', ')}`)
        }

        const task = new LemGendTask(`Template: ${template.displayName}`, template.description)

        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)

        if (!widthInfo.isVariable && !heightInfo.isVariable) {
            const aspect = widthInfo.value / heightInfo.value
            const imageAspect = image.width / image.height

            if (Math.abs(aspect - imageAspect) > 0.1) {
                task.addCrop(widthInfo.value, heightInfo.value, 'smart')
            } else {
                task.addResize(Math.max(widthInfo.value, heightInfo.value), 'longest')
            }
        } else if (widthInfo.isVariable && !heightInfo.isVariable) {
            task.addResize(heightInfo.value, 'height')
        } else if (!widthInfo.isVariable && heightInfo.isVariable) {
            task.addResize(widthInfo.value, 'width')
        }

        task.addOptimize(85, 'auto', {
            compressionMode: 'adaptive',
            preserveTransparency: template.recommendedFormats.includes('png') || template.recommendedFormats.includes('svg')
        })

        const results = await lemGendaryProcessBatch([image], task)

        if (results.length === 0 || !results[0].success) {
            throw new Error('Template processing failed')
        }

        return {
            success: true,
            template,
            image: results[0].image,
            file: results[0].file,
            compatibility,
            warnings: compatibility.warnings
        }
    } catch (error) {
        console.error('Template processing failed:', error)
        return {
            success: false,
            error: error.message,
            templateId
        }
    }
}

/**
 * Process flexible dimension template
 */
export async function processFlexibleTemplate(image, template, options = {}) {
    const widthInfo = parseDimension(template.width)
    const heightInfo = parseDimension(template.height)

    const task = new LemGendTask(`Flexible: ${template.displayName}`, template.description)

    if (widthInfo.isVariable && !heightInfo.isVariable) {
        const scale = heightInfo.value / image.height
        const targetWidth = Math.round(image.width * scale)
        task.addResize(heightInfo.value, 'height')
    } else if (!widthInfo.isVariable && heightInfo.isVariable) {
        const scale = widthInfo.value / image.width
        const targetHeight = Math.round(image.height * scale)
        task.addResize(widthInfo.value, 'width')
    } else if (widthInfo.isVariable && heightInfo.isVariable) {
        task.addOptimize(85, 'auto')
    }

    const results = await lemGendaryProcessBatch([image], task)
    return results[0] || { success: false, error: 'Processing failed' }
}

/**
 * Get library version and info
 */
export function getLibraryInfo() {
    return {
        name: 'LemGendary Image Processor',
        version: '2.2.0',
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
        templates: {
            total: LemGendTemplates?.ALL?.length || 0,
            categories: TEMPLATE_CATEGORIES?.length || 0,
            platforms: PLATFORMS ? Object.keys(PLATFORMS).length : 0
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
    }
}

// Default export for convenience
export default {
    // Core classes
    LemGendImage,
    LemGendTask,

    // Processors
    LemGendaryResize,
    LemGendaryCrop,
    LemGendaryOptimize,
    LemGendaryRename,

    // Main functions
    lemGendaryProcessBatch,
    lemGendBuildZip,
    getLibraryInfo,
    processFaviconSet,
    optimizeForZip,
    createOptimizedZip,
    processWithTemplate,
    processFlexibleTemplate,

    // Templates
    LemGendTemplates,
    TEMPLATE_CATEGORIES,
    PLATFORMS,
    getTemplatesByPlatform,
    getTemplatesByCategory,
    getTemplateById,
    getTemplatesByDimensions,
    getRecommendedTemplates,
    getTemplateStats,
    exportTemplates,
    validateTemplate,
    addCustomTemplate,
    getAllPlatforms,
    getTemplatesGroupedByPlatform,
    searchTemplates,
    getTemplateAspectRatio,
    getFlexibleTemplates,
    getTemplatesForImage,
    isVariableDimension,
    parseDimension,

    // ZIP utilities
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createCustomZip,
    createTemplateZip,
    createBatchZip,

    // Image utilities
    getImageDimensions,
    getMimeTypeFromExtension,
    hasTransparency,
    fileToDataURL,
    dataURLtoFile,
    resizeImage,
    cropImage,
    calculateAspectRatioFit,
    formatFileSize,
    getFileExtension,
    validateImageFile,
    createThumbnail,
    batchProcess,

    // Validation utilities
    ValidationErrors,
    ValidationWarnings,
    validateImage,
    validateDimensions,
    validateResize,
    validateCrop,
    validateOptimization,
    validateRenamePattern,
    getValidationSummary,
    validateOptimizationOptions,
    validateTemplateCompatibility
}