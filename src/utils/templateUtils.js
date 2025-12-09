/**
 * Template utility functions
 * @module utils/templateUtils
 */

// Import shared utilities
import { parseDimension, isVariableDimension } from './sharedUtils.js';
import { LemGendTask } from '../tasks/LemGendTask.js';

// Import template database
import { LemGendTemplates } from '../templates/templateConfig.js';

/**
 * Get template by ID or name
 */
export function getTemplateById(templateId) {
    if (!templateId) return null;

    return LemGendTemplates.ALL.find(template =>
        template.id === templateId ||
        template.displayName?.toLowerCase() === templateId.toLowerCase() ||
        template.id?.toLowerCase() === templateId.toLowerCase()
    );
}

/**
 * Get all available platforms across all templates
 */
export function getAllPlatforms() {
    const platforms = new Set();
    LemGendTemplates.ALL.forEach(template => {
        if (template.platforms && Array.isArray(template.platforms)) {
            template.platforms.forEach(platform => {
                if (platform) platforms.add(platform);
            });
        }
    });
    return Array.from(platforms).sort();
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category) {
    const normalizedCategory = category?.toLowerCase();
    if (!normalizedCategory) return [];

    return LemGendTemplates.ALL.filter(template =>
        template.category?.toLowerCase() === normalizedCategory
    );
}

/**
 * Get all unique categories with template counts
 */
export function getAllCategories() {
    const categories = {};
    LemGendTemplates.ALL.forEach(template => {
        const category = template.category || 'general';
        categories[category] = (categories[category] || 0) + 1;
    });

    return Object.keys(categories)
        .filter(key => categories[key] > 0)
        .sort();
}

/**
 * Get library information
 */
export function getLibraryInfo() {
    const stats = getTemplateStats();

    return {
        name: 'LemGendary Image Processor',
        version: '3.0.0',
        description: 'Advanced batch image processing library with template support',
        templates: stats.total || 0,
        categories: stats.categoryCount || 0,
        platforms: stats.platformCount || 0,
        flexibleTemplates: stats.flexible || 0,
        lastUpdated: stats.generatedAt,
        features: [
            'Batch processing',
            'Template-based processing',
            'Smart cropping',
            'Optimization',
            'Rename patterns',
            'Favicon generation',
            'Flexible templates'
        ]
    };
}

/**
 * Get flexible templates (with variable dimensions)
 */
export function getFlexibleTemplates(templates = LemGendTemplates.ALL) {
    if (!Array.isArray(templates)) return [];
    return templates.filter(template => {
        const widthInfo = parseDimension(template.width);
        const heightInfo = parseDimension(template.height);
        return widthInfo.isVariable || heightInfo.isVariable || template.supportsFlexible;
    });
}

/**
 * Get aspect ratio for a template
 */
export function getTemplateAspectRatio(template) {
    if (!template || !template.width || !template.height) {
        return null;
    }

    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);

    // If either dimension is variable, aspect ratio is not fixed
    if (widthInfo.isVariable || heightInfo.isVariable) {
        return null;
    }

    // Calculate aspect ratio
    return widthInfo.value / heightInfo.value;
}

/**
 * Get simplified aspect ratio string (e.g., "16:9")
 */
export function getTemplateAspectRatioString(template) {
    const aspectRatio = getTemplateAspectRatio(template);
    if (!aspectRatio) return null;

    // Common aspect ratios
    const commonRatios = {
        1: '1:1',           // Square
        1.333: '4:3',       // Standard
        1.5: '3:2',         // Classic
        1.618: '16:10',     // Golden
        1.778: '16:9',      // Widescreen
        2.333: '21:9',      // Ultra-wide
        0.75: '3:4',        // Portrait
        0.667: '2:3'        // Tall
    };

    // Find closest common ratio
    let closestRatio = null;
    let minDifference = Infinity;

    for (const [ratio, ratioString] of Object.entries(commonRatios)) {
        const difference = Math.abs(aspectRatio - parseFloat(ratio));
        if (difference < minDifference && difference < 0.05) { // 5% tolerance
            minDifference = difference;
            closestRatio = ratioString;
        }
    }

    return closestRatio || `${Math.round(aspectRatio * 100) / 100}:1`;
}

/**
 * Get template specific stats
 */
function getTemplateSpecificStats(templateOrId) {
    let template;

    if (typeof templateOrId === 'string') {
        template = getTemplateById(templateOrId);
        if (!template) {
            return {
                isValid: false,
                error: `Template not found: ${templateOrId}`,
                id: templateOrId
            };
        }
    } else {
        template = templateOrId;
    }

    if (!template || typeof template !== 'object') {
        return {
            isValid: false,
            error: 'Invalid template provided',
            template: templateOrId
        };
    }

    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    const hasVariableWidth = widthInfo.isVariable;
    const hasVariableHeight = heightInfo.isVariable;
    const hasVariableDimensions = hasVariableWidth || hasVariableHeight;
    const hasFixedDimensions = !hasVariableWidth && !hasVariableHeight;

    // Calculate aspect ratio
    let aspectRatio = null;
    let aspectRatioFormatted = null;
    let aspectRatioString = null;

    if (hasFixedDimensions && widthInfo.value && heightInfo.value) {
        aspectRatio = widthInfo.value / heightInfo.value;

        // Simplify to common ratio
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(widthInfo.value, heightInfo.value);
        aspectRatioFormatted = `${widthInfo.value / divisor}:${heightInfo.value / divisor}`;

        // Get common ratio string
        aspectRatioString = getTemplateAspectRatioString(template);
    }

    return {
        // Basic info
        id: template.id,
        name: template.displayName || 'Unnamed Template',
        description: template.description || '',
        category: template.category || 'general',

        // Dimension analysis
        dimensions: {
            width: template.width,
            height: template.height,
            widthValue: widthInfo.value,
            heightValue: heightInfo.value,
            hasVariableWidth,
            hasVariableHeight,
            hasVariableDimensions,
            hasFixedDimensions,
            isSquare: hasFixedDimensions && widthInfo.value === heightInfo.value,
            minWidth: template.minWidth,
            minHeight: template.minHeight
        },

        // Aspect ratio
        aspectRatio: {
            numeric: aspectRatio,
            formatted: aspectRatioFormatted,
            commonName: aspectRatioString,
            isPortrait: aspectRatio && aspectRatio < 1,
            isLandscape: aspectRatio && aspectRatio > 1,
            isSquare: aspectRatio && aspectRatio === 1
        },

        // Format info
        formats: {
            recommended: template.recommendedFormats || [],
            primaryFormat: template.recommendedFormats?.[0],
            supportsTransparency: template.recommendedFormats?.some(f =>
                ['png', 'webp', 'svg', 'gif'].includes(f.toLowerCase())
            ),
            supportsAnimation: template.recommendedFormats?.includes('gif'),
            isVector: template.recommendedFormats?.includes('svg'),
            isWebOptimized: template.recommendedFormats?.some(f =>
                ['webp', 'avif'].includes(f.toLowerCase())
            ),
            isPrintOptimized: template.recommendedFormats?.some(f =>
                ['pdf', 'tiff', 'eps'].includes(f.toLowerCase())
            )
        },

        // Usage info
        usage: {
            commonUses: template.commonUses || [],
            platforms: template.platforms || [],
            isResponsive: hasVariableDimensions || template.supportsFlexible,
            requiresCrop: template.requiresCrop || false,
            isFlexible: hasVariableDimensions || template.supportsFlexible
        },

        // Validation info
        validation: {
            requiresCrop: template.requiresCrop || false,
            minWidth: template.minWidth,
            minHeight: template.minHeight,
            recommendedFormats: template.recommendedFormats || []
        }
    };
}

/**
 * Get template statistics - ENHANCED for flexible templates
 * Now handles both overall statistics and specific template statistics
 * @param {string|Object} [templateOrId] - Optional: Template ID or object for specific stats
 * @returns {Object} Template statistics
 */
export function getTemplateStats(templateOrId) {
    // If parameter provided, return specific template stats
    if (templateOrId !== undefined) {
        return getTemplateSpecificStats(templateOrId);
    }

    // Otherwise return overall stats
    const allTemplates = LemGendTemplates.ALL || [];
    const flexibleTemplates = getFlexibleTemplates(allTemplates);
    const fixedTemplates = allTemplates.filter(t => {
        const widthInfo = parseDimension(t.width);
        const heightInfo = parseDimension(t.height);
        return !widthInfo.isVariable && !heightInfo.isVariable;
    });

    // Count by category
    const categories = {};
    allTemplates.forEach(template => {
        const category = template.category || 'general';
        categories[category] = (categories[category] || 0) + 1;
    });

    // Count by platform
    const platforms = {};
    allTemplates.forEach(template => {
        const templatePlatforms = template.platforms || [];
        templatePlatforms.forEach(platform => {
            platforms[platform] = (platforms[platform] || 0) + 1;
        });
    });

    // Format usage analysis
    const formats = {};
    allTemplates.forEach(template => {
        const templateFormats = template.recommendedFormats || [];
        templateFormats.forEach(format => {
            formats[format] = (formats[format] || 0) + 1;
        });
    });

    // Aspect ratio analysis
    const aspectRatios = {};
    allTemplates.forEach(template => {
        const ratioString = getTemplateAspectRatioString(template);
        if (ratioString) {
            aspectRatios[ratioString] = (aspectRatios[ratioString] || 0) + 1;
        }
    });

    const stats = {
        // Basic counts
        total: allTemplates.length,
        flexible: flexibleTemplates.length,
        fixed: fixedTemplates.length,
        flexiblePercentage: allTemplates.length > 0 ?
            Math.round((flexibleTemplates.length / allTemplates.length) * 100) : 0,

        // Categorized counts
        categories: categories,
        categoryCount: Object.keys(categories).length,
        topCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',

        // Platform analysis
        platforms: platforms,
        platformCount: Object.keys(platforms).length,
        topPlatform: Object.entries(platforms).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',

        // Format analysis
        formats: formats,
        formatCount: Object.keys(formats).length,
        topFormat: Object.entries(formats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',

        // Aspect ratio analysis
        aspectRatios: aspectRatios,
        uniqueAspectRatios: Object.keys(aspectRatios).length,
        commonAspectRatio: Object.entries(aspectRatios).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',

        // Dimension analysis
        dimensions: {
            squareTemplates: allTemplates.filter(t => {
                const widthInfo = parseDimension(t.width);
                const heightInfo = parseDimension(t.height);
                return !widthInfo.isVariable && !heightInfo.isVariable &&
                    widthInfo.value === heightInfo.value;
            }).length,
            portraitTemplates: allTemplates.filter(t => {
                const ratio = getTemplateAspectRatio(t);
                return ratio && ratio < 1;
            }).length,
            landscapeTemplates: allTemplates.filter(t => {
                const ratio = getTemplateAspectRatio(t);
                return ratio && ratio > 1;
            }).length,
            variableWidthTemplates: allTemplates.filter(t => {
                const widthInfo = parseDimension(t.width);
                return widthInfo.isVariable;
            }).length,
            variableHeightTemplates: allTemplates.filter(t => {
                const heightInfo = parseDimension(t.height);
                return heightInfo.isVariable;
            }).length
        },

        // Quality metrics
        metrics: {
            averageMinWidth: Math.round(allTemplates.reduce((sum, t) => sum + (t.minWidth || 0), 0) / allTemplates.length),
            averageMinHeight: Math.round(allTemplates.reduce((sum, t) => sum + (t.minHeight || 0), 0) / allTemplates.length),
            templatesWithCrop: allTemplates.filter(t => t.requiresCrop).length,
            templatesWithTransparency: allTemplates.filter(t =>
                t.recommendedFormats?.some(f => ['png', 'webp', 'svg'].includes(f))
            ).length
        },

        // Timestamp and version
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        templateCount: allTemplates.length
    };

    return stats;
}

/**
 * Create a task from template configuration
 */
export function createTaskFromTemplate(template, options = {}) {
    const task = new LemGendTask(
        options.taskName || `Template: ${template.displayName}`,
        options.description || template.description || ''
    );

    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);

    // Add crop if required
    if (template.requiresCrop && widthInfo.value && heightInfo.value) {
        task.addCrop(widthInfo.value, heightInfo.value, options.cropMode || 'smart');
    }

    // Add resize for variable dimensions
    if (widthInfo.isVariable && heightInfo.value) {
        task.addResize(heightInfo.value, 'height');
    } else if (heightInfo.isVariable && widthInfo.value) {
        task.addResize(widthInfo.value, 'width');
    } else if (widthInfo.value && heightInfo.value) {
        task.addResize(Math.max(widthInfo.value, heightInfo.value), 'longest');
    }

    // Add optimization
    const quality = options.quality || 85;
    const format = options.format || template.recommendedFormats?.[0] || 'auto';

    task.addOptimize(quality, format, {
        compressionMode: options.compressionMode || 'adaptive',
        preserveTransparency: template.recommendedFormats?.some(f =>
            ['png', 'webp', 'svg'].includes(f.toLowerCase())
        )
    });

    // Add rename if pattern provided
    if (options.renamePattern) {
        task.addRename(options.renamePattern, options.renameStartIndex || 1);
    }

    return task;
}

/**
 * Get validation summary for template compatibility
 */
export function getTemplateValidationSummary(validation) {
    if (!validation) return 'No validation performed';

    const { compatible, errors, warnings, suggestions } = validation;

    if (!compatible && errors.length > 0) {
        return `❌ Incompatible: ${errors.map(e => e.message).join(', ')}`;
    }

    let summary = compatible ? '✅ Compatible' : '⚠️ Has issues';

    if (warnings.length > 0) {
        summary += ` (${warnings.length} warning${warnings.length !== 1 ? 's' : ''})`;
    }

    return summary;
}

/**
 * Validate template compatibility with an image
 */
export function validateTemplateCompatibility(template, imageInfo) {
    const result = {
        compatible: true,
        errors: [],
        warnings: [],
        suggestions: []
    };

    if (!template || !imageInfo) {
        result.compatible = false;
        result.errors.push('Missing template or image information');
        return result;
    }

    const { width, height } = imageInfo;
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);

    // Check if template has variable dimensions
    const hasVariableDimensions = widthInfo.isVariable || heightInfo.isVariable;

    if (!hasVariableDimensions) {
        // Check minimum dimensions for fixed-size templates
        if (widthInfo.value && width < widthInfo.value) {
            result.warnings.push({
                code: 'SMALL_WIDTH',
                message: `Image width (${width}px) is ${widthInfo.value - width}px smaller than template width (${widthInfo.value}px)`,
                severity: 'warning'
            });
            result.suggestions.push('Consider using a larger source image or enable upscaling');
        }

        if (heightInfo.value && height < heightInfo.value) {
            result.warnings.push({
                code: 'SMALL_HEIGHT',
                message: `Image height (${height}px) is ${heightInfo.value - height}px smaller than template height (${heightInfo.value}px)`,
                severity: 'warning'
            });
            result.suggestions.push('Consider using a larger source image or enable upscaling');
        }

        // Check aspect ratio for fixed dimensions
        if (widthInfo.value && heightInfo.value) {
            const templateAspect = widthInfo.value / heightInfo.value;
            const imageAspect = width / height;
            const aspectDiff = Math.abs(templateAspect - imageAspect);

            if (aspectDiff > 0.05) { // 5% tolerance
                result.warnings.push({
                    code: 'ASPECT_MISMATCH',
                    message: `Aspect ratio mismatch: Template ${templateAspect.toFixed(2)}:1 vs Image ${imageAspect.toFixed(2)}:1`,
                    severity: 'warning'
                });
                result.suggestions.push('Enable smart cropping to match template aspect ratio');
            }
        }
    } else {
        // For variable dimension templates
        if (widthInfo.isVariable && heightInfo.value && height < heightInfo.value) {
            result.warnings.push({
                code: 'SMALL_HEIGHT',
                message: `Image height (${height}px) smaller than template minimum height (${heightInfo.value}px)`,
                severity: 'warning'
            });
        }

        if (heightInfo.isVariable && widthInfo.value && width < widthInfo.value) {
            result.warnings.push({
                code: 'SMALL_WIDTH',
                message: `Image width (${width}px) smaller than template minimum width (${widthInfo.value}px)`,
                severity: 'warning'
            });
        }
    }

    // Check format compatibility if specified
    if (imageInfo.format && template.recommendedFormats?.length > 0) {
        const imageFormat = imageInfo.format.toLowerCase();
        const recommended = template.recommendedFormats.map(f => f.toLowerCase());

        if (!recommended.includes(imageFormat) && !recommended.includes('original')) {
            result.suggestions.push(`Consider converting from ${imageFormat} to ${recommended[0]} for better optimization`);
        }
    }

    // Check for transparency if converting to JPEG
    if (imageInfo.hasTransparency && template.recommendedFormats?.includes('jpg')) {
        result.warnings.push({
            code: 'TRANSPARENCY_LOSS',
            message: 'Image has transparency but template recommends JPEG format',
            severity: 'warning'
        });
        result.suggestions.push('Add a background color or use PNG/WebP format to preserve transparency');
    }

    return result;
}