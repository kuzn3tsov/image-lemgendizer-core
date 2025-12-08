/**
 * Shared utilities used by multiple modules
 * @module utils/sharedUtils
 */

/**
 * Check if dimension is variable
 */
export function isVariableDimension(dimension) {
    if (typeof dimension === 'string') {
        return dimension.includes('{') || dimension.includes('*') ||
            dimension.toLowerCase().includes('variable') ||
            dimension.toLowerCase().includes('flexible') ||
            dimension === 'auto' || dimension === 'any'
    }
    return false
}

/**
 * Parse dimension string or number
 */
export function parseDimension(dimension) {
    if (typeof dimension === 'number') {
        return { value: dimension, isVariable: false, unit: 'px' }
    }

    if (typeof dimension === 'string') {
        if (isVariableDimension(dimension)) {
            return { value: null, isVariable: true, expression: dimension }
        }

        const match = dimension.match(/(\d+)/)
        if (match) {
            return { value: parseInt(match[1]), isVariable: false, unit: 'px' }
        }
    }

    return { value: null, isVariable: false }
}