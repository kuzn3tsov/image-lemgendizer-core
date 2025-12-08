/**
 * Image utility functions
 * @module utils/imageUtils
 */

// Import shared constants
import {
    ImageMimeTypes,
    FileExtensions,
    AspectRatios,
    Defaults
} from '../constants/sharedConstants.js';

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
        if (file.type === ImageMimeTypes.ICO || file.type === ImageMimeTypes.MICROSOFT_ICO) {
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
            if (file.type === ImageMimeTypes.SVG) {
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
        // Image formats
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
        [FileExtensions.ICO]: ImageMimeTypes.ICO,
        [FileExtensions.EPS]: 'application/postscript',
        [FileExtensions.PDF]: 'application/pdf',

        // Document formats
        'pdf': 'application/pdf',
        'eps': 'application/postscript',
        'ai': 'application/postscript',

        // Text formats
        'txt': 'text/plain',
        'csv': 'text/csv',
        'html': 'text/html',
        'htm': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',

        // Archive formats
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',

        // Video formats
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',

        // Audio formats
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',

        // Font formats
        'ttf': 'font/ttf',
        'otf': 'font/otf',
        'woff': 'font/woff',
        'woff2': 'font/woff2',

        // Default
        '': 'application/octet-stream'
    };

    return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
export function getExtensionFromMimeType(mimeType) {
    const extensionMap = {
        // Image formats
        [ImageMimeTypes.JPEG]: FileExtensions.JPG,
        [ImageMimeTypes.PNG]: FileExtensions.PNG,
        [ImageMimeTypes.WEBP]: FileExtensions.WEBP,
        [ImageMimeTypes.GIF]: FileExtensions.GIF,
        [ImageMimeTypes.SVG]: FileExtensions.SVG,
        [ImageMimeTypes.BMP]: FileExtensions.BMP,
        [ImageMimeTypes.TIFF]: FileExtensions.TIFF,
        [ImageMimeTypes.AVIF]: FileExtensions.AVIF,
        [ImageMimeTypes.ICO]: FileExtensions.ICO,
        [ImageMimeTypes.MICROSOFT_ICO]: FileExtensions.ICO,

        // Document formats
        'application/pdf': 'pdf',
        'application/postscript': 'eps',

        // Text formats
        'text/plain': 'txt',
        'text/csv': 'csv',
        'text/html': 'html',
        'application/javascript': 'js',
        'application/json': 'json',
        'application/xml': 'xml',

        // Archive formats
        'application/zip': 'zip',
        'application/vnd.rar': 'rar',

        // Video formats
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',

        // Audio formats
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',

        // Font formats
        'font/ttf': 'ttf',
        'font/otf': 'otf'
    };

    return extensionMap[mimeType] || 'bin';
}

/**
 * Check if MIME type is an image
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if image MIME type
 */
export function isImageMimeType(mimeType) {
    const imageMimeTypes = [
        ImageMimeTypes.JPEG,
        ImageMimeTypes.PNG,
        ImageMimeTypes.WEBP,
        ImageMimeTypes.GIF,
        ImageMimeTypes.SVG,
        ImageMimeTypes.BMP,
        ImageMimeTypes.TIFF,
        ImageMimeTypes.AVIF,
        ImageMimeTypes.ICO,
        ImageMimeTypes.MICROSOFT_ICO
    ];

    return imageMimeTypes.includes(mimeType) || mimeType.startsWith('image/');
}

/**
 * Get allowed image MIME types for validation
 * @returns {Array<string>} Array of allowed MIME types
 */
export function getAllowedImageMimeTypes() {
    return [
        ImageMimeTypes.JPEG,
        ImageMimeTypes.PNG,
        ImageMimeTypes.WEBP,
        ImageMimeTypes.GIF,
        ImageMimeTypes.SVG,
        ImageMimeTypes.BMP,
        ImageMimeTypes.TIFF,
        ImageMimeTypes.AVIF,
        ImageMimeTypes.ICO,
        ImageMimeTypes.MICROSOFT_ICO
    ];
}

/**
 * Get file extension priorities for format conversion
 * @returns {Object} Extension priority mapping
 */
export function getExtensionPriorities() {
    return {
        // Modern formats (highest priority)
        [FileExtensions.WEBP]: 1,
        [FileExtensions.AVIF]: 2,
        [FileExtensions.SVG]: 3,

        // Standard formats
        [FileExtensions.PNG]: 4,
        [FileExtensions.JPEG]: 5,
        [FileExtensions.JPG]: 5,

        // Legacy formats
        [FileExtensions.GIF]: 6,
        [FileExtensions.BMP]: 7,
        [FileExtensions.TIFF]: 8,
        [FileExtensions.ICO]: 9,

        // Other
        'pdf': 10,
        'eps': 11
    };
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
    if (!file || (file.type !== ImageMimeTypes.PNG && file.type !== ImageMimeTypes.WEBP)) {
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
export async function resizeImage(file, width, height, format = FileExtensions.WEBP, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Special handling for favicon format
        if (format.toLowerCase() === FileExtensions.ICO) {
            // Create PNG first, then convert to ICO (simplified approach)
            resizeImage(file, width, height, FileExtensions.PNG, quality)
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
            if (format === FileExtensions.JPG || format === FileExtensions.JPEG) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Determine MIME type
            let mimeType;
            switch (format.toLowerCase()) {
                case FileExtensions.JPG:
                case FileExtensions.JPEG:
                    mimeType = ImageMimeTypes.JPEG;
                    break;
                case FileExtensions.PNG:
                    mimeType = ImageMimeTypes.PNG;
                    break;
                case FileExtensions.WEBP:
                    mimeType = ImageMimeTypes.WEBP;
                    break;
                case FileExtensions.AVIF:
                    mimeType = ImageMimeTypes.AVIF;
                    break;
                case FileExtensions.SVG:
                    mimeType = ImageMimeTypes.SVG;
                    break;
                default:
                    mimeType = ImageMimeTypes.WEBP;
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
export async function cropImage(file, x, y, width, height, format = FileExtensions.WEBP, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Fill background for JPEG
            if (format === FileExtensions.JPG || format === FileExtensions.JPEG) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            // Determine MIME type
            let mimeType;
            switch (format.toLowerCase()) {
                case FileExtensions.JPG:
                case FileExtensions.JPEG:
                    mimeType = ImageMimeTypes.JPEG;
                    break;
                case FileExtensions.PNG:
                    mimeType = ImageMimeTypes.PNG;
                    break;
                case FileExtensions.WEBP:
                    mimeType = ImageMimeTypes.WEBP;
                    break;
                default:
                    mimeType = ImageMimeTypes.WEBP;
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
            const newWidth = Math.round((originalWidth / originalHeight) * newHeight);
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
    // 1. Handle null/undefined/empty input
    if (fileOrName == null) {
        return 'unknown';
    }

    // 2. Handle File object
    if (fileOrName instanceof File) {
        // 2a. Get file name safely
        const fileName = fileOrName.name;

        // 2b. Check if fileName is a valid string before using string methods
        if (fileName && typeof fileName === 'string' && fileName.length > 0) {
            // 2c. Safely check if it contains a period
            if (fileName.includes && typeof fileName.includes === 'function') {
                if (fileName.includes('.')) {
                    const nameExt = fileName.split('.').pop();
                    if (nameExt && typeof nameExt === 'string') {
                        const ext = nameExt.toLowerCase();
                        if (ext.length <= 10) {
                            return ext;
                        }
                    }
                }
            }
        }

        // 2d. Fall back to MIME type if name extraction failed
        const fileType = fileOrName.type;
        if (fileType && typeof fileType === 'string') {
            const mimeExt = {
                [ImageMimeTypes.JPEG]: FileExtensions.JPG,
                [ImageMimeTypes.PNG]: FileExtensions.PNG,
                [ImageMimeTypes.WEBP]: FileExtensions.WEBP,
                [ImageMimeTypes.GIF]: FileExtensions.GIF,
                [ImageMimeTypes.SVG]: FileExtensions.SVG,
                [ImageMimeTypes.BMP]: FileExtensions.BMP,
                [ImageMimeTypes.TIFF]: FileExtensions.TIFF,
                [ImageMimeTypes.AVIF]: FileExtensions.AVIF,
                [ImageMimeTypes.ICO]: FileExtensions.ICO,
                [ImageMimeTypes.MICROSOFT_ICO]: FileExtensions.ICO
            }[fileType.toLowerCase()];

            if (mimeExt) {
                return mimeExt;
            }
        }

        return 'unknown';
    }

    // 3. Handle string input
    if (typeof fileOrName === 'string') {
        const name = fileOrName.trim();

        // 3a. Check if string is empty
        if (name.length === 0) {
            return 'unknown';
        }

        // 3b. Safely check if it contains a period
        if (name.includes && typeof name.includes === 'function') {
            if (name.includes('.')) {
                const ext = name.split('.').pop();
                if (ext && typeof ext === 'string') {
                    const lowerExt = ext.toLowerCase();

                    // Remove any query parameters or fragments
                    const cleanExt = lowerExt.split('?')[0].split('#')[0].split(';')[0];

                    // Validate extension format
                    if (cleanExt && cleanExt.length <= 10 && /^[a-z0-9]+$/.test(cleanExt)) {
                        return cleanExt;
                    }
                }
            }
        }

        return 'unknown';
    }

    // 4. Handle other input types

    // 4a. Handle numbers - convert to string
    if (typeof fileOrName === 'number') {
        return getFileExtension(String(fileOrName));
    }

    // 4b. Handle booleans - convert to string
    if (typeof fileOrName === 'boolean') {
        return getFileExtension(String(fileOrName));
    }

    // 4c. Handle objects with toString method
    if (typeof fileOrName === 'object') {
        try {
            // Check if it has a toString method
            if (fileOrName.toString && typeof fileOrName.toString === 'function') {
                const str = fileOrName.toString();
                // Only use if it's not the default Object toString
                if (str !== '[object Object]') {
                    return getFileExtension(str);
                }
            }
        } catch (e) {
            // Ignore conversion errors
        }
    }

    // 5. Log warning for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.warn('getFileExtension received unexpected input:', {
            type: typeof fileOrName,
            value: fileOrName,
            constructor: fileOrName?.constructor?.name
        });
    }

    return 'unknown';
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
        if (file.type === ImageMimeTypes.ICO || file.type === ImageMimeTypes.MICROSOFT_ICO) {
            // Use a default favicon icon as thumbnail
            resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM4ODJlZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMzg4MmVmIi8+PC9zdmc+');
            return;
        }

        // Special handling for SVG
        if (file.type === ImageMimeTypes.SVG) {
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
            const thumbnail = canvas.toDataURL(ImageMimeTypes.JPEG, 0.7);

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
    const modernFormats = [FileExtensions.WEBP, FileExtensions.AVIF, FileExtensions.SVG];
    const currentFormat = getFileExtension(file);
    if (!modernFormats.includes(currentFormat)) {
        score += 20;
        analysis.recommendations.push(`Consider converting from ${currentFormat} to modern format`);
    }

    // Transparency consideration
    if (transparency && currentFormat === FileExtensions.JPG) {
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
            format: FileExtensions.WEBP,
            maxDisplayWidth: 800,
            compressionMode: 'aggressive',
            stripMetadata: true,
            description: 'Aggressive web optimization'
        },
        'social-media': {
            quality: 90,
            format: FileExtensions.JPG,
            maxDisplayWidth: 1080,
            compressionMode: 'balanced',
            stripMetadata: false, // Keep metadata for social
            description: 'Social media images'
        },
        'ecommerce': {
            quality: 92,
            format: FileExtensions.WEBP,
            maxDisplayWidth: 1200,
            compressionMode: 'balanced',
            stripMetadata: true,
            preserveTransparency: true,
            description: 'E-commerce product images'
        },
        'favicon': {
            quality: 100,
            format: FileExtensions.ICO,
            compressionMode: 'balanced',
            icoSizes: [16, 32, 48, 64],
            description: 'Favicon generation'
        },
        'print-ready': {
            quality: 100,
            format: FileExtensions.PNG,
            compressionMode: 'balanced',
            lossless: true,
            stripMetadata: false,
            description: 'Print-ready images'
        },
        'mobile-optimized': {
            quality: 75,
            format: FileExtensions.WEBP,
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
        case FileExtensions.WEBP:
            estimatedSize *= 0.7;
            reductionFactors.push('WebP format: 30% reduction');
            break;
        case FileExtensions.AVIF:
            estimatedSize *= 0.6;
            reductionFactors.push('AVIF format: 40% reduction');
            break;
        case FileExtensions.JPG:
            estimatedSize *= 0.8;
            reductionFactors.push('JPEG format: 20% reduction');
            break;
        case FileExtensions.PNG:
            estimatedSize *= 0.9;
            reductionFactors.push('PNG format: 10% reduction');
            break;
        case FileExtensions.SVG:
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
                const previewDataURL = canvas.toDataURL(ImageMimeTypes.JPEG, previewQuality);

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
    const modernFormats = [FileExtensions.WEBP, FileExtensions.AVIF, FileExtensions.SVG];
    return !modernFormats.includes(extension);
}

/**
 * Get recommended format for web
 * @param {File} file - Image file
 * @returns {string} Recommended format
 */
export function getRecommendedFormat(file) {
    const extension = getFileExtension(file);

    if (extension === FileExtensions.SVG) return FileExtensions.SVG;
    if (extension === FileExtensions.ICO) return FileExtensions.ICO;

    // Check if image has transparency
    if (file.type === ImageMimeTypes.PNG || file.type === ImageMimeTypes.WEBP) {
        return FileExtensions.WEBP; // WebP supports transparency
    }

    // For large images, recommend AVIF
    if (file.size > 2 * 1024 * 1024) {
        return FileExtensions.AVIF;
    }

    return FileExtensions.WEBP; // Default to WebP for good balance
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
        [FileExtensions.AVIF]: {
            quality: 0.9,
            browserSupport: browserSupport.includes('modern') ? 0.9 : 0.7,
            compression: 0.8,
            supportsTransparency: true,
            maxQuality: 63 // AVIF has different quality scale
        },
        [FileExtensions.WEBP]: {
            quality: 0.8,
            browserSupport: browserSupport.includes('legacy') ? 0.9 : 0.98,
            compression: 0.7,
            supportsTransparency: true,
            maxQuality: 100
        },
        [FileExtensions.JPG]: {
            quality: 0.7,
            browserSupport: 1.0,
            compression: 0.6,
            supportsTransparency: false,
            maxQuality: 100
        },
        [FileExtensions.PNG]: {
            quality: 0.9,
            browserSupport: 1.0,
            compression: 0.5,
            supportsTransparency: true,
            maxQuality: 100
        },
        [FileExtensions.ICO]: {
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
    return obj &&
        typeof obj === 'object' &&
        obj.constructor &&
        obj.constructor.name === 'LemGendImage';
}

/**
 * Get aspect ratio string from dimensions
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Aspect ratio string (e.g., "16:9")
 */
export function getAspectRatioString(width, height) {
    if (!width || !height) return 'unknown';

    const aspectRatio = width / height;

    // Common aspect ratios with tolerance
    const commonRatios = {
        1: AspectRatios.SQUARE,
        1.333: AspectRatios.FOUR_THREE,
        1.5: AspectRatios.THREE_TWO,
        1.618: AspectRatios.SIXTEEN_TEN,
        1.778: AspectRatios.SIXTEEN_NINE,
        2.333: AspectRatios.TWENTYONE_NINE,
        0.75: AspectRatios.THREE_FOUR,
        0.667: AspectRatios.TWO_THREE
    };

    // Find closest common ratio
    let closestRatio = null;
    let minDifference = Infinity;

    for (const [ratio, ratioString] of Object.entries(commonRatios)) {
        const difference = Math.abs(aspectRatio - parseFloat(ratio));
        if (difference < minDifference && difference < 0.05) { // 5% tolerance
            minDifference = difference;
            closestRatio = ratioString;
        }
    }

    return closestRatio || `${Math.round(aspectRatio * 100) / 100}:1`;
}
/**
 * Get image outputs from LemGendImage or similar object
 * @param {Object} image - Image object
 * @returns {Array} Array of output objects
 */
export function getImageOutputs(image) {
    if (!image) return [];

    if (typeof image.getAllOutputs === 'function') {
        return image.getAllOutputs();
    } else if (image.outputs && typeof image.outputs.get === 'function') {
        // Map object
        return Array.from(image.outputs.values());
    } else if (Array.isArray(image.outputs)) {
        return image.outputs;
    } else if (image.file && image.file instanceof File) {
        // Simple file object
        return [{
            file: image.file,
            format: getFileExtension(image.file),
            dimensions: image.width && image.height ?
                { width: image.width, height: image.height } :
                null,
            size: image.file.size,
            metadata: image.metadata || {}
        }];
    }

    return [];
}