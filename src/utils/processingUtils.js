/**
 * Image processing utilities
 * @module utils/processingUtils
 */
// Import core utilities
import { getFileExtension, formatFileSize, isLemGendImage, getImageDimensions, hasTransparency } from './imageUtils.js';
import { validateTask } from './validationUtils.js';

/**
 * Actually resize an image using canvas
 */
export async function actuallyResizeImage(file, targetWidth, targetHeight, algorithm = 'lanczos3') {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'))
                        return
                    }

                    const resizedFile = new File(
                        [blob],
                        file.name,
                        { type: file.type }
                    )

                    URL.revokeObjectURL(img.src)
                    resolve(resizedFile)
                }, file.type, 0.95)
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Resize failed: ${error.message}`))
            }
        }
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing'))
        }
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Actually crop an image using canvas
 */
export async function actuallyCropImage(file, originalWidth, originalHeight, cropWidth, cropHeight, offsetX, offsetY) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = cropWidth
                canvas.height = cropHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.drawImage(
                    img,
                    offsetX, offsetY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                )

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'))
                        return
                    }

                    const croppedFile = new File(
                        [blob],
                        file.name,
                        { type: file.type }
                    )

                    URL.revokeObjectURL(img.src)
                    resolve(croppedFile)
                }, file.type, 0.95)
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Crop failed: ${error.message}`))
            }
        }
        img.onerror = () => {
            reject(new Error('Failed to load image for cropping'))
        }
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Apply optimization to file using canvas
 */
export async function applyOptimization(file, dimensions, options, hasTransparency) {
    const { quality, format, lossless = false } = options

    if (format === 'original') {
        return file
    }

    return new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = dimensions.width
                canvas.height = dimensions.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not supported'))
                    return
                }

                ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

                let mimeType = 'image/jpeg'
                let qualityValue = Math.max(0.1, Math.min(1, quality / 100))

                switch (format.toLowerCase()) {
                    case 'webp':
                        mimeType = 'image/webp'
                        break
                    case 'png':
                        mimeType = 'image/png'
                        qualityValue = undefined
                        break
                    case 'avif':
                        mimeType = 'image/avif'
                        break
                    case 'jpg':
                    case 'jpeg':
                    default:
                        mimeType = 'image/jpeg'
                }

                if (hasTransparency && (format === 'jpg' || format === 'jpeg')) {
                    const tempCanvas = document.createElement('canvas')
                    tempCanvas.width = dimensions.width
                    tempCanvas.height = dimensions.height
                    const tempCtx = tempCanvas.getContext('2d')
                    tempCtx.fillStyle = 'white'
                    tempCtx.fillRect(0, 0, dimensions.width, dimensions.height)
                    tempCtx.drawImage(img, 0, 0)

                    tempCanvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create blob'))
                                return
                            }

                            const optimizedFile = new File(
                                [blob],
                                `${file.name.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()}`,
                                { type: mimeType }
                            )
                            URL.revokeObjectURL(img.src)
                            resolve(optimizedFile)
                        },
                        mimeType,
                        qualityValue
                    )
                } else {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to create blob'))
                                return
                            }

                            const optimizedFile = new File(
                                [blob],
                                `${file.name.replace(/\.[^/.]+$/, '')}.${format.toLowerCase()}`,
                                { type: mimeType }
                            )
                            URL.revokeObjectURL(img.src)
                            resolve(optimizedFile)
                        },
                        mimeType,
                        qualityValue
                    )
                }
            } catch (error) {
                URL.revokeObjectURL(img.src)
                reject(new Error(`Optimization failed: ${error.message}`))
            }
        }

        img.onerror = () => {
            reject(new Error('Failed to load image for optimization'))
        }

        img.src = URL.createObjectURL(file)
    })
}

/**
 * Process single file through task pipeline
 */
export async function processSingleFile(file, task, index) {
    console.log('processSingleFile called with:', {
        fileType: file?.constructor?.name,
        isLemGendImage: isLemGendImage(file),
        hasFileProperty: !!(file?.file),
        filePropertyType: file?.file?.constructor?.name
    })

    // Import processor modules - keep dynamic for flexibility
    const { LemGendImage } = await import('../LemGendImage.js');
    const { LemGendaryResize } = await import('../processors/LemGendaryResize.js');
    const { LemGendaryCrop } = await import('../processors/LemGendaryCrop.js');
    const { LemGendaryOptimize } = await import('../processors/LemGendaryOptimize.js');
    const { LemGendaryRename } = await import('../processors/LemGendaryRename.js');

    let lemGendImage

    try {
        if (isLemGendImage(file)) {
            lemGendImage = file

            console.log('Using existing LemGendImage:', {
                hasFile: !!lemGendImage.file,
                fileType: lemGendImage.file?.constructor?.name,
                width: lemGendImage.width,
                height: lemGendImage.height,
                originalName: lemGendImage.originalName
            })

            if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
                console.warn('LemGendImage missing valid file property, attempting to reconstruct...')
                if (lemGendImage.originalName && lemGendImage.originalSize) {
                    const placeholderBlob = new Blob([''], {
                        type: lemGendImage.metadata?.type || 'image/jpeg'
                    })
                    const reconstructedFile = new File(
                        [placeholderBlob],
                        lemGendImage.originalName,
                        {
                            type: lemGendImage.metadata?.type || 'image/jpeg',
                            lastModified: Date.now()
                        }
                    )
                    lemGendImage.file = reconstructedFile
                } else {
                    throw new Error('LemGendImage has no valid file property and cannot be reconstructed')
                }
            }

            if (!lemGendImage.width || !lemGendImage.height) {
                try {
                    console.log('LemGendImage missing dimensions, loading...')
                    await lemGendImage.load()
                } catch (loadError) {
                    console.warn('Failed to load existing LemGendImage:', loadError)
                    lemGendImage.width = lemGendImage.width || 1000
                    lemGendImage.height = lemGendImage.height || 1000
                }
            }

        } else if (file && file.file && file.file instanceof File) {
            console.log('Creating new LemGendImage from file object...')
            lemGendImage = new LemGendImage(file.file)
            try {
                await lemGendImage.load()
            } catch (loadError) {
                console.warn('Failed to load image, using defaults:', loadError)
                lemGendImage.width = lemGendImage.width || 1000
                lemGendImage.height = lemGendImage.height || 1000
            }

        } else if (file instanceof File || file instanceof Blob) {
            console.log('Creating new LemGendImage from File/Blob...')
            lemGendImage = new LemGendImage(file)
            try {
                await lemGendImage.load()
            } catch (loadError) {
                console.warn('Failed to load image, using defaults:', loadError)
                lemGendImage.width = lemGendImage.width || 1000
                lemGendImage.height = lemGendImage.height || 1000
            }

        } else {
            throw new Error(`Invalid file type provided for processing. Got: ${typeof file}, constructor: ${file?.constructor?.name}`)
        }

        if (!lemGendImage || !isLemGendImage(lemGendImage)) {
            throw new Error('Failed to create valid LemGendImage instance')
        }

        if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
            console.warn('LemGendImage missing file property, creating placeholder...')
            const placeholderBlob = new Blob([''], { type: 'image/jpeg' })
            lemGendImage.file = new File([placeholderBlob], lemGendImage.originalName || 'image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            })
        }

        if (!lemGendImage.width || !lemGendImage.height) {
            console.warn('LemGendImage missing dimensions, setting defaults...')
            lemGendImage.width = lemGendImage.width || 1000
            lemGendImage.height = lemGendImage.height || 1000
        }

        console.log('Validating task with LemGendImage...', {
            originalName: lemGendImage.originalName,
            width: lemGendImage.width,
            height: lemGendImage.height,
            hasFile: !!lemGendImage.file,
            fileType: lemGendImage.file?.constructor?.name
        })

        try {
            const validation = await validateTask(task, lemGendImage)

            if (!validation.isValid) {
                const errorMessage = validation.errors.map(e => e.message).join(', ')
                console.warn('Task validation warnings:', errorMessage)
            }
        } catch (validationError) {
            console.warn('Task validation threw an error, continuing anyway:', validationError)
        }

        console.log('Task validation passed (or warnings ignored), proceeding with processing...')

        const enabledSteps = task.getEnabledSteps()
        let currentFile = lemGendImage.file
        let currentDimensions = {
            width: lemGendImage.width,
            height: lemGendImage.height
        }

        const processingOrder = ['resize', 'crop', 'optimize', 'rename']
        const sortedSteps = enabledSteps.sort((a, b) => {
            const indexA = processingOrder.indexOf(a.processor)
            const indexB = processingOrder.indexOf(b.processor)
            return indexA - indexB
        })

        console.log('Processing steps in order:', sortedSteps.map(s => `${s.order}.${s.processor}`))
        console.log('Starting image dimensions:', currentDimensions)

        for (const step of sortedSteps) {
            try {
                console.log(`\n=== Processing step ${step.order}: ${step.processor} ===`)

                switch (step.processor) {
                    case 'resize':
                        const resizeProcessor = new LemGendaryResize(step.options)
                        const resizeResult = await resizeProcessor.process(lemGendImage)

                        console.log('Resize result:', {
                            original: `${resizeResult.originalDimensions.width}x${resizeResult.originalDimensions.height}`,
                            target: `${resizeResult.newDimensions.width}x${resizeResult.newDimensions.height}`,
                            mode: step.options.mode,
                            dimension: step.options.dimension
                        })

                        currentFile = await actuallyResizeImage(
                            currentFile,
                            resizeResult.newDimensions.width,
                            resizeResult.newDimensions.height,
                            step.options.algorithm || 'lanczos3'
                        )

                        currentDimensions = resizeResult.newDimensions
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height)
                        lemGendImage.addOperation('resize', resizeResult)

                        console.log(`✓ Resized to: ${currentDimensions.width}x${currentDimensions.height}`)
                        console.log('File after resize:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type
                        })
                        break

                    case 'crop':
                        const cropProcessor = new LemGendaryCrop(step.options)
                        const cropResult = await cropProcessor.process(lemGendImage, currentDimensions)

                        console.log('Crop result:', {
                            current: `${currentDimensions.width}x${currentDimensions.height}`,
                            target: `${cropResult.finalDimensions.width}x${cropResult.finalDimensions.height}`,
                            mode: step.options.mode,
                            smartCrop: cropResult.smartCrop
                        })

                        if (cropResult.smartCrop) {
                            console.log('Smart crop detected with steps:', {
                                detection: cropResult.steps.detection.confidence,
                                resize: cropResult.steps.resize,
                                crop: cropResult.cropOffsets
                            })
                        }

                        currentFile = await actuallyCropImage(
                            currentFile,
                            currentDimensions.width,
                            currentDimensions.height,
                            cropResult.cropOffsets.width,
                            cropResult.cropOffsets.height,
                            cropResult.cropOffsets.x,
                            cropResult.cropOffsets.y
                        )

                        currentDimensions = cropResult.finalDimensions
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height)
                        lemGendImage.addOperation('crop', cropResult)

                        console.log(`✓ Cropped to: ${currentDimensions.width}x${currentDimensions.height}`)
                        console.log('File after crop:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type
                        })
                        break

                    case 'optimize':
                        const optimizeProcessor = new LemGendaryOptimize(step.options)
                        const optimizeResult = await optimizeProcessor.process(lemGendImage)

                        console.log('Optimize result:', {
                            format: step.options.format,
                            quality: step.options.quality,
                            originalFormat: optimizeResult.originalInfo.format,
                            transparency: optimizeResult.originalInfo.transparency,
                            savings: optimizeResult.savings
                        })

                        // Get the optimize method - check for both possible method names
                        const optimizeMethod = optimizeProcessor.applyOptimization || optimizeProcessor.optimize;
                        if (!optimizeMethod) {
                            throw new Error('Optimize processor missing applyOptimization or optimize method');
                        }

                        currentFile = await optimizeMethod.call(optimizeProcessor, lemGendImage)

                        lemGendImage.addOperation('optimize', optimizeResult)
                        console.log(`✓ Optimized to: ${optimizeResult.optimization.selectedFormat} at ${optimizeResult.optimization.compression.quality}%`)
                        console.log('File after optimize:', {
                            name: currentFile.name,
                            size: currentFile.size,
                            type: currentFile.type,
                            savings: `${optimizeResult.savings.savingsPercent}%`
                        })
                        break

                    case 'rename':
                        const renameProcessor = new LemGendaryRename(step.options)
                        const renameResult = await renameProcessor.process(lemGendImage, index, task.steps.length)

                        const extension = getFileExtension(currentFile)

                        const renamedFile = new File(
                            [currentFile],
                            `${renameResult.newName}.${extension}`,
                            { type: currentFile.type }
                        )

                        currentFile = renamedFile
                        lemGendImage.addOperation('rename', renameResult)
                        console.log(`✓ Renamed to: ${renameResult.newName}.${extension}`)
                        break

                    default:
                        console.warn(`Unknown processor: ${step.processor}`)
                }
            } catch (error) {
                console.error(`Error in step ${step.order} (${step.processor}):`, error)
                throw new Error(`Step ${step.order} (${step.processor}) failed: ${error.message}`)
            }
        }

        const outputFormat = getFileExtension(currentFile)
        lemGendImage.addOutput(
            outputFormat,
            currentFile,
            null
        )

        console.log('\n=== Processing Complete ===')
        console.log('Final result:', {
            originalName: lemGendImage.originalName,
            finalName: currentFile.name,
            originalSize: lemGendImage.originalSize,
            finalSize: currentFile.size,
            dimensions: `${currentDimensions.width}x${currentDimensions.height}`,
            format: outputFormat,
            sizeReduction: `${((lemGendImage.originalSize - currentFile.size) / lemGendImage.originalSize * 100).toFixed(1)}%`
        })

        return {
            image: lemGendImage,
            file: currentFile,
            success: true,
            metadata: lemGendImage.getInfo()
        }

    } catch (error) {
        console.error('Error in processSingleFile:', error)
        return {
            image: lemGendImage || file,
            file: lemGendImage?.file || file,
            error: error.message,
            success: false
        }
    }
}

// Default export
export default {
    actuallyResizeImage,
    actuallyCropImage,
    applyOptimization,
    processSingleFile
}