/**
 * LemGendTask - Unified processing pipeline with favicon support
 * @class
 * @description Orchestrates multiple image processing operations in sequence
 */

// Import validation functions
import { validateOptimizationOptions, ValidationWarnings } from '../utils/validation.js'

export class LemGendTask {
    /**
     * Create a new LemGendTask
     * @param {string} name - Task name
     * @param {string} description - Task description
     */
    constructor(name = 'Untitled Task', description = '') {
        this.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.name = name
        this.description = description
        this.steps = []
        this.validationWarnings = []
        this.validationErrors = []
        this.createdAt = new Date().toISOString()
        this.updatedAt = new Date().toISOString()
        this.metadata = {
            version: '2.2.0',
            processorVersions: {
                resize: '1.2.1',
                crop: '2.0.0',
                optimize: '2.0.0', // Updated version
                rename: '1.0.0',
                template: '1.3.0',
                favicon: '2.0.0'
            },
            estimatedDuration: null,
            estimatedOutputs: 0,
            supportsFavicon: true,
            supportsSVG: true,
            supportsAICropping: true,
            maxBatchSize: 50,
            defaultResizeMode: 'longest',
            supportsOptimizationFirst: true,
            optimizationModes: ['adaptive', 'aggressive', 'balanced']
        }
    }

    /**
     * Add a processing step
     * @param {string} processor - Processor name ('resize', 'crop', 'optimize', 'rename', 'template', 'favicon')
     * @param {Object} options - Processor options
     * @returns {LemGendTask} This task instance for chaining
     */
    addStep = (processor, options) => {
        const validProcessors = ['resize', 'crop', 'optimize', 'rename', 'template', 'favicon']

        if (!validProcessors.includes(processor)) {
            throw new Error(`Invalid processor: ${processor}. Valid options: ${validProcessors.join(', ')}`)
        }

        const step = {
            id: `step_${this.steps.length + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            processor,
            options: this._validateStepOptions(processor, options),
            order: this.steps.length + 1,
            addedAt: new Date().toISOString(),
            enabled: true,
            metadata: {
                requiresFavicon: processor === 'favicon',
                isBatchable: !['favicon', 'template'].includes(processor),
                outputType: this._getStepOutputType(processor, options),
                supportsOptimizationFirst: processor === 'optimize'
            }
        }

        this.steps.push(step)
        this.updatedAt = new Date().toISOString()
        this._updateMetadata()

        return this
    }

    /**
     * Validate step options based on processor type
     * @private
     */
    _validateStepOptions = (processor, options) => {
        const defaults = {
            resize: {
                dimension: 1024,
                mode: 'longest',
                maintainAspectRatio: true,
                upscale: true,
                algorithm: 'lanczos3'
            },
            crop: {
                width: 500,
                height: 500,
                mode: 'smart',
                upscale: false,
                preserveAspectRatio: true,
                confidenceThreshold: 70,
                cropToFit: true,
                objectsToDetect: ['person', 'face', 'car', 'dog', 'cat']
            },
            optimize: {
                quality: 85,
                format: 'auto',
                lossless: false,
                stripMetadata: true,
                preserveTransparency: true,
                maxDisplayWidth: null,
                browserSupport: ['modern', 'legacy'],
                compressionMode: 'adaptive',
                analyzeContent: true,
                icoSizes: [16, 32, 48, 64, 128, 256]
            },
            rename: {
                pattern: '{name}-{dimensions}',
                preserveExtension: true,
                addIndex: true,
                addTimestamp: false,
                customSeparator: '-'
            },
            template: {
                templateId: null,
                applyToAll: true,
                preserveOriginal: false
            },
            favicon: {
                sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
                formats: ['png', 'ico'],
                generateManifest: true,
                generateHTML: true,
                includeAppleTouch: true,
                includeAndroid: true,
                roundCorners: true,
                backgroundColor: '#ffffff'
            }
        }

        const validatedOptions = { ...defaults[processor], ...options }

        switch (processor) {
            case 'favicon':
                validatedOptions.sizes = [...new Set(validatedOptions.sizes.sort((a, b) => a - b))]
                validatedOptions.sizes = validatedOptions.sizes.filter(size => size >= 16 && size <= 512)
                break

            case 'optimize':
                if (validatedOptions.format === 'jpg' && options.preserveTransparency) {
                    validatedOptions.format = 'png'
                }

                // Validate browser support
                const validBrowserSupport = ['modern', 'legacy', 'all']
                validatedOptions.browserSupport = validatedOptions.browserSupport.filter(support =>
                    validBrowserSupport.includes(support)
                )
                if (validatedOptions.browserSupport.length === 0) {
                    validatedOptions.browserSupport = ['modern', 'legacy']
                }

                // Validate compression mode
                const validCompressionModes = ['adaptive', 'aggressive', 'balanced']
                if (!validCompressionModes.includes(validatedOptions.compressionMode)) {
                    validatedOptions.compressionMode = 'adaptive'
                }

                // Adjust quality for specific formats
                if (validatedOptions.format === 'avif') {
                    validatedOptions.quality = Math.min(63, validatedOptions.quality)
                }
                break

            case 'crop':
                if (['smart', 'face', 'object', 'saliency', 'entropy'].includes(validatedOptions.mode)) {
                    validatedOptions.confidenceThreshold = Math.max(0, Math.min(100, validatedOptions.confidenceThreshold || 70))
                    validatedOptions.multipleFaces = validatedOptions.multipleFaces || false

                    if (!Array.isArray(validatedOptions.objectsToDetect)) {
                        validatedOptions.objectsToDetect = ['person', 'face', 'car', 'dog', 'cat']
                    }
                }
                break

            case 'rename':
                // Validate pattern has at least one placeholder
                const placeholders = ['{name}', '{index}', '{timestamp}', '{width}', '{height}', '{dimensions}']
                if (!placeholders.some(ph => validatedOptions.pattern.includes(ph))) {
                    validatedOptions.pattern = '{name}-{index}'
                }
                break
        }

        return validatedOptions
    }

    /**
     * Get step output type
     * @private
     */
    _getStepOutputType = (processor, options) => {
        switch (processor) {
            case 'optimize':
                return options.format === 'auto' ? 'optimized-auto' : `optimized-${options.format}`
            case 'favicon':
                return 'favicon-set'
            case 'template':
                return 'template-applied'
            default:
                return 'processed'
        }
    }

    /**
     * Add resize step
     * @param {number} dimension - Target dimension
     * @param {string} mode - 'auto', 'width', 'height', 'longest', or 'fit'
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addResize = (dimension, mode = 'longest', additionalOptions = {}) => {
        return this.addStep('resize', {
            dimension,
            mode,
            ...additionalOptions
        })
    }

    /**
     * Add crop step
     * @param {number} width - Crop width
     * @param {number} height - Crop height
     * @param {string} mode - Crop mode: 'smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right'
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addCrop = (width, height, mode = 'smart', additionalOptions = {}) => {
        return this.addStep('crop', {
            width,
            height,
            mode,
            ...additionalOptions
        })
    }

    /**
     * Add smart crop step with AI detection
     * @param {number} width - Crop width
     * @param {number} height - Crop height
     * @param {Object} options - Smart crop options
     * @returns {LemGendTask} This task instance for chaining
     */
    addSmartCrop = (width, height, options = {}) => {
        return this.addStep('crop', {
            width,
            height,
            mode: 'smart',
            confidenceThreshold: 70,
            multipleFaces: true,
            cropToFit: true,
            ...options
        })
    }

    /**
     * Add optimization step with enhanced options
     * @param {number} quality - Quality percentage
     * @param {string} format - Output format ('auto', 'webp', 'jpg', 'png', 'avif', 'original')
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addOptimize = (quality = 85, format = 'auto', additionalOptions = {}) => {
        return this.addStep('optimize', {
            quality,
            format,
            maxDisplayWidth: additionalOptions.maxDisplayWidth || null,
            browserSupport: additionalOptions.browserSupport || ['modern', 'legacy'],
            compressionMode: additionalOptions.compressionMode || 'adaptive',
            analyzeContent: additionalOptions.analyzeContent !== false,
            ...additionalOptions
        })
    }

    /**
     * Add optimization-first step for web delivery
     * @param {Object} options - Optimization options
     * @returns {LemGendTask} This task instance for chaining
     */
    addWebOptimization = (options = {}) => {
        return this.addStep('optimize', {
            quality: 85,
            format: 'auto',
            maxDisplayWidth: 1920,
            browserSupport: ['modern', 'legacy'],
            compressionMode: 'adaptive',
            stripMetadata: true,
            preserveTransparency: true,
            ...options
        })
    }

    /**
     * Add rename step
     * @param {string} pattern - Rename pattern (supports {name}, {width}, {height}, {dimensions}, {index}, {timestamp})
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addRename = (pattern, additionalOptions = {}) => {
        return this.addStep('rename', {
            pattern,
            ...additionalOptions
        })
    }

    /**
     * Add template step
     * @param {string} templateId - Template ID
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addTemplate = (templateId, additionalOptions = {}) => {
        return this.addStep('template', {
            templateId,
            ...additionalOptions
        })
    }

    /**
     * Add favicon generation step
     * @param {Array<number>} sizes - Array of sizes to generate
     * @param {Array<string>} formats - Formats to generate ('png', 'ico', 'svg')
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    addFavicon = (sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512], formats = ['png', 'ico'], additionalOptions = {}) => {
        return this.addStep('favicon', {
            sizes,
            formats,
            ...additionalOptions
        })
    }

    /**
     * Remove a step by ID or index
     * @param {string|number} identifier - Step ID or index
     * @returns {boolean} True if step was removed
     */
    removeStep = (identifier) => {
        let index

        if (typeof identifier === 'number') {
            index = identifier
        } else {
            index = this.steps.findIndex(step => step.id === identifier)
        }

        if (index >= 0 && index < this.steps.length) {
            this.steps.splice(index, 1)

            this.steps.forEach((step, idx) => {
                step.order = idx + 1
            })

            this.updatedAt = new Date().toISOString()
            this._updateMetadata()
            return true
        }

        return false
    }

    /**
     * Move step up in order
     * @param {number} index - Step index
     * @returns {boolean} True if step was moved
     */
    moveStepUp = (index) => {
        if (index <= 0 || index >= this.steps.length) {
            return false
        }

        [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]]

        this.steps.forEach((step, idx) => {
            step.order = idx + 1
        })

        this.updatedAt = new Date().toISOString()
        return true
    }

    /**
     * Move step down in order
     * @param {number} index - Step index
     * @returns {boolean} True if step was moved
     */
    moveStepDown = (index) => {
        if (index < 0 || index >= this.steps.length - 1) {
            return false
        }

        [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]]

        this.steps.forEach((step, idx) => {
            step.order = idx + 1
        })

        this.updatedAt = new Date().toISOString()
        return true
    }

    /**
     * Enable/disable a step
     * @param {number} index - Step index
     * @param {boolean} enabled - Enable state
     * @returns {boolean} True if step was updated
     */
    setStepEnabled = (index, enabled = true) => {
        if (index >= 0 && index < this.steps.length) {
            this.steps[index].enabled = enabled
            this.updatedAt = new Date().toISOString()
            this._updateMetadata()
            return true
        }
        return false
    }

    /**
     * Get enabled steps only
     * @returns {Array} Enabled steps
     */
    getEnabledSteps = () => {
        return this.steps.filter(step => step.enabled)
    }

    /**
     * Get steps by processor type
     * @param {string} processor - Processor type
     * @returns {Array} Matching steps
     */
    getStepsByProcessor = (processor) => {
        return this.steps.filter(step => step.processor === processor)
    }

    /**
     * Check if task has specific processor
     * @param {string} processor - Processor type
     * @returns {boolean} True if processor exists
     */
    hasProcessor = (processor) => {
        return this.getEnabledSteps().some(step => step.processor === processor)
    }

    /**
     * Check if task has optimization step
     * @returns {boolean} True if has optimization
     */
    hasOptimization = () => {
        return this.hasProcessor('optimize')
    }

    /**
     * Get optimization step if exists
     * @returns {Object|null} Optimization step
     */
    getOptimizationStep = () => {
        return this.getEnabledSteps().find(step => step.processor === 'optimize') || null
    }

    /**
     * Validate task against an image
     * @param {LemGendImage} lemGendImage - Image to validate against
     * @returns {Promise<Object>} Validation result
     */
    validate = async (lemGendImage) => {
        this.validationWarnings = []
        this.validationErrors = []

        if (!lemGendImage) {
            const enabledSteps = this.getEnabledSteps()

            if (enabledSteps.length === 0) {
                this.validationWarnings.push({
                    type: 'empty_task',
                    message: 'Task has no enabled processing steps',
                    severity: 'warning'
                })
            }

            for (const step of enabledSteps) {
                await this._validateStep(step, null)
            }

            this._validateTaskLogic()

            return {
                isValid: this.validationErrors.length === 0,
                hasWarnings: this.validationWarnings.length > 0,
                errors: [...this.validationErrors],
                warnings: [...this.validationWarnings],
                summary: this.getValidationSummary()
            }
        }

        if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
            this.validationErrors.push({
                type: 'invalid_image',
                message: 'Image missing valid file property',
                severity: 'error'
            })
        }

        const enabledSteps = this.getEnabledSteps()

        if (enabledSteps.length === 0) {
            this.validationWarnings.push({
                type: 'empty_task',
                message: 'Task has no enabled processing steps',
                severity: 'warning'
            })
        }

        for (const step of enabledSteps) {
            await this._validateStep(step, lemGendImage)
        }

        this._validateTaskLogic()

        if (lemGendImage.file && lemGendImage.file instanceof File) {
            this._validateImageCompatibility(lemGendImage)
        }

        return {
            isValid: this.validationErrors.length === 0,
            hasWarnings: this.validationWarnings.length > 0,
            errors: [...this.validationErrors],
            warnings: [...this.validationWarnings],
            summary: this.getValidationSummary()
        }
    }

    /**
     * Validate individual step
     * @private
     */
    _validateStep = async (step, image) => {
        if (!image) {
            switch (step.processor) {
                case 'optimize':
                    this._validateOptimizeStep(step, null)
                    break
                case 'rename':
                    this._validateRenameStep(step)
                    break
                case 'template':
                    this._validateTemplateStep(step)
                    break
                case 'favicon':
                    this._validateFaviconStep(step, null)
                    break
                case 'resize':
                case 'crop':
                    this._validateBasicStepOptions(step)
                    break
            }
            return
        }

        switch (step.processor) {
            case 'resize':
                this._validateResizeStep(step, image)
                break
            case 'crop':
                this._validateCropStep(step, image)
                break
            case 'optimize':
                this._validateOptimizeStep(step, image)
                break
            case 'rename':
                this._validateRenameStep(step)
                break
            case 'template':
                this._validateTemplateStep(step)
                break
            case 'favicon':
                this._validateFaviconStep(step, image)
                break
        }
    }

    /**
     * Validate basic step options (without image)
     * @private
     */
    _validateBasicStepOptions = (step) => {
        switch (step.processor) {
            case 'resize':
                const { dimension } = step.options
                if (dimension <= 0) {
                    this.validationErrors.push({
                        type: 'invalid_resize',
                        step: step.order,
                        message: `Resize dimension must be positive: ${dimension}`,
                        severity: 'error'
                    })
                }
                break

            case 'crop':
                const { width, height } = step.options
                if (width <= 0 || height <= 0) {
                    this.validationErrors.push({
                        type: 'invalid_crop',
                        step: step.order,
                        message: `Crop dimensions must be positive: ${width}x${height}`,
                        severity: 'error'
                    })
                }
                break
        }
    }

    /**
     * Validate favicon step
     * @private
     */
    _validateFaviconStep = (step, image) => {
        const { sizes, formats } = step.options

        if (!Array.isArray(sizes) || sizes.length === 0) {
            this.validationErrors.push({
                type: 'invalid_favicon_sizes',
                step: step.order,
                message: 'Favicon sizes must be a non-empty array',
                severity: 'error'
            })
        }

        sizes.forEach(size => {
            if (size < 16) {
                this.validationWarnings.push({
                    type: 'small_favicon_size',
                    step: step.order,
                    message: `Favicon size ${size}px is below recommended minimum (16px)`,
                    severity: 'warning'
                })
            }

            if (size > 1024) {
                this.validationWarnings.push({
                    type: 'large_favicon_size',
                    step: step.order,
                    message: `Favicon size ${size}px is unusually large`,
                    severity: 'info'
                })
            }
        })

        if (image) {
            const minSize = Math.min(...sizes)
            if (image.width < minSize || image.height < minSize) {
                this.validationWarnings.push({
                    type: 'small_source_favicon',
                    step: step.order,
                    message: `Source image (${image.width}x${image.height}) smaller than smallest favicon size (${minSize}px)`,
                    severity: 'warning',
                    suggestion: 'Consider using a larger source image or enable upscaling'
                })
            }

            if (Math.abs(image.width / image.height - 1) > 0.1) {
                this.validationWarnings.push({
                    type: 'non_square_favicon',
                    step: step.order,
                    message: 'Source image is not square; favicons may be distorted',
                    severity: 'warning',
                    suggestion: 'Consider adding a crop step before favicon generation'
                })
            }
        }

        const validFormats = ['png', 'ico', 'svg']
        formats.forEach(format => {
            if (!validFormats.includes(format)) {
                this.validationWarnings.push({
                    type: 'unsupported_favicon_format',
                    step: step.order,
                    message: `Unsupported favicon format: ${format}`,
                    severity: 'warning',
                    suggestion: `Use one of: ${validFormats.join(', ')}`
                })
            }
        })
    }

    /**
     * Validate resize step
     * @private
     */
    _validateResizeStep = (step, image) => {
        if (!image) return

        const { dimension, mode, upscale } = step.options

        if (dimension <= 0) {
            this.validationErrors.push({
                type: 'invalid_resize',
                step: step.order,
                message: `Resize dimension must be positive: ${dimension}`,
                severity: 'error'
            })
        }

        if (dimension < 10) {
            this.validationWarnings.push({
                type: 'very_small_resize',
                step: step.order,
                message: `Resize dimension very small (${dimension}px)`,
                severity: 'warning',
                suggestion: 'Consider larger dimensions for usable output'
            })
        }

        if (dimension > 10000) {
            this.validationWarnings.push({
                type: 'very_large_resize',
                step: step.order,
                message: `Resize dimension very large (${dimension}px)`,
                severity: 'warning',
                suggestion: 'Large dimensions may cause performance issues'
            })
        }

        if (dimension > Math.max(image.width, image.height) && !upscale) {
            this.validationWarnings.push({
                type: 'upscale_needed',
                step: step.order,
                message: `Target size (${dimension}px) larger than source, upscaling disabled`,
                severity: 'warning',
                suggestion: 'Enable upscaling or use smaller target dimension'
            })
        }
    }

    /**
     * Validate crop step
     * @private
     */
    _validateCropStep = (step, image) => {
        if (!image) return

        const { width, height, mode, upscale, confidenceThreshold } = step.options

        if (width <= 0 || height <= 0) {
            this.validationErrors.push({
                type: 'invalid_crop',
                step: step.order,
                message: `Crop dimensions must be positive: ${width}x${height}`,
                severity: 'error'
            })
        }

        if (['smart', 'face', 'object'].includes(mode)) {
            this.validationWarnings.push({
                type: 'ai_crop_mode',
                step: step.order,
                message: `Using AI-powered ${mode} cropping`,
                severity: 'info',
                suggestion: 'Ensure images have clear subjects for best results'
            })

            if (confidenceThreshold < 50) {
                this.validationWarnings.push({
                    type: 'low_confidence_threshold',
                    step: step.order,
                    message: `Low confidence threshold (${confidenceThreshold}%) may result in poor detection`,
                    severity: 'warning',
                    suggestion: 'Increase confidence threshold to 70% or higher for better accuracy'
                })
            }
        }

        if (width < 10 || height < 10) {
            this.validationWarnings.push({
                type: 'very_small_crop',
                step: step.order,
                message: `Crop dimensions very small (${width}x${height})`,
                severity: 'warning',
                suggestion: 'Consider larger crop area for usable output'
            })
        }

        const aspect = width / height
        if (aspect > 10 || aspect < 0.1) {
            this.validationWarnings.push({
                type: 'extreme_aspect',
                step: step.order,
                message: `Extreme aspect ratio: ${aspect.toFixed(2)}`,
                severity: 'warning',
                suggestion: 'Consider more balanced dimensions'
            })
        }

        if ((width > image.width || height > image.height) && !upscale) {
            this.validationWarnings.push({
                type: 'crop_larger_than_source',
                step: step.order,
                message: `Crop area (${width}x${height}) larger than source (${image.width}x${image.height})`,
                severity: 'warning',
                suggestion: 'Enable upscaling or resize first'
            })
        }
    }

    /**
    * Validate optimize step with enhanced validation
    * @private
    */
    _validateOptimizeStep = (step, image) => {
        // Use the imported validation function
        const optimizationValidation = validateOptimizationOptions(step.options)

        // Add validation errors
        optimizationValidation.errors.forEach(error => {
            this.validationErrors.push({
                type: error.code,
                step: step.order,
                message: error.message,
                severity: 'error',
                suggestion: error.suggestion
            })
        })

        // Add validation warnings
        optimizationValidation.warnings.forEach(warning => {
            this.validationWarnings.push({
                type: warning.code,
                step: step.order,
                message: warning.message,
                severity: 'warning',
                suggestion: warning.suggestion
            })
        })

        if (image) {
            if ((step.options.format === 'jpg' || step.options.format === 'jpeg') && (image.transparency || step.options.preserveTransparency)) {
                this.validationWarnings.push({
                    type: ValidationWarnings.TRANSPARENCY_LOSS,
                    step: step.order,
                    message: 'JPEG format will remove transparency',
                    severity: 'warning',
                    suggestion: 'Use PNG or WebP to preserve transparency'
                })
            }

            if (step.options.maxDisplayWidth && (image.width > step.options.maxDisplayWidth || image.height > step.options.maxDisplayWidth)) {
                this.validationWarnings.push({
                    type: 'resize_optimization',
                    step: step.order,
                    message: `Image will be resized to ${step.options.maxDisplayWidth}px maximum dimension`,
                    severity: 'info'
                })
            }

            if (step.options.format === 'avif') {
                this.validationWarnings.push({
                    type: ValidationWarnings.AVIF_BROWSER_SUPPORT,
                    step: step.order,
                    message: 'AVIF format provides excellent compression but limited browser support',
                    severity: 'info',
                    suggestion: 'Consider providing WebP fallback'
                })
            }

            if (step.options.compressionMode === 'aggressive' && image.width * image.height > 4000000) {
                this.validationWarnings.push({
                    type: 'aggressive_compression_large',
                    step: step.order,
                    message: 'Aggressive compression on large images may take longer',
                    severity: 'info'
                })
            }
        }
    }

    /**
     * Validate rename step
     * @private
     */
    _validateRenameStep = (step) => {
        const { pattern, preserveExtension } = step.options

        if (!pattern || pattern.trim() === '') {
            this.validationErrors.push({
                type: 'empty_pattern',
                step: step.order,
                message: 'Rename pattern cannot be empty',
                severity: 'error'
            })
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
        if (invalidChars.test(pattern)) {
            this.validationErrors.push({
                type: 'invalid_pattern_chars',
                step: step.order,
                message: 'Pattern contains invalid filename characters',
                severity: 'error',
                suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
            })
        }

        if (!pattern.includes('{name}') && !pattern.includes('{index}')) {
            this.validationWarnings.push({
                type: 'no_unique_placeholder',
                step: step.order,
                message: 'Pattern may create duplicate filenames',
                severity: 'warning',
                suggestion: 'Include {index} or {timestamp} for unique filenames'
            })
        }
    }

    /**
     * Validate template step
     * @private
     */
    _validateTemplateStep = (step) => {
        const { templateId } = step.options

        if (!templateId) {
            this.validationErrors.push({
                type: 'missing_template',
                step: step.order,
                message: 'Template ID is required',
                severity: 'error'
            })
        }
    }

    /**
     * Validate image compatibility
     * @private
     */
    _validateImageCompatibility = (image) => {
        const enabledSteps = this.getEnabledSteps()
        const hasFaviconStep = enabledSteps.some(s => s.processor === 'favicon')
        const hasSmartCrop = enabledSteps.some(s => s.processor === 'crop' &&
            ['smart', 'face', 'object'].includes(s.options.mode))
        const hasOptimization = enabledSteps.some(s => s.processor === 'optimize')

        if (hasFaviconStep) {
            if (image.type === 'image/svg+xml') {
                this.validationWarnings.push({
                    type: 'svg_favicon',
                    message: 'SVG images may not convert well to favicon formats',
                    severity: 'warning',
                    suggestion: 'Consider using raster image for favicon generation'
                })
            }

            if (image.type.includes('gif')) {
                this.validationWarnings.push({
                    type: 'animated_favicon',
                    message: 'Animated GIFs will lose animation in favicon conversion',
                    severity: 'info'
                })
            }
        }

        if (hasSmartCrop) {
            if (image.width < 200 || image.height < 200) {
                this.validationWarnings.push({
                    type: 'small_image_smart_crop',
                    message: 'Smart crop works best with images larger than 200x200 pixels',
                    severity: 'warning',
                    suggestion: 'Consider resizing before smart crop or use larger source images'
                })
            }
        }

        if (hasOptimization) {
            const optimizationStep = enabledSteps.find(s => s.processor === 'optimize')
            if (optimizationStep && optimizationStep.options.format === 'auto') {
                this.validationWarnings.push({
                    type: 'auto_format_selection',
                    message: 'Format will be automatically selected based on image content and browser support',
                    severity: 'info'
                })
            }
        }

        const minDimension = Math.min(image.width, image.height)
        if (minDimension < 100) {
            this.validationWarnings.push({
                type: 'low_resolution',
                message: `Source image resolution low (${image.width}x${image.height})`,
                severity: 'warning',
                suggestion: 'Consider using higher resolution source for better quality'
            })
        }
    }

    /**
     * Validate task logic
     * @private
     */
    _validateTaskLogic = () => {
        const enabledSteps = this.getEnabledSteps()

        const hasResize = enabledSteps.some(s => s.processor === 'resize')
        const hasCrop = enabledSteps.some(s => s.processor === 'crop')
        const hasOptimize = enabledSteps.some(s => s.processor === 'optimize')

        if (hasCrop && !hasResize) {
            this.validationWarnings.push({
                type: 'crop_without_resize',
                message: 'Crop without resize may result in unexpected output',
                severity: 'info',
                suggestion: 'Consider adding resize step before crop for better control'
            })
        }

        const optimizeSteps = enabledSteps.filter(s => s.processor === 'optimize')
        if (optimizeSteps.length > 1) {
            this.validationWarnings.push({
                type: 'multiple_optimize',
                message: `Multiple optimization steps (${optimizeSteps.length})`,
                severity: 'warning',
                suggestion: 'Multiple optimizations may degrade quality unnecessarily'
            })
        }

        const renameIndex = enabledSteps.findIndex(s => s.processor === 'rename')
        if (renameIndex >= 0 && renameIndex < enabledSteps.length - 2) {
            this.validationWarnings.push({
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
                this.validationWarnings.push({
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
                this.validationWarnings.push({
                    type: 'optimize_after_favicon',
                    message: 'Optimization after favicon generation may affect favicon quality',
                    severity: 'warning',
                    suggestion: 'Move optimization step before favicon generation'
                })
            }
        })

        // Validate optimization-first approach
        if (hasOptimize && !hasResize && !hasCrop) {
            this.validationWarnings.push({
                type: 'optimization_only',
                message: 'Task contains only optimization step',
                severity: 'info',
                suggestion: 'Consider adding resize/crop steps for complete image processing'
            })
        }
    }

    /**
     * Get validation summary
     * @returns {Object} Validation summary
     */
    getValidationSummary = () => {
        const enabledSteps = this.getEnabledSteps()
        const errorCount = this.validationErrors.length
        const warningCount = this.validationWarnings.length

        const processorCount = {}
        enabledSteps.forEach(step => {
            processorCount[step.processor] = (processorCount[step.processor] || 0) + 1
        })

        let taskType = 'general'
        if (enabledSteps.some(s => s.processor === 'favicon')) {
            taskType = 'favicon'
        } else if (enabledSteps.some(s => s.processor === 'template')) {
            taskType = 'template'
        } else if (enabledSteps.every(s => ['resize', 'crop', 'optimize'].includes(s.processor))) {
            taskType = 'basic'
        } else if (enabledSteps.length === 1 && enabledSteps[0].processor === 'optimize') {
            taskType = 'optimization-only'
        }

        const hasSmartCrop = enabledSteps.some(s => s.processor === 'crop' &&
            ['smart', 'face', 'object'].includes(s.options.mode))
        const hasAutoOptimization = enabledSteps.some(s =>
            s.processor === 'optimize' && s.options.format === 'auto'
        )

        return {
            totalSteps: enabledSteps.length,
            enabledSteps: enabledSteps.length,
            disabledSteps: this.steps.length - enabledSteps.length,
            errorCount,
            warningCount,
            processorCount,
            taskType,
            status: errorCount > 0 ? 'invalid' : warningCount > 0 ? 'has_warnings' : 'valid',
            canProceed: errorCount === 0,
            requiresImage: enabledSteps.some(s => ['resize', 'crop', 'optimize', 'favicon'].includes(s.processor)),
            hasFavicon: processorCount.favicon > 0,
            hasSmartCrop,
            hasAutoOptimization,
            estimatedOutputs: this._estimateOutputCount(),
            optimizationLevel: this._getOptimizationLevel()
        }
    }

    /**
     * Get optimization level based on settings
     * @private
     */
    _getOptimizationLevel = () => {
        const optimizeStep = this.getEnabledSteps().find(s => s.processor === 'optimize')
        if (!optimizeStep) return 'none'

        const { compressionMode, quality, format } = optimizeStep.options

        if (compressionMode === 'aggressive' && quality < 70) {
            return 'aggressive'
        } else if (compressionMode === 'adaptive' || (quality >= 70 && quality <= 90)) {
            return 'balanced'
        } else if (compressionMode === 'balanced' && quality > 90) {
            return 'high-quality'
        }

        return 'standard'
    }

    /**
     * Estimate number of outputs
     * @private
     */
    _estimateOutputCount = () => {
        const enabledSteps = this.getEnabledSteps()
        let count = 1

        enabledSteps.forEach(step => {
            if (step.processor === 'favicon') {
                const { sizes = [], formats = [] } = step.options
                count += sizes.length * formats.length

                if (step.options.generateManifest) count++
                if (step.options.generateHTML) count++
                if (step.options.includeAppleTouch) count++
                if (step.options.includeAndroid) count++
            } else if (step.processor === 'optimize') {
                const { format } = step.options
                if (Array.isArray(format)) {
                    count += format.length - 1
                }
            }
        })

        return count
    }

    /**
     * Get task description
     * @returns {string} Human-readable description
     */
    getDescription = () => {
        const enabledSteps = this.getEnabledSteps()

        if (enabledSteps.length === 0) {
            return 'No processing steps configured'
        }

        return enabledSteps.map((step, index) => {
            const stepNum = index + 1
            const processor = step.processor.charAt(0).toUpperCase() + step.processor.slice(1)

            switch (step.processor) {
                case 'resize':
                    return `${stepNum}. LemGendaryResize™ to ${step.options.dimension}px (${step.options.mode})`
                case 'crop':
                    const { mode, width, height } = step.options
                    let cropDesc = `${stepNum}. LemGendaryCrop™ to ${width}×${height}`

                    if (['smart', 'face', 'object', 'saliency', 'entropy'].includes(mode)) {
                        cropDesc += ` (AI ${mode} mode)`
                    } else {
                        cropDesc += ` (${mode})`
                    }

                    return cropDesc
                case 'optimize':
                    const formatStr = step.options.format === 'auto'
                        ? 'auto (intelligent selection)'
                        : step.options.format.toUpperCase()

                    let optimizeDesc = `${stepNum}. LemGendaryOptimize™ to ${formatStr} (${step.options.quality}%)`

                    if (step.options.maxDisplayWidth) {
                        optimizeDesc += `, max ${step.options.maxDisplayWidth}px`
                    }

                    if (step.options.compressionMode && step.options.compressionMode !== 'adaptive') {
                        optimizeDesc += `, ${step.options.compressionMode} compression`
                    }

                    if (step.options.browserSupport) {
                        optimizeDesc += `, ${step.options.browserSupport.join('+')} browsers`
                    }

                    return optimizeDesc
                case 'rename':
                    return `${stepNum}. Rename with pattern: "${step.options.pattern}"`
                case 'template':
                    return `${stepNum}. Apply template: ${step.options.templateId}`
                case 'favicon':
                    const sizeCount = step.options.sizes?.length || 0
                    const formatCount = step.options.formats?.length || 0
                    return `${stepNum}. Generate favicon set (${sizeCount} sizes, ${formatCount} formats)`
                default:
                    return `${stepNum}. ${processor}`
            }
        }).join('\n')
    }

    /**
     * Get estimated processing time
     * @param {number} imageCount - Number of images
     * @returns {Object} Time estimates
     */
    getTimeEstimate = (imageCount = 1) => {
        const enabledSteps = this.getEnabledSteps()

        const stepTimes = {
            'resize': 100,
            'crop': 150,
            'optimize': 200,
            'rename': 10,
            'template': 300,
            'favicon': 500
        }

        let totalMs = 0
        let complexityFactor = 1

        enabledSteps.forEach(step => {
            const baseTime = stepTimes[step.processor] || 100

            if (step.processor === 'favicon') {
                const sizeCount = step.options.sizes?.length || 1
                const formatCount = step.options.formats?.length || 1
                complexityFactor = sizeCount * formatCount
            } else if (step.processor === 'crop' &&
                ['smart', 'face', 'object'].includes(step.options.mode)) {
                complexityFactor = 3 // AI processing takes longer
            } else if (step.processor === 'optimize') {
                if (step.options.compressionMode === 'aggressive') {
                    complexityFactor = 1.5
                }
                if (step.options.analyzeContent) {
                    complexityFactor *= 1.2
                }
            }

            totalMs += baseTime * complexityFactor
        })

        totalMs *= imageCount

        return {
            perImage: totalMs / imageCount,
            total: totalMs,
            formatted: this._formatTime(totalMs),
            stepCount: enabledSteps.length,
            imageCount,
            complexityFactor: Math.round(complexityFactor * 10) / 10
        }
    }

    /**
     * Format time in milliseconds
     * @private
     */
    _formatTime = (ms) => {
        if (ms < 1000) return `${Math.round(ms)}ms`
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.round((ms % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }

    /**
     * Export task configuration
     * @returns {Object} Task configuration
     */
    exportConfig = () => {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            version: '2.2.0',
            steps: this.steps.map(step => ({
                id: step.id,
                processor: step.processor,
                options: { ...step.options },
                enabled: step.enabled,
                order: step.order,
                metadata: step.metadata
            })),
            metadata: { ...this.metadata },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            validation: {
                warnings: this.validationWarnings,
                errors: this.validationErrors
            }
        }
    }

    /**
     * Import task configuration
     * @param {Object} config - Task configuration
     * @returns {LemGendTask} New task instance
     */
    static importConfig(config) {
        const task = new LemGendTask(config.name, config.description)
        task.id = config.id || task.id
        task.createdAt = config.createdAt || task.createdAt
        task.updatedAt = config.updatedAt || task.updatedAt
        task.metadata = config.metadata || task.metadata
        task.validationWarnings = config.validation?.warnings || []
        task.validationErrors = config.validation?.errors || []

        config.steps?.forEach(stepConfig => {
            task.addStep(stepConfig.processor, stepConfig.options)
            const lastStep = task.steps[task.steps.length - 1]
            lastStep.enabled = stepConfig.enabled !== false
            lastStep.id = stepConfig.id || lastStep.id
            lastStep.metadata = stepConfig.metadata || lastStep.metadata
        })

        return task
    }

    /**
     * Create task from template
     * @param {string} templateName - Template name
     * @returns {LemGendTask} New task instance
     */
    static fromTemplate(templateName) {
        const templates = {
            'web-optimized': {
                name: 'Web Optimization',
                description: 'Optimize images for web with modern formats',
                steps: [
                    { processor: 'resize', options: { dimension: 1920, mode: 'longest' } },
                    { processor: 'optimize', options: { quality: 85, format: 'auto', compressionMode: 'adaptive' } },
                    { processor: 'rename', options: { pattern: '{name}-{width}w' } }
                ]
            },
            'social-media': {
                name: 'Social Media Posts',
                description: 'Prepare images for social media platforms',
                steps: [
                    { processor: 'resize', options: { dimension: 1080, mode: 'longest' } },
                    {
                        processor: 'crop',
                        options: {
                            width: 1080,
                            height: 1080,
                            mode: 'smart',
                            confidenceThreshold: 70,
                            multipleFaces: true
                        }
                    },
                    { processor: 'optimize', options: { quality: 90, format: 'auto', compressionMode: 'balanced' } }
                ]
            },
            'portrait-smart': {
                name: 'Smart Portrait Cropping',
                description: 'AI-powered portrait cropping with face detection',
                steps: [
                    { processor: 'resize', options: { dimension: 1080, mode: 'longest' } },
                    {
                        processor: 'crop',
                        options: {
                            width: 1080,
                            height: 1350,
                            mode: 'face',
                            confidenceThreshold: 80,
                            preserveAspectRatio: true
                        }
                    },
                    { processor: 'optimize', options: { quality: 95, format: 'auto', compressionMode: 'adaptive' } }
                ]
            },
            'product-showcase': {
                name: 'Product Showcase',
                description: 'Smart cropping for product images',
                steps: [
                    { processor: 'resize', options: { dimension: 1200, mode: 'longest' } },
                    {
                        processor: 'crop',
                        options: {
                            width: 1200,
                            height: 1200,
                            mode: 'object',
                            objectsToDetect: ['product', 'item'],
                            confidenceThreshold: 75
                        }
                    },
                    { processor: 'optimize', options: { quality: 90, format: 'auto', compressionMode: 'balanced' } }
                ]
            },
            'favicon-package': {
                name: 'Favicon Package',
                description: 'Generate complete favicon set for all devices',
                steps: [
                    { processor: 'resize', options: { dimension: 512, mode: 'longest' } },
                    {
                        processor: 'crop',
                        options: {
                            width: 512,
                            height: 512,
                            mode: 'smart',
                            confidenceThreshold: 70
                        }
                    },
                    {
                        processor: 'favicon', options: {
                            sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
                            formats: ['png', 'ico'],
                            generateManifest: true,
                            generateHTML: true
                        }
                    },
                    { processor: 'rename', options: { pattern: '{name}-favicon-{size}' } }
                ]
            },
            'optimization-only': {
                name: 'Optimization Only',
                description: 'Optimize images without resizing or cropping',
                steps: [
                    {
                        processor: 'optimize',
                        options: {
                            quality: 85,
                            format: 'auto',
                            maxDisplayWidth: 1920,
                            compressionMode: 'adaptive',
                            browserSupport: ['modern', 'legacy']
                        }
                    }
                ]
            }
        }

        const template = templates[templateName]
        if (!template) {
            throw new Error(`Unknown template: ${templateName}`)
        }

        return LemGendTask.importConfig(template)
    }

    /**
     * Update metadata
     * @private
     */
    _updateMetadata = () => {
        const enabledSteps = this.getEnabledSteps()

        this.metadata.estimatedDuration = this.getTimeEstimate().total
        this.metadata.estimatedOutputs = this._estimateOutputCount()
        this.metadata.stepCount = enabledSteps.length

        const processorCount = {}
        enabledSteps.forEach(step => {
            processorCount[step.processor] = (processorCount[step.processor] || 0) + 1
        })
        this.metadata.processorCount = processorCount

        if (processorCount.favicon > 0) {
            this.metadata.category = 'favicon'
        } else if (processorCount.template > 0) {
            this.metadata.category = 'template'
        } else if (processorCount.optimize > 0 && processorCount.resize === 0 && processorCount.crop === 0) {
            this.metadata.category = 'optimization-only'
        } else {
            this.metadata.category = 'general'
        }

        this.metadata.hasSmartCrop = enabledSteps.some(s => s.processor === 'crop' &&
            ['smart', 'face', 'object'].includes(s.options.mode))
        this.metadata.hasAutoOptimization = enabledSteps.some(s =>
            s.processor === 'optimize' && s.options.format === 'auto'
        )
    }

    /**
     * Clone the task
     * @returns {LemGendTask} Cloned task
     */
    clone = () => {
        return LemGendTask.importConfig(this.exportConfig())
    }

    /**
     * Create a simplified version of the task for UI display
     * @returns {Object} Simplified task info
     */
    toSimpleObject = () => {
        const summary = this.getValidationSummary()

        return {
            id: this.id,
            name: this.name,
            description: this.description,
            stepCount: this.steps.length,
            enabledStepCount: this.getEnabledSteps().length,
            hasFavicon: summary.hasFavicon,
            hasSmartCrop: summary.hasSmartCrop,
            hasAutoOptimization: summary.hasAutoOptimization,
            taskType: summary.taskType,
            status: summary.status,
            canProceed: summary.canProceed,
            estimatedOutputs: summary.estimatedOutputs,
            optimizationLevel: summary.optimizationLevel,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    /**
     * Check if task is compatible with image type
     * @param {string} mimeType - Image MIME type
     * @returns {Object} Compatibility result
     */
    checkCompatibility = (mimeType) => {
        const enabledSteps = this.getEnabledSteps()
        const hasFavicon = enabledSteps.some(s => s.processor === 'favicon')
        const hasSmartCrop = enabledSteps.some(s => s.processor === 'crop' &&
            ['smart', 'face', 'object'].includes(s.options.mode))
        const hasOptimization = enabledSteps.some(s => s.processor === 'optimize')

        let compatible = true
        const warnings = []
        const errors = []

        if (mimeType === 'image/svg+xml') {
            if (hasFavicon) {
                warnings.push('SVG to favicon conversion may not preserve all features')
            }

            if (hasSmartCrop) {
                warnings.push('SVG images will be rasterized before smart cropping')
            }
        }

        if (mimeType === 'image/gif') {
            if (hasFavicon) {
                warnings.push('Animated GIFs will lose animation in favicon conversion')
            }

            if (hasSmartCrop) {
                warnings.push('Smart crop will use first frame of animated GIF')
            }

            if (hasOptimization) {
                warnings.push('GIF optimization may reduce animation quality')
            }
        }

        if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') {
            warnings.push('ICO files contain multiple images; processing may use first frame only')
        }

        return {
            compatible,
            warnings,
            errors,
            recommended: warnings.length === 0 && errors.length === 0
        }
    }
}