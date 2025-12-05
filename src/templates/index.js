/**
 * Template management and utilities
 * @module templates
 */

// Import template data from .js files
import socialTemplates from './social.js'
import webTemplates from './web.js'
import faviconTemplates from './favicon.js'
import logoTemplates from './logo.js'

// Import validation utilities
import { parseDimension, isVariableDimension } from '../utils/validation.js'

/**
 * LemGendTemplates - Collection of all available templates
 * @constant
 */
export const LemGendTemplates = {
    SOCIAL_MEDIA: socialTemplates,
    WEB: webTemplates,
    LOGO: logoTemplates,
    FAVICON: faviconTemplates,
    ALL: [...socialTemplates, ...webTemplates, ...logoTemplates, ...faviconTemplates]
}

/**
 * Template categories
 * @constant
 */
export const TEMPLATE_CATEGORIES = [
    { id: 'all', name: 'All Templates', icon: 'fas fa-th', color: '#3B82F6' },
    { id: 'social', name: 'Social Media', icon: 'fas fa-share-alt', color: '#8B5CF6' },
    { id: 'web', name: 'Web', icon: 'fas fa-globe', color: '#10B981' },
    { id: 'logo', name: 'Logo', icon: 'fas fa-copyright', color: '#F59E0B' },
    { id: 'favicon', name: 'Favicon', icon: 'fas fa-star', color: '#EC4899' }
]

/**
 * Platform information
 * @constant
 */
export const PLATFORMS = {
    instagram: {
        name: 'Instagram',
        icon: 'fab fa-instagram',
        color: '#E4405F',
        categories: ['social']
    },
    facebook: {
        name: 'Facebook',
        icon: 'fab fa-facebook',
        color: '#1877F2',
        categories: ['social']
    },
    twitter: {
        name: 'Twitter / X',
        icon: 'fab fa-twitter',
        color: '#1DA1F2',
        categories: ['social']
    },
    linkedin: {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin',
        color: '#0A66C2',
        categories: ['social']
    },
    youtube: {
        name: 'YouTube',
        icon: 'fab fa-youtube',
        color: '#FF0000',
        categories: ['social']
    },
    pinterest: {
        name: 'Pinterest',
        icon: 'fab fa-pinterest',
        color: '#E60023',
        categories: ['social']
    },
    tiktok: {
        name: 'TikTok',
        icon: 'fab fa-tiktok',
        color: '#000000',
        categories: ['social']
    },
    web: {
        name: 'Web',
        icon: 'fas fa-globe',
        color: '#3B82F6',
        categories: ['web']
    },
    logo: {
        name: 'Logo',
        icon: 'fas fa-copyright',
        color: '#8B5CF6',
        categories: ['logo']
    },
    favicon: {
        name: 'Favicon',
        icon: 'fas fa-star',
        color: '#EC4899',
        categories: ['favicon']
    }
}

/**
 * Get templates by platform
 * @param {string} platform - Platform identifier
 * @returns {Array} Array of templates for the platform
 */
export function getTemplatesByPlatform(platform) {
    if (!PLATFORMS[platform]) {
        console.warn(`Unknown platform: ${platform}`)
        return []
    }

    return LemGendTemplates.ALL.filter(template =>
        template.platform && template.platform.toLowerCase() === platform.toLowerCase()
    )
}

/**
 * Get templates by category
 * @param {string} category - Category identifier
 * @returns {Array} Array of templates in the category
 */
export function getTemplatesByCategory(category) {
    const validCategories = TEMPLATE_CATEGORIES.map(c => c.id)
    if (!validCategories.includes(category) && category !== 'all') {
        console.warn(`Invalid category: ${category}`)
        return []
    }

    if (category === 'all') {
        return LemGendTemplates.ALL
    }

    return LemGendTemplates.ALL.filter(template =>
        template.category && template.category.toLowerCase() === category.toLowerCase()
    )
}

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(id) {
    return LemGendTemplates.ALL.find(template => template.id === id) || null
}

/**
 * Get templates with specific dimensions
 * @param {number|string} width - Minimum width (can be number or 'flex')
 * @param {number|string} height - Minimum height (can be number or 'flex')
 * @param {string} operator - 'exact', 'min', 'max', 'aspect', 'flexible'
 * @returns {Array} Filtered templates
 */
export function getTemplatesByDimensions(width, height, operator = 'min') {
    return LemGendTemplates.ALL.filter(template => {
        if (!template.width || !template.height) return false

        // Parse dimensions
        const templateWidth = parseDimension(template.width)
        const templateHeight = parseDimension(template.height)
        const targetWidth = parseDimension(width)
        const targetHeight = parseDimension(height)

        // Handle flexible templates
        if (operator === 'flexible') {
            return templateWidth.isVariable || templateHeight.isVariable
        }

        // For exact match with flexible dimensions
        if (operator === 'exact' && (templateWidth.isVariable || templateHeight.isVariable)) {
            // For flexible templates, we need special handling
            if (templateWidth.isVariable && templateHeight.isVariable) {
                return targetWidth.isVariable && targetHeight.isVariable
            } else if (templateWidth.isVariable) {
                return targetWidth.isVariable && templateHeight.value === targetHeight.value
            } else if (templateHeight.isVariable) {
                return templateWidth.value === targetWidth.value && targetHeight.isVariable
            }
        }

        // Ensure we have fixed values for comparison
        if (templateWidth.isVariable || templateHeight.isVariable ||
            targetWidth.isVariable || targetHeight.isVariable) {
            return false
        }

        switch (operator) {
            case 'exact':
                return templateWidth.value === targetWidth.value && templateHeight.value === targetHeight.value
            case 'min':
                return templateWidth.value >= targetWidth.value && templateHeight.value >= targetHeight.value
            case 'max':
                return templateWidth.value <= targetWidth.value && templateHeight.value <= targetHeight.value
            case 'aspect':
                const templateAspect = templateWidth.value / templateHeight.value
                const targetAspect = targetWidth.value / targetHeight.value
                return Math.abs(templateAspect - targetAspect) < 0.1 // Within 10%
            default:
                return false
        }
    })
}

/**
 * Calculate match score between image and template - ENHANCED for flexible dimensions
 * @private
 */
function calculateTemplateMatchScore(image, template) {
    let score = 0
    const maxScore = 100

    // Check if image has dimensions
    if (!image || !image.width || !image.height) {
        return 0.5 // Default score if missing data
    }

    // Parse template dimensions
    const templateWidth = parseDimension(template.width)
    const templateHeight = parseDimension(template.height)

    // Handle flexible/variable dimensions in template
    if (templateWidth.isVariable || templateHeight.isVariable) {
        // For flexible templates, score based on what's available

        // Base score for flexibility (50 points)
        score += 50

        // Check aspect ratio compatibility (30 points)
        if (templateWidth.isVariable && !templateHeight.isVariable) {
            // Height is fixed, check if image height is sufficient
            const heightRatio = image.height / templateHeight.value
            if (heightRatio >= 1) {
                score += 30 // Perfect height match
            } else if (heightRatio >= 0.8) {
                score += 20 * heightRatio // Good enough
            } else {
                score += 10 * heightRatio // Poor match
            }

            // Check if image has reasonable aspect ratio for web content (20 points)
            const aspect = image.width / image.height
            if (aspect >= 0.5 && aspect <= 2.0) {
                score += 20 // Good aspect ratio for content
            } else {
                score += 10 // Extreme aspect ratio
            }
        }
        else if (!templateWidth.isVariable && templateHeight.isVariable) {
            // Width is fixed, check if image width is sufficient
            const widthRatio = image.width / templateWidth.value
            if (widthRatio >= 1) {
                score += 30 // Perfect width match
            } else if (widthRatio >= 0.8) {
                score += 20 * widthRatio // Good enough
            } else {
                score += 10 * widthRatio // Poor match
            }

            // Check if image has reasonable aspect ratio for web content (20 points)
            const aspect = image.width / image.height
            if (aspect >= 0.5 && aspect <= 2.0) {
                score += 20 // Good aspect ratio for content
            } else {
                score += 10 // Extreme aspect ratio
            }
        }
        else {
            // Both dimensions are variable - give high score for maximum flexibility
            score += 50 // Full points for flexibility
        }
    } else {
        // Fixed template dimensions - original logic
        // Aspect ratio match (50 points)
        const imageAspect = image.width / image.height
        const templateAspect = templateWidth.value / templateHeight.value
        const aspectDiff = Math.abs(imageAspect - templateAspect) / imageAspect
        score += Math.max(0, 50 * (1 - aspectDiff))

        // Size adequacy (30 points)
        const widthRatio = image.width / templateWidth.value
        const heightRatio = image.height / templateHeight.value
        const minRatio = Math.min(widthRatio, heightRatio)

        if (minRatio >= 1) {
            // Image is larger than template - good
            score += 30
        } else {
            // Image is smaller - penalty based on how much smaller
            score += 30 * minRatio
        }

        // Platform/category relevance (20 points)
        score += 20
    }

    return Math.min(maxScore, score) / maxScore // Normalize to 0-1
}

/**
 * Get recommended templates for an image
 * @param {Object} image - Image to match templates for (needs width, height properties)
 * @param {Object} options - Matching options
 * @returns {Array} Recommended templates
 */
export function getRecommendedTemplates(image, options = {}) {
    const {
        category = 'all',
        platform = null,
        minMatchScore = 0.7,
        includeFlexible = true
    } = options

    // Get initial templates
    let templates = category === 'all'
        ? LemGendTemplates.ALL
        : getTemplatesByCategory(category)

    if (platform) {
        templates = templates.filter(t => t.platform === platform)
    }

    // Filter out flexible templates if not wanted
    if (!includeFlexible) {
        templates = templates.filter(template => {
            const widthInfo = parseDimension(template.width)
            const heightInfo = parseDimension(template.height)
            return !widthInfo.isVariable && !heightInfo.isVariable
        })
    }

    // Calculate match score for each template
    const scoredTemplates = templates.map(template => {
        const score = calculateTemplateMatchScore(image, template)
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)

        return {
            ...template,
            matchScore: score,
            hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable,
            flexibleType: widthInfo.isVariable ? 'width' : heightInfo.isVariable ? 'height' : 'none'
        }
    })

    // Filter by minimum score and sort by score
    return scoredTemplates
        .filter(t => t.matchScore >= minMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Get template statistics - ENHANCED for flexible templates
 * @returns {Object} Template statistics
 */
export function getTemplateStats() {
    const stats = {
        total: LemGendTemplates.ALL.length,
        byCategory: {},
        byPlatform: {},
        flexibleTemplates: 0,
        fixedTemplates: 0,
        dimensions: {
            minWidth: Infinity,
            maxWidth: 0,
            minHeight: Infinity,
            maxHeight: 0,
            commonAspectRatios: {}
        }
    }

    // Count by category
    TEMPLATE_CATEGORIES.forEach(category => {
        if (category.id !== 'all') {
            const count = getTemplatesByCategory(category.id).length
            stats.byCategory[category.id] = count
        }
    })

    // Count by platform
    Object.keys(PLATFORMS).forEach(platform => {
        const count = getTemplatesByPlatform(platform).length
        stats.byPlatform[platform] = count
    })

    // Calculate dimension statistics and count flexible templates
    LemGendTemplates.ALL.forEach(template => {
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)

        if (widthInfo.isVariable || heightInfo.isVariable) {
            stats.flexibleTemplates++
        } else {
            stats.fixedTemplates++

            // Update min/max for fixed dimensions only
            stats.dimensions.minWidth = Math.min(stats.dimensions.minWidth, widthInfo.value)
            stats.dimensions.maxWidth = Math.max(stats.dimensions.maxWidth, widthInfo.value)
            stats.dimensions.minHeight = Math.min(stats.dimensions.minHeight, heightInfo.value)
            stats.dimensions.maxHeight = Math.max(stats.dimensions.maxHeight, heightInfo.value)

            // Calculate aspect ratio for fixed dimensions
            const aspect = (widthInfo.value / heightInfo.value).toFixed(2)
            stats.dimensions.commonAspectRatios[aspect] =
                (stats.dimensions.commonAspectRatios[aspect] || 0) + 1
        }
    })

    return stats
}

/**
 * Export templates to various formats
 * @param {string} format - Export format: 'json', 'csv', 'markdown'
 * @returns {string} Exported data
 */
export function exportTemplates(format = 'json') {
    switch (format.toLowerCase()) {
        case 'json':
            return JSON.stringify(LemGendTemplates, null, 2)

        case 'csv':
            const headers = ['id', 'name', 'platform', 'category', 'width', 'height', 'description', 'flexible']
            const rows = LemGendTemplates.ALL.map(t => {
                const widthInfo = parseDimension(t.width)
                const heightInfo = parseDimension(t.height)
                const flexible = widthInfo.isVariable || heightInfo.isVariable ? 'yes' : 'no'

                return [
                    t.id,
                    t.name,
                    t.platform,
                    t.category,
                    t.width,
                    t.height,
                    t.description || '',
                    flexible
                ]
            })
            return [headers, ...rows].map(row => row.join(',')).join('\n')

        case 'markdown':
            let markdown = '# LemGendary Templates\n\n'
            markdown += `**Total Templates:** ${LemGendTemplates.ALL.length}\n\n`

            const stats = getTemplateStats()
            markdown += `**Flexible Templates:** ${stats.flexibleTemplates}\n`
            markdown += `**Fixed Templates:** ${stats.fixedTemplates}\n\n`

            TEMPLATE_CATEGORIES.forEach(category => {
                if (category.id !== 'all') {
                    const templates = getTemplatesByCategory(category.id)
                    markdown += `## ${category.name} (${templates.length})\n\n`

                    // Group by platform for better organization
                    const templatesByPlatform = {}
                    templates.forEach(template => {
                        if (!templatesByPlatform[template.platform]) {
                            templatesByPlatform[template.platform] = []
                        }
                        templatesByPlatform[template.platform].push(template)
                    })

                    Object.keys(templatesByPlatform).forEach(platform => {
                        const platformTemplates = templatesByPlatform[platform]
                        const platformInfo = PLATFORMS[platform] || { name: platform }
                        markdown += `### ${platformInfo.name}\n`

                        platformTemplates.forEach(template => {
                            const widthInfo = parseDimension(template.width)
                            const heightInfo = parseDimension(template.height)
                            const flexible = widthInfo.isVariable || heightInfo.isVariable

                            markdown += `- **${template.displayName || template.name}**: `

                            if (flexible) {
                                if (widthInfo.isVariable && heightInfo.isVariable) {
                                    markdown += `Flexible dimensions`
                                } else if (widthInfo.isVariable) {
                                    markdown += `Flexible width × ${heightInfo.value}`
                                } else {
                                    markdown += `${widthInfo.value} × Flexible height`
                                }
                            } else {
                                markdown += `${widthInfo.value} × ${heightInfo.value}`
                            }

                            if (template.description) {
                                markdown += ` - ${template.description}`
                            }

                            if (flexible) {
                                markdown += ` ⚡`
                            }

                            markdown += ` (\`${template.id}\`)\n`
                        })
                        markdown += '\n'
                    })
                }
            })

            return markdown

        default:
            throw new Error(`Unsupported export format: ${format}`)
    }
}

/**
 * Validate template configuration
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result
 */
export function validateTemplate(template) {
    const errors = []
    const warnings = []

    // Required fields
    const requiredFields = ['id', 'name', 'width', 'height', 'platform', 'category']
    requiredFields.forEach(field => {
        if (!template[field]) {
            errors.push(`Missing required field: ${field}`)
        }
    })

    // Field validation
    if (template.id && typeof template.id !== 'string') {
        errors.push('id must be a string')
    }

    // Width/height validation with flexible dimension support
    const widthInfo = parseDimension(template.width)
    const heightInfo = parseDimension(template.height)

    if (!widthInfo.isVariable && (typeof widthInfo.value !== 'number' || widthInfo.value <= 0 || isNaN(widthInfo.value))) {
        errors.push('width must be a positive number or "flex"')
    }

    if (!heightInfo.isVariable && (typeof heightInfo.value !== 'number' || heightInfo.value <= 0 || isNaN(heightInfo.value))) {
        errors.push('height must be a positive number or "flex"')
    }

    if (template.platform && !PLATFORMS[template.platform]) {
        warnings.push(`Unknown platform: ${template.platform}`)
    }

    if (template.category && !TEMPLATE_CATEGORIES.find(c => c.id === template.category)) {
        warnings.push(`Unknown category: ${template.category}`)
    }

    // Check for duplicate ID
    if (template.id && getTemplateById(template.id)) {
        warnings.push(`Duplicate template ID: ${template.id}`)
    }

    // Validate aspect ratio field if present
    if (template.aspectRatio) {
        if (template.aspectRatio === 'flexible' || template.aspectRatio === 'variable') {
            // This is fine for flexible templates
            if (!widthInfo.isVariable && !heightInfo.isVariable) {
                warnings.push('aspectRatio is "flexible" but both dimensions are fixed')
            }
        } else if (!template.aspectRatio.match(/^\d+:\d+$/)) {
            warnings.push(`Invalid aspect ratio format: ${template.aspectRatio}. Use "w:h" or "flexible"`)
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable
    }
}

/**
 * Add a custom template
 * @param {Object} template - Template to add
 * @returns {Object} Added template with validation result
 */
export function addCustomTemplate(template) {
    const validation = validateTemplate(template)

    if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`)
    }

    // Add to appropriate category array
    switch (template.category) {
        case 'social':
            LemGendTemplates.SOCIAL_MEDIA.push(template)
            break
        case 'web':
            LemGendTemplates.WEB.push(template)
            break
        case 'logo':
            LemGendTemplates.LOGO.push(template)
            break
        case 'favicon':
            LemGendTemplates.FAVICON.push(template)
            break
        default:
            throw new Error(`Invalid category for custom template: ${template.category}`)
    }

    // Also add to ALL array
    LemGendTemplates.ALL.push(template)

    return {
        template,
        validation,
        message: 'Custom template added successfully'
    }
}

/**
 * Get all available platforms
 * @returns {Array} Array of platform objects
 */
export function getAllPlatforms() {
    return Object.keys(PLATFORMS).map(key => ({
        id: key,
        ...PLATFORMS[key]
    }))
}

/**
 * Get templates grouped by platform
 * @returns {Object} Templates grouped by platform
 */
export function getTemplatesGroupedByPlatform() {
    const grouped = {}

    Object.keys(PLATFORMS).forEach(platform => {
        grouped[platform] = getTemplatesByPlatform(platform)
    })

    return grouped
}

/**
 * Search templates by name, description, or platform
 * @param {string} query - Search query
 * @returns {Array} Matching templates
 */
export function searchTemplates(query) {
    if (!query || query.trim() === '') {
        return LemGendTemplates.ALL
    }

    const searchTerm = query.toLowerCase().trim()

    return LemGendTemplates.ALL.filter(template => {
        return (
            (template.name && template.name.toLowerCase().includes(searchTerm)) ||
            (template.displayName && template.displayName.toLowerCase().includes(searchTerm)) ||
            (template.description && template.description.toLowerCase().includes(searchTerm)) ||
            (template.platform && template.platform.toLowerCase().includes(searchTerm)) ||
            (template.category && template.category.toLowerCase().includes(searchTerm)) ||
            (template.id && template.id.toLowerCase().includes(searchTerm))
        )
    })
}

/**
 * Get aspect ratio of a template
 * @param {Object} template - Template object
 * @returns {string} Aspect ratio in format "w:h" or "flexible"
 */
export function getTemplateAspectRatio(template) {
    const widthInfo = parseDimension(template.width)
    const heightInfo = parseDimension(template.height)

    if (widthInfo.isVariable || heightInfo.isVariable) {
        return 'flexible'
    }

    if (!widthInfo.value || !heightInfo.value) return 'unknown'

    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(widthInfo.value, heightInfo.value)

    return `${widthInfo.value / divisor}:${heightInfo.value / divisor}`
}

/**
 * Get all templates with flexible/variable dimensions
 * @returns {Array} Templates with flexible dimensions
 */
export function getFlexibleTemplates() {
    return LemGendTemplates.ALL.filter(template => {
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)
        return widthInfo.isVariable || heightInfo.isVariable
    })
}

/**
 * Get templates suitable for an image based on dimensions
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} options - Options for filtering
 * @returns {Array} Suitable templates
 */
export function getTemplatesForImage(width, height, options = {}) {
    const {
        category = 'all',
        platform = null,
        allowFlexible = true,
        minCoverage = 0.8 // How much of the template should the image cover
    } = options

    let templates = category === 'all'
        ? LemGendTemplates.ALL
        : getTemplatesByCategory(category)

    if (platform) {
        templates = templates.filter(t => t.platform === platform)
    }

    if (!allowFlexible) {
        templates = templates.filter(t => {
            const widthInfo = parseDimension(t.width)
            const heightInfo = parseDimension(t.height)
            return !widthInfo.isVariable && !heightInfo.isVariable
        })
    }

    // Score each template
    const scoredTemplates = templates.map(template => {
        const widthInfo = parseDimension(template.width)
        const heightInfo = parseDimension(template.height)
        let score = 0
        let coverage = 1
        let reason = ''

        if (widthInfo.isVariable || heightInfo.isVariable) {
            // Flexible template scoring
            score = 0.8 // Base score for flexible templates

            if (widthInfo.isVariable && heightInfo.isVariable) {
                reason = 'Both dimensions flexible - perfect fit'
                score = 0.95
            } else if (widthInfo.isVariable) {
                // Height is fixed
                coverage = height / heightInfo.value
                if (coverage >= 1) {
                    score = 0.9
                    reason = 'Image height exceeds template height'
                } else if (coverage >= minCoverage) {
                    score = 0.8
                    reason = 'Image height adequate for template'
                } else {
                    score = 0.5
                    reason = 'Image height insufficient for template'
                }
            } else {
                // Width is fixed
                coverage = width / widthInfo.value
                if (coverage >= 1) {
                    score = 0.9
                    reason = 'Image width exceeds template width'
                } else if (coverage >= minCoverage) {
                    score = 0.8
                    reason = 'Image width adequate for template'
                } else {
                    score = 0.5
                    reason = 'Image width insufficient for template'
                }
            }
        } else {
            // Fixed template scoring
            const widthCoverage = width / widthInfo.value
            const heightCoverage = height / heightInfo.value
            coverage = Math.min(widthCoverage, heightCoverage)

            if (coverage >= 1) {
                score = 1.0
                reason = 'Image exceeds template dimensions'
            } else if (coverage >= minCoverage) {
                score = 0.7 + (coverage * 0.3)
                reason = 'Image adequate for template'
            } else {
                score = coverage
                reason = 'Image too small for template'
            }

            // Aspect ratio penalty
            const imageAspect = width / height
            const templateAspect = widthInfo.value / heightInfo.value
            const aspectDiff = Math.abs(imageAspect - templateAspect)
            if (aspectDiff > 0.1) {
                score *= 0.8
                reason += ' (aspect ratio mismatch)'
            }
        }

        return {
            ...template,
            matchScore: score,
            coverage: coverage,
            reason: reason,
            hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable
        }
    })

    // Sort by score descending
    return scoredTemplates.sort((a, b) => b.matchScore - a.matchScore)
}
export { isVariableDimension, parseDimension }
// Export default object for convenience
export default {
    LemGendTemplates,
    TEMPLATE_CATEGORIES,
    PLATFORMS,
    getTemplatesByPlatform,
    getTemplatesByCategory,
    getTemplateById,
    getTemplatesByDimensions,
    getRecommendedTemplates,
    getTemplateStats,
    exportTemplates,
    validateTemplate,
    addCustomTemplate,
    getAllPlatforms,
    getTemplatesGroupedByPlatform,
    searchTemplates,
    getTemplateAspectRatio,
    getFlexibleTemplates,
    getTemplatesForImage
}