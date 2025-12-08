/**
 * String utility functions
 * @module utils/stringUtils
 */

/**
 * Calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) {
        return 1.0
    }

    const commonChars = shorter.split('').filter(char => longer.includes(char)).length
    return commonChars / longer.length
}

/**
 * Escape regex special characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format date according to pattern
 * @param {Date} date - Date to format
 * @param {string} format - Format pattern
 * @returns {string} Formatted date string
 */
export function formatDatePattern(date, format) {
    const replacements = {
        'YYYY': date.getFullYear(),
        'YY': String(date.getFullYear()).slice(-2),
        'MM': String(date.getMonth() + 1).padStart(2, '0'),
        'M': date.getMonth() + 1,
        'DD': String(date.getDate()).padStart(2, '0'),
        'D': date.getDate(),
        'HH': String(date.getHours()).padStart(2, '0'),
        'H': date.getHours(),
        'mm': String(date.getMinutes()).padStart(2, '0'),
        'm': date.getMinutes(),
        'ss': String(date.getSeconds()).padStart(2, '0'),
        's': date.getSeconds()
    }

    let result = format
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(escapeRegExp(key), 'g'), String(value))
    }

    return result
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    if (!filename) return 'unnamed-file'

    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')
        .replace(/[^\w.\-]/g, '')
        .substring(0, 255)
        .trim()
}

/**
 * Generate common rename patterns
 * @returns {Object} Pattern templates
 */
export function getCommonRenamePatterns() {
    return {
        'sequential': '{name}-{index_padded}',
        'dated': '{name}-{date}',
        'timestamped': '{name}-{timestamp}',
        'dimensioned': '{name}-{dimensions}',
        'simple': '{index_padded}',
        'descriptive': '{name}-{dimensions}-{date}',
        'batch': 'batch-{date}-{index_padded}',
        'export': 'export-{timestamp}',
        'web': '{name}-{width}w',
        'social': '{name}-{dimensions}-social'
    }
}

/**
 * Extract variables from pattern
 * @param {string} pattern - Pattern string
 * @returns {Array} Array of variable names
 */
export function extractPatternVariables(pattern) {
    const matches = pattern.match(/{[^}]+}/g) || []
    return matches.map(v => v.slice(1, -1))
}

/**
 * Apply pattern with variables
 * @param {string} pattern - Pattern string
 * @param {Object} variables - Variables object
 * @returns {string} Result string
 */
export function applyPattern(pattern, variables) {
    let result = pattern

    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`
        if (result.includes(placeholder)) {
            result = result.replace(new RegExp(escapeRegExp(placeholder), 'g'), String(value))
        }
    }

    // Remove any unmatched placeholders
    result = result.replace(/{[^}]+}/g, '')

    // Clean up invalid characters
    result = result.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    result = result.replace(/[-_]{2,}/g, '-')
    result = result.replace(/[ _]{2,}/g, ' ')
    result = result.trim()
    result = result.replace(/^[-_.]+|[-_.]+$/g, '')

    return result
}