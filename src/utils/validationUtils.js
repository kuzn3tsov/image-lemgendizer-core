/**
 * Image validation utilities
 * @module utils/validation
 * @version 3.0.0
 */
// Import shared constants
import {
    ErrorCodes,
    WarningCodes,
    CropModes,
    Defaults,
    ImageMimeTypes,
    FileExtensions,
    ResizeModes,
    ResizeAlgorithms,
    SeverityLevels,
    ProcessorTypes,
    TaskTypes,
    OptimizationFormats,
    CompressionModes,
    BrowserSupport,
    QualityTargets
} from '../constants/sharedConstants.js';

// Import utilities
import { formatFileSize, getAllowedImageMimeTypes } from './imageUtils.js';

/**
 * Validate resize parameters (replaces both validateResizeOptions and validateResize)
 * @param {Object|number} params - Resize parameters object OR dimension number
 * @param {string} [mode] - Resize mode (if first param is number)
 * @param {Object} [options] - Additional options (if first param is number)
 * @returns {Object} Validation result
 */
export function validateResize(params, mode, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    let dimension, algorithm, resizeMode, forceSquare, preserveAspectRatio;

    // Handle both parameter formats for backward compatibility
    if (typeof params === 'object') {
        // Object format: { dimension, mode, algorithm, ... }
        const opts = params;
        dimension = opts.dimension;
        algorithm = opts.algorithm;
        resizeMode = opts.mode;
        forceSquare = opts.forceSquare;
        preserveAspectRatio = opts.preserveAspectRatio;
    } else {
        // Separate parameter format: (dimension, mode, options)
        dimension = params;
        resizeMode = mode;
        const opts = options;
        algorithm = opts.algorithm;
        forceSquare = opts.forceSquare;
        preserveAspectRatio = opts.preserveAspectRatio;
    }

    // ===== COMMON VALIDATION =====

    // Validate dimension
    if (typeof dimension !== 'number' || dimension <= 0) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_DIMENSION,
            message: 'Dimension must be a positive number',
            severity: SeverityLevels.ERROR
        });
    }

    if (dimension > Defaults.MAX_DIMENSION) {
        result.errors.push({
            code: ErrorCodes.DIMENSION_EXCEEDS_MAX,
            message: `Dimension exceeds maximum allowed value of ${Defaults.MAX_DIMENSION}`,
            severity: SeverityLevels.ERROR,
            suggestion: `Reduce dimension to ${Defaults.MAX_DIMENSION} or less`
        });
    }

    if (dimension < Defaults.MIN_DIMENSION) {
        result.warnings.push({
            code: WarningCodes.VERY_SMALL_DIMENSION,
            message: `Very small target dimension (${dimension}px)`,
            severity: SeverityLevels.WARNING,
            suggestion: `Consider at least ${Defaults.DEFAULT_DIMENSION}px for usable images`
        });
    }

    if (dimension > 4000) {
        result.warnings.push({
            code: WarningCodes.VERY_LARGE_DIMENSION,
            message: `Very large target dimension (${dimension}px)`,
            severity: SeverityLevels.WARNING,
            suggestion: 'Consider 1920px or less for web images'
        });
    }

    // Validate algorithm (if provided)
    const validAlgorithms = Object.values(ResizeAlgorithms);
    if (algorithm && !validAlgorithms.includes(algorithm)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_ALGORITHM,
            message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`,
            severity: SeverityLevels.ERROR
        });
    }

    // Validate mode
    const validModes = Object.values(ResizeModes);
    if (resizeMode && !validModes.includes(resizeMode)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_MODE,
            message: `Mode must be one of: ${validModes.join(', ')}`,
            severity: SeverityLevels.ERROR
        });
    }

    // Round dimension if not integer
    if (dimension && !Number.isInteger(dimension)) {
        result.warnings.push({
            code: WarningCodes.NON_INTEGER_DIMENSION,
            message: 'Dimension should be an integer for best results',
            severity: SeverityLevels.INFO
        });
    }

    // Check for potential issues
    if (forceSquare && !preserveAspectRatio) {
        result.warnings.push({
            code: WarningCodes.FORCE_SQUARE_NO_ASPECT,
            message: 'Force square without preserving aspect ratio may cause issues',
            severity: SeverityLevels.WARNING,
            suggestion: 'Consider enabling preserveAspectRatio for forceSquare'
        });
    }

    return result;
}

/**
 * Validate crop parameters
 * @param {Object|number} params - Crop parameters object OR width number
 * @param {number|string} height - Height number or crop mode (if first param is number)
 * @param {Object} options - Additional options (if first param is number)
 * @returns {Object} Validation result
 */
export function validateCrop(params, height, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    let width, cropHeight, cropMode, algorithm;

    // Handle both parameter formats
    if (typeof params === 'object') {
        width = params.width;
        cropHeight = params.height;
        cropMode = params.mode;
        algorithm = params.algorithm;
    } else {
        width = params;
        cropHeight = height;
        const opts = options;
        cropMode = opts.mode;
        algorithm = opts.algorithm;
    }

    // Validate dimensions
    if (typeof width !== 'number' || width <= 0) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_WIDTH,
            message: 'Width must be a positive number',
            severity: SeverityLevels.ERROR
        });
    }

    if (typeof cropHeight !== 'number' || cropHeight <= 0) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_HEIGHT,
            message: 'Height must be a positive number',
            severity: SeverityLevels.ERROR
        });
    }

    // Check for extreme dimensions
    if (width < Defaults.MIN_CROP_SIZE || cropHeight < Defaults.MIN_CROP_SIZE) {
        result.errors.push({
            code: WarningCodes.VERY_SMALL_CROP,
            message: `Target dimensions too small: ${width}x${cropHeight}`,
            severity: SeverityLevels.ERROR,
            suggestion: `Use dimensions of at least ${Defaults.DEFAULT_CROP_WIDTH}x${Defaults.DEFAULT_CROP_HEIGHT} pixels`
        });
    }

    if (width > Defaults.MAX_CROP_SIZE || cropHeight > Defaults.MAX_CROP_SIZE) {
        result.warnings.push({
            code: WarningCodes.LARGE_CROP_SIZE,
            message: `Target dimensions very large: ${width}x${cropHeight}`,
            severity: SeverityLevels.WARNING,
            suggestion: 'Consider smaller dimensions for better performance'
        });
    }

    // Validate aspect ratio
    if (width && cropHeight) {
        const aspectRatio = width / cropHeight;
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            result.warnings.push({
                code: WarningCodes.EXTREME_ASPECT_RATIO,
                message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider more balanced dimensions'
            });
        }
    }

    // Validate mode
    const validModes = Object.values(CropModes);
    if (cropMode && !validModes.includes(cropMode)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_CROP_MODE,
            message: `Mode must be one of: ${validModes.join(', ')}`,
            severity: SeverityLevels.ERROR
        });
    }

    // Validate algorithm
    const validAlgorithms = [ResizeAlgorithms.LANCZOS3, ResizeAlgorithms.BILINEAR, ResizeAlgorithms.NEAREST];
    if (algorithm && !validAlgorithms.includes(algorithm)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_ALGORITHM,
            message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`,
            severity: SeverityLevels.ERROR
        });
    }

    // Check for integer dimensions
    if (width && !Number.isInteger(width) || cropHeight && !Number.isInteger(cropHeight)) {
        result.warnings.push({
            code: WarningCodes.NON_INTEGER_DIMENSION,
            message: 'Crop dimensions should be integers for best results',
            severity: SeverityLevels.INFO
        });
    }

    return result;
}

/**
 * Validate optimization options
 */
export function validateOptimizationOptions(options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    const { quality, format, compressionMode, browserSupport } = options;

    if (quality !== undefined) {
        if (typeof quality !== 'number' || quality < 1 || quality > 100) {
            result.valid = false;
            result.errors.push({
                code: ErrorCodes.INVALID_QUALITY,
                message: `Quality must be between 1 and 100, got ${quality}`,
                severity: SeverityLevels.ERROR,
                suggestion: 'Use a value between 1 and 100'
            });
        }
    }

    const validFormats = Object.values(OptimizationFormats);
    if (format && !validFormats.includes(format.toLowerCase())) {
        result.warnings.push({
            code: WarningCodes.UNSUPPORTED_FORMAT,
            message: `Format ${format} may not be supported`,
            severity: SeverityLevels.WARNING,
            suggestion: `Use one of: ${validFormats.join(', ')}`
        });
    }

    // Validate compression mode
    const validCompressionModes = Object.values(CompressionModes);
    if (compressionMode && !validCompressionModes.includes(compressionMode)) {
        result.warnings.push({
            code: ErrorCodes.INVALID_COMPRESSION_MODE,
            message: `Compression mode must be one of: ${validCompressionModes.join(', ')}`,
            severity: SeverityLevels.WARNING
        });
    }

    // Validate browser support
    const validBrowserSupport = Object.values(BrowserSupport);
    if (browserSupport && !validBrowserSupport.includes(browserSupport)) {
        result.warnings.push({
            code: ErrorCodes.INVALID_BROWSER_SUPPORT,
            message: `Browser support must be one of: ${validBrowserSupport.join(', ')}`,
            severity: SeverityLevels.WARNING
        });
    }

    return result;
}

/**
 * Get validation summary
 */
export function getValidationSummary(validationResult) {
    return {
        isValid: validationResult.valid,
        hasWarnings: validationResult.warnings.length > 0,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        errors: validationResult.errors,
        warnings: validationResult.warnings
    };
}

/**
 * Validate dimensions
 */
export function validateDimensions(width, height, options = {}) {
    const { minWidth = 1, minHeight = 1, maxWidth = Defaults.MAX_DIMENSION, maxHeight = Defaults.MAX_DIMENSION } = options;

    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    if (width < minWidth || height < minHeight) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_DIMENSIONS,
            message: `Dimensions too small: ${width}x${height} (minimum: ${minWidth}x${minHeight})`,
            severity: SeverityLevels.ERROR
        });
    }

    if (width > maxWidth || height > maxHeight) {
        result.warnings.push({
            code: WarningCodes.LARGE_DIMENSIONS,
            message: `Large dimensions: ${width}x${height} (maximum: ${maxWidth}x${maxHeight})`,
            severity: SeverityLevels.WARNING
        });
    }

    return result;
}

/**
 * Validate optimization
 */
export function validateOptimization(options = {}) {
    return validateOptimizationOptions(options);
}

/**
 * Validate rename pattern
 */
export function validateRenamePattern(pattern) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    if (!pattern || typeof pattern !== 'string' || pattern.trim() === '') {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.EMPTY_PATTERN,
            message: 'Rename pattern cannot be empty',
            severity: SeverityLevels.ERROR
        });
        return result;
    }

    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(pattern)) {
        result.errors.push({
            code: ErrorCodes.INVALID_CHARS,
            message: 'Pattern contains invalid filename characters',
            severity: SeverityLevels.ERROR,
            suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
        });
        result.valid = false;
    }

    const placeholders = ['{name}', '{index}', '{timestamp}', '{width}', '{height}', '{dimensions}', '{date}', '{time}'];
    const hasPlaceholder = placeholders.some(ph => pattern.includes(ph));

    if (!hasPlaceholder) {
        result.warnings.push({
            code: WarningCodes.NO_PLACEHOLDERS,
            message: 'Pattern may create duplicate filenames',
            severity: SeverityLevels.WARNING,
            suggestion: 'Include {index} or {timestamp} for unique filenames'
        });
    }

    if (pattern.length > Defaults.MAX_FILENAME_LENGTH) {
        result.warnings.push({
            code: WarningCodes.VERY_LONG_FILENAME,
            message: `Pattern may result in filenames longer than ${Defaults.MAX_FILENAME_LENGTH} characters`,
            severity: SeverityLevels.WARNING,
            suggestion: 'Use shorter pattern or fewer variables'
        });
    }

    return result;
}

/**
 * Validate image file
 * @param {File|Object} file - File object or object with file properties
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateImage(file, options = {}) {
    const {
        maxFileSize = Defaults.MAX_FILE_SIZE,
        minFileSize = Defaults.MIN_FILE_SIZE,
        allowedTypes = getAllowedImageMimeTypes(),
        checkDimensions = false,
        minDimensions = { width: 1, height: 1 },
        maxDimensions = { width: Defaults.MAX_DIMENSION, height: Defaults.MAX_DIMENSION },
        allowReconstruction = true
    } = options;

    const result = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    };

    // ===== 1. BASIC FILE VALIDATION =====
    if (!file || typeof file !== 'object') {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_FILE,
            message: 'Not a valid file object',
            severity: SeverityLevels.ERROR,
            suggestion: 'Provide a valid File object'
        });
        return result;
    }

    // ===== 2. EXTRACT FILE PROPERTIES =====
    let fileName, fileType, fileSize, fileObject, hasFileObject = false;

    // Handle different file input types
    if (file instanceof File) {
        fileObject = file;
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
        hasFileObject = true;
    } else if (file && file.file instanceof File) {
        // Object with file property
        fileObject = file.file;
        fileName = file.file.name;
        fileType = file.file.type;
        fileSize = file.file.size;
        hasFileObject = true;
    } else if (file.name && file.type && file.size) {
        // Object with file properties
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
        hasFileObject = false;
    } else if (file.metadata && file.metadata.name && file.metadata.type && file.metadata.size) {
        // Object with metadata
        result.metadata = { ...file.metadata };
        fileName = file.metadata.name;
        fileType = file.metadata.type;
        fileSize = file.metadata.size;
        hasFileObject = false;
    } else {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_FILE,
            message: 'File object missing required properties (name, size, type)',
            severity: SeverityLevels.ERROR,
            suggestion: 'Provide a valid File object with name, size, and type properties'
        });
        return result;
    }

    // Store extracted metadata
    result.metadata = {
        name: fileName,
        type: fileType,
        size: fileSize,
        hasFileObject,
        lastModified: file.lastModified || file.metadata?.lastModified || Date.now(),
        extension: fileName ? fileName.split('.').pop().toLowerCase() : 'unknown'
    };

    // ===== 3. SIZE VALIDATION =====
    if (fileSize < minFileSize) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_FILE,
            message: 'File is empty',
            severity: SeverityLevels.ERROR,
            details: `Size: ${formatFileSize(fileSize)}`,
            suggestion: 'Provide a non-empty file'
        });
    } else if (fileSize > maxFileSize) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.FILE_TOO_LARGE,
            message: `File too large (${formatFileSize(fileSize)} > ${formatFileSize(maxFileSize)})`,
            severity: SeverityLevels.ERROR,
            details: `Current: ${formatFileSize(fileSize)}, Maximum: ${formatFileSize(maxFileSize)}`,
            suggestion: 'Compress or resize the image before uploading'
        });
    } else if (fileSize > 10 * 1024 * 1024) {
        result.warnings.push({
            code: WarningCodes.LARGE_FILE,
            message: `Large file (${formatFileSize(fileSize)}) may process slowly`,
            severity: SeverityLevels.WARNING,
            details: `Size: ${formatFileSize(fileSize)}`,
            suggestion: 'Consider compressing the image for faster processing'
        });
    }

    // ===== 4. TYPE VALIDATION =====
    const normalizedType = fileType ? fileType.toLowerCase() : '';
    let isAllowed = false;
    let detectedType = normalizedType;

    // Check against allowed types
    for (const allowedType of allowedTypes) {
        if (normalizedType === allowedType.toLowerCase()) {
            isAllowed = true;
            break;
        }

        // Handle JPEG variations
        if (normalizedType.includes('jpeg') && allowedType.includes('jpeg')) {
            isAllowed = true;
            detectedType = allowedType;
            break;
        }

        if (normalizedType.includes('jpg') && allowedType.includes('jpg')) {
            isAllowed = true;
            detectedType = allowedType;
            break;
        }

        // Handle icon variations
        if ((normalizedType.includes('icon') || normalizedType === 'image/x-icon') &&
            (allowedType.includes('icon') || allowedType === ImageMimeTypes.ICO)) {
            isAllowed = true;
            detectedType = allowedType;
            break;
        }

        // Handle unknown/octet-stream by checking extension
        if (!normalizedType || normalizedType === 'application/octet-stream' ||
            normalizedType === 'application/unknown') {
            const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
            const extensionMap = {
                [FileExtensions.JPG]: ImageMimeTypes.JPEG,
                [FileExtensions.JPEG]: ImageMimeTypes.JPEG,
                [FileExtensions.PNG]: ImageMimeTypes.PNG,
                [FileExtensions.WEBP]: ImageMimeTypes.WEBP,
                [FileExtensions.GIF]: ImageMimeTypes.GIF,
                [FileExtensions.SVG]: ImageMimeTypes.SVG,
                [FileExtensions.BMP]: ImageMimeTypes.BMP,
                [FileExtensions.TIFF]: ImageMimeTypes.TIFF,
                [FileExtensions.TIF]: ImageMimeTypes.TIFF,
                [FileExtensions.AVIF]: ImageMimeTypes.AVIF,
                [FileExtensions.ICO]: ImageMimeTypes.ICO
            };

            if (extensionMap[extension] === allowedType) {
                isAllowed = true;
                detectedType = allowedType;
                result.metadata.detectedType = detectedType;
                break;
            }
        }
    }

    if (!isAllowed) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.UNSUPPORTED_TYPE,
            message: `Unsupported file type: ${fileType || 'unknown'}`,
            severity: SeverityLevels.ERROR,
            details: fileName ? `File: ${fileName}, Type: ${fileType}` : `Type: ${fileType}`,
            suggestion: 'Use JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF, ICO or PDF formats'
        });
    } else {
        // Update metadata with detected type
        result.metadata.detectedType = detectedType;
    }

    // ===== 5. DIMENSION VALIDATION =====
    if (checkDimensions && (file.width || file.height || file.metadata?.width || file.metadata?.height)) {
        const width = file.width || file.metadata?.width || 0;
        const height = file.height || file.metadata?.height || 0;

        result.metadata.dimensions = { width, height };

        if (width > 0 && height > 0) {
            // Validate against minimum dimensions
            if (width < minDimensions.width || height < minDimensions.height) {
                result.errors.push({
                    code: ErrorCodes.INVALID_DIMENSIONS,
                    message: `Dimensions too small: ${width}x${height} (minimum: ${minDimensions.width}x${minDimensions.height})`,
                    severity: SeverityLevels.ERROR,
                    details: `Current: ${width}x${height}, Minimum: ${minDimensions.width}x${minDimensions.height}`,
                    suggestion: 'Use a larger source image or enable upscaling'
                });
                result.valid = false;
            }

            // Warn about large dimensions
            if (width > maxDimensions.width || height > maxDimensions.height) {
                result.warnings.push({
                    code: WarningCodes.LARGE_DIMENSIONS,
                    message: `Large dimensions: ${width}x${height} (maximum: ${maxDimensions.width}x${maxDimensions.height})`,
                    severity: SeverityLevels.WARNING,
                    details: `Current: ${width}x${height}, Maximum: ${maxDimensions.width}x${maxDimensions.height}`,
                    suggestion: 'Consider resizing the image for better performance'
                });
            }

            // Check for very small source
            if (width < 100 || height < 100) {
                result.warnings.push({
                    code: WarningCodes.VERY_SMALL_SOURCE,
                    message: `Very small source image: ${width}x${height}`,
                    severity: SeverityLevels.WARNING,
                    details: `Dimensions: ${width}x${height}`,
                    suggestion: 'Consider using a higher resolution source image'
                });
            }

            // Check for very large source
            if (width > 4000 || height > 4000) {
                result.warnings.push({
                    code: WarningCodes.VERY_LARGE_SOURCE,
                    message: `Very large source image: ${width}x${height}`,
                    severity: SeverityLevels.WARNING,
                    details: `Dimensions: ${width}x${height}`,
                    suggestion: 'Consider resizing before processing for better performance'
                });
            }

            // Calculate aspect ratio
            const aspectRatio = width / height;
            result.metadata.aspectRatio = aspectRatio;
            result.metadata.orientation = width >= height ? 'landscape' : 'portrait';
        }
    }

    // ===== 6. RECONSTRUCTION WARNINGS =====
    if (!hasFileObject && allowReconstruction) {
        result.warnings.push({
            code: WarningCodes.CONTENT_LOSS,
            message: 'File data available as metadata, but not as File object',
            severity: SeverityLevels.WARNING,
            details: 'File will be reconstructed for processing',
            suggestion: 'Original quality may not be preserved'
        });
    }

    // Check if file can be reconstructed
    if (!hasFileObject && !allowReconstruction) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_FILE,
            message: 'File object required but not available',
            severity: SeverityLevels.ERROR,
            suggestion: 'Provide a File object instead of metadata'
        });
    }

    // ===== 7. URL VALIDATION =====
    if (file.url && !file.url.startsWith('blob:')) {
        result.warnings.push({
            code: WarningCodes.CONTENT_LOSS,
            message: 'Image URL may not be a valid blob URL',
            severity: SeverityLevels.WARNING,
            details: `URL: ${file.url.substring(0, 50)}...`,
            suggestion: 'Use blob URLs for local image processing'
        });
    }

    // ===== 8. TRANSPARENCY CHECK =====
    if (fileType === ImageMimeTypes.JPEG && file.transparency) {
        result.warnings.push({
            code: WarningCodes.TRANSPARENCY_LOSS,
            message: 'Image has transparency but is in JPEG format',
            severity: SeverityLevels.WARNING,
            suggestion: 'Convert to PNG or WebP to preserve transparency'
        });
    }

    // ===== 9. FORMAT SPECIFIC CHECKS =====
    if (fileType === ImageMimeTypes.AVIF) {
        result.warnings.push({
            code: WarningCodes.AVIF_BROWSER_SUPPORT,
            message: 'AVIF format may not be supported in all browsers',
            severity: SeverityLevels.INFO,
            suggestion: 'Consider providing WebP fallback for broader compatibility'
        });
    }

    if (fileType === ImageMimeTypes.SVG && checkDimensions) {
        result.warnings.push({
            code: WarningCodes.SVG_SKIPPED,
            message: 'SVG files may skip certain processing steps',
            severity: SeverityLevels.INFO,
            suggestion: 'Vector images maintain quality at any size'
        });
    }

    // ===== 10. SUMMARY =====
    if (result.errors.length === 0 && result.warnings.length === 0) {
        result.summary = 'File is valid and ready for processing';
    } else if (result.errors.length === 0 && result.warnings.length > 0) {
        result.summary = `File is valid with ${result.warnings.length} warning(s)`;
    } else {
        result.summary = `File has ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`;
    }

    // ===== 11. FINAL VALIDITY CHECK =====
    // Check if we have critical errors that prevent processing
    const criticalErrors = result.errors.filter(error =>
        error.code === ErrorCodes.INVALID_FILE ||
        error.code === ErrorCodes.FILE_TOO_LARGE ||
        error.code === ErrorCodes.UNSUPPORTED_TYPE
    );

    if (criticalErrors.length > 0) {
        result.valid = false;
    }

    return result;
}

/**
 * Validate session image data
 * @param {Object} imageData - Session image data
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateSessionImage(imageData, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: {}
    };

    if (!imageData || typeof imageData !== 'object') {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_FILE,
            message: 'Invalid image data',
            severity: SeverityLevels.ERROR
        });
        return result;
    }

    // Check if it's a LemGendImage
    if (imageData.constructor && imageData.constructor.name === 'LemGendImage') {
        // Validate the LemGendImage file property
        return validateImage(imageData.file || imageData, options);
    }

    // Check for required session data
    const hasFile = imageData.file instanceof File || imageData.file instanceof Blob;
    const hasUrl = imageData.url && typeof imageData.url === 'string';
    const hasMetadata = imageData.metadata && typeof imageData.metadata === 'object';
    const hasLemGendImage = imageData.lemGendImage && typeof imageData.lemGendImage === 'object';

    if (!hasFile && !hasUrl && !hasMetadata && !hasLemGendImage) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.MISSING_INFO,
            message: 'Cannot extract file information from session data',
            severity: SeverityLevels.ERROR,
            suggestion: 'Session data must contain file, url, metadata, or lemGendImage property'
        });
        return result;
    }

    // Extract file information from session data
    let fileInfo = {};

    if (hasFile) {
        fileInfo = imageData.file;
    } else if (hasLemGendImage && imageData.lemGendImage.file) {
        fileInfo = imageData.lemGendImage.file;
    } else if (hasMetadata) {
        fileInfo = {
            name: imageData.metadata.originalName || imageData.metadata.name,
            type: imageData.metadata.mimeType || imageData.metadata.type,
            size: imageData.metadata.originalSize || imageData.metadata.size,
            lastModified: imageData.metadata.lastModified || Date.now()
        };
    } else if (hasUrl) {
        // Try to extract info from URL
        const url = imageData.url;
        const filename = url.split('/').pop().split('?')[0];
        fileInfo = {
            name: filename,
            type: 'unknown',
            size: 0,
            lastModified: Date.now()
        };
    }

    // Validate the extracted file info
    const fileValidation = validateImage(fileInfo, {
        ...options,
        allowReconstruction: true // Allow reconstruction for session data
    });

    // Merge results
    result.valid = fileValidation.valid;
    result.errors.push(...fileValidation.errors);
    result.warnings.push(...fileValidation.warnings);
    result.metadata = { ...result.metadata, ...fileValidation.metadata };

    // Add session-specific metadata
    result.metadata.sessionData = {
        hasFile,
        hasUrl,
        hasMetadata,
        hasLemGendImage,
        id: imageData.id,
        timestamp: imageData.timestamp || Date.now()
    };

    // Warn about blob URLs
    if (hasUrl && !imageData.url.startsWith('blob:')) {
        result.warnings.push({
            code: WarningCodes.CONTENT_LOSS,
            message: 'Session image URL may not be a valid blob URL',
            severity: SeverityLevels.WARNING,
            suggestion: 'Re-upload the image for full processing capabilities'
        });
    }

    return result;
}

/**
 * Quick image validation (lightweight version)
 * @param {File} file - File to validate
 * @returns {Object} Quick validation result
 */
export function quickValidateImage(file) {
    if (!file || !(file instanceof File)) {
        return {
            valid: false,
            error: 'Not a File object',
            suggestion: 'Provide a valid File object'
        };
    }

    const result = {
        valid: true,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: getFileExtension(file),
        warnings: []
    };

    // Quick size check
    if (file.size > Defaults.MAX_FILE_SIZE) {
        result.valid = false;
        result.error = `File too large (>${formatFileSize(Defaults.MAX_FILE_SIZE)})`;
    } else if (file.size > 10 * 1024 * 1024) {
        result.warnings.push('Large file may process slowly');
    }

    // Quick type check - now includes PDF/EPS/AI
    const allowedTypes = getAllowedImageMimeTypes();
    const isAllowed = allowedTypes.some(type =>
        file.type.toLowerCase() === type.toLowerCase() ||
        (file.type.includes('jpeg') && type.includes('jpeg')) ||
        (file.type.includes('jpg') && type.includes('jpg')) ||
        (file.type.includes('pdf') && type.includes('pdf'))
    );

    if (!isAllowed) {
        result.valid = false;
        result.error = `Unsupported file type: ${file.type}`;
    }

    return result;
}

/**
 * Validate favicon options
 */
export function validateFaviconOptions(options, imageInfo = null) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    const { sizes, formats } = options;

    if (!Array.isArray(sizes) || sizes.length === 0) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_DIMENSIONS,
            message: 'Favicon sizes must be a non-empty array',
            severity: SeverityLevels.ERROR
        });
    }

    sizes?.forEach(size => {
        if (size < 16) {
            result.warnings.push({
                code: WarningCodes.SMALL_WIDTH,
                message: `Favicon size ${size}px is below recommended minimum (16px)`,
                severity: SeverityLevels.WARNING
            });
        }

        if (size > 1024) {
            result.warnings.push({
                code: WarningCodes.LARGE_DIMENSIONS,
                message: `Favicon size ${size}px is unusually large`,
                severity: SeverityLevels.INFO
            });
        }
    });

    if (imageInfo) {
        const minSize = Math.min(...sizes);
        if (imageInfo.width < minSize || imageInfo.height < minSize) {
            result.warnings.push({
                code: WarningCodes.SMALL_WIDTH,
                message: `Source image (${imageInfo.width}x${imageInfo.height}) smaller than smallest favicon size (${minSize}px)`,
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider using a larger source image or enable upscaling'
            });
        }

        if (Math.abs(imageInfo.width / imageInfo.height - 1) > 0.1) {
            result.warnings.push({
                code: WarningCodes.CONTENT_LOSS,
                message: 'Source image is not square; favicons may be distorted',
                severity: SeverityLevels.WARNING,
                suggestion: 'Consider adding a crop step before favicon generation'
            });
        }
    }

    const validFormats = [FileExtensions.PNG, FileExtensions.ICO, FileExtensions.SVG];
    formats?.forEach(format => {
        if (!validFormats.includes(format)) {
            result.warnings.push({
                code: WarningCodes.UNSUPPORTED_FORMAT,
                message: `Unsupported favicon format: ${format}`,
                severity: SeverityLevels.WARNING,
                suggestion: `Use one of: ${validFormats.join(', ')}`
            });
        }
    });

    return result;
}

/**
 * Validate task steps
 */
export function validateTaskSteps(steps, imageInfo = null) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    steps.forEach((step, index) => {
        switch (step.processor) {
            case ProcessorTypes.RESIZE:
                const resizeValidation = validateResize(step.options);
                if (!resizeValidation.valid) {
                    resizeValidation.errors.forEach(error => {
                        error.step = index + 1;
                        result.errors.push(error);
                    });
                    resizeValidation.warnings.forEach(warning => {
                        warning.step = index + 1;
                        result.warnings.push(warning);
                    });
                    result.valid = false;
                }
                break;

            case ProcessorTypes.CROP:
                const cropValidation = validateCrop(step.options);
                if (!cropValidation.valid) {
                    cropValidation.errors.forEach(error => {
                        error.step = index + 1;
                        result.errors.push(error);
                    });
                    cropValidation.warnings.forEach(warning => {
                        warning.step = index + 1;
                        result.warnings.push(warning);
                    });
                    result.valid = false;
                }
                break;

            case ProcessorTypes.OPTIMIZE:
                const optimizeValidation = validateOptimization(step.options);
                optimizeValidation.errors.forEach(error => {
                    error.step = index + 1;
                    result.errors.push(error);
                });
                optimizeValidation.warnings.forEach(warning => {
                    warning.step = index + 1;
                    result.warnings.push(warning);
                });
                result.valid = result.valid && optimizeValidation.valid;
                break;

            case ProcessorTypes.RENAME:
                const renameValidation = validateRenamePattern(step.options.pattern);
                renameValidation.errors.forEach(error => {
                    error.step = index + 1;
                    result.errors.push(error);
                });
                renameValidation.warnings.forEach(warning => {
                    warning.step = index + 1;
                    result.warnings.push(warning);
                });
                result.valid = result.valid && renameValidation.valid;
                break;

            case ProcessorTypes.FAVICON:
                const faviconValidation = validateFaviconOptions(step.options, imageInfo);
                faviconValidation.errors.forEach(error => {
                    error.step = index + 1;
                    result.errors.push(error);
                });
                faviconValidation.warnings.forEach(warning => {
                    warning.step = index + 1;
                    result.warnings.push(warning);
                });
                result.valid = result.valid && faviconValidation.valid;
                break;
        }
    });

    return result;
}

/**
 * Validate task logic
 */
export function validateTaskLogic(steps) {
    const result = {
        valid: true,
        warnings: []
    };

    const enabledSteps = steps.filter(step => step.enabled !== false);
    const hasResize = enabledSteps.some(s => s.processor === ProcessorTypes.RESIZE);
    const hasCrop = enabledSteps.some(s => s.processor === ProcessorTypes.CROP);
    const hasOptimize = enabledSteps.some(s => s.processor === ProcessorTypes.OPTIMIZE);

    if (hasCrop && !hasResize) {
        result.warnings.push({
            type: 'crop_without_resize',
            message: 'Crop without resize may result in unexpected output',
            severity: SeverityLevels.INFO,
            suggestion: 'Consider adding resize step before crop for better control'
        });
    }

    const optimizeSteps = enabledSteps.filter(s => s.processor === ProcessorTypes.OPTIMIZE);
    if (optimizeSteps.length > 1) {
        result.warnings.push({
            type: 'multiple_optimize',
            message: `Multiple optimization steps (${optimizeSteps.length})`,
            severity: SeverityLevels.WARNING,
            suggestion: 'Multiple optimizations may degrade quality unnecessarily'
        });
    }

    const renameIndex = enabledSteps.findIndex(s => s.processor === ProcessorTypes.RENAME);
    if (renameIndex >= 0 && renameIndex < enabledSteps.length - 2) {
        result.warnings.push({
            type: 'early_rename',
            message: 'Rename step placed before other operations',
            severity: SeverityLevels.INFO,
            suggestion: 'Consider moving rename to end to reflect final output'
        });
    }

    const faviconIndex = enabledSteps.findIndex(s => s.processor === ProcessorTypes.FAVICON);
    if (faviconIndex >= 0) {
        const stepsBefore = enabledSteps.slice(0, faviconIndex);
        const hasResizeBefore = stepsBefore.some(s => s.processor === ProcessorTypes.RESIZE);
        const hasCropBefore = stepsBefore.some(s => s.processor === ProcessorTypes.CROP);

        if (!hasResizeBefore && !hasCropBefore) {
            result.warnings.push({
                type: 'favicon_without_preparation',
                message: 'Favicon generation without prior resize/crop',
                severity: SeverityLevels.WARNING,
                suggestion: 'Add resize/crop step before favicon for optimal results'
            });
        }
    }

    const faviconSteps = enabledSteps.filter(s => s.processor === ProcessorTypes.FAVICON);
    faviconSteps.forEach(faviconStep => {
        const optimizeAfter = enabledSteps
            .filter(s => s.processor === ProcessorTypes.OPTIMIZE)
            .some(optimizeStep => optimizeStep.order > faviconStep.order);

        if (optimizeAfter) {
            result.warnings.push({
                type: 'optimize_after_favicon',
                message: 'Optimization after favicon generation may affect favicon quality',
                severity: SeverityLevels.WARNING,
                suggestion: 'Move optimization step before favicon generation'
            });
        }
    });

    if (hasOptimize && !hasResize && !hasCrop) {
        result.warnings.push({
            type: 'optimization_only',
            message: 'Task contains only optimization step',
            severity: SeverityLevels.INFO,
            suggestion: 'Consider adding resize/crop steps for complete image processing'
        });
    }

    return result;
}

/**
 * Validate task against an image
 */
export async function validateTask(task, lemGendImage) {
    const result = {
        isValid: true,
        hasWarnings: false,
        errors: [],
        warnings: [],
        summary: null
    };

    const enabledSteps = task.getEnabledSteps();

    if (enabledSteps.length === 0) {
        result.warnings.push({
            type: 'empty_task',
            message: 'Task has no enabled processing steps',
            severity: SeverityLevels.WARNING
        });
    }

    if (lemGendImage) {
        if (!lemGendImage.file) {
            result.warnings.push({
                type: 'missing_file_property',
                message: 'Image missing file property (may be from session storage)',
                severity: SeverityLevels.WARNING,
                suggestion: 'File will be reconstructed for processing'
            });
        } else if (!(lemGendImage.file instanceof File)) {
            result.warnings.push({
                type: 'invalid_file_type',
                message: 'Image file property is not a File instance',
                severity: SeverityLevels.WARNING,
                suggestion: 'File will be reconstructed for processing'
            });
        }

        const stepValidation = validateTaskSteps(enabledSteps, {
            width: lemGendImage.width,
            height: lemGendImage.height
        });
        result.errors.push(...stepValidation.errors);
        result.warnings.push(...stepValidation.warnings);
        result.isValid = stepValidation.valid;

        const logicValidation = validateTaskLogic(enabledSteps);
        result.warnings.push(...logicValidation.warnings);
    } else {
        const stepValidation = validateTaskSteps(enabledSteps);
        result.errors.push(...stepValidation.errors);
        result.warnings.push(...stepValidation.warnings);
        result.isValid = stepValidation.valid;
    }

    result.hasWarnings = result.warnings.length > 0;
    result.summary = getValidationSummary({
        valid: result.isValid,
        errors: result.errors,
        warnings: result.warnings
    });

    return result;
}