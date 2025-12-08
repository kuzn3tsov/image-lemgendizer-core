/**
 * LemGendaryCrop - Intelligent image cropping processor
 * @class
 */

// Import validation utilities - KEEP ORIGINAL
import { validateCrop } from '../utils/validationUtils.js';
// Import constants - ADD NEW
import {
    CropModes,
    ResizeAlgorithms,
    Defaults,
    WarningCodes,
    ErrorCodes,
    SeverityLevels
} from '../constants/sharedConstants.js';

export class LemGendaryCrop {
    /**
     * Create a new LemGendaryCrop processor
     * @param {Object} options - Crop options
     */
    constructor(options = {}) {
        this.options = {
            width: Defaults.DEFAULT_CROP_WIDTH,
            height: Defaults.DEFAULT_CROP_HEIGHT,
            mode: Defaults.CROP_MODE,
            upscale: false,
            preserveAspectRatio: true,
            confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD,
            cropToFit: true,
            objectsToDetect: ['person', 'face', 'car', 'dog', 'cat'],
            algorithm: Defaults.CROP_ALGORITHM,
            minCropSize: Defaults.MIN_CROP_SIZE,
            maxCropSize: Defaults.MAX_CROP_SIZE,
            ...options
        };

        // Validate options on creation
        this.validateOptions();

        // Store warnings for later use
        this.warnings = [];
    }

    /**
     * Validate crop options
     * @private
     */
    validateOptions() {
        const validation = validateCrop(this.options);

        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Invalid crop options: ${errorMessages}`);
        }

        // Store warnings for later use
        this.warnings = validation.warnings || [];

        // Additional validation specific to crop
        this.validateCropSpecificOptions();
    }

    /**
     * Validate crop-specific options
     * @private
     */
    validateCropSpecificOptions() {
        const { width, height, mode, upscale, minCropSize, maxCropSize } = this.options;

        // Check crop size limits
        if (width < minCropSize || height < minCropSize) {
            this.warnings.push({
                code: WarningCodes.SMALL_CROP_SIZE,
                message: `Crop size (${width}x${height}) is below minimum (${minCropSize}px)`,
                severity: SeverityLevels.WARNING
            });
        }

        if (width > maxCropSize || height > maxCropSize) {
            this.warnings.push({
                code: WarningCodes.LARGE_CROP_SIZE,
                message: `Crop size (${width}x${height}) exceeds maximum (${maxCropSize}px)`,
                severity: SeverityLevels.WARNING
            });
        }

        // Check aspect ratio for AI modes
        const aiModes = [CropModes.SMART, CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY];
        if (aiModes.includes(mode)) {
            const aspectRatio = width / height;
            if (aspectRatio > 3 || aspectRatio < 0.33) {
                this.warnings.push({
                    code: WarningCodes.EXTREME_ASPECT_AI,
                    message: `Extreme aspect ratio (${aspectRatio.toFixed(2)}) for AI cropping`,
                    severity: SeverityLevels.WARNING,
                    suggestion: 'Consider more balanced aspect ratios for better AI results'
                });
            }
        }

        // Check upscale warning
        if (!upscale) {
            this.warnings.push({
                code: WarningCodes.UPSCALE_DISABLED,
                message: 'Upscale is disabled - small crops may be limited',
                severity: SeverityLevels.INFO
            });
        }
    }

    /**
     * Process an image with crop
     * @param {LemGendImage} image - Image to process
     * @param {Object} currentDimensions - Current image dimensions
     * @returns {Promise<Object>} Crop result
     */
    async process(image, currentDimensions = null) {
        try {
            console.log('LemGendaryCrop processing started:', {
                targetSize: `${this.options.width}x${this.options.height}`,
                mode: this.options.mode,
                imageSize: currentDimensions ?
                    `${currentDimensions.width}x${currentDimensions.height}` :
                    `${image.width}x${image.height}`
            });

            // Validate input
            if (!image) {
                throw new Error('Invalid image: image object is required');
            }

            const sourceWidth = currentDimensions?.width || image.width;
            const sourceHeight = currentDimensions?.height || image.height;

            if (!sourceWidth || !sourceHeight || sourceWidth <= 0 || sourceHeight <= 0) {
                throw new Error(`Invalid image dimensions: ${sourceWidth}x${sourceHeight}`);
            }

            // Check if source is too small for crop
            if (!this.options.upscale) {
                if (sourceWidth < this.options.width || sourceHeight < this.options.height) {
                    this.warnings.push({
                        code: WarningCodes.SOURCE_TOO_SMALL,
                        message: `Source image (${sourceWidth}x${sourceHeight}) smaller than target crop (${this.options.width}x${this.options.height})`,
                        severity: SeverityLevels.WARNING,
                        suggestion: 'Enable upscale option or use smaller crop dimensions'
                    });
                }
            }

            // Calculate crop offsets
            const cropOffsets = this.calculateCropOffsets(
                sourceWidth,
                sourceHeight,
                this.options.width,
                this.options.height
            );

            // Check if crop is valid
            this.validateCropOffsets(cropOffsets, sourceWidth, sourceHeight);

            const finalDimensions = {
                width: this.options.width,
                height: this.options.height
            };

            const smartCrop = [CropModes.SMART, CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY].includes(this.options.mode);

            // Simulate AI detection for smart modes
            let detectionResult = null;
            if (smartCrop) {
                detectionResult = await this.simulateAIDetection(sourceWidth, sourceHeight);

                // Adjust crop based on detection if available
                if (detectionResult?.confidence > this.options.confidenceThreshold) {
                    const adjustedOffsets = this.adjustCropForDetection(cropOffsets, detectionResult);
                    if (adjustedOffsets) {
                        Object.assign(cropOffsets, adjustedOffsets);
                    }
                }
            }

            const result = {
                success: true,
                originalDimensions: {
                    width: sourceWidth,
                    height: sourceHeight,
                    aspectRatio: sourceWidth / sourceHeight
                },
                finalDimensions: {
                    width: cropOffsets.width,
                    height: cropOffsets.height,
                    aspectRatio: cropOffsets.width / cropOffsets.height
                },
                cropOffsets,
                smartCrop,
                mode: this.options.mode,
                confidenceThreshold: this.options.confidenceThreshold,
                steps: {
                    detection: detectionResult || { confidence: smartCrop ? 85 : 0 },
                    resize: !this.options.upscale && (sourceWidth < this.options.width || sourceHeight < this.options.height),
                    crop: cropOffsets
                },
                warnings: this.warnings,
                metadata: {
                    processedAt: new Date().toISOString(),
                    algorithm: this.options.algorithm,
                    upscale: this.options.upscale,
                    preserveAspectRatio: this.options.preserveAspectRatio,
                    cropToFit: this.options.cropToFit,
                    constants: {
                        mode: this.options.mode,
                        algorithm: this.options.algorithm
                    }
                }
            };

            console.log('LemGendaryCrop processing complete:', {
                original: `${result.originalDimensions.width}x${result.originalDimensions.height}`,
                final: `${result.finalDimensions.width}x${result.finalDimensions.height}`,
                offsets: result.cropOffsets,
                mode: result.mode,
                smartCrop: result.smartCrop
            });

            return result;

        } catch (error) {
            console.error('LemGendaryCrop processing failed:', error);
            throw new Error(`Crop failed: ${error.message}`);
        }
    }

    /**
     * Calculate crop offsets based on mode
     * @private
     */
    calculateCropOffsets(sourceWidth, sourceHeight, targetWidth, targetHeight) {
        let x = 0, y = 0;
        let cropWidth = targetWidth;
        let cropHeight = targetHeight;

        // Apply upscale logic
        if (!this.options.upscale) {
            cropWidth = Math.min(targetWidth, sourceWidth);
            cropHeight = Math.min(targetHeight, sourceHeight);
        }

        // If cropToFit is true, adjust to fit aspect ratio
        if (this.options.cropToFit && this.options.preserveAspectRatio) {
            const sourceAspect = sourceWidth / sourceHeight;
            const targetAspect = targetWidth / targetHeight;

            if (Math.abs(sourceAspect - targetAspect) > 0.01) {
                // Need to adjust crop to maintain aspect ratio
                if (sourceAspect > targetAspect) {
                    // Source is wider, adjust width
                    cropWidth = Math.round(cropHeight * targetAspect);
                } else {
                    // Source is taller, adjust height
                    cropHeight = Math.round(cropWidth / targetAspect);
                }
            }
        }

        // Ensure crop dimensions don't exceed source
        cropWidth = Math.min(cropWidth, sourceWidth);
        cropHeight = Math.min(cropHeight, sourceHeight);

        switch (this.options.mode) {
            case CropModes.CENTER:
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case CropModes.TOP:
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = 0;
                break;
            case CropModes.BOTTOM:
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case CropModes.LEFT:
                x = 0;
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case CropModes.RIGHT:
                x = Math.max(0, sourceWidth - cropWidth);
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case CropModes.TOP_LEFT:
                x = 0;
                y = 0;
                break;
            case CropModes.TOP_RIGHT:
                x = Math.max(0, sourceWidth - cropWidth);
                y = 0;
                break;
            case CropModes.BOTTOM_LEFT:
                x = 0;
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case CropModes.BOTTOM_RIGHT:
                x = Math.max(0, sourceWidth - cropWidth);
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case CropModes.SMART:
            case CropModes.FACE:
            case CropModes.OBJECT:
            case CropModes.SALIENCY:
            case CropModes.ENTROPY:
                // AI-based cropping - use weighted center based on mode
                const aiOffsets = this.calculateAICropOffsets(sourceWidth, sourceHeight, cropWidth, cropHeight);
                x = aiOffsets.x;
                y = aiOffsets.y;
                break;
            default:
                x = 0;
                y = 0;
        }

        return {
            x: Math.max(0, Math.min(x, sourceWidth - cropWidth)),
            y: Math.max(0, Math.min(y, sourceHeight - cropHeight)),
            width: cropWidth,
            height: cropHeight
        };
    }

    /**
     * Calculate AI-based crop offsets
     * @private
     */
    calculateAICropOffsets(sourceWidth, sourceHeight, cropWidth, cropHeight) {
        // For now, simulate different AI modes with different center biases
        let biasX = 0.5; // Center bias
        let biasY = 0.5;

        switch (this.options.mode) {
            case CropModes.FACE:
                // Faces are often in upper center
                biasX = 0.5;
                biasY = 0.4;
                break;
            case CropModes.OBJECT:
                // Objects are often centered
                biasX = 0.5;
                biasY = 0.5;
                break;
            case CropModes.SALIENCY:
                // Salient regions vary
                biasX = 0.5 + (Math.random() * 0.4 - 0.2);
                biasY = 0.5 + (Math.random() * 0.4 - 0.2);
                break;
            case CropModes.ENTROPY:
                // High entropy areas vary
                biasX = Math.random();
                biasY = Math.random();
                break;
            case CropModes.SMART:
                // Smart tries to balance
                biasX = 0.5 + (Math.random() * 0.2 - 0.1);
                biasY = 0.5 + (Math.random() * 0.2 - 0.1);
                break;
        }

        const x = Math.max(0, Math.floor((sourceWidth - cropWidth) * biasX));
        const y = Math.max(0, Math.floor((sourceHeight - cropHeight) * biasY));

        return { x, y };
    }

    /**
     * Simulate AI detection
     * @private
     */
    async simulateAIDetection(sourceWidth, sourceHeight) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 50));

        const confidence = 70 + Math.random() * 25; // 70-95% confidence

        return {
            detected: true,
            confidence: Math.round(confidence),
            type: this.options.mode,
            location: {
                x: Math.floor(sourceWidth * (0.3 + Math.random() * 0.4)),
                y: Math.floor(sourceHeight * (0.3 + Math.random() * 0.4)),
                width: Math.floor(sourceWidth * 0.2),
                height: Math.floor(sourceHeight * 0.2)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Adjust crop based on AI detection
     * @private
     */
    adjustCropForDetection(cropOffsets, detection) {
        if (!detection || !detection.location || detection.confidence < this.options.confidenceThreshold) {
            return null;
        }

        const { location } = detection;
        const centerX = location.x + location.width / 2;
        const centerY = location.y + location.height / 2;

        // Adjust crop to center on detected object
        const newX = Math.max(0, Math.min(
            Math.round(centerX - cropOffsets.width / 2),
            cropOffsets.width - location.width
        ));

        const newY = Math.max(0, Math.min(
            Math.round(centerY - cropOffsets.height / 2),
            cropOffsets.height - location.height
        ));

        return {
            x: newX,
            y: newY,
            width: cropOffsets.width,
            height: cropOffsets.height
        };
    }

    /**
     * Validate crop offsets
     * @private
     */
    validateCropOffsets(offsets, sourceWidth, sourceHeight) {
        const { x, y, width, height } = offsets;

        if (x < 0 || y < 0 || width <= 0 || height <= 0) {
            throw new Error(`Invalid crop offsets: x=${x}, y=${y}, width=${width}, height=${height}`);
        }

        if (x + width > sourceWidth) {
            throw new Error(`Crop exceeds source width: ${x + width} > ${sourceWidth}`);
        }

        if (y + height > sourceHeight) {
            throw new Error(`Crop exceeds source height: ${y + height} > ${sourceHeight}`);
        }

        // Check minimum size
        if (width < 10 || height < 10) {
            this.warnings.push({
                code: WarningCodes.VERY_SMALL_CROP,
                message: `Crop size very small: ${width}x${height}`,
                severity: SeverityLevels.WARNING
            });
        }
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    getInfo() {
        return {
            name: 'LemGendaryCrop',
            version: '2.0.0',
            description: 'Intelligent image cropping with AI detection',
            modes: Object.values(CropModes),
            aiCapabilities: [CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY],
            options: this.options,
            warnings: this.warnings,
            constants: {
                cropModes: Object.values(CropModes),
                aiModes: [CropModes.SMART, CropModes.FACE, CropModes.OBJECT, CropModes.SALIENCY, CropModes.ENTROPY],
                defaults: {
                    width: Defaults.DEFAULT_CROP_WIDTH,
                    height: Defaults.DEFAULT_CROP_HEIGHT,
                    mode: Defaults.CROP_MODE,
                    algorithm: Defaults.CROP_ALGORITHM,
                    confidenceThreshold: Defaults.CONFIDENCE_THRESHOLD,
                    minCropSize: Defaults.MIN_CROP_SIZE,
                    maxCropSize: Defaults.MAX_CROP_SIZE
                }
            }
        };
    }

    /**
     * Get crop warnings
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
     * Update crop options
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

    /**
     * Validate if image can be cropped
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

        // Check if image is too small for crop
        if (!this.options.upscale) {
            if (image.width < this.options.width || image.height < this.options.height) {
                result.warnings.push({
                    code: WarningCodes.IMAGE_TOO_SMALL,
                    message: `Image too small for target crop (${image.width}x${image.height} < ${this.options.width}x${this.options.height})`,
                    suggestion: 'Enable upscale option or use smaller crop dimensions',
                    severity: SeverityLevels.WARNING
                });
            }
        }

        // Check aspect ratio
        const imageAspect = image.width / image.height;
        const cropAspect = this.options.width / this.options.height;

        if (Math.abs(imageAspect - cropAspect) > 0.5) {
            result.warnings.push({
                code: WarningCodes.ASPECT_MISMATCH,
                message: `Significant aspect ratio difference: image ${imageAspect.toFixed(2)} vs crop ${cropAspect.toFixed(2)}`,
                suggestion: 'Consider different crop dimensions or enable cropToFit',
                severity: SeverityLevels.WARNING
            });
        }

        return result;
    }
}

// Export helper functions
/**
 * Create a crop processor with options
 * @param {Object} options - Crop options
 * @returns {LemGendaryCrop} Crop processor instance
 */
export function createCropProcessor(options = {}) {
    return new LemGendaryCrop(options);
}

/**
 * Quick crop function for simple use cases
 * @param {LemGendImage} image - Image to crop
 * @param {number} width - Crop width
 * @param {number} height - Crop height
 * @param {string} mode - Crop mode
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Crop result
 */
export async function quickCrop(image, width, height, mode = Defaults.CROP_MODE, options = {}) {
    const processor = new LemGendaryCrop({
        width,
        height,
        mode,
        ...options
    });

    return processor.process(image);
}

export default LemGendaryCrop;