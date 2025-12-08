/**
 * LemGendaryOptimize - Intelligent image optimization processor
 * @class
 */

// Import processing utils statically
import { applyOptimization as applyOptimizationUtil } from '../utils/processingUtils.js';
// Import validation and utility functions
import { validateOptimizationOptions } from '../utils/validationUtils.js';
// Import constants
import {
    OptimizationFormats,
    CompressionModes,
    QualityTargets,
    BrowserSupport,
    Defaults,
    WarningCodes,
    ErrorCodes,
    SeverityLevels
} from '../constants/sharedConstants.js';
import {
    getRecommendedFormat,
    getOptimizationStats,
    calculateOptimizationSavings,
    getFormatPriorities,
    needsFormatConversion,
    formatFileSize
} from '../utils/imageUtils.js';

export class LemGendaryOptimize {
    /**
     * Create a new LemGendaryOptimize processor
     * @param {Object} options - Optimization options
     */
    constructor(options = {}) {
        this.options = {
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
            qualityTarget: Defaults.QUALITY_TARGET,
            progressive: Defaults.PROGRESSIVE,
            optimizeAnimation: Defaults.OPTIMIZE_ANIMATION,
            ...options
        };

        // Validate options on creation
        this.validateOptions();

        // Store warnings for later use
        this.warnings = [];

        // Initialize format priorities
        this.formatPriorities = getFormatPriorities(this.options.browserSupport);
    }

    /**
     * Validate optimization options
     * @private
     */
    validateOptions() {
        const validation = validateOptimizationOptions(this.options);

        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Invalid optimization options: ${errorMessages}`);
        }

        // Store warnings for later use
        this.warnings = validation.warnings || [];

        // Additional validation specific to optimization
        this.validateOptimizationSpecificOptions();
    }

    /**
     * Validate optimization-specific options
     * @private
     */
    validateOptimizationSpecificOptions() {
        const { quality, format, lossless, browserSupport } = this.options;

        // Check for format-specific issues
        if (format === OptimizationFormats.AVIF && !browserSupport.includes(BrowserSupport.MODERN)) {
            this.warnings.push({
                code: WarningCodes.AVIF_BROWSER_SUPPORT,
                message: 'AVIF format may not be supported in legacy browsers',
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider using WebP for better browser compatibility'
            });
        }

        // Check lossless vs quality setting
        if (lossless && quality < 100) {
            this.warnings.push({
                code: WarningCodes.LOSSLESS_QUALITY_CONFLICT,
                message: 'Lossless mode enabled but quality is less than 100%',
                severity: SeverityLevels.WARNING,
                suggestion: 'Set quality to 100% for true lossless optimization'
            });
        }

        // Check quality ranges for different formats
        if (format === OptimizationFormats.AVIF && quality > 63) {
            this.warnings.push({
                code: WarningCodes.AVIF_QUALITY_RANGE,
                message: `AVIF quality ${quality} exceeds recommended maximum (63)`,
                severity: SeverityLevels.INFO,
                suggestion: 'AVIF quality values above 63 may not produce better results'
            });
        }
    }

    /**
     * Process an image with optimization
     * @param {LemGendImage} image - Image to process
     * @returns {Promise<Object>} Optimization result
     */
    async process(image) {
        try {
            console.log('LemGendaryOptimize processing started:', {
                imageName: image.originalName,
                originalSize: image.originalSize,
                format: image.extension,
                dimensions: `${image.width}x${image.height}`
            });

            // Validate input
            if (!image || !image.file) {
                throw new Error('Invalid image or missing file');
            }

            // Get image analysis
            const imageAnalysis = await this.analyzeImage(image);

            // Select optimal format
            const selectedFormat = this.selectOptimalFormat(image, imageAnalysis);

            // Calculate compression settings
            const compression = this.calculateCompressionSettings(image, imageAnalysis, selectedFormat);

            // Estimate savings
            const savings = this.estimateSavings(
                image.originalSize,
                selectedFormat,
                compression.quality,
                imageAnalysis
            );

            // Generate recommendations
            const recommendations = this.generateRecommendations(image, selectedFormat, imageAnalysis);

            const originalInfo = {
                format: image.extension,
                width: image.width,
                height: image.height,
                size: image.originalSize,
                transparency: image.transparency,
                mimeType: image.type,
                analysis: imageAnalysis
            };

            const result = {
                success: true,
                originalInfo,
                optimization: {
                    selectedFormat,
                    compression,
                    browserSupport: this.options.browserSupport,
                    mode: this.options.compressionMode,
                    qualityTarget: this.options.qualityTarget,
                    progressive: this.options.progressive
                },
                savings,
                recommendations,
                warnings: this.warnings,
                analysis: imageAnalysis,
                metadata: {
                    processedAt: new Date().toISOString(),
                    formatPriorities: this.formatPriorities,
                    needsConversion: needsFormatConversion(image.file),
                    estimatedQualityScore: this.calculateQualityScore(image, selectedFormat, compression.quality),
                    constants: {
                        format: selectedFormat,
                        compressionMode: this.options.compressionMode,
                        qualityTarget: this.options.qualityTarget
                    }
                },
                estimatedFile: {
                    format: selectedFormat,
                    estimatedSize: savings.estimatedSize,
                    estimatedSizeFormatted: formatFileSize(savings.estimatedSize),
                    quality: compression.quality
                }
            };

            console.log('LemGendaryOptimize processing complete:', {
                original: `${formatFileSize(result.originalInfo.size)} (${result.originalInfo.format})`,
                estimated: `${result.estimatedFile.estimatedSizeFormatted} (${result.estimatedFile.format})`,
                savings: `${result.savings.savingsPercent}%`,
                format: result.optimization.selectedFormat,
                quality: result.optimization.compression.quality
            });

            return result;

        } catch (error) {
            console.error('LemGendaryOptimize processing failed:', error);
            throw new Error(`Optimization failed: ${error.message}`);
        }
    }

    /**
     * Analyze image for optimization
     * @private
     */
    async analyzeImage(image) {
        try {
            const stats = await getOptimizationStats(image.file);

            return {
                optimizationScore: stats.analysis.optimizationScore,
                optimizationLevel: stats.analysis.optimizationLevel,
                needsOptimization: stats.needsOptimization,
                priority: stats.priority,
                recommendedFormat: stats.recommendedFormat,
                estimatedSavings: stats.estimatedSavings,
                dimensions: stats.analysis.dimensions,
                transparency: stats.analysis.transparency,
                fileSize: stats.analysis.fileSize,
                mimeType: stats.analysis.mimeType,
                extension: stats.analysis.extension,
                recommendations: stats.analysis.recommendations || []
            };
        } catch (error) {
            console.warn('Image analysis failed, using fallback:', error);
            return {
                optimizationScore: 50,
                optimizationLevel: 'medium',
                needsOptimization: true,
                priority: 'medium',
                recommendedFormat: OptimizationFormats.WEBP,
                estimatedSavings: { savingsPercent: 30 },
                dimensions: { width: image.width, height: image.height },
                transparency: image.transparency || false,
                fileSize: image.originalSize,
                mimeType: image.type,
                extension: image.extension,
                recommendations: []
            };
        }
    }

    /**
     * Apply optimization to image
     * @param {LemGendImage} image - Image to optimize
     * @returns {Promise<File>} Optimized file
     */
    async applyOptimization(image) {
        try {
            const optimizationResult = await this.process(image);
            const { selectedFormat } = optimizationResult.optimization;
            const { quality } = optimizationResult.optimization.compression;

            const dimensions = {
                width: image.width,
                height: image.height
            };

            const options = {
                quality,
                format: selectedFormat,
                lossless: this.options.lossless,
                progressive: this.options.progressive
            };

            console.log('Applying optimization:', {
                format: selectedFormat,
                quality,
                dimensions: `${dimensions.width}x${dimensions.height}`
            });

            const optimizedFile = await applyOptimizationUtil(
                image.file,
                dimensions,
                options,
                image.transparency
            );

            // Verify optimization worked
            if (!optimizedFile || !(optimizedFile instanceof File)) {
                throw new Error('Failed to create optimized file');
            }

            console.log('Optimization applied successfully:', {
                original: `${formatFileSize(image.originalSize)}`,
                optimized: `${formatFileSize(optimizedFile.size)}`,
                savings: `${((image.originalSize - optimizedFile.size) / image.originalSize * 100).toFixed(1)}%`
            });

            return optimizedFile;

        } catch (error) {
            console.error('Failed to apply optimization:', error);
            throw new Error(`Failed to apply optimization: ${error.message}`);
        }
    }

    /**
     * Select optimal format based on image characteristics
     * @private
     */
    selectOptimalFormat(image, analysis = null) {
        if (this.options.format !== OptimizationFormats.AUTO) {
            return this.options.format;
        }

        // Use analysis if available, otherwise fall back to basic logic
        if (analysis && analysis.recommendedFormat) {
            return analysis.recommendedFormat;
        }

        // Fallback auto selection logic
        if (image.extension === 'svg') return OptimizationFormats.SVG;
        if (image.type.includes('icon') || image.extension === 'ico') return OptimizationFormats.ICO;

        if (image.transparency) {
            return OptimizationFormats.WEBP; // WebP supports transparency
        }

        // Check browser support for modern formats
        if (this.options.browserSupport.includes(BrowserSupport.MODERN)) {
            // For large images, consider AVIF
            if (image.width * image.height > 1000000) {
                return OptimizationFormats.AVIF;
            }
        }

        // Check format priorities
        const priorities = this.formatPriorities;
        const supportedFormats = Object.keys(priorities).filter(format => {
            if (format === OptimizationFormats.SVG && image.extension !== 'svg') return false;
            if (format === OptimizationFormats.ICO && !image.type.includes('icon')) return false;
            if (!image.transparency && !priorities[format].supportsTransparency) return true;
            return true;
        });

        // Sort by priority score
        supportedFormats.sort((a, b) => {
            const scoreA = this.calculateFormatScore(a, image, priorities[a]);
            const scoreB = this.calculateFormatScore(b, image, priorities[b]);
            return scoreB - scoreA;
        });

        return supportedFormats[0] || OptimizationFormats.WEBP;
    }

    /**
     * Calculate format score
     * @private
     */
    calculateFormatScore(format, image, formatInfo) {
        let score = 0;

        // Browser support
        score += formatInfo.browserSupport * 100;

        // Compression efficiency
        score += formatInfo.compression * 50;

        // Quality
        score += formatInfo.quality * 30;

        // Transparency support
        if (image.transparency && formatInfo.supportsTransparency) {
            score += 40;
        } else if (!image.transparency && !formatInfo.supportsTransparency) {
            score += 20;
        }

        // File size consideration
        if (image.originalSize > 1024 * 1024) { // > 1MB
            score += formatInfo.compression * 30;
        }

        return score;
    }

    /**
     * Calculate compression settings
     * @private
     */
    calculateCompressionSettings(image, analysis = null, selectedFormat = null) {
        let quality = this.options.quality;
        const format = selectedFormat || this.selectOptimalFormat(image, analysis);

        // Adjust quality based on compression mode
        switch (this.options.compressionMode) {
            case CompressionModes.AGGRESSIVE:
                quality = Math.max(40, quality - 25);
                break;
            case CompressionModes.BALANCED:
                // Keep as is or slight adjustment based on analysis
                if (analysis && analysis.optimizationScore > 70) {
                    quality = Math.max(60, quality - 10);
                }
                break;
            case CompressionModes.ADAPTIVE:
                // Adaptive quality based on image characteristics
                if (image.width * image.height > 2000000) {
                    quality = Math.max(60, quality - 15);
                } else if (image.width * image.height < 100000) {
                    quality = Math.min(95, quality + 10);
                }
                break;
            case CompressionModes.LOSSLESS:
                quality = 100;
                break;
        }

        // Adjust based on quality target strategy
        switch (this.options.qualityTarget) {
            case QualityTargets.SMALLEST:
                quality = Math.max(40, quality - 20);
                break;
            case QualityTargets.BALANCED:
                // Already handled
                break;
            case QualityTargets.BEST:
                quality = Math.min(95, quality + 10);
                break;
        }

        // Format-specific adjustments
        if (format === OptimizationFormats.AVIF) {
            quality = Math.min(63, quality);
        } else if (format === OptimizationFormats.PNG && this.options.lossless) {
            quality = undefined; // PNG lossless doesn't use quality parameter
        }

        return {
            quality,
            mode: this.options.compressionMode,
            lossless: this.options.lossless,
            stripMetadata: this.options.stripMetadata,
            progressive: this.options.progressive,
            optimizeAnimation: this.options.optimizeAnimation
        };
    }

    /**
     * Calculate quality score
     * @private
     */
    calculateQualityScore(image, format, quality) {
        let score = quality / 100 * 80; // Base 80% of score from quality

        // Add format-specific bonus
        const formatBonus = {
            'avif': 15,
            'webp': 10,
            'png': 5,
            'jpg': 0,
            'svg': 20,
            'ico': 0
        };

        score += formatBonus[format] || 0;

        // Adjust based on image size
        const megapixels = (image.width * image.height) / 1000000;
        if (megapixels > 8) {
            score -= 10; // Large images harder to optimize
        } else if (megapixels < 1) {
            score += 5; // Small images easier to optimize
        }

        return Math.min(100, Math.round(score));
    }

    /**
     * Estimate savings from optimization
     * @private
     */
    estimateSavings(originalSize, format, quality, analysis = null) {
        // Use the utility function from imageUtils.js
        const savings = calculateOptimizationSavings(originalSize, {
            format,
            quality,
            maxDisplayWidth: this.options.maxDisplayWidth
        });

        // Adjust based on analysis if available
        if (analysis && analysis.optimizationScore > 70) {
            // High optimization potential
            savings.estimatedSize = Math.round(savings.estimatedSize * 0.9); // 10% more savings
            savings.savings = originalSize - savings.estimatedSize;
            savings.savingsPercent = (savings.savings / originalSize) * 100;
        }

        return savings;
    }

    /**
     * Generate optimization recommendations
     * @private
     */
    generateRecommendations(image, selectedFormat, analysis = null) {
        const recommendations = [];

        if (image.extension !== selectedFormat) {
            recommendations.push({
                type: 'format_conversion',
                message: `Convert from ${image.extension.toUpperCase()} to ${selectedFormat.toUpperCase()}`,
                priority: 'high',
                estimatedSavings: analysis?.estimatedSavings?.savingsPercent || 30
            });
        }

        if (image.width > 1920 || image.height > 1080) {
            recommendations.push({
                type: 'resize_recommendation',
                message: `Resize from ${image.width}x${image.height} to 1920x1080 for web`,
                priority: 'medium',
                estimatedSavings: 40
            });
        }

        if (image.transparency && selectedFormat === OptimizationFormats.JPEG) {
            recommendations.push({
                type: 'transparency_warning',
                message: 'JPEG format does not support transparency',
                priority: 'high',
                suggestion: 'Use PNG or WebP to preserve transparency'
            });
        }

        // Add analysis-based recommendations
        if (analysis && analysis.recommendations) {
            analysis.recommendations.forEach(rec => {
                recommendations.push({
                    type: 'analysis_recommendation',
                    message: rec,
                    priority: 'medium'
                });
            });
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
                        format: image.extension,
                        dimensions: `${image.width}x${image.height}`
                    },
                    optimized: optimizedFile,
                    optimization: optimizationResult,
                    savings: {
                        bytes: image.originalSize - optimizedFile.size,
                        percent: ((image.originalSize - optimizedFile.size) / image.originalSize * 100).toFixed(1)
                    }
                });
            } catch (error) {
                results.push({
                    success: false,
                    original: {
                        name: image.originalName,
                        size: image.originalSize
                    },
                    error: error.message,
                    optimization: null
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

        // Calculate format distribution
        const formatGroups = this.groupByFormat(successful);

        return {
            summary: {
                totalImages: results.length,
                successful: successful.length,
                failed: failed.length,
                totalOriginalSize,
                totalOriginalSizeFormatted: formatFileSize(totalOriginalSize),
                totalOptimizedSize,
                totalOptimizedSizeFormatted: formatFileSize(totalOptimizedSize),
                totalSavings,
                totalSavingsFormatted: formatFileSize(totalSavings),
                avgSavingsPercent: Math.round(avgSavingsPercent * 10) / 10,
                timestamp: new Date().toISOString()
            },
            byFormat: formatGroups,
            failedImages: failed.map(f => ({
                name: f.original.name,
                error: f.error
            })),
            recommendations: this.generateBatchRecommendations(successful)
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
                    totalOptimizedSize: 0,
                    avgQuality: 0,
                    qualitySum: 0
                };
            }

            groups[format].count++;
            groups[format].totalOriginalSize += result.original.size;
            groups[format].totalOptimizedSize += result.optimized.size;
            groups[format].qualitySum += result.optimization.optimization.compression.quality;
            groups[format].avgQuality = groups[format].qualitySum / groups[format].count;

            // Calculate savings
            groups[format].totalSavings = groups[format].totalOriginalSize - groups[format].totalOptimizedSize;
            groups[format].savingsPercent = (groups[format].totalSavings / groups[format].totalOriginalSize * 100);
        });

        return groups;
    }

    /**
     * Generate batch recommendations
     * @private
     */
    generateBatchRecommendations(successfulResults) {
        const recommendations = [];

        // Check for common issues
        const largeImages = successfulResults.filter(r => r.original.size > 5 * 1024 * 1024);
        if (largeImages.length > 0) {
            recommendations.push({
                type: 'large_images',
                message: `${largeImages.length} images are larger than 5MB`,
                suggestion: 'Consider additional compression or resizing'
            });
        }

        // Check for transparency issues
        const transparencyIssues = successfulResults.filter(r =>
            r.optimization.originalInfo.transparency &&
            r.optimization.optimization.selectedFormat === OptimizationFormats.JPEG
        );
        if (transparencyIssues.length > 0) {
            recommendations.push({
                type: 'transparency_issues',
                message: `${transparencyIssues.length} transparent images saved as JPEG`,
                suggestion: 'Convert to PNG or WebP to preserve transparency'
            });
        }

        return recommendations;
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
            formats: Object.values(OptimizationFormats),
            compressionModes: Object.values(CompressionModes),
            browserSupport: Object.values(BrowserSupport),
            qualityTargets: Object.values(QualityTargets),
            options: this.options,
            warnings: this.warnings,
            formatPriorities: this.formatPriorities,
            constants: {
                formats: Object.values(OptimizationFormats),
                compressionModes: Object.values(CompressionModes),
                qualityTargets: Object.values(QualityTargets),
                browserSupport: Object.values(BrowserSupport),
                defaults: {
                    quality: Defaults.OPTIMIZATION_QUALITY,
                    format: Defaults.OPTIMIZATION_FORMAT,
                    compressionMode: Defaults.COMPRESSION_MODE,
                    browserSupport: Defaults.BROWSER_SUPPORT,
                    qualityTarget: Defaults.QUALITY_TARGET,
                    progressive: Defaults.PROGRESSIVE,
                    stripMetadata: Defaults.STRIP_METADATA,
                    preserveTransparency: Defaults.PRESERVE_TRANSPARENCY
                }
            }
        };
    }

    /**
     * Get optimization warnings
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
     * Update optimization options
     * @param {Object} newOptions - New options
     */
    updateOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };

        // Re-validate with new options
        this.validateOptions();

        // Update format priorities
        this.formatPriorities = getFormatPriorities(this.options.browserSupport);
    }

    /**
     * Validate if image can be optimized
     * @param {LemGendImage} image - Image to validate
     * @returns {Object} Validation result
     */
    validateImage(image) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!image || !image.file) {
            result.valid = false;
            result.errors.push({
                code: ErrorCodes.INVALID_FILE,
                message: 'Image missing file'
            });
            return result;
        }

        // Check file type
        const validTypes = [
            'image/jpeg', 'image/png', 'image/webp',
            'image/gif', 'image/svg+xml', 'image/bmp'
        ];
        if (!validTypes.includes(image.type)) {
            result.warnings.push({
                type: 'unsupported_format',
                message: `Format ${image.extension} may have limited optimization options`,
                severity: SeverityLevels.WARNING
            });
        }

        // Check file size
        if (image.originalSize > Defaults.MAX_FILE_SIZE) {
            result.warnings.push({
                type: 'very_large_file',
                message: 'Very large file may take longer to optimize',
                severity: SeverityLevels.WARNING
            });
        }

        return result;
    }
}

// Export helper functions
/**
 * Create an optimization processor with options
 * @param {Object} options - Optimization options
 * @returns {LemGendaryOptimize} Optimization processor instance
 */
export function createOptimizationProcessor(options = {}) {
    return new LemGendaryOptimize(options);
}

/**
 * Quick optimize function for simple use cases
 * @param {LemGendImage} image - Image to optimize
 * @param {number} quality - Quality percentage
 * @param {string} format - Output format
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Optimization result
 */
export async function quickOptimize(image, quality = Defaults.OPTIMIZATION_QUALITY, format = Defaults.OPTIMIZATION_FORMAT, options = {}) {
    const processor = new LemGendaryOptimize({
        quality,
        format,
        ...options
    });

    return processor.process(image);
}

export default LemGendaryOptimize;