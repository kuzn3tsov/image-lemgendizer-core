/**
 * LemGendaryResize™ - Intelligent resize processor with enhanced validation
 * @class
 * @description Resizes each image based on its longest dimension.
 * Portrait images: height gets set to target dimension.
 * Landscape images: width gets set to target dimension.
 * Square images: both dimensions set to target dimension.
 * Always maintains aspect ratio by default.
 */
export class LemGendaryResize {
    /**
     * Create a LemGendaryResize processor
     * @param {Object} options - Resize options
     * @param {number} options.dimension - Target dimension for longest side of each image
     * @param {boolean} options.upscale - Allow upscaling (default: false)
     * @param {string} options.algorithm - Resize algorithm ('lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell')
     * @param {boolean} options.forceSquare - Force square output (for favicons/icons)
     * @param {boolean} options.preserveAspectRatio - Maintain aspect ratio (default: true)
     * @param {number} options.maxDimension - Maximum dimension limit
     * @param {boolean} options.skipSvg - Skip SVG files (default: true, as they're vector)
     * @param {string} options.mode - Resize mode: 'longest', 'width', 'height', 'auto'
     */
    constructor(options = {}) {
        this.dimension = options.dimension || 1080
        this.upscale = options.upscale || false
        this.algorithm = options.algorithm || 'lanczos3'
        this.forceSquare = options.forceSquare || false
        this.preserveAspectRatio = options.preserveAspectRatio !== false
        this.maxDimension = options.maxDimension || 10000
        this.skipSvg = options.skipSvg !== false // Skip SVG by default
        this.mode = options.mode || 'longest' // 'longest', 'width', 'height', 'auto'
        this.name = 'LemGendaryResize'
        this.version = '2.0.0' // Updated version for enhanced validation
    }

    /**
     * Validate processor options using enhanced validation system
     * @private
     */
    _validateOptions = () => {
        const errors = []
        const warnings = []

        // Validate dimension
        if (typeof this.dimension !== 'number' || this.dimension <= 0) {
            errors.push({
                code: 'INVALID_DIMENSION',
                message: 'Dimension must be a positive number',
                severity: 'error'
            })
        }

        if (this.dimension > this.maxDimension) {
            errors.push({
                code: 'DIMENSION_EXCEEDS_MAX',
                message: `Dimension exceeds maximum allowed value of ${this.maxDimension}`,
                severity: 'error',
                suggestion: `Reduce dimension to ${this.maxDimension} or less`
            })
        }

        if (this.dimension < 10) {
            warnings.push({
                code: 'VERY_SMALL_DIMENSION',
                message: `Very small target dimension (${this.dimension}px)`,
                severity: 'warning',
                suggestion: 'Consider at least 100px for usable images'
            })
        }

        if (this.dimension > 4000) {
            warnings.push({
                code: 'VERY_LARGE_DIMENSION',
                message: `Very large target dimension (${this.dimension}px)`,
                severity: 'warning',
                suggestion: 'Consider 1920px or less for web images'
            })
        }

        // Validate algorithm
        const validAlgorithms = ['lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell']
        if (!validAlgorithms.includes(this.algorithm)) {
            errors.push({
                code: 'INVALID_ALGORITHM',
                message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`,
                severity: 'error'
            })
        }

        // Validate mode
        const validModes = ['longest', 'width', 'height', 'auto']
        if (!validModes.includes(this.mode)) {
            errors.push({
                code: 'INVALID_MODE',
                message: `Mode must be one of: ${validModes.join(', ')}`,
                severity: 'error'
            })
        }

        // Round dimension if not integer
        if (!Number.isInteger(this.dimension)) {
            warnings.push({
                code: 'NON_INTEGER_DIMENSION',
                message: 'Dimension should be an integer for best results',
                severity: 'info'
            })
            this.dimension = Math.round(this.dimension)
        }

        // Check for potential issues
        if (this.forceSquare && !this.preserveAspectRatio) {
            warnings.push({
                code: 'FORCE_SQUARE_NO_ASPECT',
                message: 'Force square without preserving aspect ratio may cause issues',
                severity: 'warning',
                suggestion: 'Consider enabling preserveAspectRatio for forceSquare'
            })
        }

        // Throw errors if any
        if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join(', ')
            throw new Error(`Invalid resize options: ${errorMessages}`)
        }

        // Log warnings
        if (warnings.length > 0) {
            console.warn('Resize warnings:', warnings.map(w => w.message))
        }

        return { errors, warnings }
    }

    /**
     * Validate if image can be processed
     * @private
     */
    _validateImage = (lemGendImage) => {
        const errors = []
        const warnings = []

        if (!lemGendImage) {
            errors.push('No image provided')
            return { canProcess: false, errors, warnings }
        }

        if (!lemGendImage.width || !lemGendImage.height) {
            errors.push('Image missing dimensions')
            return { canProcess: false, errors, warnings }
        }

        // Check for SVG
        if (lemGendImage.type === 'image/svg+xml') {
            if (this.skipSvg) {
                warnings.push({
                    code: 'SVG_SKIPPED',
                    message: 'SVG files are vector-based and will not be raster-resized',
                    severity: 'info',
                    suggestion: 'Consider converting to raster format first or disable skipSvg'
                })
                return { canProcess: false, errors, warnings }
            } else {
                warnings.push({
                    code: 'SVG_RASTERIZED',
                    message: 'SVG will be rasterized before resizing (quality loss possible)',
                    severity: 'warning'
                })
            }
        }

        // Check for ICO/favicon
        if (lemGendImage.type.includes('icon')) {
            warnings.push({
                code: 'FAVICON_RESIZE',
                message: 'ICO files contain multiple images; resizing may affect all frames',
                severity: 'info'
            })
        }

        // Check for extreme aspect ratios
        const aspectRatio = lemGendImage.width / lemGendImage.height
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            warnings.push({
                code: 'EXTREME_ASPECT_RATIO',
                message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
                severity: 'warning',
                suggestion: 'Consider cropping before resizing'
            })
        }

        // Check for very small images
        if (lemGendImage.width < 50 || lemGendImage.height < 50) {
            warnings.push({
                code: 'VERY_SMALL_SOURCE',
                message: `Very small source image: ${lemGendImage.width}x${lemGendImage.height}`,
                severity: 'warning',
                suggestion: 'Consider using larger source image'
            })
        }

        // Check for very large images
        const megapixels = (lemGendImage.width * lemGendImage.height) / 1000000
        if (megapixels > 16) {
            warnings.push({
                code: 'VERY_LARGE_SOURCE',
                message: `Very large source image: ${megapixels.toFixed(1)}MP`,
                severity: 'info',
                suggestion: 'Resizing may take longer to process'
            })
        }

        return {
            canProcess: true,
            errors,
            warnings,
            imageType: lemGendImage.type,
            dimensions: { width: lemGendImage.width, height: lemGendImage.height }
        }
    }

    /**
     * Process an image with resize operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @returns {Promise<Object>} Processing result with new dimensions
     */
    process = async (lemGendImage) => {
        // Validate options
        const optionsValidation = this._validateOptions()

        // Validate image
        const imageValidation = this._validateImage(lemGendImage)

        if (!imageValidation.canProcess) {
            throw new Error(`Cannot process image: ${imageValidation.errors.join(', ')}`)
        }

        const originalWidth = lemGendImage.width
        const originalHeight = lemGendImage.height
        const originalOrientation = lemGendImage.orientation
        const originalAspect = originalWidth / originalHeight

        // Calculate new dimensions based on image's longest side
        const newDimensions = this._calculateDimensionsForImage(
            originalWidth,
            originalHeight,
            originalOrientation
        )

        // Validate against upscaling policy
        const upscaleValidation = this._validateUpscaling(originalWidth, originalHeight, newDimensions)
        if (!upscaleValidation.valid) {
            throw new Error(upscaleValidation.message)
        }

        // Validate output dimensions
        const dimensionValidation = this._validateOutputDimensions(newDimensions)

        // Create result object
        const result = {
            success: true,
            operation: this.name,
            originalDimensions: {
                width: originalWidth,
                height: originalHeight,
                orientation: originalOrientation,
                aspectRatio: originalAspect
            },
            newDimensions: {
                width: newDimensions.width,
                height: newDimensions.height,
                orientation: newDimensions.width >= newDimensions.height ? 'landscape' : 'portrait',
                aspectRatio: newDimensions.width / newDimensions.height
            },
            settings: {
                targetLongestDimension: this.dimension,
                algorithm: this.algorithm,
                upscale: this.upscale,
                forceSquare: this.forceSquare,
                preserveAspectRatio: this.preserveAspectRatio,
                mode: this.mode,
                skipSvg: this.skipSvg
            },
            warnings: [...optionsValidation.warnings, ...imageValidation.warnings, ...dimensionValidation.warnings],
            recommendations: [],
            metadata: {
                scaleFactor: newDimensions.width / originalWidth,
                aspectRatioPreserved: this.preserveAspectRatio,
                aspectRatioChange: Math.abs((newDimensions.width / newDimensions.height) - originalAspect),
                processedAt: new Date().toISOString(),
                isSquare: newDimensions.width === newDimensions.height,
                longestDimensionApplied: newDimensions.width >= newDimensions.height ? 'width' : 'height',
                appliedTo: this._getAppliedDimension(originalWidth, originalHeight),
                targetValue: this.dimension,
                validation: {
                    optionsValid: optionsValidation.errors.length === 0,
                    imageValid: imageValidation.canProcess,
                    upscaleValid: upscaleValidation.valid,
                    outputDimensionsValid: dimensionValidation.valid
                }
            }
        }

        // Add warnings and recommendations if needed
        this._addWarningsAndRecommendations(lemGendImage, originalWidth, originalHeight, newDimensions, result)

        return result
    }

    /**
     * Calculate new dimensions for THIS specific image
     * @private
     */
    _calculateDimensionsForImage = (originalWidth, originalHeight, originalOrientation) => {
        let newWidth, newHeight

        // Handle different resize modes
        switch (this.mode) {
            case 'width':
                newWidth = this.dimension
                newHeight = this.preserveAspectRatio
                    ? Math.round((originalHeight / originalWidth) * this.dimension)
                    : this.dimension
                break

            case 'height':
                newHeight = this.dimension
                newWidth = this.preserveAspectRatio
                    ? Math.round((originalWidth / originalHeight) * this.dimension)
                    : this.dimension
                break

            case 'auto':
                // Auto mode: portrait uses height, landscape uses width
                if (originalWidth >= originalHeight) {
                    newWidth = this.dimension
                    newHeight = this.preserveAspectRatio
                        ? Math.round((originalHeight / originalWidth) * this.dimension)
                        : this.dimension
                } else {
                    newHeight = this.dimension
                    newWidth = this.preserveAspectRatio
                        ? Math.round((originalWidth / originalHeight) * this.dimension)
                        : this.dimension
                }
                break

            case 'longest':
            default:
                // Original logic: longest dimension gets target
                if (this.forceSquare) {
                    // Force square output
                    newWidth = this.dimension
                    newHeight = this.dimension
                } else if (originalWidth >= originalHeight) {
                    // Landscape or square image: width is longer or equal
                    newWidth = this.dimension
                    newHeight = this.preserveAspectRatio
                        ? Math.round((originalHeight / originalWidth) * this.dimension)
                        : this.dimension
                } else {
                    // Portrait image: height is longer
                    newHeight = this.dimension
                    newWidth = this.preserveAspectRatio
                        ? Math.round((originalWidth / originalHeight) * this.dimension)
                        : this.dimension
                }
        }

        // Ensure minimum dimensions
        newWidth = Math.max(1, newWidth)
        newHeight = Math.max(1, newHeight)

        // Apply max dimension limit
        if (newWidth > this.maxDimension || newHeight > this.maxDimension) {
            const scale = Math.min(this.maxDimension / newWidth, this.maxDimension / newHeight)
            newWidth = Math.round(newWidth * scale)
            newHeight = Math.round(newHeight * scale)
        }

        return { width: newWidth, height: newHeight }
    }

    /**
     * Get which dimension the target was applied to
     * @private
     */
    _getAppliedDimension = (originalWidth, originalHeight) => {
        if (this.forceSquare) {
            return 'both (forced square)'
        }

        switch (this.mode) {
            case 'width':
                return 'width'
            case 'height':
                return 'height'
            case 'auto':
                return originalWidth >= originalHeight ? 'width (auto)' : 'height (auto)'
            case 'longest':
            default:
                return originalWidth >= originalHeight ? 'width (longest)' : 'height (longest)'
        }
    }

    /**
     * Validate upscaling policy
     * @private
     */
    _validateUpscaling = (originalWidth, originalHeight, newDimensions) => {
        const scaleUpWidth = newDimensions.width > originalWidth
        const scaleUpHeight = newDimensions.height > originalHeight

        if ((scaleUpWidth || scaleUpHeight) && !this.upscale) {
            return {
                valid: false,
                message: `Upscaling detected (${originalWidth}x${originalHeight} → ${newDimensions.width}x${newDimensions.height}). Set upscale: true to allow upscaling.`
            }
        }

        return { valid: true }
    }

    /**
     * Validate output dimensions
     * @private
     */
    _validateOutputDimensions = (dimensions) => {
        const warnings = []
        let valid = true

        const { width, height } = dimensions

        // Check minimum dimensions
        if (width < 10 || height < 10) {
            warnings.push({
                code: 'OUTPUT_TOO_SMALL',
                message: `Output dimensions very small: ${width}x${height}`,
                severity: 'warning',
                suggestion: 'Consider larger target dimension'
            })
        }

        // Check for extreme aspect ratios in output
        const aspectRatio = width / height
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            warnings.push({
                code: 'EXTREME_OUTPUT_ASPECT',
                message: `Extreme output aspect ratio: ${aspectRatio.toFixed(2)}`,
                severity: 'warning',
                suggestion: 'Consider cropping or different resize mode'
            })
        }

        // Check if dimensions are too large
        if (width * height > 100000000) { // > 100 megapixels
            warnings.push({
                code: 'OUTPUT_TOO_LARGE',
                message: `Output image very large: ${Math.round(width * height / 1000000)}MP`,
                severity: 'warning',
                suggestion: 'Consider smaller target dimension'
            })
        }

        return { valid, warnings }
    }

    /**
     * Add warnings and recommendations to result
     * @private
     */
    _addWarningsAndRecommendations = (lemGendImage, originalWidth, originalHeight, newDimensions, result) => {
        const scaleFactor = newDimensions.width / originalWidth
        const newAspect = newDimensions.width / newDimensions.height
        const originalAspect = originalWidth / originalHeight
        const aspectDiff = Math.abs(originalAspect - newAspect) / originalAspect

        // Extreme scaling warnings
        if (scaleFactor < 0.1) {
            result.warnings.push({
                type: 'EXTREME_DOWNSCALE',
                message: `Downscaling by ${((1 - scaleFactor) * 100).toFixed(1)}% may cause severe pixelation`,
                severity: 'warning',
                suggestion: this.algorithm === 'nearest'
                    ? 'Nearest-neighbor algorithm selected for pixel art'
                    : 'Consider using nearest-neighbor algorithm for pixel art'
            })
        }

        if (scaleFactor > 4) {
            result.warnings.push({
                type: 'EXTREME_UPSCALE',
                message: `Upscaling by ${((scaleFactor - 1) * 100).toFixed(1)}% may reduce quality`,
                severity: 'warning',
                suggestion: 'Consider using AI upscaling tools for better results'
            })
        }

        // Aspect ratio warnings
        if (aspectDiff > 0.01 && this.preserveAspectRatio) {
            result.warnings.push({
                type: 'ASPECT_DEVIATION',
                message: `Aspect ratio changed from ${originalAspect.toFixed(3)} to ${newAspect.toFixed(3)}`,
                severity: 'info',
                suggestion: 'Check if this deviation is acceptable for your use case'
            })
        }

        if (!this.preserveAspectRatio && !this.forceSquare) {
            result.warnings.push({
                type: 'ASPECT_RATIO_NOT_PRESERVED',
                message: 'Aspect ratio is not being preserved',
                severity: 'info',
                suggestion: 'Content may appear stretched or compressed'
            })
        }

        if (this.forceSquare && originalAspect !== 1) {
            result.warnings.push({
                type: 'FORCED_SQUARE',
                message: 'Image will be forced to square, cropping may occur',
                severity: 'warning',
                suggestion: originalAspect > 1
                    ? 'Consider cropping horizontally before resizing'
                    : 'Consider cropping vertically before resizing'
            })
        }

        // Format-specific recommendations
        if (lemGendImage.type === 'image/jpeg' || lemGendImage.type === 'image/jpg') {
            result.recommendations.push({
                type: 'FORMAT_SUGGESTION',
                message: 'JPEG format selected',
                suggestion: 'Consider WebP for better compression after resizing'
            })
        }

        if (lemGendImage.transparency && (lemGendImage.type === 'image/png' || lemGendImage.type === 'image/webp')) {
            result.warnings.push({
                type: 'TRANSPARENCY_WARNING',
                message: 'Image has transparency',
                severity: 'info',
                suggestion: 'Transparency will be preserved during resize'
            })
        }

        // Add info about what was resized
        result.metadata.resizeInfo = `Target dimension ${this.dimension}px applied using ${this.mode} mode`
        result.metadata.scaleDirection = scaleFactor > 1 ? 'upscale' : 'downscale'
        result.metadata.scalePercentage = `${(Math.abs(scaleFactor - 1) * 100).toFixed(1)}%`
    }

    /**
     * Process multiple images in batch
     * @param {Array<LemGendImage>} images - Images to process
     * @returns {Promise<Array<Object>>} Array of processing results
     */
    processBatch = async (images) => {
        this._validateOptions()

        if (!Array.isArray(images)) {
            throw new Error('Images must be provided as an array')
        }

        const results = []
        const batchWarnings = []

        // Check batch size
        if (images.length > 50) {
            batchWarnings.push({
                code: 'LARGE_BATCH',
                message: `Large batch size: ${images.length} images`,
                severity: 'info',
                suggestion: 'Consider processing in smaller batches for better performance'
            })
        }

        for (const image of images) {
            try {
                const result = await this.process(image)
                results.push(result)
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    imageName: image?.originalName || 'Unknown',
                    imageType: image?.type || 'Unknown',
                    operation: this.name,
                    warnings: batchWarnings
                })
            }
        }

        // Add batch summary
        if (results.length > 0) {
            const successful = results.filter(r => r.success).length
            const failed = results.filter(r => !r.success).length

            results.batchSummary = {
                total: results.length,
                successful,
                failed,
                successRate: ((successful / results.length) * 100).toFixed(1) + '%',
                warnings: batchWarnings
            }
        }

        return results
    }

    /**
     * Get processor description
     * @returns {string} Description
     */
    static getDescription() {
        return 'LemGendaryResize™: Intelligent image resizing with enhanced validation and multiple resize modes.'
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    static getInfo() {
        return {
            name: 'LemGendaryResize',
            version: '2.0.0',
            description: this.getDescription(),
            operation: 'Resizes images with multiple mode options and enhanced validation',
            algorithms: ['lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell'],
            modes: ['longest', 'width', 'height', 'auto'],
            defaultDimension: 1080,
            minDimension: 1,
            maxDimension: 10000,
            supportsSvg: true,
            supportsFavicon: true,
            features: [
                'Enhanced validation',
                'Multiple resize modes',
                'Batch processing',
                'Upscale control',
                'Aspect ratio preservation',
                'Square output option'
            ]
        }
    }

    /**
     * Create processor from configuration object
     * @param {Object} config - Processor configuration
     * @returns {LemGendaryResize} New processor instance
     */
    static fromConfig(config) {
        return new LemGendaryResize(config)
    }

    /**
     * Preview resize for an image without processing
     * @param {number} originalWidth - Original width
     * @param {number} originalHeight - Original height
     * @param {number} targetDimension - Target dimension for longest side
     * @param {boolean} forceSquare - Force square output
     * @param {string} mode - Resize mode
     * @returns {Object} Preview dimensions with validation
     */
    static previewResize(originalWidth, originalHeight, targetDimension = 1080, forceSquare = false, mode = 'longest') {
        const processor = new LemGendaryResize({
            dimension: targetDimension,
            forceSquare,
            mode
        })

        const newDimensions = processor._calculateDimensionsForImage(
            originalWidth,
            originalHeight,
            originalWidth >= originalHeight ? 'landscape' : 'portrait'
        )

        const warnings = []
        const recommendations = []

        // Add preview warnings
        const scaleFactor = newDimensions.width / originalWidth
        if (scaleFactor < 0.1) {
            warnings.push('Extreme downscaling may cause pixelation')
        }
        if (scaleFactor > 4) {
            warnings.push('Extreme upscaling may reduce quality')
        }

        // Add format recommendations
        if (forceSquare && (originalWidth / originalHeight) !== 1) {
            recommendations.push('Consider cropping before forcing square')
        }

        return {
            original: `${originalWidth}x${originalHeight}`,
            new: `${newDimensions.width}x${newDimensions.height}`,
            appliedTo: processor._getAppliedDimension(originalWidth, originalHeight),
            aspectRatio: {
                original: (originalWidth / originalHeight).toFixed(2),
                new: (newDimensions.width / newDimensions.height).toFixed(2)
            },
            scaleFactor: scaleFactor.toFixed(2),
            warnings,
            recommendations
        }
    }

    /**
     * Validate if processor can handle given image
     * @param {LemGendImage} image - Image to check
     * @returns {Object} Validation result
     */
    static canProcess(image) {
        const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/bmp',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon',
            'image/avif'
        ]

        const canProcess = validTypes.includes(image.type)
        const reason = canProcess
            ? 'Image type supported'
            : `Unsupported image type: ${image.type}`

        const warnings = []
        if (image.type === 'image/svg+xml') {
            warnings.push('SVG files are vector-based and may be rasterized')
        }
        if (image.type.includes('icon')) {
            warnings.push('ICO files contain multiple images')
        }

        return {
            canProcess,
            reason,
            warnings,
            supportedTypes: validTypes,
            enhancedValidation: true
        }
    }
}