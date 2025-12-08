/**
 * Image processing utilities
 * @module utils/processingUtils
 */

// Import core utilities
import {
    getFileExtension,
    formatFileSize,
    isLemGendImage,
    resizeImage,
    cropImage,
    getImageOutputs
} from './imageUtils.js';

// Cache for dynamically loaded modules
let cachedModules = null;

/**
 * Load required modules dynamically
 */
async function loadModules() {
    if (cachedModules) return cachedModules;

    try {
        const [
            LemGendImageModule,
            LemGendTaskModule,
            LemGendaryResizeModule,
            LemGendaryCropModule,
            LemGendaryOptimizeModule,
            LemGendaryRenameModule
        ] = await Promise.all([
            import('../LemGendImage.js'),
            import('../tasks/LemGendTask.js'),
            import('../processors/LemGendaryResize.js'),
            import('../processors/LemGendaryCrop.js'),
            import('../processors/LemGendaryOptimize.js'),
            import('../processors/LemGendaryRename.js')
        ]);

        cachedModules = {
            LemGendImage: LemGendImageModule.LemGendImage,
            LemGendTask: LemGendTaskModule.LemGendTask,
            LemGendaryResize: LemGendaryResizeModule.LemGendaryResize,
            LemGendaryCrop: LemGendaryCropModule.LemGendaryCrop,
            LemGendaryOptimize: LemGendaryOptimizeModule.LemGendaryOptimize,
            LemGendaryRename: LemGendaryRenameModule.LemGendaryRename
        };

        return cachedModules;
    } catch (error) {
        console.error('Failed to load processing modules:', error);
        throw new Error(`Failed to load processing modules: ${error.message}`);
    }
}

/**
 * Apply optimization to file
 */
export async function applyOptimization(file, dimensions, options, hasTransparency) {
    const { quality, format } = options;

    if (format === 'original') {
        return file;
    }

    // Use resizeImage with current dimensions for optimization
    const outputFormat = format.toLowerCase();
    const qualityValue = Math.max(0.1, Math.min(1, quality / 100));

    return await resizeImage(
        file,
        dimensions.width,
        dimensions.height,
        outputFormat,
        qualityValue
    );
}

/**
 * Process single file through task pipeline
 */
export async function processSingleFile(file, task, index) {
    console.log('processSingleFile called with:', {
        fileType: file?.constructor?.name,
        isLemGendImage: isLemGendImage(file)
    });

    let lemGendImage;

    try {
        // Load all required modules
        const modules = await loadModules();
        const {
            LemGendImage,
            LemGendaryResize,
            LemGendaryCrop,
            LemGendaryOptimize,
            LemGendaryRename
        } = modules;

        // Create or validate LemGendImage instance
        if (isLemGendImage(file)) {
            lemGendImage = file;
            console.log('Using existing LemGendImage:', {
                originalName: lemGendImage.originalName,
                width: lemGendImage.width,
                height: lemGendImage.height
            });
        } else if (file instanceof File || file instanceof Blob) {
            console.log('Creating new LemGendImage from File/Blob...');
            lemGendImage = new LemGendImage(file);
            try {
                await lemGendImage.load();
            } catch (loadError) {
                console.warn('Failed to load image, using defaults:', loadError);
                lemGendImage.width = lemGendImage.width || 1000;
                lemGendImage.height = lemGendImage.height || 1000;
            }
        } else {
            throw new Error(`Invalid file type provided. Got: ${typeof file}, constructor: ${file?.constructor?.name}`);
        }

        // Validate the instance
        if (!lemGendImage || !isLemGendImage(lemGendImage)) {
            throw new Error('Failed to create valid LemGendImage instance');
        }

        // Ensure file property exists
        if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
            console.warn('LemGendImage missing file property, creating placeholder...');
            const placeholderBlob = new Blob([''], { type: 'image/jpeg' });
            lemGendImage.file = new File(
                [placeholderBlob],
                lemGendImage.originalName || 'image.jpg',
                { type: 'image/jpeg', lastModified: Date.now() }
            );
        }

        // Ensure dimensions exist
        if (!lemGendImage.width || !lemGendImage.height) {
            console.warn('LemGendImage missing dimensions, setting defaults...');
            lemGendImage.width = lemGendImage.width || 1000;
            lemGendImage.height = lemGendImage.height || 1000;
        }

        console.log('Validating task with LemGendImage...', {
            originalName: lemGendImage.originalName,
            width: lemGendImage.width,
            height: lemGendImage.height
        });

        const enabledSteps = task.getEnabledSteps();
        let currentFile = lemGendImage.file;
        let currentDimensions = {
            width: lemGendImage.width,
            height: lemGendImage.height
        };

        const processingOrder = ['resize', 'crop', 'optimize', 'rename'];
        const sortedSteps = enabledSteps.sort((a, b) => {
            const indexA = processingOrder.indexOf(a.processor);
            const indexB = processingOrder.indexOf(b.processor);
            return indexA - indexB;
        });

        console.log('Processing steps in order:', sortedSteps.map(s => `${s.order}.${s.processor}`));
        console.log('Starting image dimensions:', currentDimensions);

        for (const step of sortedSteps) {
            try {
                console.log(`\n=== Processing step ${step.order}: ${step.processor} ===`);

                switch (step.processor) {
                    case 'resize':
                        const resizeProcessor = new LemGendaryResize(step.options);
                        const resizeResult = await resizeProcessor.process(lemGendImage);

                        console.log('Resize result:', {
                            original: `${resizeResult.originalDimensions.width}x${resizeResult.originalDimensions.height}`,
                            target: `${resizeResult.newDimensions.width}x${resizeResult.newDimensions.height}`,
                            mode: step.options.mode,
                            dimension: step.options.dimension
                        });

                        currentFile = await resizeImage(
                            currentFile,
                            resizeResult.newDimensions.width,
                            resizeResult.newDimensions.height,
                            'webp',
                            step.options.quality || 0.95
                        );

                        currentDimensions = resizeResult.newDimensions;
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
                        lemGendImage.addOperation('resize', resizeResult);

                        console.log(`✓ Resized to: ${currentDimensions.width}x${currentDimensions.height}`);
                        break;

                    case 'crop':
                        const cropProcessor = new LemGendaryCrop(step.options);
                        const cropResult = await cropProcessor.process(lemGendImage, currentDimensions);

                        console.log('Crop result:', {
                            current: `${currentDimensions.width}x${currentDimensions.height}`,
                            target: `${cropResult.finalDimensions.width}x${cropResult.finalDimensions.height}`,
                            mode: step.options.mode,
                            smartCrop: cropResult.smartCrop
                        });

                        currentFile = await cropImage(
                            currentFile,
                            cropResult.cropOffsets.x,
                            cropResult.cropOffsets.y,
                            cropResult.cropOffsets.width,
                            cropResult.cropOffsets.height,
                            'webp',
                            step.options.quality || 0.95
                        );

                        currentDimensions = cropResult.finalDimensions;
                        lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
                        lemGendImage.addOperation('crop', cropResult);

                        console.log(`✓ Cropped to: ${currentDimensions.width}x${currentDimensions.height}`);
                        break;

                    case 'optimize':
                        const optimizeProcessor = new LemGendaryOptimize(step.options);
                        const optimizeResult = await optimizeProcessor.process(lemGendImage);

                        console.log('Optimize result:', {
                            format: step.options.format,
                            quality: step.options.quality,
                            originalFormat: optimizeResult.originalInfo.format,
                            transparency: optimizeResult.originalInfo.transparency,
                            savings: optimizeResult.savings
                        });

                        const optimizedFile = await resizeImage(
                            currentFile,
                            currentDimensions.width,
                            currentDimensions.height,
                            step.options.format || 'webp',
                            (step.options.quality || 85) / 100
                        );

                        currentFile = optimizedFile;
                        lemGendImage.addOperation('optimize', optimizeResult);
                        console.log(`✓ Optimized to: ${step.options.format} at ${step.options.quality}%`);
                        break;

                    case 'rename':
                        const renameProcessor = new LemGendaryRename(step.options);
                        const renameResult = await renameProcessor.process(lemGendImage, index, task.steps.length);

                        const extension = getFileExtension(currentFile);
                        const renamedFile = new File(
                            [currentFile],
                            `${renameResult.newName}.${extension}`,
                            { type: currentFile.type }
                        );

                        currentFile = renamedFile;
                        lemGendImage.addOperation('rename', renameResult);
                        console.log(`✓ Renamed to: ${renameResult.newName}.${extension}`);
                        break;

                    default:
                        console.warn(`Unknown processor: ${step.processor}`);
                }
            } catch (error) {
                console.error(`Error in step ${step.order} (${step.processor}):`, error);
                throw new Error(`Step ${step.order} (${step.processor}) failed: ${error.message}`);
            }
        }

        const outputFormat = getFileExtension(currentFile);
        lemGendImage.addOutput(outputFormat, currentFile, null);

        console.log('\n=== Processing Complete ===');
        console.log('Final result:', {
            originalName: lemGendImage.originalName,
            finalName: currentFile.name,
            originalSize: lemGendImage.originalSize,
            finalSize: currentFile.size,
            dimensions: `${currentDimensions.width}x${currentDimensions.height}`,
            format: outputFormat,
            sizeReduction: `${((lemGendImage.originalSize - currentFile.size) / lemGendImage.originalSize * 100).toFixed(1)}%`
        });

        return {
            image: lemGendImage,
            file: currentFile,
            success: true,
            metadata: lemGendImage.getInfo()
        };

    } catch (error) {
        console.error('Error in processSingleFile:', error);
        return {
            image: lemGendImage || file,
            file: lemGendImage?.file || file,
            error: error.message,
            success: false
        };
    }
}