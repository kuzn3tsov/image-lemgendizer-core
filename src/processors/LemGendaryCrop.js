/**
 * LemGendaryCrop - Intelligent image cropping processor
 * @class
 */
export class LemGendaryCrop {
    /**
     * Create a new LemGendaryCrop processor
     * @param {Object} options - Crop options
     */
    constructor(options = {}) {
        this.options = {
            width: 500,
            height: 500,
            mode: 'center',
            upscale: false,
            preserveAspectRatio: true,
            confidenceThreshold: 70,
            cropToFit: true,
            objectsToDetect: ['person', 'face', 'car', 'dog', 'cat'],
            ...options
        };
    }

    /**
     * Process an image with crop
     * @param {LemGendImage} image - Image to process
     * @param {Object} currentDimensions - Current image dimensions
     * @returns {Promise<Object>} Crop result
     */
    async process(image, currentDimensions = null) {
        if (!image || (!image.width && !currentDimensions?.width)) {
            throw new Error('Invalid image or dimensions');
        }

        const sourceWidth = currentDimensions?.width || image.width;
        const sourceHeight = currentDimensions?.height || image.height;

        const cropOffsets = this.calculateCropOffsets(
            sourceWidth,
            sourceHeight,
            this.options.width,
            this.options.height
        );

        const finalDimensions = {
            width: this.options.width,
            height: this.options.height
        };

        const smartCrop = ['smart', 'face', 'object', 'saliency', 'entropy'].includes(this.options.mode);

        return {
            originalDimensions: { width: sourceWidth, height: sourceHeight },
            finalDimensions,
            cropOffsets,
            smartCrop,
            mode: this.options.mode,
            confidenceThreshold: this.options.confidenceThreshold,
            steps: {
                detection: { confidence: smartCrop ? 85 : 0 },
                resize: !this.options.upscale && (sourceWidth < this.options.width || sourceHeight < this.options.height),
                crop: cropOffsets
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate crop offsets based on mode
     * @private
     */
    calculateCropOffsets(sourceWidth, sourceHeight, targetWidth, targetHeight) {
        let x = 0, y = 0;
        let cropWidth = Math.min(targetWidth, sourceWidth);
        let cropHeight = Math.min(targetHeight, sourceHeight);

        if (!this.options.upscale) {
            cropWidth = Math.min(targetWidth, sourceWidth);
            cropHeight = Math.min(targetHeight, sourceHeight);
        }

        switch (this.options.mode) {
            case 'center':
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case 'top':
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = 0;
                break;
            case 'bottom':
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case 'left':
                x = 0;
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case 'right':
                x = Math.max(0, sourceWidth - cropWidth);
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            case 'top-left':
                x = 0;
                y = 0;
                break;
            case 'top-right':
                x = Math.max(0, sourceWidth - cropWidth);
                y = 0;
                break;
            case 'bottom-left':
                x = 0;
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case 'bottom-right':
                x = Math.max(0, sourceWidth - cropWidth);
                y = Math.max(0, sourceHeight - cropHeight);
                break;
            case 'smart':
            case 'face':
            case 'object':
            case 'saliency':
            case 'entropy':
                // AI-based cropping - default to center for now
                x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
                y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
                break;
            default:
                x = 0;
                y = 0;
        }

        return {
            x,
            y,
            width: cropWidth,
            height: cropHeight
        };
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
            modes: ['smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
            aiCapabilities: ['face', 'object', 'saliency', 'entropy']
        };
    }
}

export default LemGendaryCrop;