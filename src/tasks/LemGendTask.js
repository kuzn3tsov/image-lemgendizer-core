/**
 * LemGendTask - Unified processing pipeline with favicon support
 * @class
 * @description Orchestrates multiple image processing operations in sequence
 */

// Import centralized validation functions
import {
    validateTask,
    validateTaskSteps,
    validateTaskLogic
} from '../utils/validationUtils.js';

// Import template utilities
import { getTemplateById } from '../utils/templateUtils.js';

// Import constants
import {
    ProcessorTypes,
    ResizeAlgorithms,
    ResizeModes,
    CropModes,
    OptimizationFormats,
    CompressionModes,
    QualityTargets,
    BrowserSupport,
    Defaults,
    TaskTypes,
    OptimizationLevels,
    TemplateCategories,
    ErrorCodes,
    WarningCodes
} from '../constants/sharedConstants.js';

// Import processing utilities
import { formatFileSize } from '../utils/imageUtils.js';

export class LemGendTask {
    /**
     * Create a new LemGendTask
     * @param {string} name - Task name
     * @param {string} description - Task description
     */
    constructor(name = Defaults.TASK_NAME, description = Defaults.TASK_DESCRIPTION) {
        this.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.description = description;
        this.steps = [];
        this.validationWarnings = [];
        this.validationErrors = [];
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.metadata = {
            version: '3.0.0',
            processorVersions: {
                resize: '3.0.0',
                crop: '3.0.0',
                optimize: '3.0.0',
                rename: '3.0.0',
                template: '3.0.0',
                favicon: '3.0.0',
            },
            estimatedDuration: null,
            estimatedOutputs: 0,
            supportsFavicon: true,
            supportsSVG: true,
            supportsAICropping: true,
            maxBatchSize: Defaults.MAX_BATCH_SIZE,
            defaultResizeMode: Defaults.RESIZE_MODE,
            supportsOptimizationFirst: Defaults.OPTIMIZATION_FIRST,
            optimizationModes: Object.values(CompressionModes),
            totalSteps: 0,
            enabledSteps: 0,
            processorCount: {},
            category: TemplateCategories.GENERAL
        };

        // Task statistics
        this.statistics = {
            timesUsed: 0,
            lastUsed: null,
            successCount: 0,
            failureCount: 0,
            averageProcessingTime: 0
        };
    }

    /**
     * Add a processing step
     * @param {string} processor - Processor name
     * @param {Object} options - Processor options
     * @returns {LemGendTask} This task instance for chaining
     */
    addStep = (processor, options) => {
        const validProcessors = Object.values(ProcessorTypes);

        if (!validProcessors.includes(processor)) {
            throw new Error(`Invalid processor: ${processor}. Valid options: ${validProcessors.join(', ')}`);
        }

        // Validate step options before adding
        const validatedOptions = this._validateStepOptions(processor, options);

        // Check for potential issues
        const warnings = this._checkStepWarnings(processor, validatedOptions);
        if (warnings.length > 0) {
            console.warn(`Warnings for ${processor} step:`, warnings);
        }

        const step = {
            id: `step_${this.steps.length + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            processor,
            options: validatedOptions,
            order: this.steps.length + 1,
            addedAt: new Date().toISOString(),
            enabled: true,
            metadata: {
                requiresFavicon: processor === ProcessorTypes.FAVICON,
                isBatchable: ![ProcessorTypes.FAVICON, ProcessorTypes.TEMPLATE].includes(processor),
                outputType: this._getStepOutputType(processor, validatedOptions),
                supportsOptimizationFirst: processor === ProcessorTypes.OPTIMIZE,
                warnings: warnings
            }
        };

        this.steps.push(step);
        this.updatedAt = new Date().toISOString();
        this._updateMetadata();

        return this;
    }

    /**
     * Check for step warnings
     * @private
     */
    _checkStepWarnings = (processor, options) => {
        const warnings = [];

        switch (processor) {
            case ProcessorTypes.RESIZE:
                if (options.dimension > 4000) {
                    warnings.push({
                        code: WarningCodes.VERY_LARGE_DIMENSION,
                        message: `Very large target dimension (${options.dimension}px)`,
                        severity: 'warning'
                    });
                }
                if (options.dimension < 50) {
                    warnings.push({
                        code: WarningCodes.VERY_SMALL_DIMENSION,
                        message: `Very small target dimension (${options.dimension}px)`,
                        severity: 'warning'
                    });
                }
                break;

            case ProcessorTypes.CROP:
                // Validate crop options properly
                const cropValidation = this._validateCropOptions(options);
                if (cropValidation.warnings) {
                    warnings.push(...cropValidation.warnings);
                }

                // Check aspect ratio
                if (options.width && options.height) {
                    const aspectRatio = options.width / options.height;
                    if (aspectRatio > 5 || aspectRatio < 0.2) {
                        warnings.push({
                            code: WarningCodes.EXTREME_ASPECT_RATIO,
                            message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
                            severity: 'warning'
                        });
                    }
                }
                break;

            case ProcessorTypes.OPTIMIZE:
                const optimizeValidation = this._validateOptimizationOptions(options);
                if (optimizeValidation.warnings) {
                    warnings.push(...optimizeValidation.warnings);
                }

                if (options.format === OptimizationFormats.AVIF &&
                    options.browserSupport &&
                    !options.browserSupport.includes(BrowserSupport.MODERN)) {
                    warnings.push({
                        code: WarningCodes.AVIF_BROWSER_SUPPORT,
                        message: 'AVIF format may not be supported in legacy browsers',
                        severity: 'warning'
                    });
                }
                break;

            case ProcessorTypes.RENAME:
                const renameValidation = this._validateRenamePattern(options.pattern);
                if (renameValidation.warnings) {
                    warnings.push(...renameValidation.warnings);
                }
                break;

            case ProcessorTypes.TEMPLATE:
                if (!options.templateId) {
                    warnings.push({
                        code: ErrorCodes.MISSING_TEMPLATE_ID,
                        message: 'Template ID is required',
                        severity: 'warning'
                    });
                } else {
                    const template = getTemplateById(options.templateId);
                    if (!template) {
                        warnings.push({
                            code: ErrorCodes.TEMPLATE_NOT_FOUND,
                            message: `Template not found: ${options.templateId}`,
                            severity: 'warning'
                        });
                    }
                }
                break;
        }

        return warnings;
    }

    /**
     * Simple crop validation helper
     * @private
     */
    _validateCropOptions = (options) => {
        const result = { valid: true, warnings: [] };

        if (options.width && options.height) {
            if (options.width < 10 || options.height < 10) {
                result.warnings.push({
                    code: WarningCodes.SMALL_CROP_SIZE,
                    message: `Crop dimensions very small: ${options.width}x${options.height}`,
                    severity: 'warning'
                });
            }

            if (options.width > 10000 || options.height > 10000) {
                result.warnings.push({
                    code: WarningCodes.LARGE_CROP_SIZE,
                    message: `Crop dimensions very large: ${options.width}x${options.height}`,
                    severity: 'warning'
                });
            }
        }

        return result;
    }

    /**
     * Simple optimization validation helper
     * @private
     */
    _validateOptimizationOptions = (options) => {
        const result = { valid: true, warnings: [] };

        if (options.quality && (options.quality < 1 || options.quality > 100)) {
            result.warnings.push({
                code: WarningCodes.LOSSLESS_QUALITY_CONFLICT,
                message: `Quality ${options.quality}% is outside valid range (1-100)`,
                severity: 'warning'
            });
        }

        return result;
    }

    /**
     * Simple rename pattern validation helper
     * @private
     */
    _validateRenamePattern = (pattern) => {
        const result = { valid: true, warnings: [] };

        if (!pattern || pattern.trim() === '') {
            result.warnings.push({
                code: WarningCodes.NO_PLACEHOLDERS,
                message: 'Rename pattern is empty',
                severity: 'warning'
            });
        }

        return result;
    }

    /**
     * Validate step options based on processor type
     * @private
     */
    _validateStepOptions = (processor, options) => {
        const defaults = {
            [ProcessorTypes.RESIZE]: {
                dimension: Defaults.DEFAULT_DIMENSION,
                mode: Defaults.RESIZE_MODE,
                maintainAspectRatio: true,
                upscale: true,
                algorithm: Defaults.RESIZE_ALGORITHM,
                forceSquare: false
            },
            [ProcessorTypes.CROP]: {
                width: Defaults.DEFAULT_CROP_WIDTH,
                height: Defaults.DEFAULT_CROP_HEIGHT,
                mode: Defaults.CROP_MODE,
                upscale: false,
                preserveAspectRatio: true,
                confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD,
                cropToFit: true,
                objectsToDetect: ['person', 'face', 'car', 'dog', 'cat'],
                algorithm: Defaults.CROP_ALGORITHM
            },
            [ProcessorTypes.OPTIMIZE]: {
                quality: Defaults.OPTIMIZATION_QUALITY,
                format: Defaults.OPTIMIZATION_FORMAT,
                lossless: false,
                stripMetadata: Defaults.STRIP_METADATA,
                preserveTransparency: Defaults.PRESERVE_TRANSPARENCY,
                maxDisplayWidth: null,
                browserSupport: Defaults.BROWSER_SUPPORT,
                compressionMode: Defaults.COMPRESSION_MODE,
                analyzeContent: Defaults.ANALYZE_CONTENT,
                icoSizes: Defaults.FAVICON_SIZES,
                progressive: Defaults.PROGRESSIVE,
                qualityTarget: Defaults.QUALITY_TARGET
            },
            [ProcessorTypes.RENAME]: {
                pattern: Defaults.RENAME_PATTERN,
                preserveExtension: Defaults.PRESERVE_EXTENSION,
                addIndex: Defaults.ADD_INDEX,
                addTimestamp: Defaults.ADD_TIMESTAMP,
                customSeparator: Defaults.DEFAULT_SEPARATOR,
                usePaddedIndex: Defaults.USE_PADDED_INDEX,
                dateFormat: Defaults.DATE_FORMAT,
                maxLength: Defaults.MAX_FILENAME_LENGTH
            },
            [ProcessorTypes.TEMPLATE]: {
                templateId: null,
                applyToAll: true,
                preserveOriginal: false,
                overrideDimensions: false
            },
            [ProcessorTypes.FAVICON]: {
                sizes: Defaults.FAVICON_SIZES,
                formats: Defaults.FAVICON_FORMATS,
                generateManifest: Defaults.GENERATE_MANIFEST,
                generateHTML: Defaults.GENERATE_HTML,
                includeAppleTouch: Defaults.INCLUDE_APPLE_TOUCH,
                includeAndroid: Defaults.INCLUDE_ANDROID,
                roundCorners: Defaults.ROUND_CORNERS,
                backgroundColor: Defaults.BACKGROUND_COLOR,
                padding: Defaults.PADDING
            }
        };

        const validatedOptions = { ...defaults[processor], ...options };

        // Validate specific processor options
        switch (processor) {
            case ProcessorTypes.FAVICON:
                validatedOptions.sizes = [...new Set(validatedOptions.sizes.sort((a, b) => a - b))];
                validatedOptions.sizes = validatedOptions.sizes.filter(size => size >= 16 && size <= 512);

                // Validate formats
                const validFaviconFormats = ['png', 'ico', 'svg'];
                validatedOptions.formats = validatedOptions.formats.filter(format =>
                    validFaviconFormats.includes(format)
                );
                if (validatedOptions.formats.length === 0) {
                    validatedOptions.formats = Defaults.FAVICON_FORMATS;
                }
                break;

            case ProcessorTypes.OPTIMIZE:
                // Handle transparency conflict
                if (validatedOptions.format === OptimizationFormats.JPEG && validatedOptions.preserveTransparency) {
                    validatedOptions.format = OptimizationFormats.PNG;
                    console.warn('Changed format from JPG to PNG to preserve transparency');
                }

                // Validate browser support
                validatedOptions.browserSupport = validatedOptions.browserSupport.filter(support =>
                    Object.values(BrowserSupport).includes(support)
                );
                if (validatedOptions.browserSupport.length === 0) {
                    validatedOptions.browserSupport = Defaults.BROWSER_SUPPORT;
                }

                // Validate compression mode
                if (!Object.values(CompressionModes).includes(validatedOptions.compressionMode)) {
                    validatedOptions.compressionMode = Defaults.COMPRESSION_MODE;
                }

                // AVIF quality adjustment
                if (validatedOptions.format === OptimizationFormats.AVIF) {
                    validatedOptions.quality = Math.min(63, validatedOptions.quality);
                }

                // Validate quality target
                if (!Object.values(QualityTargets).includes(validatedOptions.qualityTarget)) {
                    validatedOptions.qualityTarget = Defaults.QUALITY_TARGET;
                }
                break;

            case ProcessorTypes.CROP:
                // Validate AI modes
                const aiModes = [CropModes.SMART, CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY];
                if (aiModes.includes(validatedOptions.mode)) {
                    validatedOptions.confidenceThreshold = Math.max(0, Math.min(100, validatedOptions.confidenceThreshold || Defaults.CONFIDENCE_THRESHOLD));
                    validatedOptions.multipleFaces = validatedOptions.multipleFaces || false;

                    if (!Array.isArray(validatedOptions.objectsToDetect)) {
                        validatedOptions.objectsToDetect = ['person', 'face', 'car', 'dog', 'cat'];
                    }
                }

                // Validate algorithm
                const validCropAlgorithms = Object.values(ResizeAlgorithms);
                if (!validCropAlgorithms.includes(validatedOptions.algorithm)) {
                    validatedOptions.algorithm = Defaults.CROP_ALGORITHM;
                }
                break;

            case ProcessorTypes.RENAME:
                // Validate pattern has at least one placeholder
                const placeholders = ['{name}', '{index}', '{timestamp}', '{width}', '{height}', '{dimensions}'];
                if (!placeholders.some(ph => validatedOptions.pattern.includes(ph))) {
                    validatedOptions.pattern = '{name}-{index}';
                    console.warn('Added index placeholder to rename pattern for uniqueness');
                }

                // Validate max length
                if (validatedOptions.maxLength < 10 || validatedOptions.maxLength > 500) {
                    validatedOptions.maxLength = Defaults.MAX_FILENAME_LENGTH;
                }
                break;

            case ProcessorTypes.TEMPLATE:
                // Validate template exists if ID provided
                if (validatedOptions.templateId) {
                    const template = getTemplateById(validatedOptions.templateId);
                    if (!template) {
                        console.warn(`Template not found: ${validatedOptions.templateId}`);
                    }
                }
                break;
        }

        return validatedOptions;
    }

    /**
     * Get step output type
     * @private
     */
    _getStepOutputType = (processor, options) => {
        switch (processor) {
            case ProcessorTypes.OPTIMIZE:
                return options.format === OptimizationFormats.AUTO ? 'optimized-auto' : `optimized-${options.format}`;
            case ProcessorTypes.FAVICON:
                return 'favicon-set';
            case ProcessorTypes.TEMPLATE:
                return 'template-applied';
            case ProcessorTypes.RESIZE:
                return options.forceSquare ? 'square-resized' : 'resized';
            case ProcessorTypes.CROP:
                const aiModes = [CropModes.SMART, CropModes.FACE, CropModes.OBJECT];
                return aiModes.includes(options.mode) ? 'smart-cropped' : 'cropped';
            default:
                return 'processed';
        }
    }

    /**
     * Add resize step
     */
    addResize = (dimension, mode = Defaults.RESIZE_MODE, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.RESIZE, {
            dimension,
            mode,
            ...additionalOptions
        });
    }

    /**
     * Add crop step
     */
    addCrop = (width, height, mode = CropModes.SMART, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.CROP, {
            width,
            height,
            mode,
            ...additionalOptions
        });
    }

    /**
     * Add smart crop step with AI detection
     */
    addSmartCrop = (width, height, options = {}) => {
        return this.addStep(ProcessorTypes.CROP, {
            width,
            height,
            mode: CropModes.SMART,
            confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD,
            multipleFaces: true,
            cropToFit: true,
            ...options
        });
    }

    /**
     * Add optimization step with enhanced options
     */
    addOptimize = (quality = Defaults.OPTIMIZATION_QUALITY, format = Defaults.OPTIMIZATION_FORMAT, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.OPTIMIZE, {
            quality,
            format,
            maxDisplayWidth: additionalOptions.maxDisplayWidth || null,
            browserSupport: additionalOptions.browserSupport || Defaults.BROWSER_SUPPORT,
            compressionMode: additionalOptions.compressionMode || Defaults.COMPRESSION_MODE,
            analyzeContent: additionalOptions.analyzeContent !== false,
            progressive: additionalOptions.progressive !== false,
            qualityTarget: additionalOptions.qualityTarget || Defaults.QUALITY_TARGET,
            ...additionalOptions
        });
    }

    /**
     * Add optimization-first step for web delivery
     */
    addWebOptimization = (options = {}) => {
        return this.addStep(ProcessorTypes.OPTIMIZE, {
            quality: Defaults.OPTIMIZATION_QUALITY,
            format: OptimizationFormats.AUTO,
            maxDisplayWidth: 1920,
            browserSupport: Defaults.BROWSER_SUPPORT,
            compressionMode: CompressionModes.ADAPTIVE,
            stripMetadata: Defaults.STRIP_METADATA,
            preserveTransparency: Defaults.PRESERVE_TRANSPARENCY,
            progressive: Defaults.PROGRESSIVE,
            qualityTarget: Defaults.QUALITY_TARGET,
            ...options
        });
    }

    /**
     * Add rename step
     */
    addRename = (pattern, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.RENAME, {
            pattern,
            usePaddedIndex: additionalOptions.usePaddedIndex !== false,
            dateFormat: additionalOptions.dateFormat || Defaults.DATE_FORMAT,
            maxLength: additionalOptions.maxLength || Defaults.MAX_FILENAME_LENGTH,
            ...additionalOptions
        });
    }

    /**
     * Add template step
     */
    addTemplate = (templateId, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.TEMPLATE, {
            templateId,
            overrideDimensions: additionalOptions.overrideDimensions || false,
            ...additionalOptions
        });
    }

    /**
     * Add favicon generation step
     */
    addFavicon = (sizes = Defaults.FAVICON_SIZES, formats = Defaults.FAVICON_FORMATS, additionalOptions = {}) => {
        return this.addStep(ProcessorTypes.FAVICON, {
            sizes,
            formats,
            padding: additionalOptions.padding || Defaults.PADDING,
            ...additionalOptions
        });
    }

    /**
     * Remove a step by ID or index
     */
    removeStep = (identifier) => {
        let index;

        if (typeof identifier === 'number') {
            index = identifier;
        } else {
            index = this.steps.findIndex(step => step.id === identifier);
        }

        if (index >= 0 && index < this.steps.length) {
            const removedStep = this.steps.splice(index, 1)[0];

            // Reorder remaining steps
            this.steps.forEach((step, idx) => {
                step.order = idx + 1;
            });

            this.updatedAt = new Date().toISOString();
            this._updateMetadata();

            console.log(`Removed step: ${removedStep.processor} (order: ${removedStep.order})`);
            return true;
        }

        return false;
    }

    /**
     * Move step up in order
     */
    moveStepUp = (index) => {
        if (index <= 0 || index >= this.steps.length) {
            return false;
        }

        [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];

        // Update orders
        this.steps.forEach((step, idx) => {
            step.order = idx + 1;
        });

        this.updatedAt = new Date().toISOString();
        console.log(`Moved step ${index} up to position ${index - 1}`);
        return true;
    }

    /**
     * Move step down in order
     */
    moveStepDown = (index) => {
        if (index < 0 || index >= this.steps.length - 1) {
            return false;
        }

        [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];

        // Update orders
        this.steps.forEach((step, idx) => {
            step.order = idx + 1;
        });

        this.updatedAt = new Date().toISOString();
        console.log(`Moved step ${index} down to position ${index + 1}`);
        return true;
    }

    /**
     * Enable/disable a step
     */
    setStepEnabled = (index, enabled = true) => {
        if (index >= 0 && index < this.steps.length) {
            const wasEnabled = this.steps[index].enabled;
            this.steps[index].enabled = enabled;
            this.updatedAt = new Date().toISOString();
            this._updateMetadata();

            if (wasEnabled !== enabled) {
                console.log(`${enabled ? 'Enabled' : 'Disabled'} step ${index}: ${this.steps[index].processor}`);
            }
            return true;
        }
        return false;
    }

    /**
     * Get enabled steps only
     */
    getEnabledSteps = () => {
        return this.steps.filter(step => step.enabled);
    }

    /**
     * Get steps by processor type
     */
    getStepsByProcessor = (processor) => {
        return this.steps.filter(step => step.processor === processor);
    }

    /**
     * Check if task has specific processor
     */
    hasProcessor = (processor) => {
        return this.getEnabledSteps().some(step => step.processor === processor);
    }

    /**
     * Check if task has optimization step
     */
    hasOptimization = () => {
        return this.hasProcessor(ProcessorTypes.OPTIMIZE);
    }

    /**
     * Get optimization step if exists
     */
    getOptimizationStep = () => {
        return this.getEnabledSteps().find(step => step.processor === ProcessorTypes.OPTIMIZE) || null;
    }

    /**
     * Validate task against an image
     */
    validate = async (lemGendImage) => {
        try {
            const validation = await validateTask(this, lemGendImage);

            // Update local state
            this.validationWarnings = validation.warnings || [];
            this.validationErrors = validation.errors || [];

            // Log validation results
            if (validation.isValid) {
                console.log('Task validation passed:', {
                    warnings: validation.warnings?.length || 0,
                    errors: validation.errors?.length || 0
                });
            } else {
                console.warn('Task validation failed:', validation.errors);
            }

            return validation;
        } catch (error) {
            console.error('Task validation error:', error);
            throw new Error(`Task validation failed: ${error.message}`);
        }
    }

    /**
     * Run step validation
     */
    validateSteps = (imageInfo = null) => {
        const enabledSteps = this.getEnabledSteps();
        return validateTaskSteps(enabledSteps, imageInfo);
    }

    /**
     * Run logic validation
     */
    validateLogic = () => {
        const enabledSteps = this.getEnabledSteps();
        return validateTaskLogic(enabledSteps);
    }

    /**
     * Get validation summary
     */
    getValidationSummary = () => {
        const enabledSteps = this.getEnabledSteps();
        const errorCount = this.validationErrors.length;
        const warningCount = this.validationWarnings.length;

        const processorCount = {};
        enabledSteps.forEach(step => {
            processorCount[step.processor] = (processorCount[step.processor] || 0) + 1;
        });

        let taskType = TaskTypes.GENERAL;
        if (processorCount[ProcessorTypes.FAVICON] > 0) {
            taskType = TaskTypes.FAVICON;
        } else if (processorCount[ProcessorTypes.TEMPLATE] > 0) {
            taskType = TaskTypes.TEMPLATE;
        } else if (processorCount[ProcessorTypes.OPTIMIZE] > 0 && processorCount[ProcessorTypes.RESIZE] === 0 && processorCount[ProcessorTypes.CROP] === 0) {
            taskType = TaskTypes.OPTIMIZATION_ONLY;
        } else if (processorCount[ProcessorTypes.RESIZE] > 0 && processorCount[ProcessorTypes.CROP] === 0 && processorCount[ProcessorTypes.OPTIMIZE] === 0) {
            taskType = TaskTypes.RESIZE_ONLY;
        } else if (processorCount[ProcessorTypes.CROP] > 0 && processorCount[ProcessorTypes.RESIZE] === 0 && processorCount[ProcessorTypes.OPTIMIZE] === 0) {
            taskType = TaskTypes.CROP_ONLY;
        }

        const hasSmartCrop = enabledSteps.some(s => s.processor === ProcessorTypes.CROP &&
            [CropModes.SMART, CropModes.FACE, CropModes.OBJECT].includes(s.options.mode));
        const hasAutoOptimization = enabledSteps.some(s =>
            s.processor === ProcessorTypes.OPTIMIZE && s.options.format === OptimizationFormats.AUTO
        );

        return {
            totalSteps: this.steps.length,
            enabledSteps: enabledSteps.length,
            disabledSteps: this.steps.length - enabledSteps.length,
            errorCount,
            warningCount,
            processorCount,
            taskType,
            status: errorCount > 0 ? 'invalid' : warningCount > 0 ? 'has_warnings' : 'valid',
            canProceed: errorCount === 0,
            requiresImage: enabledSteps.some(s => [ProcessorTypes.RESIZE, ProcessorTypes.CROP, ProcessorTypes.OPTIMIZE, ProcessorTypes.FAVICON].includes(s.processor)),
            hasFavicon: processorCount[ProcessorTypes.FAVICON] > 0,
            hasSmartCrop,
            hasAutoOptimization,
            estimatedOutputs: this._estimateOutputCount(),
            optimizationLevel: this._getOptimizationLevel(),
            stepOrder: enabledSteps.map(s => s.processor)
        };
    }

    /**
     * Get optimization level based on settings
     * @private
     */
    _getOptimizationLevel = () => {
        const optimizeStep = this.getEnabledSteps().find(s => s.processor === ProcessorTypes.OPTIMIZE);
        if (!optimizeStep) return OptimizationLevels.NONE;

        const { compressionMode, quality, format, qualityTarget } = optimizeStep.options;

        if (compressionMode === CompressionModes.AGGRESSIVE && quality < 70) {
            return OptimizationLevels.AGGRESSIVE;
        } else if (compressionMode === CompressionModes.ADAPTIVE || (quality >= 70 && quality <= 90)) {
            return OptimizationLevels.BALANCED;
        } else if (compressionMode === CompressionModes.BALANCED && quality > 90) {
            return OptimizationLevels.HIGH_QUALITY;
        } else if (qualityTarget === QualityTargets.BEST) {
            return OptimizationLevels.MAXIMUM_QUALITY;
        } else if (qualityTarget === QualityTargets.SMALLEST) {
            return OptimizationLevels.MAXIMUM_COMPRESSION;
        }

        return OptimizationLevels.STANDARD;
    }

    /**
     * Estimate number of outputs
     * @private
     */
    _estimateOutputCount = () => {
        const enabledSteps = this.getEnabledSteps();
        let count = 1;

        enabledSteps.forEach(step => {
            if (step.processor === ProcessorTypes.FAVICON) {
                const { sizes = [], formats = [] } = step.options;
                count += sizes.length * formats.length;

                if (step.options.generateManifest) count++;
                if (step.options.generateHTML) count++;
                if (step.options.includeAppleTouch) count++;
                if (step.options.includeAndroid) count++;
            } else if (step.processor === ProcessorTypes.OPTIMIZE) {
                const { format } = step.options;
                if (Array.isArray(format)) {
                    count += format.length - 1;
                }
            } else if (step.processor === ProcessorTypes.TEMPLATE) {
                // Templates might create multiple outputs
                count += step.options.applyToAll ? 0 : 1;
            }
        });

        return count;
    }

    /**
     * Get task description
     */
    getDescription = () => {
        const enabledSteps = this.getEnabledSteps();

        if (enabledSteps.length === 0) {
            return 'No processing steps configured';
        }

        const descriptions = enabledSteps.map((step, index) => {
            const stepNum = index + 1;
            const processor = step.processor.charAt(0).toUpperCase() + step.processor.slice(1);

            switch (step.processor) {
                case ProcessorTypes.RESIZE:
                    return `${stepNum}. LemGendaryResize™ to ${step.options.dimension}px (${step.options.mode})`;
                case ProcessorTypes.CROP:
                    const { mode, width, height } = step.options;
                    let cropDesc = `${stepNum}. LemGendaryCrop™ to ${width}×${height}`;

                    if ([CropModes.SMART, CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY].includes(mode)) {
                        cropDesc += ` (AI ${mode} mode)`;
                    } else {
                        cropDesc += ` (${mode})`;
                    }

                    return cropDesc;
                case ProcessorTypes.OPTIMIZE:
                    const formatStr = step.options.format === OptimizationFormats.AUTO
                        ? 'auto (intelligent selection)'
                        : step.options.format.toUpperCase();

                    let optimizeDesc = `${stepNum}. LemGendaryOptimize™ to ${formatStr} (${step.options.quality}%)`;

                    if (step.options.maxDisplayWidth) {
                        optimizeDesc += `, max ${step.options.maxDisplayWidth}px`;
                    }

                    if (step.options.compressionMode && step.options.compressionMode !== CompressionModes.ADAPTIVE) {
                        optimizeDesc += `, ${step.options.compressionMode} compression`;
                    }

                    if (step.options.browserSupport) {
                        optimizeDesc += `, ${step.options.browserSupport.join('+')} browsers`;
                    }

                    if (step.options.qualityTarget && step.options.qualityTarget !== QualityTargets.BALANCED) {
                        optimizeDesc += `, ${step.options.qualityTarget} target`;
                    }

                    return optimizeDesc;
                case ProcessorTypes.RENAME:
                    return `${stepNum}. Rename with pattern: "${step.options.pattern}"`;
                case ProcessorTypes.TEMPLATE:
                    return `${stepNum}. Apply template: ${step.options.templateId || 'unknown'}`;
                case ProcessorTypes.FAVICON:
                    const sizeCount = step.options.sizes?.length || 0;
                    const formatCount = step.options.formats?.length || 0;
                    return `${stepNum}. Generate favicon set (${sizeCount} sizes, ${formatCount} formats)`;
                default:
                    return `${stepNum}. ${processor}`;
            }
        });

        return descriptions.join('\n');
    }

    /**
     * Get estimated processing time
     */
    getTimeEstimate = (imageCount = 1) => {
        const enabledSteps = this.getEnabledSteps();

        const stepTimes = {
            [ProcessorTypes.RESIZE]: 100,
            [ProcessorTypes.CROP]: 150,
            [ProcessorTypes.OPTIMIZE]: 200,
            [ProcessorTypes.RENAME]: 10,
            [ProcessorTypes.TEMPLATE]: 300,
            [ProcessorTypes.FAVICON]: 500
        };

        let totalMs = 0;
        let complexityFactor = 1;

        enabledSteps.forEach(step => {
            const baseTime = stepTimes[step.processor] || 100;

            if (step.processor === ProcessorTypes.FAVICON) {
                const sizeCount = step.options.sizes?.length || 1;
                const formatCount = step.options.formats?.length || 1;
                complexityFactor = sizeCount * formatCount;
            } else if (step.processor === ProcessorTypes.CROP &&
                [CropModes.SMART, CropModes.FACE, CropModes.OBJECT].includes(step.options.mode)) {
                complexityFactor = 3;
            } else if (step.processor === ProcessorTypes.OPTIMIZE) {
                if (step.options.compressionMode === CompressionModes.AGGRESSIVE) {
                    complexityFactor = 1.5;
                }
                if (step.options.analyzeContent) {
                    complexityFactor *= 1.2;
                }
                if (step.options.format === OptimizationFormats.AVIF) {
                    complexityFactor *= 1.5; // AVIF encoding is slower
                }
            }

            totalMs += baseTime * complexityFactor;
        });

        totalMs *= imageCount;

        return {
            perImage: totalMs / imageCount,
            total: totalMs,
            formatted: this._formatTime(totalMs),
            stepCount: enabledSteps.length,
            imageCount,
            complexityFactor: Math.round(complexityFactor * 10) / 10,
            estimatedSeconds: Math.ceil(totalMs / 1000)
        };
    }

    /**
     * Format time in milliseconds
     * @private
     */
    _formatTime = (ms) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.round((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
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
            statistics: { ...this.statistics },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            validation: {
                warnings: this.validationWarnings,
                errors: this.validationErrors
            }
        };
    }

    /**
     * Import task configuration
     */
    static importConfig(config) {
        const task = new LemGendTask(config.name, config.description);
        task.id = config.id || task.id;
        task.createdAt = config.createdAt || task.createdAt;
        task.updatedAt = config.updatedAt || task.updatedAt;
        task.metadata = config.metadata || task.metadata;
        task.statistics = config.statistics || task.statistics;
        task.validationWarnings = config.validation?.warnings || [];
        task.validationErrors = config.validation?.errors || [];

        config.steps?.forEach(stepConfig => {
            task.addStep(stepConfig.processor, stepConfig.options);
            const lastStep = task.steps[task.steps.length - 1];
            lastStep.enabled = stepConfig.enabled !== false;
            lastStep.id = stepConfig.id || lastStep.id;
            lastStep.metadata = stepConfig.metadata || lastStep.metadata;
        });

        return task;
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
                    { processor: ProcessorTypes.RESIZE, options: { dimension: 1920, mode: ResizeModes.LONGEST } },
                    { processor: ProcessorTypes.OPTIMIZE, options: { quality: Defaults.OPTIMIZATION_QUALITY, format: OptimizationFormats.AUTO, compressionMode: CompressionModes.ADAPTIVE } },
                    { processor: ProcessorTypes.RENAME, options: { pattern: '{name}-{width}w' } }
                ]
            },
            'social-media': {
                name: 'Social Media Posts',
                description: 'Prepare images for social media platforms',
                steps: [
                    { processor: ProcessorTypes.RESIZE, options: { dimension: 1080, mode: ResizeModes.LONGEST } },
                    {
                        processor: ProcessorTypes.CROP,
                        options: {
                            width: 1080,
                            height: 1080,
                            mode: CropModes.SMART,
                            confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD,
                            multipleFaces: true
                        }
                    },
                    { processor: ProcessorTypes.OPTIMIZE, options: { quality: 90, format: OptimizationFormats.AUTO, compressionMode: CompressionModes.BALANCED } }
                ]
            },
            'portrait-smart': {
                name: 'Smart Portrait Cropping',
                description: 'AI-powered portrait cropping with face detection',
                steps: [
                    { processor: ProcessorTypes.RESIZE, options: { dimension: 1080, mode: ResizeModes.LONGEST } },
                    {
                        processor: ProcessorTypes.CROP,
                        options: {
                            width: 1080,
                            height: 1350,
                            mode: CropModes.FACE,
                            confidenceThreshold: 80,
                            preserveAspectRatio: true
                        }
                    },
                    { processor: ProcessorTypes.OPTIMIZE, options: { quality: 95, format: OptimizationFormats.AUTO, compressionMode: CompressionModes.ADAPTIVE } }
                ]
            },
            'product-showcase': {
                name: 'Product Showcase',
                description: 'Smart cropping for product images',
                steps: [
                    { processor: ProcessorTypes.RESIZE, options: { dimension: 1200, mode: ResizeModes.LONGEST } },
                    {
                        processor: ProcessorTypes.CROP,
                        options: {
                            width: 1200,
                            height: 1200,
                            mode: CropModes.OBJECT,
                            objectsToDetect: ['product', 'item'],
                            confidenceThreshold: 75
                        }
                    },
                    { processor: ProcessorTypes.OPTIMIZE, options: { quality: 90, format: OptimizationFormats.AUTO, compressionMode: CompressionModes.BALANCED } }
                ]
            },
            'favicon-package': {
                name: 'Favicon Package',
                description: 'Generate complete favicon set for all devices',
                steps: [
                    { processor: ProcessorTypes.RESIZE, options: { dimension: 512, mode: ResizeModes.LONGEST } },
                    {
                        processor: ProcessorTypes.CROP,
                        options: {
                            width: 512,
                            height: 512,
                            mode: CropModes.SMART,
                            confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD
                        }
                    },
                    {
                        processor: ProcessorTypes.FAVICON, options: {
                            sizes: Defaults.FAVICON_SIZES,
                            formats: Defaults.FAVICON_FORMATS,
                            generateManifest: Defaults.GENERATE_MANIFEST,
                            generateHTML: Defaults.GENERATE_HTML
                        }
                    },
                    { processor: ProcessorTypes.RENAME, options: { pattern: '{name}-favicon-{size}' } }
                ]
            },
            'optimization-only': {
                name: 'Optimization Only',
                description: 'Optimize images without resizing or cropping',
                steps: [
                    {
                        processor: ProcessorTypes.OPTIMIZE,
                        options: {
                            quality: Defaults.OPTIMIZATION_QUALITY,
                            format: OptimizationFormats.AUTO,
                            maxDisplayWidth: 1920,
                            compressionMode: CompressionModes.ADAPTIVE,
                            browserSupport: Defaults.BROWSER_SUPPORT
                        }
                    }
                ]
            }
        };

        const template = templates[templateName];
        if (!template) {
            throw new Error(`Unknown template: ${templateName}`);
        }

        return LemGendTask.importConfig(template);
    }

    /**
     * Update metadata
     * @private
     */
    _updateMetadata = () => {
        const enabledSteps = this.getEnabledSteps();

        this.metadata.estimatedDuration = this.getTimeEstimate().total;
        this.metadata.estimatedOutputs = this._estimateOutputCount();
        this.metadata.totalSteps = this.steps.length;
        this.metadata.enabledSteps = enabledSteps.length;

        const processorCount = {};
        enabledSteps.forEach(step => {
            processorCount[step.processor] = (processorCount[step.processor] || 0) + 1;
        });
        this.metadata.processorCount = processorCount;

        if (processorCount[ProcessorTypes.FAVICON] > 0) {
            this.metadata.category = TemplateCategories.FAVICON;
        } else if (processorCount[ProcessorTypes.TEMPLATE] > 0) {
            this.metadata.category = TaskTypes.TEMPLATE;
        } else if (processorCount[ProcessorTypes.OPTIMIZE] > 0 && processorCount[ProcessorTypes.RESIZE] === 0 && processorCount[ProcessorTypes.CROP] === 0) {
            this.metadata.category = TaskTypes.OPTIMIZATION_ONLY;
        } else if (processorCount[ProcessorTypes.RESIZE] > 0 && processorCount[ProcessorTypes.CROP] === 0 && processorCount[ProcessorTypes.OPTIMIZE] === 0) {
            this.metadata.category = TaskTypes.RESIZE_ONLY;
        } else if (processorCount[ProcessorTypes.CROP] > 0 && processorCount[ProcessorTypes.RESIZE] === 0 && processorCount[ProcessorTypes.OPTIMIZE] === 0) {
            this.metadata.category = TaskTypes.CROP_ONLY;
        } else {
            this.metadata.category = TemplateCategories.GENERAL;
        }

        this.metadata.hasSmartCrop = enabledSteps.some(s => s.processor === ProcessorTypes.CROP &&
            [CropModes.SMART, CropModes.FACE, CropModes.OBJECT].includes(s.options.mode));
        this.metadata.hasAutoOptimization = enabledSteps.some(s =>
            s.processor === ProcessorTypes.OPTIMIZE && s.options.format === OptimizationFormats.AUTO
        );
    }

    /**
     * Update statistics after processing
     */
    updateStatistics = (success = true, processingTime = 0) => {
        this.statistics.timesUsed++;
        this.statistics.lastUsed = new Date().toISOString();

        if (success) {
            this.statistics.successCount++;
        } else {
            this.statistics.failureCount++;
        }

        // Update average processing time
        const totalTime = this.statistics.averageProcessingTime * (this.statistics.timesUsed - 1) + processingTime;
        this.statistics.averageProcessingTime = totalTime / this.statistics.timesUsed;

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Clone the task
     */
    clone = () => {
        return LemGendTask.importConfig(this.exportConfig());
    }

    /**
     * Create a simplified version of the task for UI display
     */
    toSimpleObject = () => {
        const summary = this.getValidationSummary();

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
            updatedAt: this.updatedAt,
            statistics: {
                timesUsed: this.statistics.timesUsed,
                successRate: this.statistics.timesUsed > 0 ?
                    (this.statistics.successCount / this.statistics.timesUsed * 100).toFixed(1) + '%' :
                    '0%'
            }
        };
    }

    /**
     * Check if task is compatible with image type
     */
    checkCompatibility = (mimeType) => {
        const enabledSteps = this.getEnabledSteps();
        const hasFavicon = enabledSteps.some(s => s.processor === ProcessorTypes.FAVICON);
        const hasSmartCrop = enabledSteps.some(s => s.processor === ProcessorTypes.CROP &&
            [CropModes.SMART, CropModes.FACE, CropModes.OBJECT].includes(s.options.mode));
        const hasOptimization = enabledSteps.some(s => s.processor === ProcessorTypes.OPTIMIZE);
        const hasResize = enabledSteps.some(s => s.processor === ProcessorTypes.RESIZE);

        let compatible = true;
        const warnings = [];
        const errors = [];

        if (mimeType === 'image/svg+xml') {
            if (hasFavicon) {
                warnings.push('SVG to favicon conversion may not preserve all features');
            }

            if (hasSmartCrop) {
                warnings.push('SVG images will be rasterized before smart cropping');
            }

            if (hasResize) {
                warnings.push('SVG resize may behave differently than raster images');
            }
        }

        if (mimeType === 'image/gif') {
            if (hasFavicon) {
                warnings.push('Animated GIFs will lose animation in favicon conversion');
            }

            if (hasSmartCrop) {
                warnings.push('Smart crop will use first frame of animated GIF');
            }

            if (hasOptimization) {
                warnings.push('GIF optimization may reduce animation quality');
            }
        }

        if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') {
            warnings.push('ICO files contain multiple images; processing may use first frame only');
        }

        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
            warnings.push('HEIC/HEIF format may have limited browser support');
        }

        return {
            compatible,
            warnings,
            errors,
            recommended: warnings.length === 0 && errors.length === 0,
            supportsTransparency: !['image/jpeg', 'image/jpg'].includes(mimeType),
            supportsAnimation: mimeType === 'image/gif',
            isVector: mimeType === 'image/svg+xml'
        };
    }

    /**
     * Get recommended processing order
     */
    getRecommendedOrder = () => {
        const enabledSteps = this.getEnabledSteps();
        const order = Object.values(ProcessorTypes);

        return enabledSteps.sort((a, b) => {
            return order.indexOf(a.processor) - order.indexOf(b.processor);
        });
    }

    /**
     * Check if task order needs optimization
     */
    needsOrderOptimization = () => {
        const currentOrder = this.getEnabledSteps().map(s => s.processor);
        const recommendedOrder = this.getRecommendedOrder().map(s => s.processor);

        return JSON.stringify(currentOrder) !== JSON.stringify(recommendedOrder);
    }

    /**
     * Optimize task order
     */
    optimizeOrder = () => {
        if (!this.needsOrderOptimization()) {
            return false;
        }

        const recommendedOrder = this.getRecommendedOrder();
        const stepMap = new Map(this.steps.map(step => [step.id, step]));

        // Reorder steps based on recommended order
        const newSteps = [];
        recommendedOrder.forEach(step => {
            newSteps.push(stepMap.get(step.id));
        });

        // Add any remaining steps
        this.steps.forEach(step => {
            if (!newSteps.includes(step)) {
                newSteps.push(step);
            }
        });

        // Update orders
        newSteps.forEach((step, idx) => {
            step.order = idx + 1;
        });

        this.steps = newSteps;
        this.updatedAt = new Date().toISOString();

        console.log('Optimized task order:', this.steps.map(s => `${s.order}.${s.processor}`));
        return true;
    }
}