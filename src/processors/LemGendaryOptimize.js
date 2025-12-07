/**
 * LemGendaryOptimize - Intelligent image optimization processor
 * @class
 */

// Import processing utils statically
import { applyOptimization as applyOptimizationUtil } from '../utils/processingUtils.js';

export class LemGendaryOptimize {
    /**
     * Create a new LemGendaryOptimize processor
     * @param {Object} options - Optimization options
     */
    constructor(options = {}) {
        this.options = {
            quality: 85,
            format: 'auto',
            lossless: false,
            stripMetadata: true,
            preserveTransparency: true,
            maxDisplayWidth: null,
            browserSupport: ['modern', 'legacy'],
            compressionMode: 'adaptive',
            analyzeContent: true,
            icoSizes: [16, 32, 48, 64, 128, 256],
            ...options
        };
    }

    /**
     * Process an image with optimization
     * @param {LemGendImage} image - Image to process
     * @returns {Promise<Object>} Optimization result
     */
    async process(image) {
        if (!image || !image.file) {
            throw new Error('Invalid image or missing file');
        }

        const originalInfo = {
            format: image.extension,
            width: image.width,
            height: image.height,
            size: image.originalSize,
            transparency: image.transparency,
            mimeType: image.type
        };

        const selectedFormat = this.selectOptimalFormat(image);
        const compression = this.calculateCompressionSettings(image);

        const savings = this.estimateSavings(
            image.originalSize,
            selectedFormat,
            compression.quality
        );

        return {
            originalInfo,
            optimization: {
                selectedFormat,
                compression,
                browserSupport: this.options.browserSupport,
                mode: this.options.compressionMode
            },
            savings,
            recommendations: this.generateRecommendations(image, selectedFormat),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Apply optimization to image
     * @param {LemGendImage} image - Image to optimize
     * @returns {Promise<File>} Optimized file
     */
    async applyOptimization(image) {
        const { selectedFormat } = await this.process(image);

        const dimensions = {
            width: image.width,
            height: image.height
        };

        return applyOptimizationUtil(
            image.file,
            dimensions,
            {
                quality: this.options.quality,
                format: selectedFormat,
                lossless: this.options.lossless
            },
            image.transparency
        );
    }

    /**
     * Select optimal format based on image characteristics
     * @private
     */
    selectOptimalFormat(image) {
        if (this.options.format !== 'auto') {
            return this.options.format;
        }

        // Auto selection logic
        if (image.extension === 'svg') return 'svg';
        if (image.type.includes('icon')) return 'ico';

        if (image.transparency) {
            return 'webp'; // WebP supports transparency
        }

        // For large images, consider AVIF
        if (image.width * image.height > 1000000) {
            return this.options.browserSupport.includes('modern') ? 'avif' : 'webp';
        }

        return 'webp'; // Default to WebP
    }

    /**
     * Calculate compression settings
     * @private
     */
    calculateCompressionSettings(image) {
        let quality = this.options.quality;

        // Adjust quality based on compression mode
        switch (this.options.compressionMode) {
            case 'aggressive':
                quality = Math.max(40, quality - 20);
                break;
            case 'balanced':
                // Keep as is
                break;
            case 'adaptive':
                // Adaptive quality based on image characteristics
                if (image.width * image.height > 2000000) {
                    quality = Math.max(60, quality - 10);
                }
                break;
        }

        // AVIF has different quality scale
        const selectedFormat = this.selectOptimalFormat(image);
        if (selectedFormat === 'avif') {
            quality = Math.min(63, quality);
        }

        return {
            quality,
            mode: this.options.compressionMode,
            lossless: this.options.lossless,
            stripMetadata: this.options.stripMetadata
        };
    }

    /**
     * Estimate savings from optimization
     * @private
     */
    estimateSavings(originalSize, format, quality) {
        let estimatedSize = originalSize;

        // Format reduction factors
        const formatFactors = {
            'webp': 0.7,
            'avif': 0.6,
            'jpg': 0.8,
            'png': 0.9,
            'svg': 0.3,
            'ico': 0.95
        };

        estimatedSize *= formatFactors[format] || 0.8;
        estimatedSize *= (quality / 100);

        const savings = originalSize - estimatedSize;
        const savingsPercent = (savings / originalSize) * 100;

        return {
            originalSize,
            estimatedSize: Math.round(estimatedSize),
            savings: Math.round(savings),
            savingsPercent: Math.round(savingsPercent * 10) / 10
        };
    }

    /**
     * Generate optimization recommendations
     * @private
     */
    generateRecommendations(image, selectedFormat) {
        const recommendations = [];

        if (image.extension !== selectedFormat) {
            recommendations.push(`Convert from ${image.extension} to ${selectedFormat}`);
        }

        if (image.width > 1920 || image.height > 1080) {
            recommendations.push('Consider resizing for web display');
        }

        if (image.transparency && selectedFormat === 'jpg') {
            recommendations.push('JPEG format does not support transparency - consider PNG or WebP');
        }

        return recommendations;
    }

    /**
     * Prepare images for ZIP export
     */
    async prepareForZip(images) {
        const results = [];

        for (const image of images) {
            try {
                const optimizationResult = await this.process(image);
                const optimizedFile = await this.applyOptimization(image);

                results.push({
                    success: true,
                    original: {
                        name: image.originalName,
                        size: image.originalSize,
                        format: image.extension
                    },
                    optimized: optimizedFile,
                    optimization: optimizationResult
                });
            } catch (error) {
                results.push({
                    success: false,
                    original: {
                        name: image.originalName,
                        size: image.originalSize
                    },
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Generate optimization report
     */
    generateOptimizationReport(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        const totalOriginalSize = successful.reduce((sum, r) => sum + r.original.size, 0);
        const totalOptimizedSize = successful.reduce((sum, r) => sum + r.optimized.size, 0);
        const totalSavings = totalOriginalSize - totalOptimizedSize;
        const avgSavingsPercent = successful.length > 0
            ? (totalSavings / totalOriginalSize * 100)
            : 0;

        return {
            summary: {
                totalImages: results.length,
                successful: successful.length,
                failed: failed.length,
                totalOriginalSize,
                totalOptimizedSize,
                totalSavings,
                avgSavingsPercent: Math.round(avgSavingsPercent * 10) / 10
            },
            byFormat: this.groupByFormat(successful),
            failedImages: failed.map(f => ({
                name: f.original.name,
                error: f.error
            })),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Group results by format
     * @private
     */
    groupByFormat(results) {
        const groups = {};

        results.forEach(result => {
            const format = result.optimization.optimization.selectedFormat;
            if (!groups[format]) {
                groups[format] = {
                    count: 0,
                    totalOriginalSize: 0,
                    totalOptimizedSize: 0
                };
            }

            groups[format].count++;
            groups[format].totalOriginalSize += result.original.size;
            groups[format].totalOptimizedSize += result.optimized.size;
        });

        return groups;
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    getInfo() {
        return {
            name: 'LemGendaryOptimize',
            version: '2.0.0',
            description: 'Intelligent image optimization with format selection',
            formats: ['auto', 'webp', 'avif', 'jpg', 'png', 'svg', 'ico'],
            compressionModes: ['adaptive', 'aggressive', 'balanced'],
            browserSupport: ['modern', 'legacy', 'all']
        };
    }
}

export default LemGendaryOptimize;