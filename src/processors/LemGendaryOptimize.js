/**
 * LemGendaryOptimize™ - Advanced image optimization processor
 * @class
 * @description Optimizes images with intelligent format selection, adaptive compression, and pre-ZIP optimization
 */
export class LemGendaryOptimize {
    /**
     * Create a LemGendaryOptimize processor
     * @param {Object} options - Optimization options
     * @param {number} options.quality - Quality percentage (1-100)
     * @param {string} options.format - Output format: 'auto', 'webp', 'jpg', 'png', 'avif', 'ico', 'svg', 'original'
     * @param {boolean} options.lossless - Use lossless compression (for PNG/WebP)
     * @param {boolean} options.stripMetadata - Remove metadata (EXIF, etc.)
     * @param {boolean} options.preserveTransparency - Preserve transparency when possible
     * @param {Array<number>} options.icoSizes - Specific sizes for ICO format
     * @param {number} options.maxDisplayWidth - Maximum display width for optimization (optional)
     * @param {Array} options.browserSupport - Browser support requirements ['modern', 'legacy']
     * @param {string} options.compressionMode - 'adaptive', 'aggressive', 'balanced'
     * @param {boolean} options.analyzeContent - Enable content analysis for smart optimization
     */
    constructor(options = {}) {
        // Core optimization options
        this.quality = Math.max(1, Math.min(100, options.quality || 85))
        this.format = options.format || 'auto'
        this.lossless = options.lossless || false
        this.stripMetadata = options.stripMetadata !== false
        this.preserveTransparency = options.preserveTransparency !== false
        this.icoSizes = options.icoSizes || [16, 32, 48, 64, 128, 256]

        // Advanced optimization options
        this.maxDisplayWidth = options.maxDisplayWidth || null
        this.browserSupport = options.browserSupport || ['modern', 'legacy']
        this.compressionMode = options.compressionMode || 'adaptive'
        this.analyzeContent = options.analyzeContent !== false

        this.name = 'LemGendaryOptimize'
        this.version = '2.0.0' // Updated version

        // Format priorities for intelligent selection
        this.formatPriorities = this._getFormatPriorities()
    }

    /**
     * Get format priorities based on browser support
     * @private
     */
    _getFormatPriorities() {
        const formats = {
            'avif': {
                quality: 0.9,
                browserSupport: this.browserSupport.includes('modern') ? 0.9 : 0.7,
                compression: 0.8,
                supportsTransparency: true,
                maxQuality: 63 // AVIF has different quality scale
            },
            'webp': {
                quality: 0.8,
                browserSupport: this.browserSupport.includes('legacy') ? 0.9 : 0.98,
                compression: 0.7,
                supportsTransparency: true,
                maxQuality: 100
            },
            'jpg': {
                quality: 0.7,
                browserSupport: 1.0,
                compression: 0.6,
                supportsTransparency: false,
                maxQuality: 100
            },
            'png': {
                quality: 0.9,
                browserSupport: 1.0,
                compression: 0.5,
                supportsTransparency: true,
                maxQuality: 100
            },
            'ico': {
                quality: 1.0,
                browserSupport: 1.0,
                compression: 0.5,
                supportsTransparency: true,
                maxQuality: 100
            }
        }

        return formats
    }

    /**
    * Validate processor options using enhanced validation
    * @private
    */
    _validateOptions = () => {
        // Import validation function dynamically
        let validation
        try {
            // Try to import from validation.js
            validation = require('./validation.js').validateOptimizationOptions
        } catch {
            // Fallback to basic validation
            validation = this._basicValidateOptimizationOptions
        }

        const validationResult = validation({
            format: this.format,
            quality: this.quality,
            maxDisplayWidth: this.maxDisplayWidth,
            browserSupport: this.browserSupport,
            compressionMode: this.compressionMode,
            stripMetadata: this.stripMetadata,
            preserveTransparency: this.preserveTransparency,
            lossless: this.lossless,
            icoSizes: this.icoSizes
        })

        if (!validationResult.valid) {
            const errorMessages = validationResult.errors.map(e => e.message).join(', ')
            throw new Error(`Invalid optimization options: ${errorMessages}`)
        }

        // Show warnings if any
        if (validationResult.warnings.length > 0) {
            console.warn('Optimization warnings:', validationResult.warnings.map(w => w.message))
        }

        // Adjust quality for specific formats
        if (this.format === 'avif') {
            this.quality = Math.min(63, Math.round(this.quality * 0.63))
        }

        if (this.format === 'png' && this.preserveTransparency) {
            this.lossless = true
        }

        if (this.format === 'ico') {
            this.icoSizes.sort((a, b) => a - b)
        }
    }

    /**
     * Basic validation fallback
     * @private
     */
    _basicValidateOptimizationOptions = (options) => {
        const errors = []
        const warnings = []

        // Basic validation
        if (options.quality < 1 || options.quality > 100) {
            errors.push({
                code: 'INVALID_QUALITY',
                message: `Quality must be between 1-100, got ${options.quality}`,
                severity: 'error'
            })
        }

        const validFormats = ['auto', 'webp', 'jpg', 'jpeg', 'png', 'avif', 'ico', 'svg', 'original']
        if (!validFormats.includes(options.format)) {
            errors.push({
                code: 'INVALID_FORMAT',
                message: `Invalid format: ${options.format}`,
                severity: 'error'
            })
        }

        return { valid: errors.length === 0, errors, warnings }
    }

    /**
     * Analyze image metadata and content for intelligent optimization
     * @private
     */
    async _analyzeImage(lemGendImage) {
        const analysis = {
            metadata: {
                width: lemGendImage.width,
                height: lemGendImage.height,
                aspectRatio: lemGendImage.aspectRatio,
                orientation: lemGendImage.orientation,
                hasTransparency: lemGendImage.transparency,
                fileSize: lemGendImage.originalSize,
                format: lemGendImage.extension,
                mimeType: lemGendImage.type,
                isFavicon: lemGendImage.type.includes('icon') || lemGendImage.extension === 'ico'
            },
            content: {
                isPhotographic: this._guessIsPhotographic(lemGendImage),
                hasText: false,
                isGraphic: this._guessIsGraphic(lemGendImage),
                complexity: 'medium'
            },
            recommendations: [],
            warnings: []
        }

        // Content-specific analysis
        if (lemGendImage.type === 'image/svg+xml') {
            analysis.content.isGraphic = true
            analysis.content.complexity = 'low'
            analysis.recommendations.push('SVG format detected - vector graphics optimized differently')
        }

        if (lemGendImage.transparency) {
            analysis.content.isGraphic = true
            analysis.recommendations.push('Transparency detected - PNG or WebP recommended')
        }

        // Size-based analysis
        if (lemGendImage.width > 2000 || lemGendImage.height > 2000) {
            analysis.recommendations.push('Large dimensions - consider resizing for web use')
        }

        if (lemGendImage.originalSize > 1024 * 1024) {
            analysis.recommendations.push('Large file size - significant compression possible')
        }

        // Compatibility warnings
        if (this.format === 'jpg' && lemGendImage.transparency) {
            analysis.warnings.push({
                type: 'transparency_loss',
                message: 'JPEG format will remove transparency',
                severity: 'warning'
            })
        }

        return analysis
    }

    /**
     * Guess if image is photographic
     * @private
     */
    _guessIsPhotographic(lemGendImage) {
        // Simple heuristic based on aspect ratio and size
        const { width, height } = lemGendImage
        const aspectRatio = width / height

        // Common photographic aspect ratios
        const photoAspectRatios = [3 / 2, 4 / 3, 16 / 9, 1, 5 / 4]

        const isCloseToPhotoRatio = photoAspectRatios.some(ratio =>
            Math.abs(aspectRatio - ratio) < 0.1
        )

        return isCloseToPhotoRatio && (width * height) > 500000
    }

    /**
     * Guess if image is graphic/illustration
     * @private
     */
    _guessIsGraphic(lemGendImage) {
        return lemGendImage.type === 'image/svg+xml' ||
            lemGendImage.transparency ||
            (lemGendImage.width <= 1000 && lemGendImage.height <= 1000)
    }

    /**
     * Intelligent format selection when 'auto' is specified
     * @private
     */
    _selectBestFormat(analysis) {
        if (this.format !== 'auto') {
            return this.format
        }

        const scores = {}
        const { hasTransparency, isFavicon } = analysis.metadata
        const { isGraphic } = analysis.content
        const { width, height } = analysis.metadata

        // Don't auto-select ICO for non-favicon images
        const availableFormats = isFavicon ?
            ['ico', 'png', 'webp'] :
            ['webp', 'avif', 'jpg', 'png']

        for (const format of availableFormats) {
            const data = this.formatPriorities[format]
            if (!data) continue

            let score = data.browserSupport * 0.4 + data.compression * 0.3 + data.quality * 0.3

            // Adjust based on image characteristics
            if (hasTransparency && !data.supportsTransparency) {
                score *= 0.3
            }

            if (isGraphic && format === 'png') {
                score *= 1.3
            }

            if (width * height > 2000000 && format === 'avif') {
                score *= 1.2
            }

            if (isFavicon && format === 'ico') {
                score *= 2.0 // Strong preference for ICO for favicons
            }

            scores[format] = score
        }

        // Return best scoring format, default to webp if none found
        const bestFormat = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b)
        return bestFormat || 'webp'
    }

    /**
     * Calculate adaptive compression settings
     * @private
     */
    _calculateCompression(analysis, selectedFormat) {
        let quality = this.quality
        let compressionLevel = 'balanced'
        let lossless = this.lossless

        const { hasTransparency } = analysis.metadata
        const { isGraphic, isPhotographic } = analysis.content

        // Adjust for format-specific quality scales
        const formatData = this.formatPriorities[selectedFormat]
        if (formatData && formatData.maxQuality) {
            quality = Math.min(quality, formatData.maxQuality)
        }

        // Content-based adjustments
        if (isGraphic && selectedFormat === 'png') {
            lossless = true
            quality = 100
        } else if (isPhotographic && selectedFormat === 'jpg') {
            quality = Math.max(75, quality)
        }

        // Compression mode adjustments
        switch (this.compressionMode) {
            case 'aggressive':
                quality = Math.max(60, quality * 0.8)
                compressionLevel = 'high'
                break
            case 'balanced':
                compressionLevel = 'medium'
                break
            case 'adaptive':
                const megapixels = (analysis.metadata.width * analysis.metadata.height) / 1000000
                if (megapixels > 2) {
                    quality = Math.max(70, quality * 0.9)
                    compressionLevel = 'high'
                }
                break
        }

        // Ensure transparency compatibility
        if (hasTransparency && selectedFormat === 'jpg') {
            quality = Math.max(85, quality) // Higher quality to minimize artifacts
        }

        return {
            quality: Math.round(quality),
            compressionLevel,
            lossless: selectedFormat === 'png' && lossless,
            progressive: selectedFormat === 'jpg' || selectedFormat === 'webp',
            preserveTransparency: hasTransparency && this.preserveTransparency
        }
    }

    /**
     * Calculate resizing if maxDisplayWidth is set
     * @private
     */
    _calculateResizeDimensions(analysis) {
        if (!this.maxDisplayWidth) {
            return null
        }

        const { width, height } = analysis.metadata

        if (width <= this.maxDisplayWidth && height <= this.maxDisplayWidth) {
            return null
        }

        let newWidth, newHeight

        if (width >= height) {
            // Landscape or square
            newWidth = Math.min(width, this.maxDisplayWidth)
            newHeight = Math.round((height / width) * newWidth)
        } else {
            // Portrait
            newHeight = Math.min(height, this.maxDisplayWidth)
            newWidth = Math.round((width / height) * newHeight)
        }

        // Ensure minimum dimensions
        const minDimension = 100
        if (newWidth < minDimension) newWidth = minDimension
        if (newHeight < minDimension) newHeight = minDimension

        return {
            width: newWidth,
            height: newHeight,
            originalWidth: width,
            originalHeight: height,
            resizeRatio: newWidth / width,
            resizeNeeded: true
        }
    }

    /**
     * Check format compatibility
     * @private
     */
    _checkCompatibility = (image, selectedFormat) => {
        const supportedFormats = {
            'jpg': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon'],
            'jpeg': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon'],
            'png': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon'],
            'webp': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon'],
            'avif': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/x-icon'],
            'ico': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/x-icon'],
            'svg': ['image/svg+xml', 'image/png', 'image/webp'],
            'original': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon']
        }

        const canConvert = supportedFormats[selectedFormat]?.includes(image.type) || false

        return {
            compatible: canConvert,
            reason: canConvert ? 'Format supported' : `Cannot convert ${image.type} to ${selectedFormat}`,
            requiresRasterization: (image.type === 'image/svg+xml' && selectedFormat !== 'original' && selectedFormat !== 'svg'),
            requiresFaviconProcessing: selectedFormat === 'ico'
        }
    }

    /**
     * Estimate file size savings
     * @private
     */
    _estimateSavings(analysis, selectedFormat, compression, resizeInfo) {
        const originalSize = analysis.metadata.fileSize
        let estimatedSize = originalSize

        // Apply format compression
        const formatData = this.formatPriorities[selectedFormat]
        if (formatData) {
            estimatedSize *= formatData.compression
        }

        // Apply quality adjustment
        estimatedSize *= (compression.quality / 100)

        // Apply resize reduction if applicable
        if (resizeInfo && resizeInfo.resizeNeeded) {
            const areaReduction = (resizeInfo.width * resizeInfo.height) /
                (analysis.metadata.width * analysis.metadata.height)
            estimatedSize *= areaReduction
        }

        // Apply compression mode adjustment
        if (compression.compressionLevel === 'high') {
            estimatedSize *= 0.9
        } else if (compression.compressionLevel === 'medium') {
            estimatedSize *= 0.95
        }

        // Apply transparency factor
        if (analysis.metadata.hasTransparency && selectedFormat !== 'jpg') {
            estimatedSize *= 1.1
        }

        const savings = {
            originalSize,
            estimatedSize: Math.round(estimatedSize),
            savings: originalSize - Math.round(estimatedSize),
            savingsPercent: Math.round(((originalSize - estimatedSize) / originalSize) * 1000) / 10,
            compressionRatio: (originalSize / estimatedSize).toFixed(2)
        }

        return savings
    }

    /**
     * Process an image with optimization
     * @param {LemGendImage} lemGendImage - Image to process
     * @returns {Promise<Object>} Optimization result
     */
    process = async (lemGendImage) => {
        this._validateOptions()

        if (!lemGendImage) {
            throw new Error('Invalid image')
        }

        // Step 1: Analyze image
        const analysis = await this._analyzeImage(lemGendImage)

        // Step 2: Select format
        const selectedFormat = this._selectBestFormat(analysis)

        // Step 3: Check compatibility
        const compatibility = this._checkCompatibility(lemGendImage, selectedFormat)
        if (!compatibility.compatible) {
            throw new Error(`Format not compatible: ${compatibility.reason}`)
        }

        // Step 4: Calculate resize
        const resizeInfo = this._calculateResizeDimensions(analysis)

        // Step 5: Calculate compression
        const compression = this._calculateCompression(analysis, selectedFormat)

        // Step 6: Estimate savings
        const savings = this._estimateSavings(analysis, selectedFormat, compression, resizeInfo)

        const result = {
            success: true,
            operation: this.name,
            originalInfo: {
                ...analysis.metadata,
                name: lemGendImage.originalName
            },
            optimization: {
                selectedFormat: selectedFormat === 'original' ? lemGendImage.extension : selectedFormat,
                compression,
                resizeInfo,
                browserSupport: this.browserSupport,
                compressionMode: this.compressionMode,
                compatibility,
                recommendedForWeb: this._isRecommendedForWeb(analysis, selectedFormat)
            },
            analysis,
            savings,
            recommendations: analysis.recommendations,
            warnings: analysis.warnings,
            metadata: {
                processedAt: new Date().toISOString(),
                processorVersion: this.version,
                optimizationLevel: this._getOptimizationLevel(compression, savings)
            }
        }

        return result
    }

    /**
     * Determine if format is recommended for web
     * @private
     */
    _isRecommendedForWeb(analysis, format) {
        const webRecommended = ['webp', 'avif', 'jpg', 'png']
        return webRecommended.includes(format) &&
            analysis.metadata.fileSize < 5000000 // Less than 5MB
    }

    /**
     * Get optimization level
     * @private
     */
    _getOptimizationLevel(compression, savings) {
        if (savings.savingsPercent > 70) return 'high'
        if (savings.savingsPercent > 40) return 'medium'
        return 'low'
    }

    /**
     * Apply optimization to create optimized file (for ZIP preparation)
     * @param {LemGendImage} lemGendImage - Image to optimize
     * @returns {Promise<File>} Optimized file
     */
    async applyOptimization(lemGendImage) {
        const result = await this.process(lemGendImage)

        return new Promise((resolve, reject) => {
            const img = new Image()

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')

                    // Set dimensions
                    let width = img.width
                    let height = img.height

                    if (result.optimization.resizeInfo && result.optimization.resizeInfo.resizeNeeded) {
                        width = result.optimization.resizeInfo.width
                        height = result.optimization.resizeInfo.height
                    }

                    canvas.width = width
                    canvas.height = height

                    // Handle transparency/background
                    const format = result.optimization.selectedFormat
                    const hasTransparency = result.originalInfo.hasTransparency

                    if ((format === 'jpg' || format === 'jpeg') && !hasTransparency) {
                        ctx.fillStyle = '#ffffff'
                        ctx.fillRect(0, 0, width, height)
                    }

                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height)

                    // Determine MIME type
                    let mimeType
                    switch (format) {
                        case 'webp': mimeType = 'image/webp'; break
                        case 'avif': mimeType = 'image/avif'; break
                        case 'jpg':
                        case 'jpeg': mimeType = 'image/jpeg'; break
                        case 'png': mimeType = 'image/png'; break
                        case 'ico': mimeType = 'image/x-icon'; break
                        default: mimeType = 'image/webp'
                    }

                    // Apply quality
                    const quality = result.optimization.compression.quality / 100

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create blob'))
                                return
                            }

                            const extension = format
                            const originalName = lemGendImage.originalName.replace(/\.[^/.]+$/, '')
                            const newName = `${originalName}-optimized.${extension}`

                            resolve(new File([blob], newName, { type: mimeType }))
                        },
                        mimeType,
                        quality
                    )
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(lemGendImage.file)
        })
    }

    /**
     * Prepare images for ZIP with optimization
     * @param {Array<LemGendImage>} images - Images to prepare
     * @returns {Promise<Array>} Prepared images with optimization results
     */
    async prepareForZip(images) {
        const results = []

        for (const image of images) {
            try {
                const optimizationResult = await this.process(image)
                const optimizedFile = await this.applyOptimization(image)

                results.push({
                    original: image,
                    optimized: optimizedFile,
                    result: optimizationResult,
                    success: true
                })
            } catch (error) {
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
     * Generate optimization report
     * @param {Array} optimizationResults - Results from prepareForZip
     * @returns {Object} Optimization report
     */
    generateOptimizationReport(optimizationResults) {
        const successful = optimizationResults.filter(r => r.success)
        const failed = optimizationResults.filter(r => !r.success)

        const totalOriginalSize = successful.reduce((sum, r) => sum + r.original.originalSize, 0)
        const totalOptimizedSize = successful.reduce((sum, r) => sum + r.result.savings.estimatedSize, 0)
        const totalSavings = totalOriginalSize - totalOptimizedSize
        const savingsPercentage = (totalSavings / totalOriginalSize * 100).toFixed(1)

        return {
            summary: {
                totalImages: optimizationResults.length,
                successful: successful.length,
                failed: failed.length,
                totalOriginalSize,
                totalOptimizedSize,
                totalSavings,
                savingsPercentage: `${savingsPercentage}%`,
                averageCompressionRatio: (totalOriginalSize / totalOptimizedSize).toFixed(2),
                generatedAt: new Date().toISOString()
            },
            successfulImages: successful.map(r => ({
                name: r.original.originalName,
                originalSize: r.original.originalSize,
                optimizedSize: r.result.savings.estimatedSize,
                savings: r.result.savings.savings,
                savingsPercent: r.result.savings.savingsPercent,
                format: r.result.optimization.selectedFormat,
                dimensions: `${r.result.originalInfo.width}x${r.result.originalInfo.height}`,
                optimizedDimensions: r.result.optimization.resizeInfo ?
                    `${r.result.optimization.resizeInfo.width}x${r.result.optimization.resizeInfo.height}` :
                    `${r.result.originalInfo.width}x${r.result.originalInfo.height}`
            })),
            failedImages: failed.map(f => ({
                name: f.original.originalName,
                error: f.error
            })),
            recommendations: this._extractRecommendations(successful)
        }
    }

    /**
     * Extract recommendations from optimization results
     * @private
     */
    _extractRecommendations(successful) {
        const recommendations = []

        // Check for mixed formats
        const formats = successful.map(r => r.result.optimization.selectedFormat)
        const uniqueFormats = [...new Set(formats)]

        if (uniqueFormats.length > 2) {
            recommendations.push({
                type: 'format_standardization',
                message: `Multiple formats used: ${uniqueFormats.join(', ')}`,
                suggestion: 'Consider standardizing on 1-2 formats for consistency'
            })
        }

        // Check for large originals
        const largeOriginals = successful.filter(r =>
            r.original.originalSize > 5 * 1024 * 1024 // > 5MB
        )

        if (largeOriginals.length > 0) {
            recommendations.push({
                type: 'large_source_files',
                message: `${largeOriginals.length} images were originally very large`,
                suggestion: 'Consider using smaller source images for web'
            })
        }

        return recommendations
    }

    /**
     * Get processor description
     * @returns {string} Description
     */
    static getDescription() {
        return 'LemGendaryOptimize™: Advanced image optimization with intelligent format selection, adaptive compression, and ZIP preparation.'
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    static getInfo() {
        return {
            name: 'LemGendaryOptimize',
            version: '2.0.0',
            description: this.getDescription(),
            supportedFormats: ['auto', 'webp', 'jpg', 'jpeg', 'png', 'avif', 'ico', 'svg', 'original'],
            features: [
                'Intelligent format selection',
                'Adaptive compression',
                'Content-aware optimization',
                'Browser compatibility analysis',
                'Pre-ZIP optimization',
                'Size estimation',
                'Optimization reporting'
            ],
            optimizationModes: ['adaptive', 'aggressive', 'balanced']
        }
    }

    /**
     * Create processor from configuration object
     * @param {Object} config - Processor configuration
     * @returns {LemGendaryOptimize} New processor instance
     */
    static fromConfig(config) {
        return new LemGendaryOptimize(config)
    }
}