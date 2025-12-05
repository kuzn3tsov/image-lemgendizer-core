/**
 * Validation utilities for LemGendary Image Processor
 * @module utils/validation
 */

/**
 * Image validation errors
 */
export const ValidationErrors = {
    INVALID_FILE: 'INVALID_FILE',
    UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    DIMENSIONS_TOO_SMALL: 'DIMENSIONS_TOO_SMALL',
    DIMENSIONS_TOO_LARGE: 'DIMENSIONS_TOO_LARGE',
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    ASPECT_RATIO_MISMATCH: 'ASPECT_RATIO_MISMATCH',
    QUALITY_OUT_OF_RANGE: 'QUALITY_OUT_OF_RANGE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    TRANSPARENCY_LOSS: 'TRANSPARENCY_LOSS',
    EXCESSIVE_COMPRESSION: 'EXCESSIVE_COMPRESSION',
    AVIF_BROWSER_SUPPORT: 'AVIF_BROWSER_SUPPORT',
    VARIABLE_DIMENSION_NOT_ALLOWED: 'VARIABLE_DIMENSION_NOT_ALLOWED'
}

/**
 * Image validation warnings
 */
export const ValidationWarnings = {
    LARGE_FILE: 'LARGE_FILE',
    SMALL_DIMENSIONS: 'SMALL_DIMENSIONS',
    LARGE_DIMENSIONS: 'LARGE_DIMENSIONS',
    HIGH_QUALITY: 'HIGH_QUALITY',
    LOW_QUALITY: 'LOW_QUALITY',
    POTENTIAL_PIXELATION: 'POTENTIAL_PIXELATION',
    CONTENT_LOSS: 'CONTENT_LOSS',
    ASPECT_CHANGE: 'ASPECT_CHANGE',
    MULTIPLE_OPTIMIZATIONS: 'MULTIPLE_OPTIMIZATIONS',
    TRANSPARENCY_LOSS: 'TRANSPARENCY_LOSS',
    AVIF_BROWSER_SUPPORT: 'AVIF_BROWSER_SUPPORT',
    VARIABLE_DIMENSION_USED: 'VARIABLE_DIMENSION_USED',
    FLEXIBLE_TEMPLATE: 'FLEXIBLE_TEMPLATE'
}

/**
 * Check if a value represents variable/flexible dimension
 * @param {*} value - Value to check
 * @returns {boolean} True if variable dimension
 */
export function isVariableDimension(value) {
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase()
        return lowerValue === 'auto' ||
            lowerValue === 'flex' ||
            lowerValue === 'variable' ||
            lowerValue === 'natural'
    }
    return false
}

/**
 * Parse dimension value (handles numbers and variable dimensions)
 * @param {*} value - Dimension value
 * @returns {Object} Parsed dimension info
 */
export function parseDimension(value) {
    if (isVariableDimension(value)) {
        return {
            value: null,
            isVariable: true,
            type: value.toLowerCase(),
            raw: value
        }
    }

    const numValue = Number(value)
    return {
        value: isNaN(numValue) ? null : numValue,
        isVariable: false,
        type: 'fixed',
        raw: value
    }
}

/**
 * Format bytes to human-readable string
 * @private
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Validate optimization options - ENHANCED FUNCTION
 * @param {Object} options - Optimization options
 * @returns {Object} Validation result
 */
export function validateOptimizationOptions(options = {}) {
    const errors = []
    const warnings = []
    const result = { valid: true, errors, warnings }

    // Default values
    const quality = options.quality !== undefined ? options.quality : 85
    const format = options.format || 'auto'
    const compressionMode = options.compressionMode || 'adaptive'
    const maxDisplayWidth = options.maxDisplayWidth
    const browserSupport = options.browserSupport || ['modern', 'legacy']
    const preserveTransparency = options.preserveTransparency !== false

    // Validate quality
    if (typeof quality !== 'number' || quality < 1 || quality > 100) {
        errors.push({
            code: ValidationErrors.QUALITY_OUT_OF_RANGE,
            message: `Quality must be between 1-100, got ${quality}`,
            severity: 'error',
            suggestion: 'Use quality between 60-95 for best results'
        })
        result.valid = false
    } else if (quality > 95) {
        warnings.push({
            code: ValidationWarnings.HIGH_QUALITY,
            message: `High quality (${quality}%) provides minimal visual improvement over 90%`,
            severity: 'info',
            suggestion: 'Consider 80-90% for optimal balance'
        })
    } else if (quality < 50) {
        warnings.push({
            code: ValidationWarnings.LOW_QUALITY,
            message: `Low quality (${quality}%) may cause noticeable artifacts`,
            severity: 'warning',
            suggestion: 'Consider at least 60% for acceptable quality'
        })
    }

    // Validate format
    const validFormats = ['auto', 'webp', 'jpg', 'jpeg', 'png', 'avif', 'ico', 'svg', 'original']
    if (!validFormats.includes(format.toLowerCase())) {
        errors.push({
            code: ValidationErrors.INVALID_FORMAT,
            message: `Invalid format: ${format}`,
            severity: 'error',
            suggestion: `Use one of: ${validFormats.join(', ')}`
        })
        result.valid = false
    }

    // Validate AVIF quality adjustment
    if (format.toLowerCase() === 'avif') {
        const avifQuality = Math.min(63, Math.round(quality * 0.63))
        if (avifQuality < quality) {
            warnings.push({
                code: 'AVIF_QUALITY_ADJUSTED',
                message: `AVIF quality adjusted from ${quality} to ${avifQuality} (different quality scale)`,
                severity: 'info'
            })
        }
    }

    // Validate maxDisplayWidth
    if (maxDisplayWidth !== undefined && maxDisplayWidth !== null) {
        if (typeof maxDisplayWidth !== 'number' || maxDisplayWidth < 10 || maxDisplayWidth > 10000) {
            warnings.push({
                code: 'EXTREME_MAX_DISPLAY_WIDTH',
                message: `maxDisplayWidth (${maxDisplayWidth}) outside recommended range`,
                severity: 'warning',
                suggestion: 'Use between 100-4000px for web images'
            })
        }
    }

    // Validate compression mode
    const validCompressionModes = ['adaptive', 'aggressive', 'balanced']
    if (!validCompressionModes.includes(compressionMode)) {
        warnings.push({
            code: 'INVALID_COMPRESSION_MODE',
            message: `Invalid compression mode: ${compressionMode}`,
            severity: 'warning',
            suggestion: `Use one of: ${validCompressionModes.join(', ')}`
        })
    }

    // Validate browser support
    if (browserSupport && !Array.isArray(browserSupport)) {
        warnings.push({
            code: 'INVALID_BROWSER_SUPPORT',
            message: 'browserSupport should be an array',
            severity: 'warning',
            suggestion: 'Use ["modern", "legacy"] or ["all"]'
        })
    }

    // Validate ICO sizes
    if (options.icoSizes && Array.isArray(options.icoSizes)) {
        options.icoSizes.forEach(size => {
            if (size < 16 || size > 512) {
                warnings.push({
                    code: 'INVALID_ICO_SIZE',
                    message: `ICO size ${size}px outside recommended range`,
                    severity: 'warning',
                    suggestion: 'Use sizes between 16-512px'
                })
            }
        })
    }

    // Check for JPEG transparency incompatibility
    if ((format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg') && preserveTransparency) {
        warnings.push({
            code: ValidationWarnings.TRANSPARENCY_LOSS,
            message: 'JPEG format does not support transparency',
            severity: 'warning',
            suggestion: 'Use PNG or WebP to preserve transparency'
        })
    }

    // AVIF browser support warning
    if (format.toLowerCase() === 'avif' && (!browserSupport || !browserSupport.includes('modern'))) {
        warnings.push({
            code: ValidationWarnings.AVIF_BROWSER_SUPPORT,
            message: 'AVIF format has limited browser support (Chrome 85+, Firefox 93+, Edge 85+)',
            severity: 'info',
            suggestion: 'Consider providing WebP fallback or use ["modern", "legacy"] browser support'
        })
    }

    // Excessive compression warning
    if (compressionMode === 'aggressive' && quality < 60) {
        warnings.push({
            code: ValidationWarnings.EXCESSIVE_COMPRESSION,
            message: 'Aggressive compression with low quality may degrade image significantly',
            severity: 'warning',
            suggestion: 'Increase quality or use balanced/adaptive mode'
        })
    }

    return result
}

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateImage(file, options = {}) {
    const {
        maxFileSize = 50 * 1024 * 1024, // 50MB
        minFileSize = 1, // 1 byte
        allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png',
            'image/webp', 'image/gif', 'image/svg+xml',
            'image/bmp', 'image/tiff', 'image/avif',
            'image/x-icon', 'image/vnd.microsoft.icon' // Added favicon support
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

    // Check if it's a valid File object
    if (!(file instanceof File)) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'Not a valid File object',
            severity: 'error'
        })
        return result
    }

    // Check file size
    if (file.size < minFileSize) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FILE,
            message: 'File is empty',
            severity: 'error'
        })
    } else if (file.size > maxFileSize) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.FILE_TOO_LARGE,
            message: `File too large (${formatBytes(file.size)} > ${formatBytes(maxFileSize)})`,
            severity: 'error'
        })
    } else if (file.size > 10 * 1024 * 1024) { // 10MB
        result.warnings.push({
            code: ValidationWarnings.LARGE_FILE,
            message: `Large file (${formatBytes(file.size)}) may process slowly`,
            severity: 'warning'
        })
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.UNSUPPORTED_TYPE,
            message: `Unsupported file type: ${file.type}`,
            severity: 'error'
        })
    }

    // Store metadata
    result.metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
    }

    return result
}

/**
 * Validate dimensions - ENHANCED to handle variable dimensions
 * @param {Object} dimensions - Image dimensions
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateDimensions(dimensions, options = {}) {
    const {
        minWidth = 1,
        minHeight = 1,
        maxWidth = 10000,
        maxHeight = 10000,
        requireIntegers = true,
        allowVariable = true  // New option
    } = options

    const result = {
        valid: true,
        errors: [],
        warnings: [],
        dimensions: { ...dimensions },
        hasVariableDimensions: false
    }

    const { width, height } = dimensions

    // Parse dimensions
    const widthInfo = parseDimension(width)
    const heightInfo = parseDimension(height)

    result.hasVariableDimensions = widthInfo.isVariable || heightInfo.isVariable

    // Check if variable dimensions are allowed
    if ((widthInfo.isVariable || heightInfo.isVariable) && !allowVariable) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.VARIABLE_DIMENSION_NOT_ALLOWED,
            message: 'Variable dimensions are not allowed in this context',
            severity: 'error',
            suggestion: 'Provide fixed dimensions or enable allowVariable option'
        })
        return result
    }

    // Validate fixed dimensions
    if (!widthInfo.isVariable) {
        if (typeof widthInfo.value !== 'number' || isNaN(widthInfo.value)) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.INVALID_DIMENSIONS,
                message: 'Width must be a valid number',
                severity: 'error'
            })
        } else if (requireIntegers && !Number.isInteger(widthInfo.value)) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_DIMENSIONS,
                message: 'Width should be an integer for best results',
                severity: 'warning'
            })
        } else if (widthInfo.value < minWidth) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.DIMENSIONS_TOO_SMALL,
                message: `Width too small (${widthInfo.value} < ${minWidth})`,
                severity: 'error'
            })
        } else if (widthInfo.value > maxWidth) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.DIMENSIONS_TOO_LARGE,
                message: `Width too large (${widthInfo.value} > ${maxWidth})`,
                severity: 'error'
            })
        } else if (widthInfo.value < 50) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_DIMENSIONS,
                message: `Small width (${widthInfo.value}px) may produce pixelated results`,
                severity: 'warning'
            })
        }
    }

    if (!heightInfo.isVariable) {
        if (typeof heightInfo.value !== 'number' || isNaN(heightInfo.value)) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.INVALID_DIMENSIONS,
                message: 'Height must be a valid number',
                severity: 'error'
            })
        } else if (requireIntegers && !Number.isInteger(heightInfo.value)) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_DIMENSIONS,
                message: 'Height should be an integer for best results',
                severity: 'warning'
            })
        } else if (heightInfo.value < minHeight) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.DIMENSIONS_TOO_SMALL,
                message: `Height too small (${heightInfo.value} < ${minHeight})`,
                severity: 'error'
            })
        } else if (heightInfo.value > maxHeight) {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.DIMENSIONS_TOO_LARGE,
                message: `Height too large (${heightInfo.value} > ${maxHeight})`,
                severity: 'error'
            })
        } else if (heightInfo.value < 50) {
            result.warnings.push({
                code: ValidationWarnings.SMALL_DIMENSIONS,
                message: `Small height (${heightInfo.value}px) may produce pixelated results`,
                severity: 'warning'
            })
        }
    }

    // Calculate aspect ratio only if both dimensions are fixed
    if (!widthInfo.isVariable && !heightInfo.isVariable &&
        widthInfo.value > 0 && heightInfo.value > 0) {
        result.dimensions.aspectRatio = widthInfo.value / heightInfo.value
        result.dimensions.orientation = widthInfo.value >= heightInfo.value ? 'landscape' : 'portrait'

        // Check for extreme dimensions
        if (widthInfo.value > 4000 || heightInfo.value > 4000) {
            result.warnings.push({
                code: ValidationWarnings.LARGE_DIMENSIONS,
                message: `Large dimensions (${widthInfo.value}x${heightInfo.value}) may cause performance issues`,
                severity: 'warning'
            })
        }
    } else if (widthInfo.isVariable || heightInfo.isVariable) {
        result.dimensions.hasVariable = true
        result.dimensions.variableType = widthInfo.isVariable ? 'width' : 'height'

        // Warn about variable dimensions
        result.warnings.push({
            code: ValidationWarnings.VARIABLE_DIMENSION_USED,
            message: `Using ${widthInfo.isVariable ? 'variable width' : 'variable height'} dimension`,
            severity: 'info',
            suggestion: 'One dimension will be calculated automatically'
        })
    }

    return result
}

/**
 * Validate resize operation with variable dimension support
 * @param {Object} currentDimensions - Current image dimensions
 * @param {number|string} targetDimension - Target dimension (can be number or 'flex')
 * @param {string} mode - Resize mode ('auto', 'width', 'height')
 * @returns {Object} Validation result
 */
export function validateResize(currentDimensions, targetDimension, mode = 'auto') {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        newDimensions: null
    }

    // Validate current dimensions
    const dimValidation = validateDimensions(currentDimensions)
    if (!dimValidation.valid) {
        return dimValidation
    }

    const { width, height } = currentDimensions

    // Parse target dimension
    const targetInfo = parseDimension(targetDimension)

    // Validate target dimension
    if (targetInfo.isVariable) {
        // Variable target - only valid in certain modes
        if (mode === 'width' && targetInfo.type === 'flex') {
            // Flexible width - maintain aspect ratio based on fixed height
            result.newDimensions = { width: 'flex', height: height }
            result.warnings.push({
                code: ValidationWarnings.FLEXIBLE_TEMPLATE,
                message: 'Using flexible width - will maintain natural aspect ratio',
                severity: 'info'
            })
            return result
        } else if (mode === 'height' && targetInfo.type === 'flex') {
            // Flexible height - maintain aspect ratio based on fixed width
            result.newDimensions = { width: width, height: 'flex' }
            result.warnings.push({
                code: ValidationWarnings.FLEXIBLE_TEMPLATE,
                message: 'Using flexible height - will maintain natural aspect ratio',
                severity: 'info'
            })
            return result
        } else {
            result.valid = false
            result.errors.push({
                code: ValidationErrors.INVALID_DIMENSIONS,
                message: `Invalid target dimension for mode ${mode}: ${targetDimension}`,
                severity: 'error'
            })
            return result
        }
    }

    // Fixed target dimension validation
    if (typeof targetInfo.value !== 'number' || targetInfo.value <= 0) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_DIMENSIONS,
            message: `Invalid target dimension: ${targetDimension}`,
            severity: 'error'
        })
        return result
    }

    // Calculate new dimensions
    let newWidth, newHeight
    if (mode === 'width') {
        newWidth = targetInfo.value
        newHeight = Math.round((height / width) * targetInfo.value)
    } else if (mode === 'height') {
        newHeight = targetInfo.value
        newWidth = Math.round((width / height) * targetInfo.value)
    } else { // auto
        if (width >= height) {
            newWidth = targetInfo.value
            newHeight = Math.round((height / width) * targetInfo.value)
        } else {
            newHeight = targetInfo.value
            newWidth = Math.round((width / height) * targetInfo.value)
        }
    }

    result.newDimensions = { width: newWidth, height: newHeight }

    // Validate new dimensions
    const newDimValidation = validateDimensions(result.newDimensions)
    if (!newDimValidation.valid) {
        return newDimValidation
    }

    // Add resize-specific warnings
    const scaleFactor = newWidth / width

    // Extreme downscaling warning
    if (scaleFactor < 0.1) {
        result.warnings.push({
            code: ValidationWarnings.POTENTIAL_PIXELATION,
            message: `Downscaling by ${((1 - scaleFactor) * 100).toFixed(1)}% may cause pixelation`,
            severity: 'warning',
            suggestion: 'Consider using nearest-neighbor algorithm for pixel art'
        })
    }

    // Extreme upscaling warning
    if (scaleFactor > 4) {
        result.warnings.push({
            code: ValidationWarnings.POTENTIAL_PIXELATION,
            message: `Upscaling by ${((scaleFactor - 1) * 100).toFixed(1)}% may reduce quality`,
            severity: 'warning',
            suggestion: 'Consider using AI upscaling tools for better results'
        })
    }

    // Aspect ratio change warning
    const originalAspect = width / height
    const newAspect = newWidth / newHeight
    const aspectDiff = Math.abs(originalAspect - newAspect) / originalAspect

    if (aspectDiff > 0.01) { // More than 1% deviation
        result.warnings.push({
            code: ValidationWarnings.ASPECT_CHANGE,
            message: `Aspect ratio changed from ${originalAspect.toFixed(3)} to ${newAspect.toFixed(3)}`,
            severity: 'info',
            suggestion: 'Check if this deviation is acceptable'
        })
    }

    return result
}

/**
 * Validate crop operation
 * @param {Object} currentDimensions - Current image dimensions
 * @param {number|string} cropWidth - Crop width (can be number or 'flex')
 * @param {number|string} cropHeight - Crop height (can be number or 'flex')
 * @param {string} position - Crop position
 * @returns {Object} Validation result
 */
export function validateCrop(currentDimensions, cropWidth, cropHeight, position = 'center') {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        cropInfo: null
    }

    // Validate current dimensions
    const dimValidation = validateDimensions(currentDimensions)
    if (!dimValidation.valid) {
        return dimValidation
    }

    const { width, height } = currentDimensions

    // Parse crop dimensions
    const cropWidthInfo = parseDimension(cropWidth)
    const cropHeightInfo = parseDimension(cropHeight)

    // Check for variable dimensions in crop
    if (cropWidthInfo.isVariable || cropHeightInfo.isVariable) {
        result.warnings.push({
            code: ValidationWarnings.FLEXIBLE_TEMPLATE,
            message: 'Using flexible dimensions for crop - will use maximum available space',
            severity: 'info'
        })

        // For flexible crop, use original dimensions as max
        const actualCropWidth = cropWidthInfo.isVariable ? width : cropWidthInfo.value
        const actualCropHeight = cropHeightInfo.isVariable ? height : cropHeightInfo.value

        result.cropInfo = {
            cropDimensions: { width: actualCropWidth, height: actualCropHeight },
            offsets: { x: 0, y: 0 },
            position: 'center',
            scale: 1,
            hasFlexibleDimensions: true,
            flexibleWidth: cropWidthInfo.isVariable,
            flexibleHeight: cropHeightInfo.isVariable
        }

        return result
    }

    // Validate fixed crop dimensions
    const cropDimValidation = validateDimensions({ width: cropWidthInfo.value, height: cropHeightInfo.value })
    if (!cropDimValidation.valid) {
        return cropDimValidation
    }

    // Calculate scale to fit
    const scale = Math.max(cropWidthInfo.value / width, cropHeightInfo.value / height)
    const scaledWidth = Math.round(width * scale)
    const scaledHeight = Math.round(height * scale)

    // Calculate crop offsets
    let offsetX, offsetY
    switch (position) {
        case 'top':
            offsetX = (scaledWidth - cropWidthInfo.value) / 2
            offsetY = 0
            break
        case 'bottom':
            offsetX = (scaledWidth - cropWidthInfo.value) / 2
            offsetY = scaledHeight - cropHeightInfo.value
            break
        case 'left':
            offsetX = 0
            offsetY = (scaledHeight - cropHeightInfo.value) / 2
            break
        case 'right':
            offsetX = scaledWidth - cropWidthInfo.value
            offsetY = (scaledHeight - cropHeightInfo.value) / 2
            break
        case 'center':
        default:
            offsetX = (scaledWidth - cropWidthInfo.value) / 2
            offsetY = (scaledHeight - cropHeightInfo.value) / 2
    }

    result.cropInfo = {
        scaledDimensions: { width: scaledWidth, height: scaledHeight },
        cropDimensions: { width: cropWidthInfo.value, height: cropHeightInfo.value },
        offsets: { x: Math.max(0, Math.round(offsetX)), y: Math.max(0, Math.round(offsetY)) },
        position,
        scale
    }

    // Add crop-specific warnings
    const contentLostX = Math.max(0, (cropWidthInfo.value - width) / width)
    const contentLostY = Math.max(0, (cropHeightInfo.value - height) / height)
    const maxContentLost = Math.max(contentLostX, contentLostY)

    if (maxContentLost > 0.3) { // More than 30% content lost
        result.warnings.push({
            code: ValidationWarnings.CONTENT_LOSS,
            message: `Crop will remove ${(maxContentLost * 100).toFixed(1)}% of image content`,
            severity: 'warning',
            suggestion: 'Consider adjusting crop dimensions or position'
        })
    }

    // Aspect ratio mismatch warning
    const sourceAspect = width / height
    const targetAspect = cropWidthInfo.value / cropHeightInfo.value
    const aspectDiff = Math.abs(sourceAspect - targetAspect) / sourceAspect

    if (aspectDiff > 0.5) { // More than 50% aspect ratio difference
        result.warnings.push({
            code: ValidationWarnings.ASPECT_CHANGE,
            message: `Source aspect ratio (${sourceAspect.toFixed(2)}) differs significantly from target (${targetAspect.toFixed(2)})`,
            severity: 'warning',
            suggestion: 'This may result in stretched appearance'
        })
    }

    return result
}

/**
 * Validate optimization settings
 * @param {string} currentFormat - Current image format
 * @param {string} targetFormat - Target format
 * @param {number} quality - Quality percentage
 * @param {boolean} hasTransparency - Whether image has transparency
 * @returns {Object} Validation result
 */
export function validateOptimization(currentFormat, targetFormat, quality, hasTransparency = false) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        recommendations: []
    }

    // Validate quality
    if (typeof quality !== 'number' || quality < 1 || quality > 100) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.QUALITY_OUT_OF_RANGE,
            message: `Quality must be between 1-100, got ${quality}`,
            severity: 'error'
        })
    } else if (quality > 95) {
        result.warnings.push({
            code: ValidationWarnings.HIGH_QUALITY,
            message: `High quality setting (${quality}%) provides minimal visual improvement`,
            severity: 'info',
            suggestion: 'Consider 80-85% for optimal balance'
        })
    } else if (quality < 50) {
        result.warnings.push({
            code: ValidationWarnings.LOW_QUALITY,
            message: `Low quality setting (${quality}%) may cause noticeable artifacts`,
            severity: 'warning',
            suggestion: 'Consider 60%+ for acceptable quality'
        })
    }

    // Validate format compatibility
    const formatMatrix = {
        'jpg': ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico'],
        'jpeg': ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico'],
        'png': ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico'],
        'webp': ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico'],
        'avif': ['jpeg', 'png', 'webp', 'ico'],
        'ico': ['jpeg', 'png', 'webp', 'gif', 'bmp', 'ico'] // Added favicon support
    }

    const current = currentFormat.toLowerCase().replace('image/', '')
    const target = targetFormat.toLowerCase()

    if (target !== 'original' && !formatMatrix[target]?.includes(current)) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FORMAT,
            message: `Cannot convert ${current} to ${target}`,
            severity: 'error'
        })
    }

    // Transparency loss warning
    if ((target === 'jpg' || target === 'jpeg') && hasTransparency) {
        result.warnings.push({
            code: ValidationWarnings.TRANSPARENCY_LOSS,
            message: 'JPEG format does not support transparency',
            severity: 'warning',
            suggestion: 'Use PNG or WebP to preserve transparency'
        })
    }

    // Format-specific recommendations
    if (target === 'webp') {
        if (quality > 90) {
            result.recommendations.push({
                type: 'quality_adjustment',
                message: 'WebP quality above 90 has diminishing returns',
                suggestion: 'Use 80-85% for optimal size/quality balance'
            })
        }
    } else if (target === 'jpg' || target === 'jpeg') {
        result.recommendations.push({
            type: 'format_suggestion',
            message: 'Consider WebP for better compression with similar quality',
            suggestion: 'WebP typically provides 25-35% smaller files than JPEG'
        })
    } else if (target === 'ico') {
        result.recommendations.push({
            type: 'format_suggestion',
            message: 'ICO format is best for favicons and Windows icons',
            suggestion: 'Include multiple sizes (16×16, 32×32, 48×48, 64×64) in single .ico file'
        })
    }

    return result
}

/**
 * Validate batch rename pattern
 * @param {string} pattern - Rename pattern
 * @returns {Object} Validation result
 */
export function validateRenamePattern(pattern) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        variables: []
    }

    if (typeof pattern !== 'string' || pattern.trim() === '') {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FORMAT,
            message: 'Pattern cannot be empty',
            severity: 'error'
        })
        return result
    }

    // Check for invalid filename characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(pattern)) {
        result.valid = false
        result.errors.push({
            code: ValidationErrors.INVALID_FORMAT,
            message: 'Pattern contains invalid filename characters',
            severity: 'error',
            details: 'Remove <>:"/\\|?* from pattern'
        })
    }

    // Extract variables
    const variableRegex = /\{(\w+)\}/g
    let match
    const variables = new Set()

    while ((match = variableRegex.exec(pattern)) !== null) {
        variables.add(match[1])
    }

    result.variables = Array.from(variables)

    // Check for unknown variables
    const knownVariables = [
        'name', 'index', 'date', 'time', 'year', 'month', 'day',
        'hour', 'minute', 'second', 'timestamp', 'width', 'height',
        'size', 'format', 'ext', 'orientation', 'aspect', 'total', 'padded'
    ]

    const unknownVars = result.variables.filter(v => !knownVariables.includes(v))
    if (unknownVars.length > 0) {
        result.warnings.push({
            code: ValidationWarnings.CONTENT_LOSS,
            message: `Unknown variables: ${unknownVars.join(', ')}`,
            severity: 'warning',
            suggestion: 'These variables will not be replaced'
        })
    }

    return result
}

/**
 * Validate template dimensions compatibility
 * @param {Object} template - Template with dimensions
 * @param {Object} imageDimensions - Image dimensions
 * @returns {Object} Compatibility result
 */
export function validateTemplateCompatibility(template, imageDimensions) {
    const result = {
        compatible: true,
        errors: [],
        warnings: [],
        matchScore: 0,
        recommendations: []
    }

    // Parse template dimensions
    const templateWidth = parseDimension(template.width)
    const templateHeight = parseDimension(template.height)

    // Parse image dimensions
    const imageWidth = parseDimension(imageDimensions.width)
    const imageHeight = parseDimension(imageDimensions.height)

    // Check for variable dimensions in template
    if (templateWidth.isVariable || templateHeight.isVariable) {
        result.warnings.push({
            code: ValidationWarnings.FLEXIBLE_TEMPLATE,
            message: 'Using flexible template - one dimension will adapt automatically',
            severity: 'info'
        })

        // Calculate match score for flexible template
        let score = 80 // High base score for flexible templates

        // Check aspect ratio compatibility if both image dimensions are fixed
        if (!imageWidth.isVariable && !imageHeight.isVariable) {
            if (templateWidth.isVariable && !templateHeight.isVariable) {
                // Height fixed, check if image has sufficient height
                const heightRatio = imageHeight.value / templateHeight.value
                if (heightRatio >= 0.8) {
                    score += 20
                } else {
                    score *= heightRatio
                    result.warnings.push({
                        code: ValidationWarnings.SMALL_DIMENSIONS,
                        message: `Image height (${imageHeight.value}px) is smaller than template height (${templateHeight.value}px)`,
                        severity: 'warning'
                    })
                }
            } else if (!templateWidth.isVariable && templateHeight.isVariable) {
                // Width fixed, check if image has sufficient width
                const widthRatio = imageWidth.value / templateWidth.value
                if (widthRatio >= 0.8) {
                    score += 20
                } else {
                    score *= widthRatio
                    result.warnings.push({
                        code: ValidationWarnings.SMALL_DIMENSIONS,
                        message: `Image width (${imageWidth.value}px) is smaller than template width (${templateWidth.value}px)`,
                        severity: 'warning'
                    })
                }
            }
        }

        result.matchScore = score / 100
        result.compatible = true
        return result
    }

    // Fixed template dimensions validation
    if (imageWidth.isVariable || imageHeight.isVariable) {
        result.compatible = false
        result.errors.push({
            code: ValidationErrors.INVALID_DIMENSIONS,
            message: 'Cannot use variable image dimensions with fixed template',
            severity: 'error'
        })
        return result
    }

    // Check if image meets minimum template dimensions
    if (imageWidth.value < templateWidth.value || imageHeight.value < templateHeight.value) {
        result.warnings.push({
            code: ValidationWarnings.SMALL_DIMENSIONS,
            message: `Image dimensions (${imageWidth.value}x${imageHeight.value}) are smaller than template (${templateWidth.value}x${templateHeight.value})`,
            severity: 'warning'
        })

        // Calculate how much smaller
        const widthRatio = imageWidth.value / templateWidth.value
        const heightRatio = imageHeight.value / templateHeight.value
        const minRatio = Math.min(widthRatio, heightRatio)

        result.matchScore = minRatio * 0.8 // Scale score based on size adequacy
    } else {
        // Image is equal or larger - good match
        result.matchScore = 0.9

        // Check aspect ratio
        const imageAspect = imageWidth.value / imageHeight.value
        const templateAspect = templateWidth.value / templateHeight.value
        const aspectDiff = Math.abs(imageAspect - templateAspect) / imageAspect

        if (aspectDiff > 0.1) {
            result.warnings.push({
                code: ValidationWarnings.ASPECT_CHANGE,
                message: `Aspect ratio differs (image: ${imageAspect.toFixed(2)}, template: ${templateAspect.toFixed(2)})`,
                severity: 'warning',
                suggestion: 'Consider cropping to match template aspect ratio'
            })
            result.matchScore *= 0.8 // Reduce score for aspect mismatch
        }
    }

    return result
}

/**
 * Get validation summary
 * @param {Object} validationResults - Array of validation results
 * @returns {Object} Summary
 */
export function getValidationSummary(validationResults) {
    const summary = {
        total: validationResults.length,
        valid: 0,
        errors: 0,
        warnings: 0,
        errorDetails: [],
        warningDetails: []
    }

    validationResults.forEach(result => {
        if (result.valid) summary.valid++
        summary.errors += result.errors.length
        summary.warnings += result.warnings.length

        result.errors.forEach(error => {
            summary.errorDetails.push({
                ...error,
                source: result.metadata?.name || 'Unknown'
            })
        })

        result.warnings.forEach(warning => {
            summary.warningDetails.push({
                ...warning,
                source: result.metadata?.name || 'Unknown'
            })
        })
    })

    return summary
}

/**
 * Get all flexible dimension templates
 * @param {Array} templates - Template array
 * @returns {Array} Templates with flexible dimensions
 */
export function getFlexibleTemplates(templates) {
    return templates.filter(template => {
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)
        return widthInfo.isVariable || heightInfo.isVariable
    })
}

export default {
    ValidationErrors,
    ValidationWarnings,
    isVariableDimension,
    parseDimension,
    validateOptimizationOptions,
    validateImage,
    validateDimensions,
    validateResize,
    validateCrop,
    validateOptimization,
    validateRenamePattern,
    validateTemplateCompatibility,
    getValidationSummary,
    getFlexibleTemplates
}