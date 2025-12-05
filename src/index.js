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

// Templates - COMPLETE IMPORTS with flexible dimension support
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

// Utilities
import {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress
} from './utils/zipUtils.js'

import {
    getImageDimensions,
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
    batchProcess
} from './utils/imageUtils.js'

// Validation - COMPLETE IMPORTS with flexible dimension support
import {
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
    isVariableDimension as validationIsVariableDimension,
    parseDimension as validationParseDimension,
    getFlexibleTemplates as validationGetFlexibleTemplates
} from './utils/validation.js'

// Re-export everything as named exports
export {
    LemGendImage,
    LemGendTask,
    LemGendaryResize,
    LemGendaryCrop,
    LemGendaryOptimize,
    LemGendaryRename
}

export {
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
}

export {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress
}

export {
    getImageDimensions,
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
    batchProcess
}

export {
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

/**
 * Actually resize an image using canvas
 * @private
 */
async function _actuallyResizeImage(file, targetWidth, targetHeight, algorithm = 'lanczos3') {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'))
                        return
                    }

                    const resizedFile = new File(
                        [blob],
                        file.name,
                        { type: file.type }
                    )

                    URL.revokeObjectURL(img.src)
                    resolve(resizedFile)
                }, file.type, 0.95)
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Resize failed: ${error.message}`))
            }
        }
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing'))
        }
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Actually crop an image using canvas
 * @private
 */
async function _actuallyCropImage(file, originalWidth, originalHeight, cropWidth, cropHeight, offsetX, offsetY) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = cropWidth
                canvas.height = cropHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.drawImage(
                    img,
                    offsetX, offsetY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                )

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'))
                        return
                    }

                    const croppedFile = new File(
                        [blob],
                        file.name,
                        { type: file.type }
                    )

                    URL.revokeObjectURL(img.src)
                    resolve(croppedFile)
                }, file.type, 0.95)
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Crop failed: ${error.message}`))
            }
        }
        img.onerror = () => {
            reject(new Error('Failed to load image for cropping'))
        }
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Apply optimization to file using the enhanced LemGendaryOptimize
 * @private
 */
async function applyOptimization(file, dimensions, options, hasTransparency) {
    const { quality, format, lossless = false } = options

    if (format === 'original') {
        return file
    }

    return new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = dimensions.width
                canvas.height = dimensions.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

                let mimeType = 'image/jpeg'
                let qualityValue = Math.max(0.1, Math.min(1, quality / 100))

                switch (format.toLowerCase()) {
                    case 'webp':
                        mimeType = 'image/webp'
                        break
                    case 'png':
                        mimeType = 'image/png'
                        qualityValue = undefined
                        break
                    case 'avif':
                        mimeType = 'image/avif'
                        break
                    case 'jpg':
                    case 'jpeg':
                    default:
                        mimeType = 'image/jpeg'
                }

                if (hasTransparency && (format === 'jpg' || format === 'jpeg')) {
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = dimensions.width
                    tempCanvas.height = dimensions.height
                    const tempCtx = tempCanvas.getContext('2d')
                    tempCtx.fillStyle = 'white'
                    tempCtx.fillRect(0, 0, dimensions.width, dimensions.height)
                    tempCtx.drawImage(img, 0, 0)

                    tempCanvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create blob'))
                                return
                            }

                            const optimizedFile = new File(
                                [blob],
                                `${file.name.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()}`,
                                { type: mimeType }
                            )
                            URL.revokeObjectURL(img.src)
                            resolve(optimizedFile)
                        },
                        mimeType,
                        qualityValue
                    )
                } else {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create blob'))
                                return
                            }

                            const optimizedFile = new File(
                                [blob],
                                `${file.name.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()}`,
                                { type: mimeType }
                            )
                            URL.revokeObjectURL(img.src)
                            resolve(optimizedFile)
                        },
                        mimeType,
                        qualityValue
                    )
                }
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Optimization failed: ${error.message}`))
            }
        }

        img.onerror = () => {
            reject(new Error('Failed to load image for optimization'))
        }

        img.src = URL.createObjectURL(file)
    })
}

/**
 * Helper function to get file extension
 * Renamed to avoid conflict with imported getFileExtension
 * @private
 */
function _getFileExtension(file) {
    return file.name.split('.').pop().toLowerCase()
}

/**
 * Process single file through task pipeline with optimization-first approach
 * @private
 */
async function processSingleFile(file, task, index) {
    console.log('processSingleFile called with:', {
        fileType: file?.constructor?.name,
        isLemGendImage: file instanceof LemGendImage,
        hasFileProperty: !!(file?.file),
        filePropertyType: file?.file?.constructor?.name
    })

    let lemGendImage

    try {
        if (file instanceof LemGendImage) {
            lemGendImage = file

            console.log('Using existing LemGendImage:', {
                hasFile: !!lemGendImage.file,
                fileType: lemGendImage.file?.constructor?.name,
                width: lemGendImage.width,
                height: lemGendImage.height,
                originalName: lemGendImage.originalName
            })

            if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
                console.warn('LemGendImage missing valid file property')
                throw new Error('LemGendImage has no valid file property')
            }

            if (!lemGendImage.width || !lemGendImage.height) {
                try {
                    console.log('LemGendImage missing dimensions, loading...')
                    await lemGendImage.load()
                } catch (loadError) {
                    console.warn('Failed to load existing LemGendImage:', loadError)
                    throw new Error(`Failed to load LemGendImage: ${loadError.message}`)
                }
            }

        } else if (file && file.file && file.file instanceof File) {
            console.log('Creating new LemGendImage from file object...')
            lemGendImage = new LemGendImage(file.file)
            await lemGendImage.load()

        } else if (file instanceof File || file instanceof Blob) {
            console.log('Creating new LemGendImage from File/Blob...')
            lemGendImage = new LemGendImage(file)
            await lemGendImage.load()

        } else {
            throw new Error(`Invalid file type provided for processing. Got: ${typeof file}, constructor: ${file?.constructor?.name}`)
        }

        if (!lemGendImage || !(lemGendImage instanceof LemGendImage)) {
            throw new Error('Failed to create valid LemGendImage instance')
        }

        if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
            throw new Error('LemGendImage missing file property')
        }

        if (!lemGendImage.width || !lemGendImage.height) {
            throw new Error('LemGendImage missing dimensions')
        }

        console.log('Validating task with LemGendImage...', {
            originalName: lemGendImage.originalName,
            width: lemGendImage.width,
            height: lemGendImage.height,
            hasFile: !!lemGendImage.file,
            fileType: lemGendImage.file?.constructor?.name
        })

        const validation = await task.validate(lemGendImage)

        if (!validation.isValid) {
            const errorMessage = validation.errors.map(e => e.message).join(', ')
            console.error('Task validation failed:', errorMessage)
            throw new Error(`Task validation failed: ${errorMessage}`)
        }

        console.log('Task validation passed successfully')

        const enabledSteps = task.getEnabledSteps()
        let currentFile = lemGendImage.file
        let currentDimensions = {
            width: lemGendImage.width,
            height: lemGendImage.height
        }

        const processingOrder = ['resize', 'crop', 'optimize', 'rename']
        const sortedSteps = enabledSteps.sort((a, b) => {
            const indexA = processingOrder.indexOf(a.processor)
            const indexB = processingOrder.indexOf(b.processor)
            return indexA - indexB
        })

        console.log('Processing steps in order:', sortedSteps.map(s => `${s.order}.${s.processor}`))
        console.log('Starting image dimensions:', currentDimensions)

        for (const step of sortedSteps) {
            try {
                console.log(`\n=== Processing step ${step.order}: ${step.processor} ===`)

                switch (step.processor) {
                    case 'resize':
                        const resizeProcessor = new LemGendaryResize(step.options)
                        const resizeResult = await resizeProcessor.process(lemGendImage)

                        console.log('Resize result:', {
                            original: `${resizeResult.originalDimensions.width}x${resizeResult.originalDimensions.height}`,
                            target: `${resizeResult.newDimensions.width}x${resizeResult.newDimensions.height}`,
                            mode: step.options.mode,
                            dimension: step.options.dimension
                        })

                        currentFile = await _actuallyResizeImage(
                            currentFile,
                            resizeResult.newDimensions.width,
                            resizeResult.newDimensions.height,
                            step.options.algorithm || 'lanczos3'
                        )

                        currentDimensions = resizeResult.newDimensions
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height)
                        lemGendImage.addOperation('resize', resizeResult)

                        console.log(`✓ Resized to: ${currentDimensions.width}x${currentDimensions.height}`)
                        console.log('File after resize:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type
                        })
                        break

                    case 'crop':
                        const cropProcessor = new LemGendaryCrop(step.options)
                        const cropResult = await cropProcessor.process(lemGendImage, currentDimensions)

                        console.log('Crop result:', {
                            current: `${currentDimensions.width}x${currentDimensions.height}`,
                            target: `${cropResult.finalDimensions.width}x${cropResult.finalDimensions.height}`,
                            mode: step.options.mode,
                            smartCrop: cropResult.smartCrop
                        })

                        // Use either smart crop or regular crop
                        if (cropResult.smartCrop) {
                            console.log('Smart crop detected with steps:', {
                                detection: cropResult.steps.detection.confidence,
                                resize: cropResult.steps.resize,
                                crop: cropResult.cropOffsets
                            })
                        }

                        currentFile = await _actuallyCropImage(
                            currentFile,
                            currentDimensions.width,
                            currentDimensions.height,
                            cropResult.cropOffsets.width,
                            cropResult.cropOffsets.height,
                            cropResult.cropOffsets.x,
                            cropResult.cropOffsets.y
                        )

                        currentDimensions = cropResult.finalDimensions
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height)
                        lemGendImage.addOperation('crop', cropResult)

                        console.log(`✓ Cropped to: ${currentDimensions.width}x${currentDimensions.height}`)
                        console.log('File after crop:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type
                        })
                        break

                    case 'optimize':
                        const optimizeProcessor = new LemGendaryOptimize(step.options)
                        const optimizeResult = await optimizeProcessor.process(lemGendImage)

                        console.log('Optimize result:', {
                            format: step.options.format,
                            quality: step.options.quality,
                            originalFormat: optimizeResult.originalInfo.format,
                            transparency: optimizeResult.originalInfo.transparency,
                            savings: optimizeResult.savings
                        })

                        // Apply optimization using the enhanced processor
                        currentFile = await optimizeProcessor.applyOptimization(lemGendImage)

                        lemGendImage.addOperation('optimize', optimizeResult)
                        console.log(`✓ Optimized to: ${optimizeResult.optimization.selectedFormat} at ${optimizeResult.optimization.compression.quality}%`)
                        console.log('File after optimize:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type,
                            savings: `${optimizeResult.savings.savingsPercent}%`
                        })
                        break

                    case 'rename':
                        const renameProcessor = new LemGendaryRename(step.options)
                        const renameResult = await renameProcessor.process(lemGendImage, index, task.steps.length)

                        const extension = _getFileExtension(currentFile)

                        const renamedFile = new File(
                            [currentFile],
                            `${renameResult.newName}.${extension}`,
                            { type: currentFile.type }
                        )

                        currentFile = renamedFile
                        lemGendImage.addOperation('rename', renameResult)
                        console.log(`✓ Renamed to: ${renameResult.newName}.${extension}`)
                        break

                    default:
                        console.warn(`Unknown processor: ${step.processor}`)
                }
            } catch (error) {
                console.error(`Error in step ${step.order} (${step.processor}):`, error)
                throw new Error(`Step ${step.order} (${step.processor}) failed: ${error.message}`)
            }
        }

        const outputFormat = _getFileExtension(currentFile)
        lemGendImage.addOutput(
            outputFormat,
            currentFile,
            null
        )

        console.log('\n=== Processing Complete ===')
        console.log('Final result:', {
            originalName: lemGendImage.originalName,
            finalName: currentFile.name,
            originalSize: lemGendImage.originalSize,
            finalSize: currentFile.size,
            dimensions: `${currentDimensions.width}x${currentDimensions.height}`,
            format: outputFormat,
            sizeReduction: `${((lemGendImage.originalSize - currentFile.size) / lemGendImage.originalSize * 100).toFixed(1)}%`
        })

        return {
            image: lemGendImage,
            file: currentFile,
            success: true,
            metadata: lemGendImage.getInfo()
        }

    } catch (error) {
        console.error('Error in processSingleFile:', error)
        return {
            image: lemGendImage || file,
            file: lemGendImage?.file || file,
            error: error.message,
            success: false
        }
    }
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
    const taskValidation = files.length > 0 ? await task.validate(files[0]) : await task.validate()

    if (!taskValidation.isValid) {
        console.error('Task validation failed:', taskValidation.errors)

        const hasOnlyImageError = taskValidation.errors.every(e =>
            e.type === 'invalid_image' || e.message.includes('No image provided')
        )

        if (hasOnlyImageError && files.length > 0) {
            console.warn('Task validation has image-related warnings but proceeding anyway...')
        } else {
            throw new Error(`Task validation failed: ${taskValidation.errors.map(e => e.message).join(', ')}`)
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

            // Get optimization plan and apply it
            const optimizationResult = await optimizer.process(lemGendImage)
            const optimizedFile = await optimizer.applyOptimization(lemGendImage)

            // Create optimized LemGendImage
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
 * Create optimized ZIP from images
 * @param {Array<File|LemGendImage>} images - Images to include in ZIP
 * @param {Object} options - Options including optimization settings
 * @returns {Promise<Blob>} ZIP file with optimized images
 */
export async function createOptimizedZip(images, options = {}) {
    const {
        optimization = {},
        zipOptions = {},
        includeReport = true
    } = options

    const optimizer = new LemGendaryOptimize(optimization)

    // Convert to LemGendImage if needed
    const lemGendImages = await Promise.all(
        images.map(async (img) => {
            if (img instanceof LemGendImage) {
                return img
            } else {
                const lemGendImg = new LemGendImage(img)
                await lemGendImg.load()
                return lemGendImg
            }
        })
    )

    // Step 1: Optimize all images
    console.log(`Optimizing ${lemGendImages.length} images...`)
    const optimizationResults = await optimizer.prepareForZip(lemGendImages)

    // Step 2: Filter successful optimizations
    const successful = optimizationResults.filter(r => r.success)
    const failed = optimizationResults.filter(r => !r.success)

    console.log(`Optimization complete: ${successful.length} successful, ${failed.length} failed`)

    if (successful.length === 0) {
        throw new Error('No images could be optimized')
    }

    // Step 3: Create optimized images array for ZIP
    const optimizedImages = successful.map(result => {
        const optimizedImage = new LemGendImage(result.optimized)
        optimizedImage.originalName = result.original.originalName
        return optimizedImage
    })

    // Step 4: Add optimization report if requested
    if (includeReport) {
        const report = optimizer.generateOptimizationReport(optimizationResults)
        const reportFile = new File(
            [JSON.stringify(report, null, 2)],
            'optimization-report.json',
            { type: 'application/json' }
        )
        const reportImage = new LemGendImage(reportFile)
        reportImage.originalName = 'optimization-report.json'
        optimizedImages.push(reportImage)
    }

    // Step 5: Create ZIP
    console.log('Creating ZIP from optimized images...')
    const zipBlob = await createLemGendaryZip(optimizedImages, {
        zipName: 'optimized-images.zip',
        ...zipOptions
    })

    return zipBlob
}

/**
 * Create ZIP from processed images
 * @param {Array} processedResults - Results from lemGendaryProcessBatch
 * @param {Object} options - ZIP options
 * @returns {Promise<Blob>} ZIP file
 */
export async function lemGendBuildZip(processedResults, options = {}) {
    const images = processedResults
        .filter(result => result.success)
        .map(result => result.image)

    return createLemGendaryZip(images, options)
}

/**
 * Get library version and info
 * @returns {Object} Library information
 */
export function getLibraryInfo() {
    return {
        name: 'LemGendary Image Processor',
        version: '2.2.0', // Updated to match LemGendTask version
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

// Add favicon-specific helper functions
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
 * Process images using a template (connects task validation with template processing)
 * @param {LemGendImage} image - Image to process
 * @param {string} templateId - Template ID to apply
 * @param {Object} options - Template options
 * @returns {Promise<Object>} Template processing result
 */
export async function processWithTemplate(image, templateId, options = {}) {
    try {
        // Get template from templates system
        const template = getTemplateById(templateId)
        if (!template) {
            throw new Error(`Template not found: ${templateId}`)
        }

        // Check template compatibility with image
        const compatibility = validateTemplateCompatibility(template, {
            width: image.width,
            height: image.height
        })

        if (!compatibility.compatible) {
            throw new Error(`Template incompatible: ${compatibility.errors.map(e => e.message).join(', ')}`)
        }

        // Create a task from template
        const task = new LemGendTask(`Template: ${template.displayName}`, template.description)

        // Parse template dimensions
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)

        // Add appropriate steps based on template
        if (!widthInfo.isVariable && !heightInfo.isVariable) {
            // Fixed dimensions template
            const aspect = widthInfo.value / heightInfo.value
            const imageAspect = image.width / image.height

            if (Math.abs(aspect - imageAspect) > 0.1) {
                // Aspect ratio mismatch - need to crop
                task.addCrop(widthInfo.value, heightInfo.value, 'smart')
            } else {
                // Aspect ratio matches - just resize
                task.addResize(Math.max(widthInfo.value, heightInfo.value), 'longest')
            }
        } else if (widthInfo.isVariable && !heightInfo.isVariable) {
            // Flexible width, fixed height
            task.addResize(heightInfo.value, 'height')
        } else if (!widthInfo.isVariable && heightInfo.isVariable) {
            // Fixed width, flexible height
            task.addResize(widthInfo.value, 'width')
        }

        // Add optimization
        task.addOptimize(85, 'auto', {
            compressionMode: 'adaptive',
            preserveTransparency: template.recommendedFormats.includes('png') || template.recommendedFormats.includes('svg')
        })

        // Process the image
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
 * @param {LemGendImage} image - Image to process
 * @param {Object} template - Template with flexible dimensions
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processFlexibleTemplate(image, template, options = {}) {
    const widthInfo = parseDimension(template.width)
    const heightInfo = parseDimension(template.height)

    const task = new LemGendTask(`Flexible: ${template.displayName}`, template.description)

    if (widthInfo.isVariable && !heightInfo.isVariable) {
        // Fixed height, flexible width - maintain aspect ratio
        const scale = heightInfo.value / image.height
        const targetWidth = Math.round(image.width * scale)
        task.addResize(heightInfo.value, 'height')
    } else if (!widthInfo.isVariable && heightInfo.isVariable) {
        // Fixed width, flexible height - maintain aspect ratio
        const scale = widthInfo.value / image.width
        const targetHeight = Math.round(image.height * scale)
        task.addResize(widthInfo.value, 'width')
    } else if (widthInfo.isVariable && heightInfo.isVariable) {
        // Both dimensions flexible - just optimize
        task.addOptimize(85, 'auto')
    }

    const results = await lemGendaryProcessBatch([image], task)
    return results[0] || { success: false, error: 'Processing failed' }
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

    // Utilities
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,

    // Image utils
    getImageDimensions,
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

    // Validation
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