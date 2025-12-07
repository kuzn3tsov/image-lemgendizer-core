/**
 * Image utility functions
 * @module utils/imageUtils
 */

/**
 * Get image dimensions from File
 * @param {File} file - Image file
 * @returns {Promise<Object>} Dimensions object
 */
export async function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        if (!file || !(file instanceof File)) {
            reject(new Error('Invalid file provided'));
            return;
        }

        // Special handling for favicons
        if (file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon') {
            getIcoDimensions(file)
                .then(resolve)
                .catch(() => resolve({ width: 32, height: 32, orientation: 'square', aspectRatio: 1 }));
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const dimensions = {
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                orientation: img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait',
                aspectRatio: img.naturalWidth / img.naturalHeight
            };

            URL.revokeObjectURL(objectUrl);
            resolve(dimensions);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);

            // For SVG files, try different approach
            if (file.type === 'image/svg+xml') {
                getSVGDimensions(file)
                    .then(resolve)
                    .catch(() => reject(new Error('Failed to load image dimensions')));
            } else {
                reject(new Error('Failed to load image'));
            }
        };

        img.src = objectUrl;
    });
}

/**
 * Get MIME type from file extension
 * @param {string} filename - Filename or extension
 * @returns {string} MIME type
 */
export function getMimeTypeFromExtension(filename) {
    const extension = filename.toLowerCase().split('.').pop();

    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'avif': 'image/avif',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        '': 'application/octet-stream'
    };

    return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Get SVG dimensions
 * @private
 */
async function getSVGDimensions(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const svgText = e.target.result;
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;

                // Check for parsing errors
                if (svgDoc.querySelector('parsererror')) {
                    reject(new Error('Invalid SVG format'));
                    return;
                }

                // Get dimensions
                const width = parseFloat(svgElement.getAttribute('width')) ||
                    svgElement.viewBox?.baseVal?.width || 100;
                const height = parseFloat(svgElement.getAttribute('height')) ||
                    svgElement.viewBox?.baseVal?.height || 100;

                resolve({
                    width,
                    height,
                    orientation: width >= height ? 'landscape' : 'portrait',
                    aspectRatio: width / height
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Get ICO file dimensions (simplified)
 * @private
 */
async function getIcoDimensions(file) {
    return new Promise((resolve) => {
        // ICO files can contain multiple sizes, return default for favicons
        resolve({
            width: 32,
            height: 32,
            orientation: 'square',
            aspectRatio: 1
        });
    });
}

/**
 * Check if image has transparency
 * @param {File} file - Image file
 * @returns {Promise<boolean>} True if image has transparency
 */
export async function hasTransparency(file) {
    if (!file || (file.type !== 'image/png' && file.type !== 'image/webp')) {
        return false; // Only PNG and WebP have meaningful transparency for our purposes
    }

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check alpha channel
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    URL.revokeObjectURL(objectUrl);
                    resolve(true);
                    return;
                }
            }

            URL.revokeObjectURL(objectUrl);
            resolve(false);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(false);
        };

        img.src = objectUrl;
    });
}

/**
 * Convert File to Data URL
 * @param {File} file - File to convert
 * @returns {Promise<string>} Data URL
 */
export function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Convert Data URL to File
 * @param {string} dataURL - Data URL
 * @param {string} filename - Output filename
 * @returns {Promise<File>} File object
 */
export function dataURLtoFile(dataURL, filename) {
    return new Promise((resolve, reject) => {
        try {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            resolve(new File([u8arr], filename, { type: mime }));
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Resize image using canvas
 * @param {File} file - Image file
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} format - Output format
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<File>} Resized image file
 */
export async function resizeImage(file, width, height, format = 'webp', quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Special handling for favicon format
        if (format.toLowerCase() === 'ico') {
            // Create PNG first, then convert to ICO (simplified approach)
            resizeImage(file, width, height, 'png', quality)
                .then(pngFile => {
                    // For now, return PNG and warn about ICO limitation
                    console.warn('ICO format creation limited in browser. Using PNG instead.');
                    resolve(pngFile);
                })
                .catch(reject);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Fill background for JPEG
            if (format === 'jpg' || format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Determine MIME type
            let mimeType;
            switch (format.toLowerCase()) {
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                case 'avif':
                    mimeType = 'image/avif';
                    break;
                case 'svg':
                    mimeType = 'image/svg+xml';
                    break;
                default:
                    mimeType = 'image/webp';
            }

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objectUrl);

                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }

                    const extension = format.toLowerCase();
                    const originalName = file.name.replace(/\.[^/.]+$/, '');
                    const newName = `${originalName}-${width}x${height}.${extension}`;

                    resolve(new File([blob], newName, { type: mimeType }));
                },
                mimeType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

/**
 * Crop image using canvas
 * @param {File} file - Image file
 * @param {number} x - X offset
 * @param {number} y - Y offset
 * @param {number} width - Crop width
 * @param {number} height - Crop height
 * @param {string} format - Output format
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<File>} Cropped image file
 */
export async function cropImage(file, x, y, width, height, format = 'webp', quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Fill background for JPEG
            if (format === 'jpg' || format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            // Determine MIME type
            let mimeType;
            switch (format.toLowerCase()) {
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    mimeType = 'image/webp';
            }

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objectUrl);

                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }

                    const extension = format.toLowerCase();
                    const originalName = file.name.replace(/\.[^/.]+$/, '');
                    const newName = `${originalName}-crop-${width}x${height}.${extension}`;

                    resolve(new File([blob], newName, { type: mimeType }));
                },
                mimeType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 * @param {number} originalWidth - Original width
 * @param {number} originalHeight - Original height
 * @param {number} targetSize - Target size (width or height)
 * @param {string} mode - 'width', 'height', or 'auto'
 * @returns {Object} New dimensions
 */
export function calculateAspectRatioFit(originalWidth, originalHeight, targetSize, mode = 'auto') {
    if (mode === 'width') {
        const newWidth = targetSize;
        const newHeight = Math.round((originalHeight / originalWidth) * targetSize);
        return { width: newWidth, height: newHeight };
    } else if (mode === 'height') {
        const newHeight = targetSize;
        const newWidth = Math.round((originalWidth / originalHeight) * targetSize);
        return { width: newWidth, height: newHeight };
    } else {
        // Auto mode: portrait uses height, landscape uses width
        if (originalWidth >= originalHeight) {
            const newWidth = targetSize;
            const newHeight = Math.round((originalHeight / originalWidth) * targetSize);
            return { width: newWidth, height: newHeight };
        } else {
            const newHeight = targetSize;
            const newWidth = Math.round((originalWidth / originalHeight) * targetSize);
            return { width: newWidth, height: newHeight };
        }
    }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename or MIME type
 * @param {File|string} fileOrName - File object or filename
 * @returns {string} File extension
 */
export function getFileExtension(fileOrName) {
    if (fileOrName instanceof File) {
        // Try from name first
        const nameExt = fileOrName.name.split('.').pop().toLowerCase();
        if (nameExt && nameExt.length <= 4) {
            return nameExt;
        }

        // Fall back to MIME type
        const mimeExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff',
            'image/avif': 'avif',
            'image/x-icon': 'ico',
            'image/vnd.microsoft.icon': 'ico'
        }[fileOrName.type];

        return mimeExt || 'unknown';
    }

    // String input
    const name = typeof fileOrName === 'string' ? fileOrName : '';
    const ext = name.split('.').pop().toLowerCase();
    return ext && ext.length <= 4 ? ext : 'unknown';
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateImageFile(file) {
    const errors = [];
    const warnings = [];

    // Check if it's a File object
    if (!(file instanceof File)) {
        errors.push('Not a valid File object');
        return { valid: false, errors, warnings };
    }

    // Check file type
    const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'image/avif',
        'image/x-icon',
        'image/vnd.microsoft.icon'
    ];

    if (!validTypes.includes(file.type)) {
        errors.push(`Unsupported file type: ${file.type}`);
    }

    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        errors.push(`File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(maxSize)})`);
    } else if (file.size > 10 * 1024 * 1024) { // 10MB
        warnings.push(`Large file: ${formatFileSize(file.size)} - processing may be slow`);
    }

    // Check filename
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
        warnings.push('Filename contains invalid characters');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Create image thumbnail
 * @param {File|Object} imageOrFile - Image file or object with file property
 * @param {number} maxSize - Maximum thumbnail dimension
 * @returns {Promise<string>} Thumbnail as Data URL
 */
export async function createThumbnail(imageOrFile, maxSize = 200) {
    let file;

    // Handle both File and object with file property
    if (imageOrFile instanceof File) {
        file = imageOrFile;
    } else if (imageOrFile && imageOrFile.file instanceof File) {
        // Assuming it's a LemGendImage or similar object
        file = imageOrFile.file;
    } else {
        throw new Error('Invalid input: must be File or object with file property');
    }

    return new Promise((resolve, reject) => {
        // Special handling for favicons
        if (file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon') {
            // Use a default favicon icon as thumbnail
            resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM4ODJlZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMzg4MmVmIi8+PC9zdmc+');
            return;
        }

        // Special handling for SVG
        if (file.type === 'image/svg+xml') {
            // For SVG, return as-is
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            // Calculate thumbnail dimensions
            let width, height;
            if (img.width > img.height) {
                width = maxSize;
                height = Math.round((img.height / img.width) * maxSize);
            } else {
                height = maxSize;
                width = Math.round((img.width / img.height) * maxSize);
            }

            // Create canvas for thumbnail
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to Data URL
            const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

            // Clean up
            URL.revokeObjectURL(objectUrl);
            resolve(thumbnail);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to create thumbnail'));
        };

        img.src = objectUrl;
    });
}

/**
 * Batch process images with progress tracking
 * @param {Array<File>} files - Image files
 * @param {Function} processor - Processing function
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Processed results
 */
export async function batchProcess(files, processor, onProgress) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await processor(files[i], i);
            results.push(result);

            if (onProgress) {
                onProgress((i + 1) / total, i + 1, total);
            }
        } catch (error) {
            console.error(`Error processing file ${i + 1}:`, error);
            results.push({ error: error.message, file: files[i] });
        }
    }

    return results;
}

/**
 * Analyze image for optimization potential
 * @param {File} file - Image file
 * @returns {Promise<Object>} Optimization analysis
 */
export async function analyzeForOptimization(file) {
    const dimensions = await getImageDimensions(file);
    const transparency = await hasTransparency(file);

    const analysis = {
        dimensions,
        transparency,
        fileSize: file.size,
        mimeType: file.type,
        extension: getFileExtension(file),
        optimizationScore: 0,
        recommendations: []
    };

    // Calculate optimization score (0-100)
    let score = 0;

    // Size-based scoring
    if (file.size > 5 * 1024 * 1024) {
        score += 40; // Large files have high optimization potential
        analysis.recommendations.push('File is very large - high optimization potential');
    } else if (file.size > 1 * 1024 * 1024) {
        score += 20;
    } else if (file.size > 100 * 1024) {
        score += 10;
    }

    // Dimension-based scoring
    const megapixels = (dimensions.width * dimensions.height) / 1000000;
    if (megapixels > 16) {
        score += 30;
        analysis.recommendations.push('Very high resolution - consider resizing');
    } else if (megapixels > 4) {
        score += 15;
    }

    // Format-based scoring
    const modernFormats = ['webp', 'avif', 'svg'];
    const currentFormat = getFileExtension(file);
    if (!modernFormats.includes(currentFormat)) {
        score += 20;
        analysis.recommendations.push(`Consider converting from ${currentFormat} to modern format`);
    }

    // Transparency consideration
    if (transparency && currentFormat === 'jpg') {
        score += 10;
        analysis.recommendations.push('JPEG with transparency - convert to PNG or WebP');
    }

    analysis.optimizationScore = Math.min(100, score);
    analysis.optimizationLevel = score > 50 ? 'high' : score > 25 ? 'medium' : 'low';

    return analysis;
}

/**
 * Get optimization presets for common use cases
 * @param {string} useCase - Use case identifier
 * @returns {Object} Optimization preset
 */
export function getOptimizationPreset(useCase) {
    const presets = {
        'web-high': {
            quality: 85,
            format: 'auto',
            maxDisplayWidth: 1920,
            compressionMode: 'balanced',
            stripMetadata: true,
            description: 'High quality web images'
        },
        'web-balanced': {
            quality: 80,
            format: 'auto',
            maxDisplayWidth: 1200,
            compressionMode: 'adaptive',
            stripMetadata: true,
            description: 'Balanced web images'
        },
        'web-aggressive': {
            quality: 70,
            format: 'webp',
            maxDisplayWidth: 800,
            compressionMode: 'aggressive',
            stripMetadata: true,
            description: 'Aggressive web optimization'
        },
        'social-media': {
            quality: 90,
            format: 'jpg',
            maxDisplayWidth: 1080,
            compressionMode: 'balanced',
            stripMetadata: false, // Keep metadata for social
            description: 'Social media images'
        },
        'ecommerce': {
            quality: 92,
            format: 'webp',
            maxDisplayWidth: 1200,
            compressionMode: 'balanced',
            stripMetadata: true,
            preserveTransparency: true,
            description: 'E-commerce product images'
        },
        'favicon': {
            quality: 100,
            format: 'ico',
            compressionMode: 'balanced',
            icoSizes: [16, 32, 48, 64],
            description: 'Favicon generation'
        },
        'print-ready': {
            quality: 100,
            format: 'png',
            compressionMode: 'balanced',
            lossless: true,
            stripMetadata: false,
            description: 'Print-ready images'
        },
        'mobile-optimized': {
            quality: 75,
            format: 'webp',
            maxDisplayWidth: 800,
            compressionMode: 'aggressive',
            stripMetadata: true,
            description: 'Mobile-optimized images'
        }
    };

    return presets[useCase] || presets['web-balanced'];
}

/**
 * Calculate estimated optimization savings
 * @param {number} originalSize - Original file size in bytes
 * @param {Object} optimizationSettings - Optimization settings
 * @returns {Object} Estimated savings
 */
export function calculateOptimizationSavings(originalSize, optimizationSettings) {
    const { format, quality, maxDisplayWidth } = optimizationSettings;

    let estimatedSize = originalSize;
    let reductionFactors = [];

    // Format reduction
    switch (format) {
        case 'webp':
            estimatedSize *= 0.7;
            reductionFactors.push('WebP format: 30% reduction');
            break;
        case 'avif':
            estimatedSize *= 0.6;
            reductionFactors.push('AVIF format: 40% reduction');
            break;
        case 'jpg':
            estimatedSize *= 0.8;
            reductionFactors.push('JPEG format: 20% reduction');
            break;
        case 'png':
            estimatedSize *= 0.9;
            reductionFactors.push('PNG format: 10% reduction');
            break;
        case 'svg':
            estimatedSize *= 0.3;
            reductionFactors.push('SVG format: 70% reduction');
            break;
        default:
            estimatedSize *= 0.75;
            reductionFactors.push('Auto format selection: ~25% reduction');
    }

    // Quality reduction
    const qualityFactor = quality / 100;
    estimatedSize *= qualityFactor;
    reductionFactors.push(`Quality ${quality}%: ${Math.round((1 - qualityFactor) * 100)}% reduction`);

    // Display width reduction (if specified)
    if (maxDisplayWidth) {
        // Assume typical reduction for web display
        estimatedSize *= 0.85;
        reductionFactors.push(`Max width ${maxDisplayWidth}px: ~15% reduction`);
    }

    const savings = originalSize - estimatedSize;
    const savingsPercent = (savings / originalSize) * 100;

    return {
        originalSize,
        estimatedSize: Math.round(estimatedSize),
        savings: Math.round(savings),
        savingsPercent: Math.round(savingsPercent * 10) / 10,
        reductionFactors,
        readable: {
            original: formatFileSize(originalSize),
            estimated: formatFileSize(Math.round(estimatedSize)),
            savings: formatFileSize(Math.round(savings)),
            savingsPercent: `${Math.round(savingsPercent * 10) / 10}%`
        }
    };
}

/**
 * Create optimization preview
 * @param {File} file - Image file
 * @param {Object} optimizationSettings - Optimization settings
 * @returns {Promise<string>} Data URL of optimized preview
 */
export async function createOptimizationPreview(file, optimizationSettings) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate preview dimensions (max 400px for preview)
                const maxPreviewSize = 400;
                let width = img.width;
                let height = img.height;

                if (width > maxPreviewSize || height > maxPreviewSize) {
                    if (width >= height) {
                        width = maxPreviewSize;
                        height = Math.round((img.height / img.width) * maxPreviewSize);
                    } else {
                        height = maxPreviewSize;
                        width = Math.round((img.width / img.height) * maxPreviewSize);
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Create preview with reduced quality
                const previewQuality = Math.min(0.7, optimizationSettings.quality / 100 * 0.8);
                const previewDataURL = canvas.toDataURL('image/jpeg', previewQuality);

                resolve(previewDataURL);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Generate optimization comparison
 * @param {File} originalFile - Original image file
 * @param {File} optimizedFile - Optimized image file
 * @returns {Promise<Object>} Comparison data
 */
export async function generateOptimizationComparison(originalFile, optimizedFile) {
    const originalSize = originalFile.size;
    const optimizedSize = optimizedFile.size;
    const savings = originalSize - optimizedSize;
    const savingsPercent = (savings / originalSize) * 100;

    // Get thumbnails for visual comparison
    const originalThumbnail = await createThumbnail(originalFile, 300);
    const optimizedThumbnail = await createThumbnail(optimizedFile, 300);

    return {
        original: {
            size: originalSize,
            sizeFormatted: formatFileSize(originalSize),
            thumbnail: originalThumbnail
        },
        optimized: {
            size: optimizedSize,
            sizeFormatted: formatFileSize(optimizedSize),
            thumbnail: optimizedThumbnail
        },
        savings: {
            bytes: savings,
            percent: Math.round(savingsPercent * 10) / 10,
            formatted: formatFileSize(savings),
            compressionRatio: (originalSize / optimizedSize).toFixed(2)
        },
        comparison: savingsPercent > 0 ?
            `Saved ${formatFileSize(savings)} (${Math.round(savingsPercent)}%)` :
            'No savings achieved'
    };
}

/**
 * Check if image format needs conversion for web
 * @param {File} file - Image file
 * @returns {boolean} True if format conversion recommended
 */
export function needsFormatConversion(file) {
    const extension = getFileExtension(file);
    const modernFormats = ['webp', 'avif', 'svg'];
    return !modernFormats.includes(extension);
}

/**
 * Get recommended format for web
 * @param {File} file - Image file
 * @returns {string} Recommended format
 */
export function getRecommendedFormat(file) {
    const extension = getFileExtension(file);

    if (extension === 'svg') return 'svg';
    if (extension === 'ico') return 'ico';

    // Check if image has transparency
    if (file.type === 'image/png' || file.type === 'image/webp') {
        return 'webp'; // WebP supports transparency
    }

    // For large images, recommend AVIF
    if (file.size > 2 * 1024 * 1024) {
        return 'avif';
    }

    return 'webp'; // Default to WebP for good balance
}

/**
 * Get optimization quick stats
 * @param {File} file - Image file
 * @returns {Promise<Object>} Quick optimization stats
 */
export async function getOptimizationStats(file) {
    const analysis = await analyzeForOptimization(file);
    const recommendedFormat = getRecommendedFormat(file);
    const savings = calculateOptimizationSavings(file.size, {
        format: recommendedFormat,
        quality: 85,
        maxDisplayWidth: 1920
    });

    return {
        analysis,
        recommendedFormat,
        estimatedSavings: savings,
        needsOptimization: analysis.optimizationScore > 30,
        priority: analysis.optimizationLevel
    };
}

/**
 * Get format priorities for intelligent optimization selection
 * @param {Array<string>} browserSupport - Browser support requirements
 * @returns {Object} Format priority data
 */
export function getFormatPriorities(browserSupport = ['modern', 'legacy']) {
    const formats = {
        'avif': {
            quality: 0.9,
            browserSupport: browserSupport.includes('modern') ? 0.9 : 0.7,
            compression: 0.8,
            supportsTransparency: true,
            maxQuality: 63 // AVIF has different quality scale
        },
        'webp': {
            quality: 0.8,
            browserSupport: browserSupport.includes('legacy') ? 0.9 : 0.98,
            compression: 0.7,
            supportsTransparency: true,
            maxQuality: 100
        },
        'jpg': {
            quality: 0.7,
            browserSupport: 1.0,
            compression: 0.6,
            supportsTransparency: false,
            maxQuality: 100
        },
        'png': {
            quality: 0.9,
            browserSupport: 1.0,
            compression: 0.5,
            supportsTransparency: true,
            maxQuality: 100
        },
        'ico': {
            quality: 1.0,
            browserSupport: 1.0,
            compression: 0.5,
            supportsTransparency: true,
            maxQuality: 100
        }
    };

    return formats;
}

/**
 * Check AI capabilities for smart cropping
 * @returns {Promise<Object>} AI capability report
 */
export async function checkAICapabilities() {
    const capabilities = {
        faceDetection: false,
        objectDetection: false,
        saliencyDetection: false,
        entropyDetection: false,
        canvasAvailable: false,
        workerAvailable: typeof Worker !== 'undefined',
        tensorFlowAvailable: typeof tf !== 'undefined',
        faceDetectorAvailable: typeof FaceDetector !== 'undefined'
    };

    try {
        // Check canvas API
        const canvas = document.createElement('canvas');
        capabilities.canvasAvailable = !!(canvas.getContext && canvas.getContext('2d'));

        // Check Face Detection API
        if (typeof FaceDetector === 'function') {
            try {
                const faceDetector = new FaceDetector();
                capabilities.faceDetection = true;
            } catch (e) {
                console.warn('FaceDetector API available but failed to initialize:', e.message);
            }
        }

        // Check TensorFlow.js
        if (typeof tf !== 'undefined') {
            capabilities.tensorFlowAvailable = true;
            capabilities.objectDetection = true;
            capabilities.saliencyDetection = true;
            capabilities.entropyDetection = true;
        }

        // Check for offscreen canvas for workers
        if (typeof OffscreenCanvas !== 'undefined') {
            capabilities.offscreenCanvas = true;
        }

    } catch (error) {
        console.warn('Error checking AI capabilities:', error.message);
    }

    // Generate capability summary
    capabilities.summary = generateAISummary(capabilities);
    capabilities.hasAnyAI = capabilities.faceDetection || capabilities.objectDetection ||
        capabilities.saliencyDetection || capabilities.entropyDetection;

    return capabilities;
}

/**
 * Generate AI capability summary
 * @private
 */
function generateAISummary(capabilities) {
    const availableFeatures = [];
    const unavailableFeatures = [];

    if (capabilities.faceDetection) availableFeatures.push('Face Detection');
    else unavailableFeatures.push('Face Detection (requires FaceDetector API)');

    if (capabilities.objectDetection) availableFeatures.push('Object Detection');
    else unavailableFeatures.push('Object Detection (requires TensorFlow.js)');

    if (capabilities.saliencyDetection) availableFeatures.push('Saliency Detection');
    else unavailableFeatures.push('Saliency Detection (requires TensorFlow.js)');

    if (capabilities.entropyDetection) availableFeatures.push('Entropy Analysis');
    else unavailableFeatures.push('Entropy Analysis (requires TensorFlow.js)');

    return {
        available: availableFeatures,
        unavailable: unavailableFeatures,
        hasAdvancedAI: capabilities.tensorFlowAvailable,
        canUseWorkers: capabilities.workerAvailable && capabilities.offscreenCanvas,
        recommendedMode: capabilities.faceDetection ? 'face' :
            capabilities.objectDetection ? 'object' :
                capabilities.saliencyDetection ? 'saliency' : 'center'
    };
}

/**
 * Check if object is a LemGendImage instance
 * @param {any} obj - Object to check
 * @returns {boolean} True if LemGendImage instance
 */
export function isLemGendImage(obj) {
    // Simple check - this avoids circular dependency
    return obj &&
        typeof obj === 'object' &&
        obj.constructor &&
        obj.constructor.name === 'LemGendImage';
}

export default {
    getImageDimensions,
    getMimeTypeFromExtension,
    hasTransparency,
    fileToDataURL,
    dataURLtoFile,
    resizeImage,
    cropImage,
    calculateAspectRatioFit,
    formatFileSize,
    getFileExtension,
    validateImageFile,
    createThumbnail,
    batchProcess,
    analyzeForOptimization,
    getOptimizationPreset,
    calculateOptimizationSavings,
    createOptimizationPreview,
    generateOptimizationComparison,
    needsFormatConversion,
    getRecommendedFormat,
    getOptimizationStats,
    getFormatPriorities,
    checkAICapabilities,
    isLemGendImage
};