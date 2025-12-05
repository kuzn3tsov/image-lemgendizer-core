/**
 * LemGendaryRename™ - Intelligent rename processor
 * @class
 * @description Batch rename images with pattern support
 */
export class LemGendaryRename {
    /**
     * Create a LemGendaryRename processor
     * @param {Object} options - Rename options
     * @param {string} options.pattern - Rename pattern
     * @param {number} options.startIndex - Starting index for {index} variable
     * @param {boolean} options.preserveExtension - Keep original file extension
     * @param {string} options.dateFormat - Date format for {date} variable
     * @param {string} options.timeFormat - Time format for {time} variable
     */
    constructor(options = {}) {
        this.pattern = options.pattern || '{name}-{index}'
        this.startIndex = options.startIndex || 1
        this.preserveExtension = options.preserveExtension !== false
        this.dateFormat = options.dateFormat || 'YYYY-MM-DD'
        this.timeFormat = options.timeFormat || 'HH-mm-ss'
        this.name = 'LemGendaryRename'
        this.version = '1.0.0'
    }

    /**
     * Validate processor options
     * @private
     */
    _validateOptions = () => {
        if (!this.pattern || this.pattern.trim() === '') {
            throw new Error('Rename pattern cannot be empty')
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/
        if (invalidChars.test(this.pattern)) {
            throw new Error('Pattern contains invalid filename characters')
        }

        if (typeof this.startIndex !== 'number' || this.startIndex < 0) {
            throw new Error('Start index must be a positive number')
        }
    }

    /**
     * Process an image with rename operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @param {number} imageIndex - Index of image in batch
     * @param {number} totalImages - Total number of images
     * @returns {Promise<Object>} Processing result with new filename
     */
    process = async (lemGendImage, imageIndex = 0, totalImages = 1) => {
        this._validateOptions()

        if (!lemGendImage) {
            throw new Error('Invalid image')
        }

        const variables = this._generateVariables(lemGendImage, imageIndex)
        const newName = this._applyPattern(this.pattern, variables)

        const result = {
            success: true,
            operation: this.name,
            originalName: lemGendImage.originalName,
            newName: newName,
            variables: variables,
            settings: {
                pattern: this.pattern,
                startIndex: this.startIndex,
                preserveExtension: this.preserveExtension
            },
            warnings: [],
            recommendations: [],
            metadata: {
                processedAt: new Date().toISOString(),
                patternVariables: Object.keys(variables),
                nameLength: newName.length
            }
        }

        this._addWarningsAndRecommendations(lemGendImage, newName, result)

        return result
    }

    /**
     * Generate variables for pattern replacement
     * @private
     */
    _generateVariables = (lemGendImage, imageIndex) => {
        const now = new Date()

        const variables = {
            name: lemGendImage.originalName.replace(/\.[^/.]+$/, ''),
            originalName: lemGendImage.originalName,
            index: this.startIndex + imageIndex,
            width: lemGendImage.width || 0,
            height: lemGendImage.height || 0,
            dimensions: `${lemGendImage.width || 0}x${lemGendImage.height || 0}`,
            aspectRatio: lemGendImage.aspectRatio ? lemGendImage.aspectRatio.toFixed(2) : '0',
            orientation: lemGendImage.orientation || 'unknown',
            timestamp: now.getTime(),
            date: this._formatDate(now, this.dateFormat),
            time: this._formatDate(now, this.timeFormat),
            year: now.getFullYear(),
            month: String(now.getMonth() + 1).padStart(2, '0'),
            day: String(now.getDate()).padStart(2, '0'),
            hour: String(now.getHours()).padStart(2, '0'),
            minute: String(now.getMinutes()).padStart(2, '0'),
            second: String(now.getSeconds()).padStart(2, '0'),
            extension: lemGendImage.extension || 'unknown',
            fileSize: lemGendImage.originalSize || 0,
            transparency: lemGendImage.transparency ? 'transparent' : 'opaque'
        }

        variables['dimensions_wxh'] = `${variables.width}x${variables.height}`
        variables['dimensions_hxw'] = `${variables.height}x${variables.width}`

        const totalDigits = Math.max(3, String(variables.index + 100).length - 1)
        variables['index_padded'] = String(variables.index).padStart(totalDigits, '0')

        return variables
    }

    /**
     * Format date according to pattern
     * @private
     */
    _formatDate = (date, format) => {
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
            result = result.replace(new RegExp(key, 'g'), value)
        }

        return result
    }

    /**
     * Apply pattern with variables
     * @private
     */
    _applyPattern = (pattern, variables) => {
        let result = pattern

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`
            if (result.includes(placeholder)) {
                result = result.replace(new RegExp(this._escapeRegExp(placeholder), 'g'), String(value))
            }
        }

        result = result.replace(/{[^}]+}/g, '')
        result = result.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        result = result.replace(/[-_]{2,}/g, '-')
        result = result.replace(/[ _]{2,}/g, ' ')
        result = result.trim()
        result = result.replace(/^[-_.]+|[-_.]+$/g, '')

        return result
    }

    /**
     * Escape regex special characters
     * @private
     */
    _escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    /**
     * Add warnings and recommendations to result
     * @private
     */
    _addWarningsAndRecommendations = (lemGendImage, newName, result) => {
        const patternVariables = this.pattern.match(/{[^}]+}/g) || []
        const usedVariables = patternVariables.map(v => v.slice(1, -1))

        const hasUniqueIdentifier = usedVariables.some(v =>
            ['index', 'timestamp', 'time'].includes(v)
        )

        if (!hasUniqueIdentifier && !this.pattern.includes('{name}')) {
            result.warnings.push({
                type: 'no_unique_identifier',
                message: 'Pattern may create duplicate filenames',
                severity: 'warning',
                suggestion: 'Include {index}, {timestamp}, or {time} for unique filenames'
            })
        }

        if (newName.length < 3) {
            result.warnings.push({
                type: 'very_short_name',
                message: 'Filename is very short',
                severity: 'warning',
                suggestion: 'Consider adding more variables to the pattern'
            })
        }

        if (newName.length > 255) {
            result.warnings.push({
                type: 'very_long_name',
                message: 'Filename exceeds 255 characters',
                severity: 'error',
                suggestion: 'Simplify pattern or use shorter variable names'
            })
        }

        const specialChars = /[~`!@#$%^&*()+=[]{}|;:',<>?]/
        if (specialChars.test(newName)) {
            result.warnings.push({
                type: 'special_characters',
                message: 'Filename contains special characters that may cause issues',
                severity: 'warning',
                suggestion: 'Use only letters, numbers, hyphens, and underscores'
            })
        }

        const originalBase = lemGendImage.originalName.replace(/\.[^/.]+$/, '')
        const similarity = this._calculateSimilarity(originalBase, newName)

        if (similarity < 0.3) {
            result.recommendations.push({
                type: 'significant_name_change',
                message: 'Filename changed significantly from original',
                suggestion: 'Consider including {name} variable to preserve original name reference'
            })
        }

        if (this.pattern.includes('{index}')) {
            result.metadata.sequentialNumbering = true
            result.metadata.startIndex = this.startIndex
            result.metadata.indexPadding = this.pattern.includes('{index_padded}') ? 'padded' : 'unpadded'
        }
    }

    /**
     * Calculate string similarity
     * @private
     */
    _calculateSimilarity = (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2
        const shorter = str1.length > str2.length ? str2 : str1

        if (longer.length === 0) {
            return 1.0
        }

        const commonChars = shorter.split('').filter(char => longer.includes(char)).length
        return commonChars / longer.length
    }

    /**
     * Get common rename patterns
     * @returns {Object} Common pattern templates
     */
    static getCommonPatterns() {
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
     * Get processor description
     * @returns {string} Description
     */
    static getDescription() {
        return 'LemGendaryRename™: Batch rename images with pattern support.'
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    static getInfo() {
        return {
            name: 'LemGendaryRename',
            version: '1.0.0',
            description: this.getDescription(),
            variables: [
                '{name}', '{index}', '{index_padded}', '{width}', '{height}',
                '{dimensions}', '{dimensions_wxh}', '{dimensions_hxw}',
                '{aspectRatio}', '{orientation}', '{timestamp}', '{date}',
                '{time}', '{year}', '{month}', '{day}', '{hour}', '{minute}',
                '{second}', '{extension}', '{fileSize}', '{transparency}'
            ],
            commonPatterns: this.getCommonPatterns()
        }
    }

    /**
     * Create processor from configuration object
     * @param {Object} config - Processor configuration
     * @returns {LemGendaryRename} New processor instance
     */
    static fromConfig(config) {
        return new LemGendaryRename(config)
    }
}