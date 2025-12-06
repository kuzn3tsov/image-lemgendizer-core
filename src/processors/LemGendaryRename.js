/**
 * LemGendaryRename - Intelligent file renaming processor
 * @class
 */
export class LemGendaryRename {
    /**
     * Create a new LemGendaryRename processor
     * @param {Object} options - Rename options
     */
    constructor(options = {}) {
        this.options = {
            pattern: '{name}-{dimensions}',
            preserveExtension: true,
            addIndex: true,
            addTimestamp: false,
            customSeparator: '-',
            ...options
        };
    }

    /**
     * Process an image with rename
     * @param {LemGendImage} image - Image to process
     * @param {number} index - File index in batch
     * @param {number} total - Total files in batch
     * @returns {Promise<Object>} Rename result
     */
    async process(image, index = 0, total = 1) {
        if (!image || !image.originalName) {
            throw new Error('Invalid image or missing original name');
        }

        const variables = this.generateVariables(image, index, total);
        const newName = this.applyPattern(this.options.pattern, variables);

        return {
            originalName: image.originalName,
            newName,
            variables,
            pattern: this.options.pattern,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate variables for pattern replacement
     * @private
     */
    generateVariables(image, index, total) {
        const now = new Date();
        const originalName = image.originalName.replace(/\.[^/.]+$/, ''); // Remove extension
        const dimensions = image.width && image.height ? `${image.width}x${image.height}` : 'unknown';

        return {
            name: this.sanitizeName(originalName),
            index: index + 1,
            index_padded: String(index + 1).padStart(String(total).length, '0'),
            total,
            width: image.width || 'unknown',
            height: image.height || 'unknown',
            dimensions,
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            time: now.toTimeString().split(' ')[0], // HH:MM:SS
            timestamp: now.getTime(),
            year: now.getFullYear(),
            month: String(now.getMonth() + 1).padStart(2, '0'),
            day: String(now.getDate()).padStart(2, '0'),
            hour: String(now.getHours()).padStart(2, '0'),
            minute: String(now.getMinutes()).padStart(2, '0'),
            second: String(now.getSeconds()).padStart(2, '0'),
            extension: image.extension || 'unknown'
        };
    }

    /**
     * Apply pattern with variables
     * @private
     */
    applyPattern(pattern, variables) {
        let result = pattern;

        // Replace all variables
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            if (result.includes(placeholder)) {
                result = result.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), String(value));
            }
        }

        // Clean up result
        result = result.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        result = result.replace(/[-_]{2,}/g, '-');
        result = result.replace(/[ _]{2,}/g, ' ');
        result = result.trim();
        result = result.replace(/^[-_.]+|[-_.]+$/g, '');

        return result;
    }

    /**
     * Sanitize filename
     * @private
     */
    sanitizeName(name) {
        return name
            .replace(/[<>:"/\\|?*]/g, '-')
            .replace(/\s+/g, '_')
            .replace(/[^\w.\-]/g, '')
            .substring(0, 255)
            .trim();
    }

    /**
     * Escape regex special characters
     * @private
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get common rename patterns
     * @returns {Object} Pattern templates
     */
    getCommonPatterns() {
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
        };
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    getInfo() {
        return {
            name: 'LemGendaryRename',
            version: '1.0.0',
            description: 'Intelligent file renaming with pattern support',
            patterns: this.getCommonPatterns(),
            variables: ['name', 'index', 'index_padded', 'width', 'height', 'dimensions', 'date', 'time', 'timestamp', 'year', 'month', 'day', 'hour', 'minute', 'second', 'extension']
        };
    }
}

export default LemGendaryRename;