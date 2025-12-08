/**
 * LemGendary Resize Processor
 * Intelligent image resizing with aspect ratio preservation
 * @module processors/LemGendaryResize
 */

// Import validation utilities - KEEP ORIGINAL IMPORT
import { validateResize } from '../utils/validationUtils.js';
// Import constants - ADD NEW IMPORT
import {
    ResizeAlgorithms,
    ResizeModes,
    Defaults,
    WarningCodes,
    ErrorCodes,
    SeverityLevels
} from '../constants/sharedConstants.js';

/**
 * LemGendaryResize - Intelligent image resizing processor
 */
export class LemGendaryResize {
    /**
     * Create a new resize processor
     * @param {Object} options - Resize options
     * @param {number} options.dimension - Target dimension (width/height)
     * @param {string} options.mode - Resize mode ('width', 'height', 'longest', 'fit')
     * @param {string} options.algorithm - Resize algorithm ('lanczos3', 'bilinear', 'nearest')
     * @param {boolean} options.forceSquare - Force square output
     * @param {boolean} options.preserveAspectRatio - Preserve aspect ratio
     */
    constructor(options = {}) {
        this.options = {
            dimension: options.dimension || Defaults.DEFAULT_DIMENSION,
            mode: options.mode || Defaults.RESIZE_MODE,
            algorithm: options.algorithm || Defaults.RESIZE_ALGORITHM,
            forceSquare: options.forceSquare || false,
            preserveAspectRatio: options.preserveAspectRatio !== false,
            ...options
        };

        // Validate options on creation - FIXED: Added validation
        this.validateOptions();
    }

    /**
     * Validate resize options
     * @private
     */
    validateOptions() {
        const validation = validateResize(this.options);

        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Invalid resize options: ${errorMessages}`);
        }

        // Store warnings for later use
        this.warnings = validation.warnings;
    }

    /**
     * Process an image with resize operation
     * @param {LemGendImage} image - Image to process
     * @returns {Promise<Object>} Resize result
     */
    async process(image) {
        try {
            console.log('LemGendaryResize processing started:', {
                dimension: this.options.dimension,
                mode: this.options.mode,
                algorithm: this.options.algorithm,
                imageSize: `${image.width}x${image.height}`
            });

            // Validate image - FIXED: Added image validation
            if (!image || !image.width || !image.height) {
                throw new Error('Invalid image: missing dimensions');
            }

            // Calculate new dimensions
            const newDimensions = this.calculateDimensions(image.width, image.height);

            console.log('Calculated new dimensions:', {
                original: `${image.width}x${image.height}`,
                new: `${newDimensions.width}x${newDimensions.height}`,
                mode: this.options.mode,
                dimension: this.options.dimension
            });

            // Check for extreme resizing
            this.checkResizeWarnings(image.width, image.height, newDimensions.width, newDimensions.height);

            // Return result object
            const result = {
                success: true,
                originalDimensions: {
                    width: image.width,
                    height: image.height,
                    aspectRatio: image.width / image.height
                },
                newDimensions: newDimensions,
                options: { ...this.options },
                warnings: this.warnings || [],
                metadata: {
                    processedAt: new Date().toISOString(),
                    algorithm: this.options.algorithm,
                    mode: this.options.mode,
                    scaleFactor: {
                        width: newDimensions.width / image.width,
                        height: newDimensions.height / image.height
                    },
                    constants: {
                        algorithm: this.options.algorithm,
                        mode: this.options.mode
                    }
                }
            };

            console.log('LemGendaryResize processing complete:', result);
            return result;

        } catch (error) {
            console.error('LemGendaryResize processing failed:', error);
            throw new Error(`Resize failed: ${error.message}`);
        }
    }

    /**
     * Calculate new dimensions based on options
     * @private
     */
    calculateDimensions(originalWidth, originalHeight) {
        const { dimension, mode, forceSquare, preserveAspectRatio } = this.options;

        let width, height;

        if (forceSquare) {
            width = height = dimension;

            if (!preserveAspectRatio) {
                // If not preserving aspect ratio, return square dimensions
                return { width, height };
            }
        }

        switch (mode) {
            case ResizeModes.WIDTH:
                width = dimension;
                height = preserveAspectRatio
                    ? Math.round((originalHeight / originalWidth) * dimension)
                    : dimension;
                break;

            case ResizeModes.HEIGHT:
                height = dimension;
                width = preserveAspectRatio
                    ? Math.round((originalWidth / originalHeight) * dimension)
                    : dimension;
                break;

            case ResizeModes.LONGEST:
                if (originalWidth >= originalHeight) {
                    width = dimension;
                    height = preserveAspectRatio
                        ? Math.round((originalHeight / originalWidth) * dimension)
                        : dimension;
                } else {
                    height = dimension;
                    width = preserveAspectRatio
                        ? Math.round((originalWidth / originalHeight) * dimension)
                        : dimension;
                }
                break;

            case ResizeModes.FIT:
                // Fit within dimensions while preserving aspect ratio
                const scale = Math.min(dimension / originalWidth, dimension / originalHeight);
                width = Math.round(originalWidth * scale);
                height = Math.round(originalHeight * scale);
                break;

            default:
                // Default to 'longest' mode
                if (originalWidth >= originalHeight) {
                    width = dimension;
                    height = preserveAspectRatio
                        ? Math.round((originalHeight / originalWidth) * dimension)
                        : dimension;
                } else {
                    height = dimension;
                    width = preserveAspectRatio
                        ? Math.round((originalWidth / originalHeight) * dimension)
                        : dimension;
                }
        }

        // Ensure minimum dimensions
        width = Math.max(1, width);
        height = Math.max(1, height);

        // Round to nearest integer
        width = Math.round(width);
        height = Math.round(height);

        return { width, height };
    }

    /**
     * Check for resize warnings
     * @private
     */
    checkResizeWarnings(originalWidth, originalHeight, newWidth, newHeight) {
        const warnings = this.warnings || [];

        // Check for extreme upscaling
        const upscaleFactor = Math.max(newWidth / originalWidth, newHeight / originalHeight);
        if (upscaleFactor > 3) {
            warnings.push({
                code: WarningCodes.EXTREME_UPSCALE,
                message: `Extreme upscaling detected: ${upscaleFactor.toFixed(1)}x`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider using higher resolution source image'
            });
        }

        // Check for extreme downscaling
        const downscaleFactor = Math.min(originalWidth / newWidth, originalHeight / newHeight);
        if (downscaleFactor > 10) {
            warnings.push({
                code: WarningCodes.EXTREME_DOWNSCALE,
                message: `Extreme downscaling detected: ${downscaleFactor.toFixed(1)}x`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider multiple resize steps for better quality'
            });
        }

        // Check for aspect ratio change
        const originalAspect = originalWidth / originalHeight;
        const newAspect = newWidth / newHeight;
        const aspectChange = Math.abs(originalAspect - newAspect);

        if (aspectChange > 0.1 && !this.options.forceSquare) {
            warnings.push({
                code: WarningCodes.ASPECT_RATIO_CHANGE,
                message: `Aspect ratio changed: ${originalAspect.toFixed(2)} → ${newAspect.toFixed(2)}`,
                severity: SeverityLevels.INFO,
                suggestion: 'Consider using crop instead of resize for aspect ratio changes'
            });
        }

        this.warnings = warnings;
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    getInfo() {
        return {
            name: 'LemGendaryResize',
            version: '1.2.1',
            description: 'Intelligent image resizing with aspect ratio preservation',
            options: this.options,
            supports: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
            features: [
                'Aspect ratio preservation',
                'Multiple resize modes',
                'Quality algorithms',
                'Force square option',
                'Intelligent dimension calculation'
            ],
            constants: {
                resizeAlgorithms: Object.values(ResizeAlgorithms),
                resizeModes: Object.values(ResizeModes),
                defaults: {
                    dimension: Defaults.DEFAULT_DIMENSION,
                    mode: Defaults.RESIZE_MODE,
                    algorithm: Defaults.RESIZE_ALGORITHM
                }
            }
        };
    }

    /**
     * Validate if processor can handle the image
     * @param {LemGendImage} image - Image to validate
     * @returns {Object} Validation result
     */
    validateImage(image) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!image || !image.width || !image.height) {
            result.valid = false;
            result.errors.push({
                code: ErrorCodes.MISSING_INFO,
                message: 'Image missing dimensions'
            });
            return result;
        }

        // Check dimensions
        if (image.width < Defaults.MIN_DIMENSION || image.height < Defaults.MIN_DIMENSION) {
            result.warnings.push({
                code: WarningCodes.VERY_SMALL_SOURCE,
                message: 'Image dimensions very small',
                severity: SeverityLevels.WARNING
            });
        }

        if (image.width > Defaults.MAX_DIMENSION || image.height > Defaults.MAX_DIMENSION) {
            result.warnings.push({
                code: WarningCodes.VERY_LARGE_SOURCE,
                message: 'Image dimensions very large',
                severity: SeverityLevels.WARNING
            });
        }

        // Check aspect ratio
        const aspectRatio = image.width / image.height;
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            result.warnings.push({
                code: WarningCodes.EXTREME_ASPECT_RATIO,
                message: 'Extreme aspect ratio may cause issues',
                severity: SeverityLevels.WARNING
            });
        }

        return result;
    }

    /**
     * Get resize warnings
     * @returns {Array} Array of warning objects
     */
    getWarnings() {
        return this.warnings || [];
    }

    /**
     * Clear warnings
     */
    clearWarnings() {
        this.warnings = [];
    }

    /**
     * Update resize options
     * @param {Object} newOptions - New options
     */
    updateOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };

        // Re-validate with new options
        this.validateOptions();
    }
}

// Export helper function for standalone use - FIXED: Added export
/**
 * Create a resize processor with options
 * @param {Object} options - Resize options
 * @returns {LemGendaryResize} Resize processor instance
 */
export function createResizeProcessor(options = {}) {
    return new LemGendaryResize(options);
}

/**
 * Quick resize function for simple use cases
 * @param {LemGendImage} image - Image to resize
 * @param {number} dimension - Target dimension
 * @param {string} mode - Resize mode
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Resize result
 */
export async function quickResize(image, dimension, mode = ResizeModes.LONGEST, options = {}) {
    const processor = new LemGendaryResize({
        dimension,
        mode,
        ...options
    });

    return processor.process(image);
}