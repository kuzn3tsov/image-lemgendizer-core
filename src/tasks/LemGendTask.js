/**
 * LemGendTask - Unified processing pipeline with favicon support
 * @class
 * @description Orchestrates multiple image processing operations in sequence
 */

// Import centralized validation functions
import {
    validateTask,
    validateOptimizationOptions,
    ValidationWarnings,
    validateFaviconOptions,
    validateTaskSteps,
    validateTaskLogic
} from '../utils/validationUtils.js'

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
                optimize: '2.0.0',
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
     * @param {string} processor - Processor name
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

                const validBrowserSupport = ['modern', 'legacy', 'all']
                validatedOptions.browserSupport = validatedOptions.browserSupport.filter(support =>
                    validBrowserSupport.includes(support)
                )
                if (validatedOptions.browserSupport.length === 0) {
                    validatedOptions.browserSupport = ['modern', 'legacy']
                }

                const validCompressionModes = ['adaptive', 'aggressive', 'balanced']
                if (!validCompressionModes.includes(validatedOptions.compressionMode)) {
                    validatedOptions.compressionMode = 'adaptive'
                }

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
     */
    addRename = (pattern, additionalOptions = {}) => {
        return this.addStep('rename', {
            pattern,
            ...additionalOptions
        })
    }

    /**
     * Add template step
     */
    addTemplate = (templateId, additionalOptions = {}) => {
        return this.addStep('template', {
            templateId,
            ...additionalOptions
        })
    }

    /**
     * Add favicon generation step
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
     */
    getEnabledSteps = () => {
        return this.steps.filter(step => step.enabled)
    }

    /**
     * Get steps by processor type
     */
    getStepsByProcessor = (processor) => {
        return this.steps.filter(step => step.processor === processor)
    }

    /**
     * Check if task has specific processor
     */
    hasProcessor = (processor) => {
        return this.getEnabledSteps().some(step => step.processor === processor)
    }

    /**
     * Check if task has optimization step
     */
    hasOptimization = () => {
        return this.hasProcessor('optimize')
    }

    /**
     * Get optimization step if exists
     */
    getOptimizationStep = () => {
        return this.getEnabledSteps().find(step => step.processor === 'optimize') || null
    }

    /**
     * Validate task against an image
     */
    validate = async (lemGendImage) => {
        const validation = await validateTask(this, lemGendImage)

        // Update local state
        this.validationWarnings = validation.warnings || []
        this.validationErrors = validation.errors || []

        return validation
    }

    /**
     * Get validation summary
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
                complexityFactor = 3
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
     */
    clone = () => {
        return LemGendTask.importConfig(this.exportConfig())
    }

    /**
     * Create a simplified version of the task for UI display
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