/**
 * PDF/EPS/AI document processor
 * @class LemGendaryPDF
 * @version 3.0.0
 */

import { LemGendImage } from '../LemGendImage.js';

export class LemGendaryPDF {
    /**
     * Create a new PDF processor
     * @param {Object} options - Processor options
     */
    constructor(options = {}) {
        this.options = {
            outputFormat: 'pdf',
            quality: 'high',
            pageSize: 'A4',
            pageOrientation: 'portrait',
            compress: true,
            preserveVectors: true,
            ...options
        };

        this.name = 'PDF Processor';
        this.version = '3.0.0';
    }

    /**
     * Process document
     * @param {LemGendImage|File} image - Image to process
     * @returns {Promise<Object>} Processing result
     */
    async process(image) {
        let lemGendImage;

        // Handle different input types
        if (image instanceof LemGendImage) {
            lemGendImage = image;
        } else if (image instanceof File) {
            lemGendImage = new LemGendImage(image);
            await lemGendImage.load();
        } else {
            throw new Error('Invalid input type');
        }

        // Check if it's a document format
        if (!lemGendImage.isDocumentFormat()) {
            throw new Error('Input is not a PDF/EPS/AI document');
        }

        const startTime = Date.now();

        // Get conversion options
        const conversionOptions = {
            quality: this.options.quality,
            pageSize: this.options.pageSize,
            pageOrientation: this.options.pageOrientation,
            compress: this.options.compress
        };

        // Convert to PDF
        const pdfFile = await lemGendImage.convertToPDF(conversionOptions);

        const processingTime = Date.now() - startTime;

        return {
            success: true,
            original: {
                name: lemGendImage.originalName,
                type: lemGendImage.type,
                size: lemGendImage.originalSize,
                dimensions: {
                    width: lemGendImage.width,
                    height: lemGendImage.height
                }
            },
            processed: {
                file: pdfFile,
                format: 'pdf',
                size: pdfFile.size,
                processingTime
            },
            conversion: {
                from: lemGendImage.extension,
                to: 'pdf',
                options: conversionOptions
            },
            warnings: [],
            metadata: {
                processor: 'LemGendaryPDF',
                version: this.version,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Validate processor options
     * @param {Object} options - Options to validate
     * @returns {Object} Validation result
     */
    validateOptions(options = {}) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        const validPageSizes = ['A4', 'A3', 'Letter', 'Legal', 'A5', 'B4', 'B5'];
        const validOrientations = ['portrait', 'landscape'];
        const validQualities = ['low', 'medium', 'high', 'lossless'];

        if (options.pageSize && !validPageSizes.includes(options.pageSize)) {
            result.errors.push({
                code: 'INVALID_PAGE_SIZE',
                message: `Page size must be one of: ${validPageSizes.join(', ')}`,
                severity: 'error'
            });
            result.valid = false;
        }

        if (options.pageOrientation && !validOrientations.includes(options.pageOrientation)) {
            result.errors.push({
                code: 'INVALID_ORIENTATION',
                message: `Orientation must be one of: ${validOrientations.join(', ')}`,
                severity: 'error'
            });
            result.valid = false;
        }

        if (options.quality && !validQualities.includes(options.quality)) {
            result.errors.push({
                code: 'INVALID_QUALITY',
                message: `Quality must be one of: ${validQualities.join(', ')}`,
                severity: 'error'
            });
            result.valid = false;
        }

        return result;
    }
}

/**
 * Quick PDF conversion helper
 * @param {File|LemGendImage} file - File to convert
 * @param {Object} options - Conversion options
 * @returns {Promise<File>} PDF file
 */
export async function quickPDF(file, options = {}) {
    const processor = new LemGendaryPDF(options);
    const result = await processor.process(file);
    return result.processed.file;
}

/**
 * Create PDF processor factory function
 * @param {Object} options - Processor options
 * @returns {LemGendaryPDF} PDF processor instance
 */
export function createPDFProcessor(options = {}) {
    return new LemGendaryPDF(options);
}