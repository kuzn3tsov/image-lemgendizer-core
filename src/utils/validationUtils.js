/**
 * Image validation utilities
 * @module utils/validation
 */
// Import shared constants
import {
    ErrorCodes,
    WarningCodes,
    CropModes,  // ADD THIS
    Defaults,
    ImageMimeTypes,
    FileExtensions
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
            severity: 'error'
        });
    }

    if (dimension > 10000) {
        result.errors.push({
            code: ErrorCodes.DIMENSION_EXCEEDS_MAX,
            message: `Dimension exceeds maximum allowed value of 10000`,
            severity: 'error',
            suggestion: 'Reduce dimension to 10000 or less'
        });
    }

    if (dimension < 10) {
        result.warnings.push({
            code: WarningCodes.VERY_SMALL_DIMENSION,
            message: `Very small target dimension (${dimension}px)`,
            severity: 'warning',
            suggestion: 'Consider at least 100px for usable images'
        });
    }

    if (dimension > 4000) {
        result.warnings.push({
            code: WarningCodes.VERY_LARGE_DIMENSION,
            message: `Very large target dimension (${dimension}px)`,
            severity: 'warning',
            suggestion: 'Consider 1920px or less for web images'
        });
    }

    // Validate algorithm (if provided)
    const validAlgorithms = ['lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell'];
    if (algorithm && !validAlgorithms.includes(algorithm)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_ALGORITHM,
            message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`,
            severity: 'error'
        });
    }

    // Validate mode
    const validModes = ['auto', 'width', 'height', 'longest', 'fit'];
    if (resizeMode && !validModes.includes(resizeMode)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_MODE,
            message: `Mode must be one of: ${validModes.join(', ')}`,
            severity: 'error'
        });
    }

    // Round dimension if not integer
    if (dimension && !Number.isInteger(dimension)) {
        result.warnings.push({
            code: WarningCodes.NON_INTEGER_DIMENSION,
            message: 'Dimension should be an integer for best results',
            severity: 'info'
        });
    }

    // Check for potential issues
    if (forceSquare && !preserveAspectRatio) {
        result.warnings.push({
            code: WarningCodes.FORCE_SQUARE_NO_ASPECT,
            message: 'Force square without preserving aspect ratio may cause issues',
            severity: 'warning',
            suggestion: 'Consider enabling preserveAspectRatio for forceSquare'
        });
    }

    return result;
}

/**
 * Validate resize parameters (replaces both validateCropOptions and validateCrop)
 * @param {Object|number} params - Resize parameters object OR dimension number
 * @param {string} [mode] - Resize mode (if first param is number)
 * @param {Object} [options] - Additional options (if first param is number)
 * @returns {Object} Validation result
 */
export function validateCrop(params, mode, options = {}) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    let width, height, cropMode, algorithm;

    // Handle both parameter formats
    if (typeof params === 'object') {
        width = params.width;
        height = params.height;
        cropMode = params.mode;
        algorithm = params.algorithm;
    } else {
        width = params;
        height = mode;
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
            severity: 'error'
        });
    }

    if (typeof height !== 'number' || height <= 0) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_HEIGHT,
            message: 'Height must be a positive number',
            severity: 'error'
        });
    }

    // Check for extreme dimensions
    if (width < 10 || height < 10) {
        result.errors.push({
            code: 'EXTREME_SMALL_DIMENSIONS',
            message: `Target dimensions too small: ${width}x${height}`,
            severity: 'error',
            suggestion: 'Use dimensions of at least 100x100 pixels'
        });
    }

    if (width > 10000 || height > 10000) {
        result.warnings.push({
            code: 'EXTREME_LARGE_DIMENSIONS',
            message: `Target dimensions very large: ${width}x${height}`,
            severity: 'warning',
            suggestion: 'Consider smaller dimensions for better performance'
        });
    }

    // Validate aspect ratio
    if (width && height) {
        const aspectRatio = width / height;
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            result.warnings.push({
                code: 'EXTREME_ASPECT_RATIO',
                message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
                severity: 'warning',
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
            severity: 'error'
        });
    }

    // Validate algorithm
    const validAlgorithms = ['lanczos3', 'bilinear', 'nearest'];
    if (algorithm && !validAlgorithms.includes(algorithm)) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.INVALID_ALGORITHM,
            message: 'Algorithm must be "lanczos3", "bilinear", or "nearest"',
            severity: 'error'
        });
    }

    // Check for integer dimensions
    if (width && !Number.isInteger(width) || height && !Number.isInteger(height)) {
        result.warnings.push({
            code: 'NON_INTEGER_DIMENSIONS',
            message: 'Crop dimensions should be integers for best results',
            severity: 'info'
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
                code: 'INVALID_QUALITY',
                message: `Quality must be between 1 and 100, got ${quality}`,
                severity: 'error',
                suggestion: 'Use a value between 1 and 100'
            });
        }
    }

    const validFormats = ['auto', 'webp', 'jpg', 'jpeg', 'png', 'avif', 'original'];
    if (format && !validFormats.includes(format.toLowerCase())) {
        result.warnings.push({
            code: 'UNSUPPORTED_FORMAT',
            message: `Format ${format} may not be supported`,
            severity: 'warning',
            suggestion: `Use one of: ${validFormats.join(', ')}`
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
    const { minWidth = 1, minHeight = 1, maxWidth = 10000, maxHeight = 10000 } = options;

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
            severity: 'error'
        });
    }

    if (width > maxWidth || height > maxHeight) {
        result.warnings.push({
            code: 'LARGE_DIMENSIONS',
            message: `Large dimensions: ${width}x${height} (maximum: ${maxWidth}x${maxHeight})`,
            severity: 'warning'
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
            code: 'EMPTY_PATTERN',
            message: 'Rename pattern cannot be empty',
            severity: 'error'
        });
        return result;
    }

    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(pattern)) {
        result.errors.push({
            code: 'INVALID_CHARS',
            message: 'Pattern contains invalid filename characters',
            severity: 'error',
            suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
        });
        result.valid = false;
    }

    const placeholders = ['{name}', '{index}', '{timestamp}', '{width}', '{height}', '{dimensions}', '{date}', '{time}'];
    const hasPlaceholder = placeholders.some(ph => pattern.includes(ph));

    if (!hasPlaceholder) {
        result.warnings.push({
            code: 'NO_PLACEHOLDERS',
            message: 'Pattern may create duplicate filenames',
            severity: 'warning',
            suggestion: 'Include {index} or {timestamp} for unique filenames'
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
            severity: 'error',
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
            severity: 'error',
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
            severity: 'error',
            details: `Size: ${formatFileSize(fileSize)}`,
            suggestion: 'Provide a non-empty file'
        });
    } else if (fileSize > maxFileSize) {
        result.valid = false;
        result.errors.push({
            code: ErrorCodes.FILE_TOO_LARGE,
            message: `File too large (${formatFileSize(fileSize)} > ${formatFileSize(maxFileSize)})`,
            severity: 'error',
            details: `Current: ${formatFileSize(fileSize)}, Maximum: ${formatFileSize(maxFileSize)}`,
            suggestion: 'Compress or resize the image before uploading'
        });
    } else if (fileSize > 10 * 1024 * 1024) {
        result.warnings.push({
            code: WarningCodes.LARGE_FILE,
            message: `Large file (${formatFileSize(fileSize)}) may process slowly`,
            severity: 'warning',
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
            severity: 'error',
            details: fileName ? `File: ${fileName}, Type: ${fileType}` : `Type: ${fileType}`,
            suggestion: 'Use JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF, or ICO formats'
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
                    severity: 'error',
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
                    severity: 'warning',
                    details: `Current: ${width}x${height}, Maximum: ${maxDimensions.width}x${maxDimensions.height}`,
                    suggestion: 'Consider resizing the image for better performance'
                });
            }

            // Check for very small source
            if (width < 100 || height < 100) {
                result.warnings.push({
                    code: WarningCodes.VERY_SMALL_SOURCE,
                    message: `Very small source image: ${width}x${height}`,
                    severity: 'warning',
                    details: `Dimensions: ${width}x${height}`,
                    suggestion: 'Consider using a higher resolution source image'
                });
            }

            // Check for very large source
            if (width > 4000 || height > 4000) {
                result.warnings.push({
                    code: WarningCodes.VERY_LARGE_SOURCE,
                    message: `Very large source image: ${width}x${height}`,
                    severity: 'warning',
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
            severity: 'warning',
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
            severity: 'error',
            suggestion: 'Provide a File object instead of metadata'
        });
    }

    // ===== 7. URL VALIDATION =====
    if (file.url && !file.url.startsWith('blob:')) {
        result.warnings.push({
            code: WarningCodes.CONTENT_LOSS,
            message: 'Image URL may not be a valid blob URL',
            severity: 'warning',
            details: `URL: ${file.url.substring(0, 50)}...`,
            suggestion: 'Use blob URLs for local image processing'
        });
    }

    // ===== 8. TRANSPARENCY CHECK =====
    if (fileType === ImageMimeTypes.JPEG && file.transparency) {
        result.warnings.push({
            code: WarningCodes.TRANSPARENCY_LOSS,
            message: 'Image has transparency but is in JPEG format',
            severity: 'warning',
            suggestion: 'Convert to PNG or WebP to preserve transparency'
        });
    }

    // ===== 9. FORMAT SPECIFIC CHECKS =====
    if (fileType === ImageMimeTypes.AVIF) {
        result.warnings.push({
            code: WarningCodes.AVIF_BROWSER_SUPPORT,
            message: 'AVIF format may not be supported in all browsers',
            severity: 'info',
            suggestion: 'Consider providing WebP fallback for broader compatibility'
        });
    }

    if (fileType === ImageMimeTypes.SVG && checkDimensions) {
        result.warnings.push({
            code: WarningCodes.SVG_SKIPPED,
            message: 'SVG files may skip certain processing steps',
            severity: 'info',
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
            severity: 'error'
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
            severity: 'error',
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
            severity: 'warning',
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
    if (file.size > 50 * 1024 * 1024) {
        result.valid = false;
        result.error = 'File too large (>50MB)';
    } else if (file.size > 10 * 1024 * 1024) {
        result.warnings.push('Large file may process slowly');
    }

    // Quick type check
    const allowedTypes = getAllowedImageMimeTypes();
    const isAllowed = allowedTypes.some(type =>
        file.type.toLowerCase() === type.toLowerCase() ||
        (file.type.includes('jpeg') && type.includes('jpeg')) ||
        (file.type.includes('jpg') && type.includes('jpg'))
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
            severity: 'error'
        });
    }

    sizes?.forEach(size => {
        if (size < 16) {
            result.warnings.push({
                code: WarningCodes.SMALL_WIDTH,
                message: `Favicon size ${size}px is below recommended minimum (16px)`,
                severity: 'warning'
            });
        }

        if (size > 1024) {
            result.warnings.push({
                code: WarningCodes.LARGE_DIMENSIONS,
                message: `Favicon size ${size}px is unusually large`,
                severity: 'info'
            });
        }
    });

    if (imageInfo) {
        const minSize = Math.min(...sizes);
        if (imageInfo.width < minSize || imageInfo.height < minSize) {
            result.warnings.push({
                code: WarningCodes.SMALL_WIDTH,
                message: `Source image (${imageInfo.width}x${imageInfo.height}) smaller than smallest favicon size (${minSize}px)`,
                severity: 'warning',
                suggestion: 'Consider using a larger source image or enable upscaling'
            });
        }

        if (Math.abs(imageInfo.width / imageInfo.height - 1) > 0.1) {
            result.warnings.push({
                code: WarningCodes.CONTENT_LOSS,
                message: 'Source image is not square; favicons may be distorted',
                severity: 'warning',
                suggestion: 'Consider adding a crop step before favicon generation'
            });
        }
    }

    const validFormats = ['png', 'ico', 'svg'];
    formats?.forEach(format => {
        if (!validFormats.includes(format)) {
            result.warnings.push({
                code: WarningCodes.UNSUPPORTED_FORMAT,
                message: `Unsupported favicon format: ${format}`,
                severity: 'warning',
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
            case 'resize':
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

            case 'crop':
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

            case 'optimize':
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

            case 'rename':
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

            case 'favicon':
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
    const hasResize = enabledSteps.some(s => s.processor === 'resize');
    const hasCrop = enabledSteps.some(s => s.processor === 'crop');
    const hasOptimize = enabledSteps.some(s => s.processor === 'optimize');

    if (hasCrop && !hasResize) {
        result.warnings.push({
            type: 'crop_without_resize',
            message: 'Crop without resize may result in unexpected output',
            severity: 'info',
            suggestion: 'Consider adding resize step before crop for better control'
        });
    }

    const optimizeSteps = enabledSteps.filter(s => s.processor === 'optimize');
    if (optimizeSteps.length > 1) {
        result.warnings.push({
            type: 'multiple_optimize',
            message: `Multiple optimization steps (${optimizeSteps.length})`,
            severity: 'warning',
            suggestion: 'Multiple optimizations may degrade quality unnecessarily'
        });
    }

    const renameIndex = enabledSteps.findIndex(s => s.processor === 'rename');
    if (renameIndex >= 0 && renameIndex < enabledSteps.length - 2) {
        result.warnings.push({
            type: 'early_rename',
            message: 'Rename step placed before other operations',
            severity: 'info',
            suggestion: 'Consider moving rename to end to reflect final output'
        });
    }

    const faviconIndex = enabledSteps.findIndex(s => s.processor === 'favicon');
    if (faviconIndex >= 0) {
        const stepsBefore = enabledSteps.slice(0, faviconIndex);
        const hasResizeBefore = stepsBefore.some(s => s.processor === 'resize');
        const hasCropBefore = stepsBefore.some(s => s.processor === 'crop');

        if (!hasResizeBefore && !hasCropBefore) {
            result.warnings.push({
                type: 'favicon_without_preparation',
                message: 'Favicon generation without prior resize/crop',
                severity: 'warning',
                suggestion: 'Add resize/crop step before favicon for optimal results'
            });
        }
    }

    const faviconSteps = enabledSteps.filter(s => s.processor === 'favicon');
    faviconSteps.forEach(faviconStep => {
        const optimizeAfter = enabledSteps
            .filter(s => s.processor === 'optimize')
            .some(optimizeStep => optimizeStep.order > faviconStep.order);

        if (optimizeAfter) {
            result.warnings.push({
                type: 'optimize_after_favicon',
                message: 'Optimization after favicon generation may affect favicon quality',
                severity: 'warning',
                suggestion: 'Move optimization step before favicon generation'
            });
        }
    });

    if (hasOptimize && !hasResize && !hasCrop) {
        result.warnings.push({
            type: 'optimization_only',
            message: 'Task contains only optimization step',
            severity: 'info',
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
            severity: 'warning'
        });
    }

    if (lemGendImage) {
        if (!lemGendImage.file) {
            result.warnings.push({
                type: 'missing_file_property',
                message: 'Image missing file property (may be from session storage)',
                severity: 'warning',
                suggestion: 'File will be reconstructed for processing'
            });
        } else if (!(lemGendImage.file instanceof File)) {
            result.warnings.push({
                type: 'invalid_file_type',
                message: 'Image file property is not a File instance',
                severity: 'warning',
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