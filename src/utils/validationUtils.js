/**
 * Image validation utilities
 * @module utils/validation
 */

// Import shared utilities
import { formatFileSize } from './imageUtils.js';

/**
 * Validation error codes
 */
export const ValidationErrors = {
    INVALID_FILE: 'INVALID_FILE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    INVALID_QUALITY: 'INVALID_QUALITY',
    INVALID_FORMAT: 'INVALID_FORMAT',
    EMPTY_PATTERN: 'EMPTY_PATTERN',
    INVALID_CHARS: 'INVALID_CHARS',
    MISSING_INFO: 'MISSING_INFO',
    INVALID_CROP_DIMENSIONS: 'INVALID_CROP_DIMENSIONS',
    INVALID_CROP_MODE: 'INVALID_CROP_MODE',
    INVALID_DIMENSION: 'INVALID_DIMENSION',
    INVALID_MODE: 'INVALID_MODE',
    INVALID_ALGORITHM: 'INVALID_ALGORITHM',
    INVALID_WIDTH: 'INVALID_WIDTH',
    INVALID_HEIGHT: 'INVALID_HEIGHT',
    DIMENSION_EXCEEDS_MAX: 'DIMENSION_EXCEEDS_MAX',
    VERY_SMALL_DIMENSION: 'VERY_SMALL_DIMENSION',
    VERY_LARGE_DIMENSION: 'VERY_LARGE_DIMENSION'
}

/**
 * Validation warning codes
 */
export const ValidationWarnings = {
    LARGE_FILE: 'LARGE_FILE',
    CONTENT_LOSS: 'CONTENT_LOSS',
    TRANSPARENCY_LOSS: 'TRANSPARENCY_LOSS',
    AVIF_BROWSER_SUPPORT: 'AVIF_BROWSER_SUPPORT',
    SMALL_WIDTH: 'SMALL_WIDTH',
    SMALL_HEIGHT: 'SMALL_HEIGHT',
    LARGE_DIMENSIONS: 'LARGE_DIMENSIONS',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    NO_PLACEHOLDERS: 'NO_PLACEHOLDERS',
    NON_INTEGER_DIMENSION: 'NON_INTEGER_DIMENSION',
    FORCE_SQUARE_NO_ASPECT: 'FORCE_SQUARE_NO_ASPECT',
    SVG_SKIPPED: 'SVG_SKIPPED',
    FAVICON_RESIZE: 'FAVICON_RESIZE',
    EXTREME_ASPECT_RATIO: 'EXTREME_ASPECT_RATIO',
    VERY_SMALL_SOURCE: 'VERY_SMALL_SOURCE',
    VERY_LARGE_SOURCE: 'VERY_LARGE_SOURCE'
}

/**
 * Validate resize options (moved from LemGendaryResize)
 */
export function validateResizeOptions(options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    const { dimension, algorithm, mode, forceSquare, preserveAspectRatio } = options

    // Validate dimension
    if (typeof dimension !== 'number' || dimension <= 0) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_DIMENSION',
            message: 'Dimension must be a positive number',
            severity: 'error'
        })
    }

    if (dimension > 10000) {
        result.errors.push({
            code: 'DIMENSION_EXCEEDS_MAX',
            message: `Dimension exceeds maximum allowed value of 10000`,
            severity: 'error',
            suggestion: 'Reduce dimension to 10000 or less'
        })
    }

    if (dimension < 10) {
        result.warnings.push({
            code: 'VERY_SMALL_DIMENSION',
            message: `Very small target dimension (${dimension}px)`,
            severity: 'warning',
            suggestion: 'Consider at least 100px for usable images'
        })
    }

    if (dimension > 4000) {
        result.warnings.push({
            code: 'VERY_LARGE_DIMENSION',
            message: `Very large target dimension (${dimension}px)`,
            severity: 'warning',
            suggestion: 'Consider 1920px or less for web images'
        })
    }

    // Validate algorithm
    const validAlgorithms = ['lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell']
    if (algorithm && !validAlgorithms.includes(algorithm)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_ALGORITHM',
            message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`,
            severity: 'error'
        })
    }

    // Validate mode
    const validModes = ['longest', 'width', 'height', 'auto']
    if (mode && !validModes.includes(mode)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_MODE',
            message: `Mode must be one of: ${validModes.join(', ')}`,
            severity: 'error'
        })
    }

    // Round dimension if not integer
    if (dimension && !Number.isInteger(dimension)) {
        result.warnings.push({
            code: 'NON_INTEGER_DIMENSION',
            message: 'Dimension should be an integer for best results',
            severity: 'info'
        })
    }

    // Check for potential issues
    if (forceSquare && !preserveAspectRatio) {
        result.warnings.push({
            code: 'FORCE_SQUARE_NO_ASPECT',
            message: 'Force square without preserving aspect ratio may cause issues',
            severity: 'warning',
            suggestion: 'Consider enabling preserveAspectRatio for forceSquare'
        })
    }

    return result
}

/**
 * Validate crop options (moved from LemGendaryCrop)
 */
export function validateCropOptions(options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    const { width, height, mode, algorithm } = options

    // Validate dimensions
    if (typeof width !== 'number' || width <= 0) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_WIDTH',
            message: 'Width must be a positive number',
            severity: 'error'
        })
    }

    if (typeof height !== 'number' || height <= 0) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_HEIGHT',
            message: 'Height must be a positive number',
            severity: 'error'
        })
    }

    // Check for extreme dimensions
    if (width < 10 || height < 10) {
        result.errors.push({
            code: 'EXTREME_SMALL_DIMENSIONS',
            message: `Target dimensions too small: ${width}x${height}`,
            severity: 'error',
            suggestion: 'Use dimensions of at least 100x100 pixels'
        })
    }

    if (width > 10000 || height > 10000) {
        result.warnings.push({
            code: 'EXTREME_LARGE_DIMENSIONS',
            message: `Target dimensions very large: ${width}x${height}`,
            severity: 'warning',
            suggestion: 'Consider smaller dimensions for better performance'
        })
    }

    // Validate aspect ratio
    const aspectRatio = width / height
    if (aspectRatio > 10 || aspectRatio < 0.1) {
        result.warnings.push({
            code: 'EXTREME_ASPECT_RATIO',
            message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
            severity: 'warning',
            suggestion: 'Consider more balanced dimensions'
        })
    }

    // Validate mode
    const validModes = [
        'smart', 'face', 'object', 'saliency', 'entropy',
        'center', 'top', 'bottom', 'left', 'right',
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ]

    if (mode && !validModes.includes(mode)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_CROP_MODE',
            message: `Mode must be one of: ${validModes.join(', ')}`,
            severity: 'error'
        })
    }

    // Validate algorithm
    if (algorithm && !['lanczos3', 'bilinear', 'nearest'].includes(algorithm)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_ALGORITHM',
            message: 'Algorithm must be "lanczos3", "bilinear", or "nearest"',
            severity: 'error'
        })
    }

    // Check for integer dimensions
    if (width && !Number.isInteger(width) || height && !Number.isInteger(height)) {
        result.warnings.push({
            code: 'NON_INTEGER_DIMENSIONS',
            message: 'Crop dimensions should be integers for best results',
            severity: 'info'
        })
    }

    return result
}

/**
 * Validate optimization options
 */
export function validateOptimizationOptions(options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    const { quality, format, compressionMode, browserSupport } = options

    if (quality !== undefined) {
        if (typeof quality !== 'number' || quality < 1 || quality > 100) {
            result.valid = false
            result.errors.push({
                code: 'INVALID_QUALITY',
                message: `Quality must be between 1 and 100, got ${quality}`,
                severity: 'error',
                suggestion: 'Use a value between 1 and 100'
            })
        }
    }

    const validFormats = ['auto', 'webp', 'jpg', 'jpeg', 'png', 'avif', 'original']
    if (format && !validFormats.includes(format.toLowerCase())) {
        result.warnings.push({
            code: 'UNSUPPORTED_FORMAT',
            message: `Format ${format} may not be supported`,
            severity: 'warning',
            suggestion: `Use one of: ${validFormats.join(', ')}`
        })
    }

    return result
}

/**
 * Get validation summary
 */
export function getValidationSummary(validationResult) {
    return {
        isValid: validationResult.valid,
        hasWarnings: validationResult.warnings.length > 0,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        errors: validationResult.errors,
        warnings: validationResult.warnings
    }
}

/**
 * Validate dimensions
 */
export function validateDimensions(width, height, options = {}) {
    const { minWidth = 1, minHeight = 1, maxWidth = 10000, maxHeight = 10000 } = options

    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    if (width < minWidth || height < minHeight) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_DIMENSIONS,
            message: `Dimensions too small: ${width}x${height} (minimum: ${minWidth}x${minHeight})`,
            severity: 'error'
        })
    }

    if (width > maxWidth || height > maxHeight) {
        result.warnings.push({
            code: 'LARGE_DIMENSIONS',
            message: `Large dimensions: ${width}x${height} (maximum: ${maxWidth}x${maxHeight})`,
            severity: 'warning'
        })
    }

    return result
}

/**
 * Validate resize
 */
export function validateResize(dimension, mode, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    if (!dimension || dimension <= 0) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_DIMENSION',
            message: `Invalid resize dimension: ${dimension}`,
            severity: 'error',
            suggestion: 'Dimension must be a positive number'
        })
    }

    const validModes = ['auto', 'width', 'height', 'longest', 'fit']
    if (!validModes.includes(mode)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_MODE',
            message: `Invalid resize mode: ${mode}`,
            severity: 'error',
            suggestion: `Use one of: ${validModes.join(', ')}`
        })
    }

    return result
}

/**
 * Validate crop
 */
export function validateCrop(width, height, mode, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    if (!width || width <= 0 || !height || height <= 0) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_CROP_DIMENSIONS',
            message: `Invalid crop dimensions: ${width}x${height}`,
            severity: 'error',
            suggestion: 'Dimensions must be positive numbers'
        })
    }

    const validModes = ['smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']
    if (!validModes.includes(mode)) {
        result.valid = false
        result.errors.push({
            code: 'INVALID_CROP_MODE',
            message: `Invalid crop mode: ${mode}`,
            severity: 'error',
            suggestion: `Use one of: ${validModes.join(', ')}`
        })
    }

    return result
}

/**
 * Validate optimization
 */
export function validateOptimization(options = {}) {
    return validateOptimizationOptions(options)
}

/**
 * Validate rename pattern
 */
export function validateRenamePattern(pattern) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    if (!pattern || typeof pattern !== 'string' || pattern.trim() === '') {
        result.valid = false
        result.errors.push({
            code: 'EMPTY_PATTERN',
            message: 'Rename pattern cannot be empty',
            severity: 'error'
        })
        return result
    }

    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g
    if (invalidChars.test(pattern)) {
        result.errors.push({
            code: 'INVALID_CHARS',
            message: 'Pattern contains invalid filename characters',
            severity: 'error',
            suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
        })
        result.valid = false
    }

    const placeholders = ['{name}', '{index}', '{timestamp}', '{width}', '{height}', '{dimensions}', '{date}', '{time}']
    const hasPlaceholder = placeholders.some(ph => pattern.includes(ph))

    if (!hasPlaceholder) {
        result.warnings.push({
            code: 'NO_PLACEHOLDERS',
            message: 'Pattern may create duplicate filenames',
            severity: 'warning',
            suggestion: 'Include {index} or {timestamp} for unique filenames'
        })
    }

    return result
}

/**
 * Validate image file
 */
export function validateImage(file, options = {}) {
    const {
        maxFileSize = 50 * 1024 * 1024,
        minFileSize = 1,
        allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png',
            'image/webp', 'image/gif', 'image/svg+xml',
            'image/bmp', 'image/tiff', 'image/avif',
            'image/x-icon', 'image/vnd.microsoft.icon'
        ],
        checkDimensions = false,
        minDimensions = { width: 1, height: 1 },
        maxDimensions = { width: 10000, height: 10000 }
    } = options

    const result = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    }

    if (!file || typeof file !== 'object') {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'Not a valid file object',
            severity: 'error'
        })
        return result
    }

    const hasRequiredProperties = file.name !== undefined &&
        file.size !== undefined &&
        file.type !== undefined

    if (!hasRequiredProperties) {
        if (file.metadata && file.metadata.name && file.metadata.type && file.metadata.size) {
            result.metadata = { ...file.metadata }
        } else {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.INVALID_FILE,
                message: 'File object missing required properties (name, size, type)',
                severity: 'error'
            })
            return result
        }
    } else {
        result.metadata = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified || Date.now()
        }
    }

    const fileName = file.name || result.metadata.name
    const fileType = file.type || result.metadata.type
    const fileSize = file.size || result.metadata.size

    if (fileSize < minFileSize) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'File is empty',
            severity: 'error'
        })
    } else if (fileSize > maxFileSize) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.FILE_TOO_LARGE,
            message: `File too large (${formatFileSize(fileSize)} > ${formatFileSize(maxFileSize)})`,
            severity: 'error'
        })
    } else if (fileSize > 10 * 1024 * 1024) {
        result.warnings.push({
            code: ValidationWarnings.LARGE_FILE,
            message: `Large file (${formatFileSize(fileSize)}) may process slowly`,
            severity: 'warning'
        })
    }

    const normalizedType = fileType ? fileType.toLowerCase() : ''
    const isAllowed = allowedTypes.some(allowedType => {
        if (normalizedType === allowedType) return true

        if (normalizedType.includes('jpeg') && allowedType.includes('jpeg')) return true
        if (normalizedType.includes('jpg') && allowedType.includes('jpg')) return true

        if (!normalizedType || normalizedType === 'application/octet-stream') {
            const extension = fileName ? fileName.split('.').pop().toLowerCase() : ''
            const extensionMap = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff',
                'avif': 'image/avif',
                'ico': 'image/x-icon'
            }
            return extensionMap[extension] === allowedType
        }

        return false
    })

    if (!isAllowed) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.UNSUPPORTED_TYPE,
            message: `Unsupported file type: ${fileType || 'unknown'}`,
            severity: 'error',
            details: fileName ? `File: ${fileName}` : ''
        })
    }

    if (checkDimensions && file.width && file.height) {
        const dimensionValidation = validateDimensions(file.width, file.height, {
            minWidth: minDimensions.width,
            minHeight: minDimensions.height,
            maxWidth: maxDimensions.width,
            maxHeight: maxDimensions.height
        })

        result.errors.push(...dimensionValidation.errors)
        result.warnings.push(...dimensionValidation.warnings)
        result.valid = result.valid && dimensionValidation.valid
    }

    return result
}

/**
 * Validate session image data
 */
export function validateSessionImage(imageData, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    }

    if (!imageData || typeof imageData !== 'object') {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'Invalid image data',
            severity: 'error'
        })
        return result
    }

    let fileName, fileType, fileSize, fileObject

    if (imageData.file instanceof File || imageData.file instanceof Blob) {
        fileObject = imageData.file
        fileName = imageData.file.name
        fileType = imageData.file.type
        fileSize = imageData.file.size
    } else if (imageData.name && imageData.type && imageData.size) {
        fileName = imageData.name
        fileType = imageData.type
        fileSize = imageData.size
    } else if (imageData.lemGendImage) {
        if (imageData.lemGendImage.file) {
            fileObject = imageData.lemGendImage.file
        }
        fileName = imageData.lemGendImage.metadata?.originalName || imageData.originalName
        fileType = imageData.lemGendImage.metadata?.mimeType || imageData.type
        fileSize = imageData.lemGendImage.metadata?.originalSize || imageData.size
    } else {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'Cannot extract file information',
            severity: 'error'
        })
        return result
    }

    if (!fileObject && imageData.blob) {
        result.warnings.push({
            code: ValidationWarnings.CONTENT_LOSS,
            message: 'File data available as blob, but not as File object',
            severity: 'warning',
            suggestion: 'File may need to be reconstructed for processing'
        })
    }

    result.metadata = {
        name: fileName,
        type: fileType,
        size: fileSize,
        id: imageData.id,
        hasFileObject: !!fileObject,
        hasBlobData: !!imageData.blob
    }

    if (fileObject) {
        const fileValidation = validateImage(fileObject, options)
        result.valid = fileValidation.valid
        result.errors.push(...fileValidation.errors)
        result.warnings.push(...fileValidation.warnings)
        result.metadata = { ...result.metadata, ...fileValidation.metadata }
    } else {
        const minimalFile = {
            name: fileName,
            type: fileType,
            size: fileSize,
            lastModified: Date.now()
        }
        const fileValidation = validateImage(minimalFile, options)
        result.valid = fileValidation.valid
        result.errors.push(...fileValidation.errors)
        result.warnings.push(...fileValidation.warnings)
        result.metadata = { ...result.metadata, ...fileValidation.metadata }
    }

    if (imageData.url && !imageData.url.startsWith('blob:')) {
        result.warnings.push({
            code: ValidationWarnings.CONTENT_LOSS,
            message: 'Image URL may not be a valid blob URL',
            severity: 'warning'
        })
    }

    return result
}

/**
 * Validate favicon options
 */
export function validateFaviconOptions(options, imageInfo = null) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    const { sizes, formats } = options

    if (!Array.isArray(sizes) || sizes.length === 0) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_DIMENSIONS,
            message: 'Favicon sizes must be a non-empty array',
            severity: 'error'
        })
    }

    sizes?.forEach(size => {
        if (size < 16) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_WIDTH,
                message: `Favicon size ${size}px is below recommended minimum (16px)`,
                severity: 'warning'
            })
        }

        if (size > 1024) {
            result.warnings.push({
                code: ValidationWarnings.LARGE_DIMENSIONS,
                message: `Favicon size ${size}px is unusually large`,
                severity: 'info'
            })
        }
    })

    if (imageInfo) {
        const minSize = Math.min(...sizes)
        if (imageInfo.width < minSize || imageInfo.height < minSize) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_WIDTH,
                message: `Source image (${imageInfo.width}x${imageInfo.height}) smaller than smallest favicon size (${minSize}px)`,
                severity: 'warning',
                suggestion: 'Consider using a larger source image or enable upscaling'
            })
        }

        if (Math.abs(imageInfo.width / imageInfo.height - 1) > 0.1) {
            result.warnings.push({
                code: ValidationWarnings.CONTENT_LOSS,
                message: 'Source image is not square; favicons may be distorted',
                severity: 'warning',
                suggestion: 'Consider adding a crop step before favicon generation'
            })
        }
    }

    const validFormats = ['png', 'ico', 'svg']
    formats?.forEach(format => {
        if (!validFormats.includes(format)) {
            result.warnings.push({
                code: ValidationWarnings.UNSUPPORTED_FORMAT,
                message: `Unsupported favicon format: ${format}`,
                severity: 'warning',
                suggestion: `Use one of: ${validFormats.join(', ')}`
            })
        }
    })

    return result
}

/**
 * Validate task steps
 */
export function validateTaskSteps(steps, imageInfo = null) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    }

    steps.forEach((step, index) => {
        switch (step.processor) {
            case 'resize':
                const resizeValidation = validateResize(
                    step.options.dimension,
                    step.options.mode
                )
                if (!resizeValidation.valid) {
                    resizeValidation.errors.forEach(error => {
                        error.step = index + 1
                        result.errors.push(error)
                    })
                    resizeValidation.warnings.forEach(warning => {
                        warning.step = index + 1
                        result.warnings.push(warning)
                    })
                    result.valid = false
                }
                break

            case 'crop':
                const cropValidation = validateCrop(
                    step.options.width,
                    step.options.height,
                    step.options.mode
                )
                if (!cropValidation.valid) {
                    cropValidation.errors.forEach(error => {
                        error.step = index + 1
                        result.errors.push(error)
                    })
                    cropValidation.warnings.forEach(warning => {
                        warning.step = index + 1
                        result.warnings.push(warning)
                    })
                    result.valid = false
                }
                break

            case 'optimize':
                const optimizeValidation = validateOptimization(step.options)
                optimizeValidation.errors.forEach(error => {
                    error.step = index + 1
                    result.errors.push(error)
                })
                optimizeValidation.warnings.forEach(warning => {
                    warning.step = index + 1
                    result.warnings.push(warning)
                })
                result.valid = result.valid && optimizeValidation.valid
                break

            case 'rename':
                const renameValidation = validateRenamePattern(step.options.pattern)
                renameValidation.errors.forEach(error => {
                    error.step = index + 1
                    result.errors.push(error)
                })
                renameValidation.warnings.forEach(warning => {
                    warning.step = index + 1
                    result.warnings.push(warning)
                })
                result.valid = result.valid && renameValidation.valid
                break

            case 'favicon':
                const faviconValidation = validateFaviconOptions(step.options, imageInfo)
                faviconValidation.errors.forEach(error => {
                    error.step = index + 1
                    result.errors.push(error)
                })
                faviconValidation.warnings.forEach(warning => {
                    warning.step = index + 1
                    result.warnings.push(warning)
                })
                result.valid = result.valid && faviconValidation.valid
                break
        }
    })

    return result
}

/**
 * Validate task logic
 */
export function validateTaskLogic(steps) {
    const result = {
        valid: true,
        warnings: []
    }

    const enabledSteps = steps.filter(step => step.enabled !== false)
    const hasResize = enabledSteps.some(s => s.processor === 'resize')
    const hasCrop = enabledSteps.some(s => s.processor === 'crop')
    const hasOptimize = enabledSteps.some(s => s.processor === 'optimize')

    if (hasCrop && !hasResize) {
        result.warnings.push({
            type: 'crop_without_resize',
            message: 'Crop without resize may result in unexpected output',
            severity: 'info',
            suggestion: 'Consider adding resize step before crop for better control'
        })
    }

    const optimizeSteps = enabledSteps.filter(s => s.processor === 'optimize')
    if (optimizeSteps.length > 1) {
        result.warnings.push({
            type: 'multiple_optimize',
            message: `Multiple optimization steps (${optimizeSteps.length})`,
            severity: 'warning',
            suggestion: 'Multiple optimizations may degrade quality unnecessarily'
        })
    }

    const renameIndex = enabledSteps.findIndex(s => s.processor === 'rename')
    if (renameIndex >= 0 && renameIndex < enabledSteps.length - 2) {
        result.warnings.push({
            type: 'early_rename',
            message: 'Rename step placed before other operations',
            severity: 'info',
            suggestion: 'Consider moving rename to end to reflect final output'
        })
    }

    const faviconIndex = enabledSteps.findIndex(s => s.processor === 'favicon')
    if (faviconIndex >= 0) {
        const stepsBefore = enabledSteps.slice(0, faviconIndex)
        const hasResizeBefore = stepsBefore.some(s => s.processor === 'resize')
        const hasCropBefore = stepsBefore.some(s => s.processor === 'crop')

        if (!hasResizeBefore && !hasCropBefore) {
            result.warnings.push({
                type: 'favicon_without_preparation',
                message: 'Favicon generation without prior resize/crop',
                severity: 'warning',
                suggestion: 'Add resize/crop step before favicon for optimal results'
            })
        }
    }

    const faviconSteps = enabledSteps.filter(s => s.processor === 'favicon')
    faviconSteps.forEach(faviconStep => {
        const optimizeAfter = enabledSteps
            .filter(s => s.processor === 'optimize')
            .some(optimizeStep => optimizeStep.order > faviconStep.order)

        if (optimizeAfter) {
            result.warnings.push({
                type: 'optimize_after_favicon',
                message: 'Optimization after favicon generation may affect favicon quality',
                severity: 'warning',
                suggestion: 'Move optimization step before favicon generation'
            })
        }
    })

    if (hasOptimize && !hasResize && !hasCrop) {
        result.warnings.push({
            type: 'optimization_only',
            message: 'Task contains only optimization step',
            severity: 'info',
            suggestion: 'Consider adding resize/crop steps for complete image processing'
        })
    }

    return result
}

/**
 * Validate task against an image
 */
export async function validateTask(task, lemGendImage) {
    const result = {
        isValid: true,
        hasWarnings: false,
        errors: [],
        warnings: [],
        summary: null
    }

    const enabledSteps = task.getEnabledSteps()

    if (enabledSteps.length === 0) {
        result.warnings.push({
            type: 'empty_task',
            message: 'Task has no enabled processing steps',
            severity: 'warning'
        })
    }

    if (lemGendImage) {
        if (!lemGendImage.file) {
            result.warnings.push({
                type: 'missing_file_property',
                message: 'Image missing file property (may be from session storage)',
                severity: 'warning',
                suggestion: 'File will be reconstructed for processing'
            })
        } else if (!(lemGendImage.file instanceof File)) {
            result.warnings.push({
                type: 'invalid_file_type',
                message: 'Image file property is not a File instance',
                severity: 'warning',
                suggestion: 'File will be reconstructed for processing'
            })
        }

        const stepValidation = validateTaskSteps(enabledSteps, {
            width: lemGendImage.width,
            height: lemGendImage.height
        })
        result.errors.push(...stepValidation.errors)
        result.warnings.push(...stepValidation.warnings)
        result.isValid = stepValidation.valid

        const logicValidation = validateTaskLogic(enabledSteps)
        result.warnings.push(...logicValidation.warnings)
    } else {
        const stepValidation = validateTaskSteps(enabledSteps)
        result.errors.push(...stepValidation.errors)
        result.warnings.push(...stepValidation.warnings)
        result.isValid = stepValidation.valid
    }

    result.hasWarnings = result.warnings.length > 0
    result.summary = getValidationSummary({
        valid: result.isValid,
        errors: result.errors,
        warnings: result.warnings
    })

    return result
}