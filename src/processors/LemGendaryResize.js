/**
 * LemGendaryResize - Intelligent image resizing processor
 * @class
 */
export class LemGendaryResize {
    /**
     * Create a new LemGendaryResize processor
     * @param {Object} options - Resize options
     */
    constructor(options = {}) {
        this.options = {
            dimension: 1024,
            mode: 'longest',
            maintainAspectRatio: true,
            upscale: false,
            algorithm: 'lanczos3',
            ...options
        };
    }

    /**
     * Process an image with resize
     * @param {LemGendImage} image - Image to process
     * @returns {Promise<Object>} Resize result
     */
    async process(image) {
        if (!image || !image.width || !image.height) {
            throw new Error('Invalid image dimensions');
        }

        const originalDimensions = {
            width: image.width,
            height: image.height
        };

        const newDimensions = this.calculateNewDimensions(
            originalDimensions.width,
            originalDimensions.height
        );

        return {
            originalDimensions,
            newDimensions,
            options: this.options,
            mode: this.options.mode,
            algorithm: this.options.algorithm,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate new dimensions based on mode
     * @private
     */
    calculateNewDimensions(originalWidth, originalHeight) {
        const { dimension, mode, maintainAspectRatio } = this.options;

        if (!maintainAspectRatio) {
            return {
                width: dimension,
                height: dimension
            };
        }

        let newWidth, newHeight;

        switch (mode) {
            case 'width':
                newWidth = dimension;
                newHeight = Math.round((originalHeight / originalWidth) * dimension);
                break;

            case 'height':
                newHeight = dimension;
                newWidth = Math.round((originalWidth / originalHeight) * dimension);
                break;

            case 'longest':
            default:
                if (originalWidth >= originalHeight) {
                    newWidth = dimension;
                    newHeight = Math.round((originalHeight / originalWidth) * dimension);
                } else {
                    newHeight = dimension;
                    newWidth = Math.round((originalWidth / originalHeight) * dimension);
                }
                break;
        }

        // Apply upscale restriction
        if (!this.options.upscale) {
            newWidth = Math.min(newWidth, originalWidth);
            newHeight = Math.min(newHeight, originalHeight);
        }

        return {
            width: Math.max(1, newWidth),
            height: Math.max(1, newHeight)
        };
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
            modes: ['width', 'height', 'longest'],
            algorithms: ['lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell']
        };
    }
}

export default LemGendaryResize;