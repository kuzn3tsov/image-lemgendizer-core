/**
 * ZIP utility functions
 * @module utils/zipUtils
 */

// Import from centralized utils
import { formatFileSize, getFileExtension, getMimeTypeFromExtension } from './imageUtils.js';
import { sanitizeFilename } from './stringUtils.js';

/**
 * Create a ZIP file with organized structure
 */
export async function createLemGendaryZip(processedImages = [], options = {}) {
    const defaultOptions = {
        mode: 'custom',
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

    let JSZip
    try {
        JSZip = (await import('jszip')).default
    } catch (error) {
        try {
            JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
        } catch (cdnError) {
            throw new Error('JSZip library required. Include it via CDN or npm package.')
        }
    }

    const zip = new JSZip()
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0]
    const folderName = `${mergedOptions.zipName}-${timestamp}`

    const mainFolder = mergedOptions.createFolders
        ? zip.folder(folderName)
        : zip

    const stats = {
        totalImages: processedImages.length,
        originals: 0,
        optimized: 0,
        web: 0,
        logo: 0,
        favicon: 0,
        social: 0,
        formats: {},
        totalSize: 0
    }

    const addFilesToFolder = async (folder, files, category = '') => {
        for (const fileData of files) {
            if (fileData.content) {
                const fileName = sanitizeFilename(fileData.name)
                folder.file(fileName, fileData.content)

                if (category) {
                    stats[category] = (stats[category] || 0) + 1
                }

                const ext = getFileExtension(fileData.content)
                stats.formats[ext] = (stats.formats[ext] || 0) + 1

                if (fileData.content.size) {
                    stats.totalSize += fileData.content.size
                }
            }
        }
    }

    const filesByCategory = await categorizeFiles(processedImages, mergedOptions)
    const folderStructure = getFolderStructure(mergedOptions.mode)

    for (const [category, files] of Object.entries(filesByCategory)) {
        if (files.length === 0 && mergedOptions.skipEmptyFolders) {
            console.log(`Skipping empty folder: ${category}`)
            continue
        }

        if (folderStructure[category]) {
            const folderName = folderStructure[category]
            const folder = mergedOptions.createFolders
                ? mainFolder.folder(folderName)
                : mainFolder

            await addFilesToFolder(folder, files, getStatsCategory(category))
        }
    }

    if (mergedOptions.includeInfoFile) {
        const infoContent = generateInfoFileContent(processedImages, stats, mergedOptions)
        mainFolder.file('INFO.txt', infoContent)
    }

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
 * Create simple ZIP from file list
 */
export async function createSimpleZip(files = [], zipName = 'files') {
    let JSZip
    try {
        JSZip = (await import('jszip')).default
    } catch (error) {
        try {
            JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
        } catch (cdnError) {
            throw new Error('JSZip library required. Include it via CDN or npm package.')
        }
    }

    const zip = new JSZip()

    for (const file of files) {
        if (file && file instanceof File) {
            const sanitizedName = sanitizeFilename(file.name)
            zip.file(sanitizedName, file)
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
 */
export async function extractZip(zipBlob) {
    if (!(zipBlob instanceof Blob)) {
        throw new Error('Input must be a Blob object')
    }

    let JSZip
    try {
        JSZip = (await import('jszip')).default
    } catch (error) {
        try {
            JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
        } catch (cdnError) {
            throw new Error('JSZip library required. Include it via CDN or npm package.')
        }
    }

    const zip = await JSZip.loadAsync(zipBlob)
    const files = []

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
 * Get ZIP file info without extracting
 */
export async function getZipInfo(zipBlob) {
    if (!(zipBlob instanceof Blob)) {
        throw new Error('Input must be a Blob object')
    }

    let JSZip
    try {
        JSZip = (await import('jszip')).default
    } catch (error) {
        try {
            JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
        } catch (cdnError) {
            throw new Error('JSZip library required. Include it via CDN or npm package.')
        }
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
 */
export async function createZipWithProgress(processedImages, options = {}, onProgress = null) {
    let JSZip
    try {
        JSZip = (await import('jszip')).default
    } catch (error) {
        try {
            JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default
        } catch (cdnError) {
            throw new Error('JSZip library required. Include it via CDN or npm package.')
        }
    }

    const zip = new JSZip()
    const folderName = options.zipName || `export-${Date.now()}`
    const mainFolder = options.createFolders ? zip.folder(folderName) : zip

    const totalFiles = calculateTotalFiles(processedImages, options)
    let filesAdded = 0

    if (options.includeOriginal) {
        const originals = getOriginals(processedImages)
        for (const fileData of originals) {
            const sanitizedName = sanitizeFilename(fileData.name)
            mainFolder.file(sanitizedName, fileData.content)
            filesAdded++

            if (onProgress) {
                onProgress(filesAdded / totalFiles, `Adding ${fileData.name}`)
            }
        }
    }

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
 * Create optimized ZIP with advanced optimization
 */
export async function createOptimizedZip(images, options = {}) {
    const {
        optimization = {},
        zipOptions = {},
        includeReport = true
    } = options

    const { LemGendaryOptimize } = await import('../processors/LemGendaryOptimize.js')
    const optimizer = new LemGendaryOptimize(optimization)

    const { LemGendImage } = await import('../LemGendImage.js')
    const lemGendImages = await Promise.all(
        images.map(async (img) => {
            if (img instanceof LemGendImage) {
                return img
            } else {
                const lemGendImg = new LemGendImage(img)
                await lemGendImg.load()
                return lemGendImg
            }
        })
    )

    console.log(`Optimizing ${lemGendImages.length} images...`)
    const optimizationResults = await optimizer.prepareForZip(lemGendImages)

    const successful = optimizationResults.filter(r => r.success)
    const failed = optimizationResults.filter(r => !r.success)

    console.log(`Optimization complete: ${successful.length} successful, ${failed.length} failed`)

    if (successful.length === 0) {
        throw new Error('No images could be optimized')
    }

    const optimizedImages = successful.map(result => {
        const optimizedImage = new LemGendImage(result.optimized)
        optimizedImage.originalName = result.original.originalName
        return optimizedImage
    })

    if (includeReport) {
        const report = optimizer.generateOptimizationReport(optimizationResults)
        const reportFile = new File(
            [JSON.stringify(report, null, 2)],
            'optimization-report.json',
            { type: 'application/json' }
        )
        const reportImage = new LemGendImage(reportFile)
        reportImage.originalName = 'optimization-report.json'
        optimizedImages.push(reportImage)
    }

    console.log('Creating ZIP from optimized images...')
    const zipBlob = await createLemGendaryZip(optimizedImages, {
        zipName: 'optimized-images.zip',
        ...zipOptions
    })

    return zipBlob
}

/**
 * Create ZIP from processed images (legacy function)
 */
export async function lemGendBuildZip(processedResults, options = {}) {
    console.warn('lemGendBuildZip is deprecated. Use createBatchZip or createTemplateZip instead.')

    const images = processedResults
        .filter(result => result.success && result.image)
        .map(result => result.image)

    const hasTemplates = images.some(img => {
        const outputs = getImageOutputs(img)
        return outputs.some(out => out.template)
    })

    if (hasTemplates) {
        return createTemplateZip(processedResults, options)
    } else {
        return createBatchZip(processedResults, options)
    }
}

/**
 * Create optimized ZIP structure for custom processing
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

/**
 * Create ZIP from processed batch results
 */
export async function createBatchZip(processedResults, options = {}) {
    const images = processedResults
        .filter(result => result.success && result.image)
        .map(result => result.image)

    const zipOptions = {
        mode: 'custom',
        zipName: options.zipName || 'custom-processed',
        ...options
    }

    return createLemGendaryZip(images, zipOptions)
}

// ===== PRIVATE HELPER FUNCTIONS =====

/**
 * Categorize files based on processing mode
 */
async function categorizeFiles(images, options) {
    const categories = {
        originals: [],
        optimized: [],
        web: [],
        logo: [],
        favicon: [],
        social: []
    }

    for (const image of images) {
        if (options.includeOriginal && image.file && image.file instanceof File) {
            categories.originals.push({
                name: image.originalName || image.file.name,
                content: image.file
            })
        }

        const outputs = getImageOutputs(image)

        for (const output of outputs) {
            if (!output.file || !(output.file instanceof File)) continue

            const category = determineCategory(output, options.mode)

            if (categories[category] && shouldIncludeCategory(category, options)) {
                categories[category].push({
                    name: output.file.name || `output-${Date.now()}.${getFileExtension(output.file)}`,
                    content: output.file,
                    metadata: output.metadata || {}
                })
            }
        }
    }

    return categories
}

/**
 * Get image outputs
 */
function getImageOutputs(image) {
    if (typeof image.getAllOutputs === 'function') {
        return image.getAllOutputs()
    } else if (image.outputs && typeof image.outputs.get === 'function') {
        return Array.from(image.outputs.values())
    } else if (Array.isArray(image.outputs)) {
        return image.outputs
    }
    return []
}

/**
 * Determine category for output
 */
function determineCategory(output, mode) {
    if (mode === 'custom') {
        return 'optimized'
    }

    const templateCategory = output.template?.category?.toLowerCase() ||
        output.category?.toLowerCase() ||
        ''

    switch (templateCategory) {
        case 'web':
        case 'favicon':
            return templateCategory
        case 'logo':
            return 'logo'
        case 'social':
        case 'social media':
            return 'social'
        default:
            return 'optimized'
    }
}

/**
 * Check if category should be included
 */
function shouldIncludeCategory(category, options) {
    const categoryMap = {
        originals: options.includeOriginal,
        optimized: options.includeOptimized,
        web: options.includeWebImages,
        logo: options.includeLogoImages,
        favicon: options.includeFaviconImages,
        social: options.includeSocialMedia
    }

    return categoryMap[category] !== false
}

/**
 * Get folder structure based on mode
 */
function getFolderStructure(mode) {
    if (mode === 'custom') {
        return {
            originals: '01_OriginalImages',
            optimized: '02_OptimizedImages'
        }
    } else {
        return {
            originals: '01_OriginalImages',
            web: '02_WebImages',
            logo: '03_LogoImages',
            favicon: '04_FaviconImages',
            social: '05_SocialImages',
            optimized: '06_OptimizedImages'
        }
    }
}

/**
 * Get statistics category name
 */
function getStatsCategory(folderCategory) {
    const map = {
        'originals': 'originals',
        'optimized': 'optimized',
        'web': 'web',
        'logo': 'logo',
        'favicon': 'favicon',
        'social': 'social'
    }
    return map[folderCategory] || 'optimized'
}

/**
 * Generate info file content
 */
function generateInfoFileContent(images, stats, options) {
    const now = new Date()

    let infoText = `LEMGENDARY IMAGE EXPORT
===========================

Export Information
------------------
Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
Mode: ${options.mode === 'custom' ? 'Custom Processing' : 'Template Processing'}
Tool: LemGendary Image Processor
Version: 2.2.0
Export ID: ${Date.now().toString(36).toUpperCase()}

Options Used
------------
${Object.entries(options)
            .filter(([key]) => !['zipName'].includes(key))
            .map(([key, value]) => `${key.padEnd(25)}: ${value}`)
            .join('\n')}

Statistics
----------
Total Images Processed: ${stats.totalImages}
Total Files in Export: ${Object.values(stats).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) - stats.totalImages}

File Breakdown:`

    const categories = ['originals', 'optimized', 'web', 'logo', 'favicon', 'social']
    categories.forEach(category => {
        if (stats[category] > 0) {
            const folderName = getFolderStructure(options.mode)[category] || category
            infoText += `\n  ${folderName.padEnd(25)}: ${stats[category]} files`
        }
    })

    infoText += `

Format Distribution:
${Object.entries(stats.formats)
            .map(([format, count]) => `  ${format.toUpperCase().padEnd(6)}: ${count} files`)
            .join('\n')}

Total Size: ${formatFileSize(stats.totalSize)}

Image Details
-------------
${images.map((img, index) => {
                const outputs = getImageOutputs(img)
                return `[${index + 1}] ${img.originalName || 'Unnamed'}
  Original: ${formatFileSize(img.originalSize || 0)} | ${img.width || '?'}×${img.height || '?'}
  Outputs: ${outputs.length} file(s)
  ${outputs.map(out => `  - ${out.file?.name || 'Unnamed'} (${out.template?.category || 'custom'})`).join('\n  ')}`
            }).join('\n\n')}

Folder Structure
----------------
${options.createFolders ?
            Object.entries(getFolderStructure(options.mode))
                .map(([category, folderName]) => {
                    const count = stats[category] || 0
                    return `${folderName}/ - ${count > 0 ? `${count} files` : 'Empty (skipped)'}`
                })
                .join('\n') :
            'All files in root folder'}

Notes
-----
• All processing done client-side in browser
• No images uploaded to external servers
• Empty folders are automatically skipped
• Created with LemGendary Image Processor
• https://github.com/lemgenda/image-lemgendizer`

    return infoText
}

/**
 * Calculate total files for progress tracking
 */
function calculateTotalFiles(images, options) {
    let count = 0

    if (options.includeOriginal) {
        count += images.filter(img => img.file).length
    }

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

    return Math.max(count, 1)
}

/**
 * Get originals files from LemGendImages
 */
function getOriginals(images) {
    const files = []

    for (const image of images) {
        if (image.file && image.file instanceof File) {
            const sanitizedName = sanitizeFilename(image.originalName || image.file.name)
            files.push({
                name: sanitizedName,
                content: image.file
            })
        }
    }

    return files
}

// Default export
export default {
    createLemGendaryZip,
    createSimpleZip,
    extractZip,
    getZipInfo,
    createZipWithProgress,
    createOptimizedZip,
    lemGendBuildZip,
    createCustomZip,
    createTemplateZip,
    createBatchZip
}