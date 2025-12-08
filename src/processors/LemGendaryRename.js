/**
 * LemGendaryRename - Intelligent file renaming processor
 * @class
 */

// Import string utilities
import {
    applyPattern,
    sanitizeFilename,
    extractPatternVariables,
    getCommonRenamePatterns,
    formatDatePattern
} from '../utils/stringUtils.js';

// Import validation utilities
import { validateRenamePattern } from '../utils/validationUtils.js';

// Import constants
import {
    Defaults,
    WarningCodes,
    ErrorCodes,
    SeverityLevels
} from '../constants/sharedConstants.js';

export class LemGendaryRename {
    /**
     * Create a new LemGendaryRename processor
     * @param {Object} options - Rename options
     */
    constructor(options = {}) {
        this.options = {
            pattern: Defaults.RENAME_PATTERN,
            preserveExtension: Defaults.PRESERVE_EXTENSION,
            addIndex: Defaults.ADD_INDEX,
            addTimestamp: Defaults.ADD_TIMESTAMP,
            customSeparator: Defaults.DEFAULT_SEPARATOR,
            usePaddedIndex: Defaults.USE_PADDED_INDEX,
            dateFormat: Defaults.DATE_FORMAT,
            timeFormat: Defaults.TIME_FORMAT,
            maxLength: Defaults.MAX_FILENAME_LENGTH,
            replaceSpaces: Defaults.REPLACE_SPACES,
            spaceReplacement: Defaults.SPACE_REPLACEMENT,
            keepSpecialChars: Defaults.KEEP_SPECIAL_CHARS,
            ...options
        };

        // Validate pattern on creation
        this.validatePattern();

        // Store warnings for later use
        this.warnings = [];

        // Extract pattern variables for validation
        this.patternVariables = extractPatternVariables(this.options.pattern);
    }

    /**
     * Validate rename pattern
     * @private
     */
    validatePattern() {
        const validation = validateRenamePattern(this.options.pattern);

        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Invalid rename pattern: ${errorMessages}`);
        }

        // Store warnings for later use
        this.warnings = validation.warnings || [];

        // Additional validation specific to rename
        this.validateRenameSpecificOptions();
    }

    /**
     * Validate rename-specific options
     * @private
     */
    validateRenameSpecificOptions() {
        const { pattern, maxLength, keepSpecialChars } = this.options;

        // Check pattern length
        if (pattern.length > 100) {
            this.warnings.push({
                code: WarningCodes.LONG_PATTERN,
                message: 'Rename pattern is very long',
                severity: SeverityLevels.INFO,
                suggestion: 'Consider a shorter pattern for readability'
            });
        }

        // Check for missing index in batch patterns
        if (pattern.includes('batch') && !pattern.includes('{index') && !pattern.includes('{timestamp}')) {
            this.warnings.push({
                code: WarningCodes.MISSING_UNIQUE_ID,
                message: 'Batch pattern may create duplicate filenames',
                severity: SeverityLevels.WARNING,
                suggestion: 'Add {index} or {timestamp} to ensure unique filenames'
            });
        }

        // Check max length
        if (maxLength < 10 || maxLength > 500) {
            this.warnings.push({
                code: WarningCodes.INVALID_MAX_LENGTH,
                message: `Maximum filename length ${maxLength} is outside recommended range (10-500)`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Use a value between 10 and 500 characters'
            });
        }

        // Check special characters warning
        if (keepSpecialChars) {
            this.warnings.push({
                code: WarningCodes.SPECIAL_CHARS_ENABLED,
                message: 'Special characters may cause issues on some systems',
                severity: SeverityLevels.WARNING,
                suggestion: 'Disable keepSpecialChars for maximum compatibility'
            });
        }
    }

    /**
     * Process an image with rename
     * @param {LemGendImage} image - Image to process
     * @param {number} index - File index in batch
     * @param {number} total - Total files in batch
     * @returns {Promise<Object>} Rename result
     */
    async process(image, index = 0, total = 1) {
        try {
            console.log('LemGendaryRename processing started:', {
                originalName: image.originalName,
                pattern: this.options.pattern,
                index,
                total
            });

            // Validate input
            if (!image || !image.originalName) {
                throw new Error('Invalid image or missing original name');
            }

            // Generate variables
            const variables = this.generateVariables(image, index, total);

            // Apply pattern
            const newName = this.applyPattern(this.options.pattern, variables);

            // Apply final sanitization
            const finalName = this.finalizeName(newName);

            // Check for potential issues
            this.checkForIssues(image.originalName, finalName, variables);

            const result = {
                success: true,
                originalName: image.originalName,
                newName: finalName,
                variables,
                pattern: this.options.pattern,
                warnings: this.warnings,
                metadata: {
                    processedAt: new Date().toISOString(),
                    patternVariables: this.patternVariables,
                    nameLength: finalName.length,
                    extension: image.extension || 'unknown',
                    index,
                    total,
                    constants: {
                        pattern: this.options.pattern,
                        maxLength: this.options.maxLength,
                        separator: this.options.customSeparator
                    }
                },
                analysis: {
                    nameChange: image.originalName !== finalName,
                    patternUsed: this.options.pattern,
                    variableCount: Object.keys(variables).length,
                    usedVariables: Object.keys(variables).filter(k =>
                        this.options.pattern.includes(`{${k}}`)
                    )
                }
            };

            console.log('LemGendaryRename processing complete:', {
                original: result.originalName,
                new: result.newName,
                pattern: result.pattern,
                variables: result.usedVariables
            });

            return result;

        } catch (error) {
            console.error('LemGendaryRename processing failed:', error);
            throw new Error(`Rename failed: ${error.message}`);
        }
    }

    /**
     * Generate variables for pattern replacement
     * @private
     */
    generateVariables(image, index, total) {
        const now = new Date();

        // Extract base name without extension
        const originalName = image.originalName || 'unnamed';
        const baseName = this.extractBaseName(originalName);

        // Get dimensions
        const dimensions = image.width && image.height ?
            `${image.width}x${image.height}` :
            'unknown';

        // Generate index variables
        const indexNum = index + 1;
        const indexPadded = this.options.usePaddedIndex ?
            String(indexNum).padStart(String(total).length, '0') :
            String(indexNum);

        // Format date and time
        const formattedDate = formatDatePattern(now, this.options.dateFormat);
        const formattedTime = formatDatePattern(now, this.options.timeFormat);

        const variables = {
            // Name variables
            name: this.sanitizeVariable(baseName),
            name_lower: baseName.toLowerCase(),
            name_upper: baseName.toUpperCase(),
            name_snake: baseName.replace(/\s+/g, '_'),
            name_kebab: baseName.replace(/\s+/g, '-'),

            // Index variables
            index: indexNum,
            index_padded: indexPadded,
            index_zero: String(indexNum).padStart(String(total).length, '0'),
            total,

            // Dimension variables
            width: image.width || 'unknown',
            height: image.height || 'unknown',
            dimensions,
            aspect_ratio: image.width && image.height ?
                (image.width / image.height).toFixed(2) :
                'unknown',

            // Date/time variables
            date: formattedDate,
            time: formattedTime,
            timestamp: now.getTime(),
            datetime: now.toISOString().replace(/[:.]/g, '-').split('.')[0],

            // Individual date components
            year: now.getFullYear(),
            month: String(now.getMonth() + 1).padStart(2, '0'),
            month_name: now.toLocaleString('default', { month: 'short' }),
            month_full: now.toLocaleString('default', { month: 'long' }),
            day: String(now.getDate()).padStart(2, '0'),
            day_name: now.toLocaleString('default', { weekday: 'short' }),
            day_full: now.toLocaleString('default', { weekday: 'long' }),
            hour: String(now.getHours()).padStart(2, '0'),
            minute: String(now.getMinutes()).padStart(2, '0'),
            second: String(now.getSeconds()).padStart(2, '0'),

            // File info
            extension: image.extension || 'unknown',
            original_extension: this.extractExtension(originalName),
            size_category: this.getSizeCategory(image.originalSize)
        };

        // Add custom separator if needed
        if (this.options.customSeparator && this.options.customSeparator !== '-') {
            variables.separator = this.options.customSeparator;
        }

        return variables;
    }

    /**
     * Extract base name from filename
     * @private
     */
    extractBaseName(filename) {
        if (!filename || typeof filename !== 'string') {
            return 'unnamed';
        }

        // Remove extension
        const base = filename.replace(/\.[^/.]+$/, '');

        // Remove path if present
        const name = base.split('/').pop().split('\\').pop();

        return name || 'unnamed';
    }

    /**
     * Extract extension from filename
     * @private
     */
    extractExtension(filename) {
        if (!filename || typeof filename !== 'string') {
            return '';
        }

        const match = filename.match(/\.([^.]+)$/);
        return match ? match[1].toLowerCase() : '';
    }

    /**
     * Get size category
     * @private
     */
    getSizeCategory(size) {
        if (!size) return 'unknown';

        if (size < 1024) return 'tiny';
        if (size < 1024 * 10) return 'very-small';
        if (size < 1024 * 100) return 'small';
        if (size < 1024 * 1024) return 'medium';
        if (size < 1024 * 1024 * 5) return 'large';
        return 'very-large';
    }

    /**
     * Sanitize variable value
     * @private
     */
    sanitizeVariable(value) {
        if (typeof value !== 'string') {
            value = String(value);
        }

        // Apply sanitization based on options
        let sanitized = value;

        if (!this.options.keepSpecialChars) {
            sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        }

        if (this.options.replaceSpaces) {
            sanitized = sanitized.replace(/\s+/g, this.options.spaceReplacement);
        }

        return sanitized.trim();
    }

    /**
     * Apply pattern with variables
     * @private
     */
    applyPattern(pattern, variables) {
        // Use the utility function from stringUtils.js
        return applyPattern(pattern, variables);
    }

    /**
     * Finalize name with additional processing
     * @private
     */
    finalizeName(name) {
        let finalName = name;

        // Apply length limit
        if (finalName.length > this.options.maxLength) {
            console.warn(`Filename truncated from ${finalName.length} to ${this.options.maxLength} characters`);
            finalName = finalName.substring(0, this.options.maxLength);
        }

        // Final sanitization
        finalName = sanitizeFilename(finalName);

        // Ensure no double separators
        finalName = finalName.replace(/[-_]{2,}/g, this.options.customSeparator || '-');

        // Trim separators from ends
        finalName = finalName.replace(/^[-_.]+|[-_.]+$/g, '');

        return finalName;
    }

    /**
     * Check for potential issues
     * @private
     */
    checkForIssues(originalName, newName, variables) {
        // Check for no change
        if (originalName === newName) {
            this.warnings.push({
                code: WarningCodes.NO_NAME_CHANGE,
                message: 'Filename unchanged after renaming',
                severity: SeverityLevels.INFO,
                suggestion: 'Consider a different pattern if rename was intended'
            });
        }

        // Check for very long names
        if (newName.length > 100) {
            this.warnings.push({
                code: WarningCodes.VERY_LONG_FILENAME,
                message: `Filename is very long (${newName.length} characters)`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider a shorter pattern'
            });
        }

        // Check for missing variables
        const usedVariables = this.patternVariables.filter(v =>
            newName.includes(`{${v}}`)
        );
        if (usedVariables.length > 0) {
            this.warnings.push({
                code: WarningCodes.UNREPLACED_VARIABLES,
                message: `Pattern variables not replaced: ${usedVariables.join(', ')}`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Check variable names or provide missing values'
            });
        }

        // Check for special characters if not allowed
        if (!this.options.keepSpecialChars) {
            const specialChars = newName.match(/[<>:"/\\|?*]/g);
            if (specialChars) {
                this.warnings.push({
                    code: WarningCodes.SPECIAL_CHARS_DETECTED,
                    message: `Special characters found: ${[...new Set(specialChars)].join('')}`,
                    severity: SeverityLevels.WARNING,
                    suggestion: 'Enable keepSpecialChars or check sanitization'
                });
            }
        }
    }

    /**
     * Get common rename patterns
     * @returns {Object} Pattern templates
     */
    getCommonPatterns() {
        // Use the utility function from stringUtils.js
        return getCommonRenamePatterns();
    }

    /**
     * Get available variables for patterns
     * @returns {Array} Available variables
     */
    getAvailableVariables() {
        return [
            // Name variations
            'name', 'name_lower', 'name_upper', 'name_snake', 'name_kebab',

            // Index variables
            'index', 'index_padded', 'index_zero', 'total',

            // Dimension variables
            'width', 'height', 'dimensions', 'aspect_ratio',

            // Date/time variables
            'date', 'time', 'timestamp', 'datetime',
            'year', 'month', 'month_name', 'month_full',
            'day', 'day_name', 'day_full',
            'hour', 'minute', 'second',

            // File info
            'extension', 'original_extension', 'size_category',

            // Custom
            'separator'
        ];
    }

    /**
     * Preview rename without processing
     * @param {string} originalName - Original filename
     * @param {Object} imageInfo - Image information
     * @param {number} index - File index
     * @param {number} total - Total files
     * @returns {Object} Preview result
     */
    previewRename(originalName, imageInfo = {}, index = 0, total = 1) {
        const mockImage = {
            originalName,
            width: imageInfo.width,
            height: imageInfo.height,
            originalSize: imageInfo.size,
            extension: imageInfo.extension
        };

        const variables = this.generateVariables(mockImage, index, total);
        const newName = this.applyPattern(this.options.pattern, variables);
        const finalName = this.finalizeName(newName);

        return {
            original: originalName,
            preview: finalName,
            variables: Object.keys(variables).reduce((acc, key) => {
                if (this.options.pattern.includes(`{${key}}`)) {
                    acc[key] = variables[key];
                }
                return acc;
            }, {}),
            pattern: this.options.pattern,
            warnings: this.warnings
        };
    }

    /**
     * Batch rename preview
     * @param {Array} files - Array of file info objects
     * @returns {Array} Preview results
     */
    previewBatchRename(files) {
        return files.map((file, index) =>
            this.previewRename(
                file.name,
                {
                    width: file.width,
                    height: file.height,
                    size: file.size,
                    extension: file.extension
                },
                index,
                files.length
            )
        );
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
            variables: this.getAvailableVariables(),
            options: this.options,
            warnings: this.warnings,
            validation: {
                maxLength: this.options.maxLength,
                patternVariables: this.patternVariables,
                customSeparator: this.options.customSeparator
            },
            constants: {
                defaults: {
                    pattern: Defaults.RENAME_PATTERN,
                    maxLength: Defaults.MAX_FILENAME_LENGTH,
                    separator: Defaults.DEFAULT_SEPARATOR,
                    dateFormat: Defaults.DATE_FORMAT,
                    timeFormat: Defaults.TIME_FORMAT
                }
            }
        };
    }

    /**
     * Get rename warnings
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
     * Update rename options
     * @param {Object} newOptions - New options
     */
    updateOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };

        // Re-validate with new options
        this.validatePattern();

        // Update pattern variables
        this.patternVariables = extractPatternVariables(this.options.pattern);
    }

    /**
     * Validate if filename can be renamed
     * @param {string} filename - Filename to validate
     * @returns {Object} Validation result
     */
    validateFilename(filename) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!filename || typeof filename !== 'string') {
            result.valid = false;
            result.errors.push({
                code: ErrorCodes.INVALID_FILE,
                message: 'Invalid filename'
            });
            return result;
        }

        // Check filename length
        if (filename.length > this.options.maxLength) {
            result.warnings.push({
                type: 'filename_too_long',
                message: `Filename exceeds maximum length (${filename.length} > ${this.options.maxLength})`,
                severity: SeverityLevels.WARNING
            });
        }

        // Check for invalid characters
        if (!this.options.keepSpecialChars) {
            const invalidChars = filename.match(/[<>:"/\\|?*\x00-\x1F]/g);
            if (invalidChars) {
                result.warnings.push({
                    type: 'invalid_characters',
                    message: `Contains invalid characters: ${[...new Set(invalidChars)].join('')}`,
                    suggestion: 'These characters will be replaced during renaming',
                    severity: SeverityLevels.WARNING
                });
            }
        }

        return result;
    }
}

// Export helper functions
/**
 * Create a rename processor with options
 * @param {Object} options - Rename options
 * @returns {LemGendaryRename} Rename processor instance
 */
export function createRenameProcessor(options = {}) {
    return new LemGendaryRename(options);
}

/**
 * Quick rename function for simple use cases
 * @param {string} filename - Original filename
 * @param {string} pattern - Rename pattern
 * @param {Object} variables - Additional variables
 * @param {Object} options - Additional options
 * @returns {string} New filename
 */
export function quickRename(filename, pattern = Defaults.RENAME_PATTERN, variables = {}, options = {}) {
    const processor = new LemGendaryRename({
        pattern,
        ...options
    });

    const mockImage = {
        originalName: filename,
        width: variables.width,
        height: variables.height,
        originalSize: variables.size,
        extension: variables.extension || filename.split('.').pop()
    };

    const result = processor.previewRename(
        filename,
        mockImage,
        variables.index || 0,
        variables.total || 1
    );

    return result.preview;
}

export default LemGendaryRename;