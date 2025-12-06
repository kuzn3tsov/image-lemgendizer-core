/**
 * LemGendImage - Core image representation class
 * @class
 * @description Represents an image throughout the processing pipeline
 */

// Import utility functions
import {
    getImageDimensions,
    hasTransparency,
    createThumbnail,
    analyzeForOptimization,
    formatFileSize,
    getFileExtension,
    fileToDataURL
} from './utils/imageUtils.js';

export class LemGendImage {
    /**
     * Create a new LemGendImage instance
     * @param {File} file - The original image file
     * @param {Object} options - Configuration options
     */
    constructor(file, options = {}) {
        if (!(file instanceof File)) {
            throw new TypeError('LemGendImage requires a File object')
        }

        this.id = `lemgend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.file = file
        this.originalName = file.name
        this.originalSize = file.size
        this.type = file.type
        this.mimeType = file.type
        this.extension = getFileExtension(file)

        if (this.extension === 'ico' && !this.type.includes('image')) {
            this.type = 'image/x-icon'
            this.mimeType = 'image/x-icon'
        }

        this.metadata = {
            originalDimensions: null,
            processedDimensions: null,
            operations: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            optimizationHistory: [],
            analysis: null
        }
        this.outputs = new Map()
        this.processed = false
        this.orientation = options.orientation || null
        this.width = options.width || null
        this.height = options.height || null
        this.aspectRatio = null
        this.transparency = null
        this._imageElement = null
        this._svgDocument = null
        this._objectURL = null
        this.optimizationScore = 0
        this.optimizationRecommendations = []

        if (this.width && this.height) {
            this.aspectRatio = this.width / this.height
            this.orientation = this.width >= this.height ? 'landscape' : 'portrait'
        }
    }

    /**
     * Load and analyze the image
     * @returns {Promise<LemGendImage>} The loaded image instance
     */
    load = async () => {
        try {
            if (this.type === 'image/svg+xml') {
                await this._loadSVG()
            } else if (this.type === 'image/x-icon' || this.type === 'image/vnd.microsoft.icon') {
                await this._loadFavicon()
            } else {
                await this._loadRaster()
            }

            if (this.width && this.height) {
                this.aspectRatio = this.width / this.height
                this.orientation = this.width >= this.height ? 'landscape' : 'portrait'
            }

            this.metadata.originalDimensions = {
                width: this.width,
                height: this.height,
                orientation: this.orientation,
                aspectRatio: this.aspectRatio
            }

            // Analyze image for optimization using utility function
            const analysis = await analyzeForOptimization(this.file)
            this.optimizationScore = analysis.optimizationScore
            this.optimizationRecommendations = analysis.recommendations
            this.metadata.analysis = analysis
            this.metadata.optimizationLevel = analysis.optimizationLevel

            // Check transparency if applicable
            if (this.type === 'image/png' || this.type === 'image/webp' || this.type.includes('icon')) {
                this.transparency = await hasTransparency(this.file)
            }

            return this
        } catch (error) {
            throw new Error(`Failed to load image: ${error.message}`)
        }
    }

    /**
     * Load and analyze favicon (ICO) file
     * @private
     */
    _loadFavicon = async () => {
        try {
            this.width = 32
            this.height = 32
            this.aspectRatio = 1
            this.orientation = 'square'

            this.metadata.favicon = true
            this.metadata.possibleSizes = [16, 32, 48, 64, 128, 256]

            return this
        } catch (error) {
            throw new Error(`Failed to load favicon: ${error.message}`)
        }
    }

    /**
     * Load and analyze SVG image
     * @private
     */
    _loadSVG = async () => {
        try {
            const text = await this.file.text()
            const parser = new DOMParser()
            const svgDoc = parser.parseFromString(text, 'image/svg+xml')
            const svgElement = svgDoc.documentElement

            const parserError = svgDoc.querySelector('parsererror')
            if (parserError) {
                throw new Error('Invalid SVG format')
            }

            const widthAttr = svgElement.getAttribute('width')
            const heightAttr = svgElement.getAttribute('height')
            const viewBox = svgElement.getAttribute('viewBox')

            if (widthAttr && heightAttr) {
                this.width = this._parseSVGLength(widthAttr)
                this.height = this._parseSVGLength(heightAttr)
            } else if (viewBox) {
                const [x, y, vbWidth, vbHeight] = viewBox.split(/\s+|,/).map(parseFloat)
                this.width = vbWidth || 100
                this.height = vbHeight || 100
            } else {
                this.width = 100
                this.height = 100
            }

            this._svgDocument = svgDoc
            this.metadata.svgContent = text
            this.metadata.svgElement = svgElement
            this.transparency = this._checkSVGTransparency(text)

        } catch (error) {
            throw new Error(`Failed to load SVG: ${error.message}`)
        }
    }

    /**
     * Parse SVG length string to pixels
     * @private
     */
    _parseSVGLength = (lengthStr) => {
        const match = lengthStr.match(/^([\d.]+)(px|pt|pc|mm|cm|in|em|ex|%)?$/)
        if (!match) return 100

        const value = parseFloat(match[1])
        const unit = match[2] || 'px'

        const unitMap = {
            'px': 1,
            'pt': 1.33,
            'pc': 16,
            'mm': 3.78,
            'cm': 37.8,
            'in': 96,
            'em': 16,
            'ex': 8,
            '%': value
        }

        return value * (unitMap[unit] || 1)
    }

    /**
     * Check if SVG has transparent elements
     * @private
     */
    _checkSVGTransparency = (svgText) => {
        const transparencyIndicators = [
            'fill="none"',
            'fill="transparent"',
            'fill-opacity',
            'opacity=',
            'rgba(',
            'hsla(',
            'fill:#00000000',
            'fill:transparent',
            'stroke-opacity',
            'stop-opacity'
        ]

        return transparencyIndicators.some(indicator =>
            svgText.includes(indicator)
        )
    }

    /**
     * Load and analyze raster image
     * @private
     */
    _loadRaster = async () => {
        return new Promise((resolve, reject) => {
            const img = new Image()

            img.onload = () => {
                this.width = img.naturalWidth || img.width
                this.height = img.naturalHeight || img.height
                this._imageElement = img
                this._objectURL = img.src
                resolve(this)
            }

            img.onerror = () => {
                reject(new Error('Failed to load raster image'))
            }

            img.src = URL.createObjectURL(this.file)
        })
    }

    /**
     * Update image dimensions
     * @param {number} width - New width in pixels
     * @param {number} height - New height in pixels
     */
    updateDimensions = (width, height) => {
        if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
            throw new Error('Dimensions must be positive numbers')
        }

        this.width = width
        this.height = height
        this.aspectRatio = width / height
        this.orientation = width >= height ? 'landscape' : 'portrait'

        this.metadata.processedDimensions = { width, height, aspectRatio: this.aspectRatio }
        this.metadata.lastModified = new Date().toISOString()
    }

    /**
     * Add an operation to metadata
     * @param {string} operation - Operation name
     * @param {Object} details - Operation details
     */
    addOperation = (operation, details) => {
        this.metadata.operations.push({
            operation,
            details,
            timestamp: new Date().toISOString(),
            previousDimensions: this.metadata.processedDimensions || this.metadata.originalDimensions
        })

        // Track optimization operations separately
        if (operation === 'optimize') {
            this.metadata.optimizationHistory.push({
                ...details,
                timestamp: new Date().toISOString()
            })
        }
    }

    /**
     * Add processed output
     * @param {string} format - Output format
     * @param {File} file - Processed file
     * @param {Object} template - Template used (if any)
     */
    addOutput = (format, file, template = null) => {
        if (!(file instanceof File)) {
            throw new TypeError('Output must be a File object')
        }

        this.outputs.set(format, {
            file,
            format,
            template,
            dimensions: { width: this.width, height: this.height },
            size: file.size,
            addedAt: new Date().toISOString()
        })

        this.processed = true
    }

    /**
     * Get output by format
     * @param {string} format - Output format
     * @returns {Object|null} Output object or null
     */
    getOutput = (format) => {
        return this.outputs.get(format) || null
    }

    /**
     * Get all outputs
     * @returns {Array} Array of output objects
     */
    getAllOutputs = () => {
        return Array.from(this.outputs.values())
    }

    /**
     * Get output as Data URL
     * @param {string} format - Output format
     * @returns {Promise<string>} Data URL
     */
    getOutputAsDataURL = async (format) => {
        const output = this.getOutput(format)
        if (!output) {
            throw new Error(`No output found for format: ${format}`)
        }

        return fileToDataURL(output.file)
    }

    /**
     * Get original image as Data URL
     * @returns {Promise<string>} Data URL
     */
    toDataURL = async () => {
        return fileToDataURL(this.file)
    }

    /**
     * Get optimization recommendations based on image analysis
     * @returns {Object} Optimization recommendations
     */
    getOptimizationRecommendations = () => {
        const recommendations = {
            format: this._recommendFormat(),
            quality: this._recommendQuality(),
            resize: this._recommendResize(),
            warnings: this.optimizationRecommendations,
            suggestions: [],
            priority: this._getOptimizationPriority()
        }

        // Additional suggestions based on image characteristics
        if (this.transparency && this.extension === 'jpg') {
            recommendations.suggestions.push('JPEG format does not support transparency - consider PNG or WebP')
        }

        if (this.width > 4000 || this.height > 4000) {
            recommendations.suggestions.push('Image dimensions very large - consider resizing for web')
        }

        if (this.originalSize > 10 * 1024 * 1024) {
            recommendations.suggestions.push('Image is very large (>10MB) - consider aggressive compression')
        }

        return recommendations
    }

    /**
     * Recommend best format based on image characteristics
     * @private
     */
    _recommendFormat = () => {
        if (this.type === 'image/svg+xml') return 'svg'
        if (this.type.includes('icon')) return 'ico'

        if (this.transparency) {
            return 'webp' // WebP supports transparency and has good compression
        }

        // For photographic images, recommend modern formats
        if (this.width * this.height > 1000000) {
            return 'avif' // AVIF is great for large images
        }

        return 'webp' // Default to WebP for good balance
    }

    /**
     * Recommend quality setting
     * @private
     */
    _recommendQuality = () => {
        if (this.type === 'image/svg+xml' || this.type.includes('icon')) {
            return 100 // Vector and icons should be lossless
        }

        if (this.transparency) {
            return 90 // Higher quality for transparency
        }

        if (this.width * this.height > 2000000) {
            return 80 // Lower quality for very large images
        }

        return 85 // Default good quality
    }

    /**
     * Recommend resize dimensions
     * @private
     */
    _recommendResize = () => {
        const maxWebDimension = 1920

        if (this.width <= maxWebDimension && this.height <= maxWebDimension) {
            return null // No resize needed
        }

        let newWidth, newHeight

        if (this.width >= this.height) {
            newWidth = Math.min(this.width, maxWebDimension)
            newHeight = Math.round((this.height / this.width) * newWidth)
        } else {
            newHeight = Math.min(this.height, maxWebDimension)
            newWidth = Math.round((this.width / this.height) * newHeight)
        }

        return {
            width: newWidth,
            height: newHeight,
            reason: `Resize to ${newWidth}x${newHeight} for web display`
        }
    }

    /**
     * Get optimization priority
     * @private
     */
    _getOptimizationPriority = () => {
        const megapixels = (this.width * this.height) / 1000000
        const mbSize = this.originalSize / (1024 * 1024)

        if (mbSize > 10 || megapixels > 16) {
            return 'high' // Very large images need optimization
        }

        if (mbSize > 2 || megapixels > 4) {
            return 'medium' // Large images benefit from optimization
        }

        return 'low' // Small images are already fairly optimized
    }

    /**
     * Get optimization summary for reporting
     * @returns {Object} Optimization summary
     */
    getOptimizationSummary = () => {
        const recommendations = this.getOptimizationRecommendations()

        return {
            original: {
                name: this.originalName,
                size: this.originalSize,
                dimensions: `${this.width}x${this.height}`,
                format: this.extension,
                hasTransparency: this.transparency,
                mimeType: this.type
            },
            recommendations,
            estimatedSavings: this._estimateOptimizationSavings(recommendations),
            priority: recommendations.priority,
            optimizationScore: this.optimizationScore,
            optimizationLevel: this.metadata.optimizationLevel || 'unknown'
        }
    }

    /**
     * Estimate optimization savings
     * @private
     */
    _estimateOptimizationSavings = (recommendations) => {
        // Simple estimation based on format and quality
        let estimatedSize = this.originalSize

        switch (recommendations.format) {
            case 'webp':
                estimatedSize *= 0.7
                break
            case 'avif':
                estimatedSize *= 0.6
                break
            case 'png':
                estimatedSize *= 0.9
                break
            case 'jpg':
                estimatedSize *= 0.8
                break
            case 'svg':
                estimatedSize *= 0.3
                break
        }

        // Apply quality adjustment
        estimatedSize *= (recommendations.quality / 100)

        // Apply resize if recommended
        if (recommendations.resize) {
            const areaReduction = (recommendations.resize.width * recommendations.resize.height) /
                (this.width * this.height)
            estimatedSize *= areaReduction
        }

        const savings = this.originalSize - estimatedSize

        return {
            originalSize: this.originalSize,
            estimatedSize: Math.round(estimatedSize),
            savings: Math.round(savings),
            savingsPercent: Math.round((savings / this.originalSize) * 1000) / 10
        }
    }

    /**
     * Get image info summary
     * @returns {Object} Image information
     */
    getInfo = () => {
        return {
            id: this.id,
            name: this.originalName,
            type: this.type,
            originalSize: this.originalSize,
            width: this.width,
            height: this.height,
            orientation: this.orientation,
            aspectRatio: this.aspectRatio,
            transparency: this.transparency,
            processed: this.processed,
            outputs: this.getAllOutputs().map(output => output.format),
            metadata: { ...this.metadata },
            optimization: {
                score: this.optimizationScore,
                level: this.metadata.optimizationLevel,
                recommendations: this.optimizationRecommendations.length
            }
        }
    }

    /**
     * Get detailed optimization report
     * @returns {Object} Detailed optimization report
     */
    getOptimizationReport = () => {
        const summary = this.getOptimizationSummary()
        const info = this.getInfo()

        return {
            ...summary,
            imageInfo: {
                id: info.id,
                name: info.name,
                type: info.type,
                processed: info.processed
            },
            analysis: this.metadata.analysis,
            optimizationHistory: this.metadata.optimizationHistory,
            generatedAt: new Date().toISOString()
        }
    }

    /**
     * Check if image needs optimization
     * @param {number} threshold - Optimization score threshold (0-100)
     * @returns {boolean} True if optimization needed
     */
    needsOptimization = (threshold = 30) => {
        return this.optimizationScore >= threshold
    }

    /**
     * Get recommended optimization settings
     * @param {string} useCase - Use case identifier
     * @returns {Object} Recommended settings
     */
    getRecommendedSettings = (useCase = 'web') => {
        const recommendations = this.getOptimizationRecommendations()

        const presets = {
            'web': {
                quality: recommendations.quality,
                format: recommendations.format,
                maxDisplayWidth: 1920,
                compressionMode: 'adaptive',
                browserSupport: ['modern', 'legacy']
            },
            'social': {
                quality: 90,
                format: 'jpg',
                maxDisplayWidth: 1080,
                compressionMode: 'balanced',
                stripMetadata: false
            },
            'ecommerce': {
                quality: 92,
                format: 'webp',
                maxDisplayWidth: 1200,
                compressionMode: 'balanced',
                preserveTransparency: true
            },
            'print': {
                quality: 100,
                format: 'png',
                maxDisplayWidth: null,
                compressionMode: 'balanced',
                lossless: true
            }
        }

        return presets[useCase] || presets['web']
    }

    /**
     * Create thumbnail preview - uses utility function
     * @param {number} maxSize - Maximum thumbnail dimension
     * @returns {Promise<string>} Thumbnail as Data URL
     */
    createThumbnail = async (maxSize = 200) => {
        return createThumbnail(this, maxSize)
    }

    /**
     * Clean up resources
     */
    destroy = () => {
        if (this._objectURL) {
            URL.revokeObjectURL(this._objectURL)
        }

        if (this._imageElement?.src && this._imageElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(this._imageElement.src)
        }

        this._imageElement = null
        this._svgDocument = null
        this._objectURL = null
        this.outputs.clear()
    }

    /**
     * Clone the image instance (without outputs)
     * @returns {LemGendImage} Cloned instance
     */
    clone = () => {
        const clone = new LemGendImage(this.file, {
            orientation: this.orientation,
            width: this.width,
            height: this.height
        })

        clone.metadata = JSON.parse(JSON.stringify(this.metadata))
        clone.transparency = this.transparency
        clone.aspectRatio = this.aspectRatio
        clone.optimizationScore = this.optimizationScore
        clone.optimizationRecommendations = [...this.optimizationRecommendations]

        return clone
    }
}