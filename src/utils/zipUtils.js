/**
 * ZIP utility functions
 * @module utils/zipUtils
 */

/**
 * Create a ZIP file with organized structure
 * @param {Array<LemGendImage>} processedImages - Array of processed LemGendImage objects
 * @param {Object} options - ZIP creation options
 * @param {boolean} options.includeOriginal - Include original images (default: true)
 * @param {boolean} options.includeOptimized - Include optimized versions (default: true)
 * @param {boolean} options.includeWebImages - Include web-optimized versions (default: true)
 * @param {boolean} options.includeLogoImages - Include logo versions (default: true)
 * @param {boolean} options.includeFaviconImages - Include favicon versions (default: true)
 * @param {boolean} options.includeSocialMedia - Include social media versions (default: true)
 * @param {boolean} options.createFolders - Create organized folder structure (default: true)
 * @param {boolean} options.includeInfoFile - Include INFO.txt with metadata (default: true)
 * @param {string} options.zipName - Custom ZIP filename (default: 'lemgendary-export')
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createLemGendaryZip(processedImages = [], options = {}) {
    // Set default options
    const defaultOptions = {
        includeOriginal: true,
        includeOptimized: true,
        includeWebImages: true,
        includeLogoImages: true,
        includeFaviconImages: true,
        includeSocialMedia: true,
        createFolders: true,
        includeInfoFile: true,
        zipName: 'lemgendary-export',
        skipEmptyFolders: true
    }

    const mergedOptions = { ...defaultOptions, ...options }

    // Dynamically load JSZip to avoid dependency issues
    let JSZip
    try {
        JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
    } catch (error) {
        throw new Error('JSZip library required. Include it via CDN or npm package.')
    }

    const zip = new JSZip()
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0]
    const folderName = `${mergedOptions.zipName}-${timestamp}`

    // Create main folder
    const mainFolder = mergedOptions.createFolders
        ? zip.folder(folderName)
        : zip

    // Define all possible folders with their conditions
    const folderConfigs = [
        {
            name: '00_Originals',
            condition: mergedOptions.includeOriginal,
            files: await getOriginals(processedImages)
        },
        {
            name: '01_Optimized',
            condition: mergedOptions.includeOptimized,
            files: await getOptimizedFiles(processedImages, 'optimized')
        },
        {
            name: '02_Web_Images',
            condition: mergedOptions.includeWebImages,
            files: await getCategorizedFiles(processedImages, 'web')
        },
        {
            name: '03_Logo_Images',
            condition: mergedOptions.includeLogoImages,
            files: await getCategorizedFiles(processedImages, 'logo')
        },
        {
            name: '04_Favicon_Images',
            condition: mergedOptions.includeFaviconImages,
            files: await getCategorizedFiles(processedImages, 'favicon')
        },
        {
            name: '05_Social_Media',
            condition: mergedOptions.includeSocialMedia,
            files: await getCategorizedFiles(processedImages, 'social')
        }
    ]

    // Add files to folders, skipping empty ones if configured
    for (const config of folderConfigs) {
        if (config.condition && config.files.length > 0) {
            const folder = mergedOptions.createFolders
                ? mainFolder.folder(config.name)
                : mainFolder

            for (const fileData of config.files) {
                const fileName = sanitizeFilename(fileData.name)
                folder.file(fileName, fileData.content)
            }
        } else if (config.condition && config.files.length === 0 && mergedOptions.skipEmptyFolders) {
            console.log(`Skipping empty folder: ${config.name}`)
        }
    }

    // Add info file if requested
    if (mergedOptions.includeInfoFile) {
        const infoContent = generateInfoFileContent(processedImages, mergedOptions)
        mainFolder.file('INFO.txt', infoContent)
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 6
        },
        comment: `Created by LemGendary Image Processor - ${now.toISOString()}`,
        platform: 'UNIX'
    })

    return zipBlob
}

/**
 * Get original files from LemGendImages
 * @private
 */
async function getOriginals(images) {
    const files = []

    for (const image of images) {
        if (image.file && image.file instanceof File) {
            files.push({
                name: image.originalName || image.file.name,
                content: image.file
            })
        }
    }

    return files
}

/**
 * Get optimized files from LemGendImages
 * @private
 */
async function getOptimizedFiles(images, category) {
    const files = []

    for (const image of images) {
        // Get outputs from the image
        let outputs = []

        if (typeof image.getAllOutputs === 'function') {
            outputs = image.getAllOutputs()
        } else if (image.outputs && typeof image.outputs.get === 'function') {
            // Handle Map-based outputs
            outputs = Array.from(image.outputs.values())
        } else if (Array.isArray(image.outputs)) {
            outputs = image.outputs
        }

        // Filter for optimized files (no template or custom category)
        const optimizedOutputs = outputs.filter(output => {
            return !output.template || output.template === 'custom' || output.category === category
        })

        for (const output of optimizedOutputs) {
            if (output.file && output.file instanceof File) {
                files.push({
                    name: output.file.name || `optimized-${Date.now()}.${getFileExtension(output.file)}`,
                    content: output.file
                })
            }
        }
    }

    return files
}

/**
 * Get categorized files from LemGendImages
 * @private
 */
async function getCategorizedFiles(images, category) {
    const files = []

    for (const image of images) {
        // Get outputs from the image
        let outputs = []

        if (typeof image.getAllOutputs === 'function') {
            outputs = image.getAllOutputs()
        } else if (image.outputs && typeof image.outputs.get === 'function') {
            // Handle Map-based outputs
            outputs = Array.from(image.outputs.values())
        } else if (Array.isArray(image.outputs)) {
            outputs = image.outputs
        }

        // Filter by category
        const categorizedOutputs = outputs.filter(output => {
            const outputCategory = output.template?.category || output.category || ''
            return outputCategory.toLowerCase() === category.toLowerCase()
        })

        for (const output of categorizedOutputs) {
            if (output.file && output.file instanceof File) {
                files.push({
                    name: output.file.name || `${category}-${Date.now()}.${getFileExtension(output.file)}`,
                    content: output.file
                })
            }
        }
    }

    return files
}

/**
 * Generate info file content
 * @private
 */
function generateInfoFileContent(images, options) {
    const now = new Date()

    // Collect statistics
    const stats = {
        totalImages: images.length,
        originals: 0,
        optimized: 0,
        web: 0,
        logo: 0,
        favicon: 0,
        social: 0,
        formats: {},
        totalSize: 0
    }

    // Calculate statistics
    for (const image of images) {
        if (image.file) {
            stats.originals++
            stats.totalSize += image.file.size || 0
        }

        // Get outputs
        let outputs = []
        if (typeof image.getAllOutputs === 'function') {
            outputs = image.getAllOutputs()
        } else if (image.outputs && Array.isArray(image.outputs)) {
            outputs = image.outputs
        }

        for (const output of outputs) {
            if (output.file) {
                stats.totalSize += output.file.size || 0

                // Count by category
                const category = output.template?.category || output.category || 'optimized'
                switch (category.toLowerCase()) {
                    case 'web': stats.web++; break
                    case 'logo': stats.logo++; break
                    case 'favicon': stats.favicon++; break
                    case 'social': stats.social++; break
                    default: stats.optimized++
                }

                // Count by format
                const format = getFileExtension(output.file)
                stats.formats[format] = (stats.formats[format] || 0) + 1
            }
        }
    }

    // Generate info text
    const infoText = `LEMGENDARY IMAGE EXPORT
===========================

Export Information
------------------
Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
Tool: LemGendary Image Processor
Version: 2.0.0
Export ID: ${Date.now().toString(36).toUpperCase()}

Options Used
------------
${Object.entries(options)
            .filter(([key]) => !['zipName'].includes(key))
            .map(([key, value]) => `${key.padEnd(20)}: ${value}`)
            .join('\n')}

Statistics
----------
Total Images Processed: ${stats.totalImages}
Total Files in Export: ${stats.originals + stats.optimized + stats.web + stats.logo + stats.favicon + stats.social}

File Breakdown:
  Original Images: ${stats.originals}
  Optimized Images: ${stats.optimized}
  Web Images: ${stats.web}
  Logo Images: ${stats.logo}
  Favicon Images: ${stats.favicon}
  Social Media Images: ${stats.social}

Format Distribution:
${Object.entries(stats.formats)
            .map(([format, count]) => `  ${format.toUpperCase().padEnd(6)}: ${count} files`)
            .join('\n')}

Total Size: ${formatBytes(stats.totalSize)}

Image Details
-------------
${images.map((img, index) => {
                const outputs = typeof img.getAllOutputs === 'function' ? img.getAllOutputs() : []
                return `[${index + 1}] ${img.originalName || 'Unnamed'}
  Original: ${formatBytes(img.originalSize || 0)} | ${img.width || '?'}×${img.height || '?'}
  Outputs: ${outputs.length} file(s)
  ${outputs.map(out => `  - ${out.file?.name || 'Unnamed'} (${out.template?.category || 'custom'})`).join('\n  ')}`
            }).join('\n\n')}

Folder Structure
----------------
${options.createFolders ? `
00_Originals/       - Original uploaded images (${stats.originals > 0 ? stats.originals + ' files' : 'Skipped - empty'})
01_Optimized/       - Custom processed images (${stats.optimized > 0 ? stats.optimized + ' files' : 'Skipped - empty'})
02_Web_Images/      - Web template outputs (${stats.web > 0 ? stats.web + ' files' : 'Skipped - empty'})
03_Logo_Images/     - Logo template outputs (${stats.logo > 0 ? stats.logo + ' files' : 'Skipped - empty'})
04_Favicon_Images/  - Favicon template outputs (${stats.favicon > 0 ? stats.favicon + ' files' : 'Skipped - empty'})
05_Social_Media/    - Social media platform outputs (${stats.social > 0 ? stats.social + ' files' : 'Skipped - empty'})`
            : 'All files in root folder'}

Notes
-----
• All processing done client-side in browser
• No images uploaded to external servers
• Created with LemGendary Image Processor
• https://github.com/lemgenda/image-lemgendizer`

    return infoText
}

/**
 * Format bytes to human-readable string
 * @private
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 * @private
 */
function getFileExtension(file) {
    if (!file || !file.name) return 'unknown'

    const parts = file.name.split('.')
    if (parts.length > 1) {
        return parts.pop().toLowerCase()
    }

    // Try to get from MIME type
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/x-icon': 'ico',
        'image/avif': 'avif'
    }

    return mimeMap[file.type] || 'unknown'
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    if (!filename) return 'unnamed-file'

    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')
        .replace(/[^\w.\-]/g, '')
        .substring(0, 255)
        .trim()
}

/**
 * Create simple ZIP from file list
 * @param {Array<File>} files - Files to include in ZIP
 * @param {string} zipName - ZIP filename
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createSimpleZip(files = [], zipName = 'files') {
    // Dynamically load JSZip
    let JSZip
    try {
        JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
    } catch (error) {
        throw new Error('JSZip library required. Include it via CDN or npm package.')
    }

    const zip = new JSZip()

    for (const file of files) {
        if (file && file instanceof File) {
            zip.file(sanitizeFilename(file.name), file)
        }
    }

    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    })
}

/**
 * Extract ZIP file
 * @param {Blob} zipBlob - ZIP file as Blob
 * @returns {Promise<Array>} Array of extracted files
 */
export async function extractZip(zipBlob) {
    if (!(zipBlob instanceof Blob)) {
        throw new Error('Input must be a Blob object')
    }

    // Dynamically load JSZip
    let JSZip
    try {
        JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
    } catch (error) {
        throw new Error('JSZip library required. Include it via CDN or npm package.')
    }

    const zip = await JSZip.loadAsync(zipBlob)
    const files = []

    // Process all files in ZIP
    const filePromises = Object.keys(zip.files).map(async (filename) => {
        const zipEntry = zip.files[filename]

        if (!zipEntry.dir) {
            try {
                const content = await zipEntry.async('blob')
                const mimeType = getMimeTypeFromExtension(filename)

                const file = new File([content], filename, {
                    type: mimeType,
                    lastModified: zipEntry.date ? zipEntry.date.getTime() : Date.now()
                })

                files.push({
                    name: filename,
                    file: file,
                    size: content.size,
                    type: file.type,
                    path: filename.includes('/') ? filename.split('/').slice(0, -1).join('/') : '',
                    lastModified: zipEntry.date
                })
            } catch (error) {
                console.warn(`Failed to extract file ${filename}:`, error)
            }
        }
    })

    await Promise.all(filePromises)
    return files
}

/**
 * Get MIME type from file extension
 * @private
 */
function getMimeTypeFromExtension(filename) {
    const extension = filename.toLowerCase().split('.').pop()

    const mimeTypes = {
        // Images
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

        // Documents
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',

        // Archives
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',

        // Default
        '': 'application/octet-stream'
    }

    return mimeTypes[extension] || 'application/octet-stream'
}

/**
 * Get ZIP file info without extracting
 * @param {Blob} zipBlob - ZIP file as Blob
 * @returns {Promise<Object>} ZIP information
 */
export async function getZipInfo(zipBlob) {
    if (!(zipBlob instanceof Blob)) {
        throw new Error('Input must be a Blob object')
    }

    // Dynamically load JSZip
    let JSZip
    try {
        JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
    } catch (error) {
        throw new Error('JSZip library required. Include it via CDN or npm package.')
    }

    const zip = await JSZip.loadAsync(zipBlob)

    const files = []
    let totalSize = 0
    let fileCount = 0
    let folderCount = 0

    Object.keys(zip.files).forEach(filename => {
        const zipEntry = zip.files[filename]

        if (zipEntry.dir) {
            folderCount++
        } else {
            fileCount++
            const uncompressedSize = zipEntry._data.uncompressedSize || 0
            totalSize += uncompressedSize

            files.push({
                name: filename,
                size: uncompressedSize,
                compressedSize: zipEntry._data.compressedSize || 0,
                compressed: zipEntry._data.compression !== null,
                directory: false,
                lastModified: zipEntry.date,
                ratio: uncompressedSize > 0
                    ? ((uncompressedSize - zipEntry._data.compressedSize) / uncompressedSize * 100).toFixed(1)
                    : 0
            })
        }
    })

    return {
        fileCount,
        folderCount,
        totalSize,
        compressedSize: zipBlob.size,
        compressionRatio: totalSize > 0 ? (zipBlob.size / totalSize) : 0,
        files,
        comment: zip.comment || '',
        format: 'ZIP',
        isEncrypted: zip.password !== null,
        timestamp: new Date().toISOString()
    }
}

/**
 * Create ZIP with progress tracking
 * @param {Array} processedImages - Processed images
 * @param {Object} options - ZIP options
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<Blob>} ZIP file
 */
export async function createZipWithProgress(processedImages, options = {}, onProgress = null) {
    // Dynamically load JSZip
    let JSZip
    try {
        JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
    } catch (error) {
        throw new Error('JSZip library required. Include it via CDN or npm package.')
    }

    const zip = new JSZip()
    const folderName = options.zipName || `export-${Date.now()}`
    const mainFolder = options.createFolders ? zip.folder(folderName) : zip

    // Calculate total files for progress
    const totalFiles = calculateTotalFiles(processedImages, options)
    let filesAdded = 0

    // Add files to ZIP with progress updates
    if (options.includeOriginal) {
        const originals = await getOriginals(processedImages)
        for (const fileData of originals) {
            mainFolder.file(sanitizeFilename(fileData.name), fileData.content)
            filesAdded++

            if (onProgress) {
                onProgress(filesAdded / totalFiles, `Adding ${fileData.name}`)
            }
        }
    }

    // Add other file categories similarly
    const categories = [
        { name: 'optimized', getter: getOptimizedFiles },
        { name: 'web', getter: (images) => getCategorizedFiles(images, 'web') },
        { name: 'logo', getter: (images) => getCategorizedFiles(images, 'logo') },
        { name: 'favicon', getter: (images) => getCategorizedFiles(images, 'favicon') },
        { name: 'social', getter: (images) => getCategorizedFiles(images, 'social') }
    ]

    for (const category of categories) {
        if (options[`include${category.name.charAt(0).toUpperCase() + category.name.slice(1)}`]) {
            const files = await category.getter(processedImages)
            const folder = options.createFolders ? mainFolder.folder(getFolderName(category.name)) : mainFolder

            for (const fileData of files) {
                folder.file(sanitizeFilename(fileData.name), fileData.content)
                filesAdded++

                if (onProgress) {
                    onProgress(filesAdded / totalFiles, `Adding ${category.name}: ${fileData.name}`)
                }
            }
        }
    }

    // Generate ZIP with progress
    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    }, (metadata) => {
        if (onProgress) {
            const fileProgress = filesAdded / totalFiles
            const zipProgress = metadata.percent / 100
            const overallProgress = fileProgress * 0.5 + zipProgress * 0.5
            onProgress(overallProgress, `Compressing (${metadata.percent.toFixed(1)}%)`)
        }
    })
}

/**
 * Calculate total files for progress tracking
 * @private
 */
function calculateTotalFiles(images, options) {
    let count = 0

    // Count originals
    if (options.includeOriginal) {
        count += images.filter(img => img.file).length
    }

    // Count optimized/categorized files
    for (const image of images) {
        let outputs = []
        if (typeof image.getAllOutputs === 'function') {
            outputs = image.getAllOutputs()
        } else if (Array.isArray(image.outputs)) {
            outputs = image.outputs
        }

        for (const output of outputs) {
            const category = output.template?.category || output.category || 'optimized'
            const optionName = `include${category.charAt(0).toUpperCase() + category.slice(1)}`

            if (options[optionName] !== false) {
                count++
            }
        }
    }

    return Math.max(count, 1) // Ensure at least 1 for progress calculation
}

/**
 * Get folder name for category
 * @private
 */
function getFolderName(category) {
    const folderMap = {
        'optimized': '01_Optimized',
        'web': '02_Web_Images',
        'logo': '03_Logo_Images',
        'favicon': '04_Favicon_Images',
        'social': '05_Social_Media'
    }

    return folderMap[category] || category
}

/**
 * Create optimized ZIP structure for custom processing
 * @param {Array} processedResults - Results from processing
 * @param {Object} options - ZIP options
 * @returns {Promise<Blob>} ZIP file
 */
export async function createCustomZip(processedResults, options = {}) {
    const images = processedResults
        .filter(result => result.success && result.image)
        .map(result => result.image)

    const customOptions = {
        ...options,
        includeWebImages: false,
        includeLogoImages: false,
        includeFaviconImages: false,
        includeSocialMedia: false,
        zipName: options.zipName || 'custom-processed'
    }

    return createLemGendaryZip(images, customOptions)
}

/**
 * Create template-based ZIP structure
 * @param {Array} templateResults - Results from template processing
 * @param {Object} options - ZIP options
 * @returns {Promise<Blob>} ZIP file
 */
export async function createTemplateZip(templateResults, options = {}) {
    const images = templateResults
        .filter(result => result.success && result.image)
        .map(result => result.image)

    const templateOptions = {
        ...options,
        zipName: options.zipName || 'template-export'
    }

    return createLemGendaryZip(images, templateOptions)
}

export default {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createCustomZip,
    createTemplateZip
}