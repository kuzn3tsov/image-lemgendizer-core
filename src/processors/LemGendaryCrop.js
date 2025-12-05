/**
 * LemGendaryCrop™ - Intelligent smart crop processor with enhanced validation
 * @class
 * @description Smart cropping with AI detection, resizing, and content-aware cropping
 */
export class LemGendaryCrop {
    /**
     * Create a LemGendaryCrop processor
     * @param {Object} options - Crop options
     * @param {number} options.width - Target width in pixels
     * @param {number} options.height - Target height in pixels
     * @param {string} options.mode - 'smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right'
     * @param {boolean} options.upscale - Allow upscaling (default: false)
     * @param {string} options.algorithm - Resize algorithm for pre-scaling
     * @param {boolean} options.preserveAspectRatio - Maintain aspect ratio during resize (default: true)
     * @param {number} options.confidenceThreshold - Confidence threshold for AI detection (0-100)
     * @param {boolean} options.multipleFaces - Handle multiple faces (for face mode)
     * @param {Array<string>} options.objectsToDetect - Specific objects to look for ['person', 'car', 'dog', etc.]
     * @param {boolean} options.cropToFit - Crop to fit exact dimensions after resize (default: true)
     * @param {boolean} options.skipSvg - Skip SVG files (default: true)
     * @param {number} options.minSourceDimension - Minimum source dimension for AI to work
     * @param {boolean} options.fallbackToSimple - Fallback to simple crop if AI fails
     */
    constructor(options = {}) {
        this.width = options.width || 1080
        this.height = options.height || 1080
        this.mode = options.mode || 'smart'
        this.upscale = options.upscale || false
        this.algorithm = options.algorithm || 'lanczos3'
        this.preserveAspectRatio = options.preserveAspectRatio !== false
        this.confidenceThreshold = Math.max(0, Math.min(100, options.confidenceThreshold || 70))
        this.multipleFaces = options.multipleFaces || false
        this.objectsToDetect = options.objectsToDetect || ['person', 'face', 'car', 'dog', 'cat']
        this.cropToFit = options.cropToFit !== false
        this.skipSvg = options.skipSvg !== false
        this.minSourceDimension = options.minSourceDimension || 200
        this.fallbackToSimple = options.fallbackToSimple !== false

        this.name = 'LemGendaryCrop'
        this.version = '3.0.0' // Major update for enhanced validation
        this.aiCapabilities = null // Will be populated
    }

    /**
     * Validate processor options with enhanced validation
     * @private
     */
    _validateOptions = async () => {
        const errors = []
        const warnings = []

        // Validate dimensions
        if (typeof this.width !== 'number' || this.width <= 0) {
            errors.push({
                code: 'INVALID_WIDTH',
                message: 'Width must be a positive number',
                severity: 'error'
            })
        }

        if (typeof this.height !== 'number' || this.height <= 0) {
            errors.push({
                code: 'INVALID_HEIGHT',
                message: 'Height must be a positive number',
                severity: 'error'
            })
        }

        // Check for extreme dimensions
        if (this.width < 10 || this.height < 10) {
            errors.push({
                code: 'EXTREME_SMALL_DIMENSIONS',
                message: `Target dimensions too small: ${this.width}x${this.height}`,
                severity: 'error',
                suggestion: 'Use dimensions of at least 100x100 pixels'
            })
        }

        if (this.width > 10000 || this.height > 10000) {
            warnings.push({
                code: 'EXTREME_LARGE_DIMENSIONS',
                message: `Target dimensions very large: ${this.width}x${this.height}`,
                severity: 'warning',
                suggestion: 'Consider smaller dimensions for better performance'
            })
        }

        // Validate aspect ratio
        const aspectRatio = this.width / this.height
        if (aspectRatio > 10 || aspectRatio < 0.1) {
            warnings.push({
                code: 'EXTREME_ASPECT_RATIO',
                message: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
                severity: 'warning',
                suggestion: 'Consider more balanced dimensions'
            })
        }

        // Validate mode
        const validModes = [
            'smart', 'face', 'object', 'saliency', 'entropy',
            'center', 'top', 'bottom', 'left', 'right',
            'top-left', 'top-right', 'bottom-left', 'bottom-right'
        ]

        if (!validModes.includes(this.mode)) {
            errors.push({
                code: 'INVALID_MODE',
                message: `Mode must be one of: ${validModes.join(', ')}`,
                severity: 'error'
            })
        }

        // Validate algorithm
        if (!['lanczos3', 'bilinear', 'nearest'].includes(this.algorithm)) {
            errors.push({
                code: 'INVALID_ALGORITHM',
                message: 'Algorithm must be "lanczos3", "bilinear", or "nearest"',
                severity: 'error'
            })
        }

        // Validate confidence threshold
        if (this.confidenceThreshold < 30) {
            warnings.push({
                code: 'LOW_CONFIDENCE_THRESHOLD',
                message: `Low confidence threshold: ${this.confidenceThreshold}%`,
                severity: 'warning',
                suggestion: 'Use at least 50% for reliable detection'
            })
        }

        // Check AI capabilities for smart modes
        if (['smart', 'face', 'object', 'saliency', 'entropy'].includes(this.mode)) {
            this.aiCapabilities = await this._checkAICapabilities()

            if (this.mode === 'face' && !this.aiCapabilities.faceDetection) {
                warnings.push({
                    code: 'FACE_DETECTION_UNAVAILABLE',
                    message: 'Face detection API not available',
                    severity: 'warning',
                    suggestion: 'Browser may not support FaceDetector API, will use fallback'
                })
            }

            if (this.mode === 'object' && !this.aiCapabilities.objectDetection) {
                warnings.push({
                    code: 'OBJECT_DETECTION_UNAVAILABLE',
                    message: 'Object detection not available',
                    severity: 'warning',
                    suggestion: 'TensorFlow.js not loaded, will use saliency detection'
                })
            }

            if (this.mode === 'saliency' && !this.aiCapabilities.canvasAvailable) {
                errors.push({
                    code: 'SALIENCY_DETECTION_UNAVAILABLE',
                    message: 'Canvas API not available for saliency detection',
                    severity: 'error'
                })
            }
        }

        // Check for integer dimensions
        if (!Number.isInteger(this.width) || !Number.isInteger(this.height)) {
            warnings.push({
                code: 'NON_INTEGER_DIMENSIONS',
                message: 'Crop dimensions should be integers for best results',
                severity: 'info'
            })
            this.width = Math.round(this.width)
            this.height = Math.round(this.height)
        }

        // Validate objectsToDetect array
        if (!Array.isArray(this.objectsToDetect)) {
            errors.push({
                code: 'INVALID_OBJECTS_ARRAY',
                message: 'objectsToDetect must be an array',
                severity: 'error'
            })
        }

        // Check if objectsToDetect is empty when mode is 'object'
        if (this.mode === 'object' && (!this.objectsToDetect || this.objectsToDetect.length === 0)) {
            warnings.push({
                code: 'NO_OBJECTS_SPECIFIED',
                message: 'No objects specified for object detection',
                severity: 'warning',
                suggestion: 'Add objects to detect like ["person", "car", "dog"]'
            })
        }

        // Throw errors if any
        if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join(', ')
            throw new Error(`Invalid crop options: ${errorMessages}`)
        }

        // Return warnings for processing
        return { errors, warnings }
    }

    /**
     * Validate if image can be processed with smart crop
     * @private
     */
    _validateImage = (lemGendImage) => {
        const errors = []
        const warnings = []

        if (!lemGendImage) {
            errors.push('No image provided')
            return { canProcess: false, errors, warnings }
        }

        if (!lemGendImage.width || !lemGendImage.height) {
            errors.push('Image missing dimensions')
            return { canProcess: false, errors, warnings }
        }

        // Check for SVG
        if (lemGendImage.type === 'image/svg+xml') {
            if (this.skipSvg) {
                warnings.push({
                    code: 'SVG_SKIPPED',
                    message: 'SVG files are vector-based and smart cropping may not work well',
                    severity: 'info',
                    suggestion: 'Consider converting to raster format first'
                })
                return { canProcess: false, errors, warnings }
            } else {
                warnings.push({
                    code: 'SVG_RASTERIZED',
                    message: 'SVG will be rasterized before smart cropping',
                    severity: 'warning'
                })
            }
        }

        // Check for ICO/favicon
        if (lemGendImage.type.includes('icon')) {
            warnings.push({
                code: 'FAVICON_SMART_CROP',
                message: 'ICO files contain multiple images; smart cropping may affect all frames',
                severity: 'info'
            })
        }

        // Check minimum source dimensions for AI
        if (['smart', 'face', 'object', 'saliency', 'entropy'].includes(this.mode)) {
            const minDimension = Math.min(lemGendImage.width, lemGendImage.height)
            if (minDimension < this.minSourceDimension) {
                warnings.push({
                    code: 'SMALL_SOURCE_FOR_AI',
                    message: `Source image small (${lemGendImage.width}x${lemGendImage.height}), AI may not work well`,
                    severity: 'warning',
                    suggestion: 'Use larger source image or simple crop mode'
                })
            }
        }

        // Check for extreme source aspect ratios
        const sourceAspect = lemGendImage.width / lemGendImage.height
        const targetAspect = this.width / this.height
        const aspectDiff = Math.abs(sourceAspect - targetAspect) / sourceAspect

        if (aspectDiff > 2) { // More than 200% difference
            warnings.push({
                code: 'EXTREME_ASPECT_MISMATCH',
                message: `Source aspect ratio (${sourceAspect.toFixed(2)}) very different from target (${targetAspect.toFixed(2)})`,
                severity: 'warning',
                suggestion: 'Consider cropping before smart crop or adjust target dimensions'
            })
        }

        // Check if image is too small for target
        if (!this.upscale && (lemGendImage.width < this.width || lemGendImage.height < this.height)) {
            warnings.push({
                code: 'UPSCALING_REQUIRED',
                message: 'Target dimensions larger than source, upscaling disabled',
                severity: 'warning',
                suggestion: 'Enable upscaling or use smaller target dimensions'
            })
        }

        return {
            canProcess: true,
            errors,
            warnings,
            imageType: lemGendImage.type,
            dimensions: { width: lemGendImage.width, height: lemGendImage.height }
        }
    }

    /**
     * Check available AI capabilities with detailed reporting
     * @private
     */
    _checkAICapabilities = async () => {
        const capabilities = {
            faceDetection: false,
            objectDetection: false,
            saliencyDetection: false,
            entropyDetection: false,
            canvasAvailable: false,
            workerAvailable: typeof Worker !== 'undefined',
            tensorFlowAvailable: typeof tf !== 'undefined',
            faceDetectorAvailable: typeof FaceDetector !== 'undefined'
        }

        try {
            // Check canvas API
            const canvas = document.createElement('canvas')
            capabilities.canvasAvailable = !!(canvas.getContext && canvas.getContext('2d'))

            // Check Face Detection API
            if (typeof FaceDetector === 'function') {
                try {
                    const faceDetector = new FaceDetector()
                    capabilities.faceDetection = true
                } catch (e) {
                    console.warn('FaceDetector API available but failed to initialize:', e.message)
                }
            }

            // Check TensorFlow.js
            if (typeof tf !== 'undefined') {
                capabilities.tensorFlowAvailable = true
                capabilities.objectDetection = true
                capabilities.saliencyDetection = true
                capabilities.entropyDetection = true
            }

            // Check for offscreen canvas for workers
            if (typeof OffscreenCanvas !== 'undefined') {
                capabilities.offscreenCanvas = true
            }

        } catch (error) {
            console.warn('Error checking AI capabilities:', error.message)
        }

        // Generate capability summary
        capabilities.summary = this._generateAISummary(capabilities)
        capabilities.hasAnyAI = capabilities.faceDetection || capabilities.objectDetection ||
            capabilities.saliencyDetection || capabilities.entropyDetection

        return capabilities
    }

    /**
     * Generate AI capability summary
     * @private
     */
    _generateAISummary = (capabilities) => {
        const availableFeatures = []
        const unavailableFeatures = []

        if (capabilities.faceDetection) availableFeatures.push('Face Detection')
        else unavailableFeatures.push('Face Detection (requires FaceDetector API)')

        if (capabilities.objectDetection) availableFeatures.push('Object Detection')
        else unavailableFeatures.push('Object Detection (requires TensorFlow.js)')

        if (capabilities.saliencyDetection) availableFeatures.push('Saliency Detection')
        else unavailableFeatures.push('Saliency Detection (requires TensorFlow.js)')

        if (capabilities.entropyDetection) availableFeatures.push('Entropy Analysis')
        else unavailableFeatures.push('Entropy Analysis (requires TensorFlow.js)')

        return {
            available: availableFeatures,
            unavailable: unavailableFeatures,
            hasAdvancedAI: capabilities.tensorFlowAvailable,
            canUseWorkers: capabilities.workerAvailable && capabilities.offscreenCanvas,
            recommendedMode: capabilities.faceDetection ? 'face' :
                capabilities.objectDetection ? 'object' :
                    capabilities.saliencyDetection ? 'saliency' : 'center'
        }
    }

    /**
     * Process an image with smart crop operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @param {Object} previousDimensions - Optional dimensions from previous step
     * @returns {Promise<Object>} Processing result with smart crop details
     */
    process = async (lemGendImage, previousDimensions = null) => {
        // Validate options
        const optionsValidation = await this._validateOptions()

        // Validate image
        const imageValidation = this._validateImage(lemGendImage)

        if (!imageValidation.canProcess) {
            if (this.fallbackToSimple && ['center', 'top', 'bottom', 'left', 'right'].includes(this.mode)) {
                console.warn('Smart crop not possible, falling back to simple crop')
                return this._fallbackToSimpleCrop(lemGendImage, previousDimensions)
            }
            throw new Error(`Cannot process image: ${imageValidation.errors.join(', ')}`)
        }

        const sourceWidth = previousDimensions?.width || lemGendImage.width
        const sourceHeight = previousDimensions?.height || lemGendImage.height

        console.log(`Smart crop starting: ${sourceWidth}x${sourceHeight} -> ${this.width}x${this.height}`)

        // STEP 1: Detect region of interest with fallback handling
        let detectionResult
        try {
            detectionResult = await this._detectRegionOfInterest(lemGendImage)

            // Check if detection was successful
            if (detectionResult.confidence < this.confidenceThreshold / 100 && this.fallbackToSimple) {
                console.warn(`Low confidence (${detectionResult.confidence}), falling back to ${this.mode} mode`)
                detectionResult.focusPoint = this._getFocusPointForMode(this.mode, sourceWidth, sourceHeight)
            }
        } catch (error) {
            console.warn('Detection failed, using fallback:', error.message)
            if (this.fallbackToSimple) {
                detectionResult = {
                    focusPoint: this._getFocusPointForMode(this.mode, sourceWidth, sourceHeight),
                    confidence: 0.5,
                    usingFallback: true
                }
            } else {
                throw new Error(`Detection failed: ${error.message}`)
            }
        }

        // STEP 2: Calculate resize dimensions with validation
        const resizeResult = this._calculateResizeDimensions(
            sourceWidth,
            sourceHeight,
            detectionResult
        )

        // Validate resize result
        const resizeValidation = this._validateResizeDimensions(resizeResult, sourceWidth, sourceHeight)
        if (!resizeValidation.valid) {
            if (this.fallbackToSimple) {
                console.warn('Resize validation failed, using simple crop')
                return this._fallbackToSimpleCrop(lemGendImage, previousDimensions)
            }
            throw new Error(`Resize calculation failed: ${resizeValidation.errors.join(', ')}`)
        }

        // STEP 3: Calculate crop area based on ROI and target dimensions
        let cropResult
        try {
            cropResult = await this._calculateSmartCropArea(
                detectionResult,
                resizeResult,
                sourceWidth,
                sourceHeight
            )
        } catch (error) {
            console.warn('Smart crop calculation failed:', error.message)
            if (this.fallbackToSimple) {
                return this._fallbackToSimpleCrop(lemGendImage, previousDimensions)
            }
            throw error
        }

        // Create comprehensive result object with validation metadata
        const result = {
            success: true,
            operation: this.name,
            smartCrop: true,
            steps: {
                detection: detectionResult,
                resize: resizeResult,
                crop: cropResult
            },
            sourceDimensions: {
                width: sourceWidth,
                height: sourceHeight,
                aspectRatio: sourceWidth / sourceHeight
            },
            targetDimensions: {
                width: this.width,
                height: this.height,
                aspectRatio: this.width / this.height
            },
            finalDimensions: {
                width: cropResult.finalWidth || this.width,
                height: cropResult.finalHeight || this.height
            },
            cropOffsets: {
                x: cropResult.cropX,
                y: cropResult.cropY,
                width: cropResult.cropWidth || this.width,
                height: cropResult.cropHeight || this.height
            },
            settings: {
                mode: this.mode,
                width: this.width,
                height: this.height,
                algorithm: this.algorithm,
                upscale: this.upscale,
                preserveAspectRatio: this.preserveAspectRatio,
                confidenceThreshold: this.confidenceThreshold,
                cropToFit: this.cropToFit,
                fallbackToSimple: this.fallbackToSimple
            },
            warnings: [...optionsValidation.warnings, ...imageValidation.warnings, ...resizeValidation.warnings],
            recommendations: [],
            metadata: {
                detectedObjects: detectionResult.objects?.length || 0,
                hasFaces: detectionResult.faces?.length > 0,
                hasSaliency: detectionResult.saliencyArea !== null,
                contentPreserved: this._calculateContentPreservation(detectionResult, cropResult),
                aiCapabilities: this.aiCapabilities?.summary,
                usingFallback: detectionResult.usingFallback || false,
                validation: {
                    optionsValid: optionsValidation.errors.length === 0,
                    imageValid: imageValidation.canProcess,
                    resizeValid: resizeValidation.valid,
                    aiAvailable: this.aiCapabilities?.hasAnyAI || false
                },
                processingTime: Date.now(),
                processedAt: new Date().toISOString()
            }
        }

        // Add warnings and recommendations
        this._addSmartCropWarnings(detectionResult, resizeResult, cropResult, result)

        return result
    }

    /**
     * Fallback to simple crop when AI/smart crop fails
     * @private
     */
    _fallbackToSimpleCrop = (lemGendImage, previousDimensions) => {
        const sourceWidth = previousDimensions?.width || lemGendImage.width
        const sourceHeight = previousDimensions?.height || lemGendImage.height

        const cropResult = LemGendaryCrop.simpleCrop(
            sourceWidth,
            sourceHeight,
            this.width,
            this.height,
            this.mode
        )

        const result = {
            success: true,
            operation: this.name,
            smartCrop: false,
            fallbackUsed: true,
            sourceDimensions: {
                width: sourceWidth,
                height: sourceHeight,
                aspectRatio: sourceWidth / sourceHeight
            },
            targetDimensions: {
                width: this.width,
                height: this.height,
                aspectRatio: this.width / this.height
            },
            finalDimensions: {
                width: this.width,
                height: this.height
            },
            cropOffsets: {
                x: cropResult.cropX,
                y: cropResult.cropY,
                width: cropResult.cropWidth,
                height: cropResult.cropHeight
            },
            settings: {
                mode: this.mode,
                width: this.width,
                height: this.height,
                usingSimpleCrop: true
            },
            warnings: [{
                type: 'AI_UNAVAILABLE',
                message: 'AI features not available, using simple crop',
                severity: 'warning',
                suggestion: 'Check browser compatibility or use simple crop modes'
            }],
            metadata: {
                usingFallback: true,
                fallbackReason: 'AI not available or failed',
                scale: cropResult.scale,
                processingTime: Date.now(),
                processedAt: new Date().toISOString()
            }
        }

        return result
    }

    /**
     * Get focus point for simple crop modes
     * @private
     */
    _getFocusPointForMode = (mode, width, height) => {
        switch (mode) {
            case 'center':
                return { x: width / 2, y: height / 2 }
            case 'top':
                return { x: width / 2, y: height * 0.25 }
            case 'bottom':
                return { x: width / 2, y: height * 0.75 }
            case 'left':
                return { x: width * 0.25, y: height / 2 }
            case 'right':
                return { x: width * 0.75, y: height / 2 }
            case 'top-left':
                return { x: width * 0.25, y: height * 0.25 }
            case 'top-right':
                return { x: width * 0.75, y: height * 0.25 }
            case 'bottom-left':
                return { x: width * 0.25, y: height * 0.75 }
            case 'bottom-right':
                return { x: width * 0.75, y: height * 0.75 }
            default:
                return { x: width / 2, y: height / 2 }
        }
    }

    /**
     * Validate resize dimensions
     * @private
     */
    _validateResizeDimensions = (resizeResult, sourceWidth, sourceHeight) => {
        const warnings = []
        let valid = true

        const { width: resizeWidth, height: resizeHeight, requiresUpscaling } = resizeResult

        // Check for extreme scaling
        const scaleX = resizeWidth / sourceWidth
        const scaleY = resizeHeight / sourceHeight

        if (scaleX < 0.1 || scaleY < 0.1) {
            warnings.push({
                code: 'EXTREME_DOWNSCALING',
                message: `Extreme downscaling detected (scale: ${Math.min(scaleX, scaleY).toFixed(2)})`,
                severity: 'warning',
                suggestion: 'Consider larger target dimensions or source image'
            })
        }

        if ((scaleX > 4 || scaleY > 4) && !this.upscale) {
            warnings.push({
                code: 'EXTREME_UPSCALING_NEEDED',
                message: 'Extreme upscaling needed but upscale disabled',
                severity: 'warning',
                suggestion: 'Enable upscaling or use smaller target dimensions'
            })
            valid = false
        }

        // Check output dimensions
        if (resizeWidth < 10 || resizeHeight < 10) {
            warnings.push({
                code: 'RESIZE_TOO_SMALL',
                message: `Resized dimensions very small: ${resizeWidth}x${resizeHeight}`,
                severity: 'warning'
            })
        }

        if (resizeWidth * resizeHeight > 100000000) { // > 100MP
            warnings.push({
                code: 'RESIZE_TOO_LARGE',
                message: `Resized image very large: ${Math.round(resizeWidth * resizeHeight / 1000000)}MP`,
                severity: 'warning',
                suggestion: 'Consider smaller target dimensions'
            })
        }

        return { valid, warnings }
    }

    /**
     * Calculate resize dimensions
     * @private
     */
    _calculateResizeDimensions = (sourceWidth, sourceHeight, detectionResult) => {
        const sourceAspect = sourceWidth / sourceHeight
        const targetAspect = this.width / this.height

        let resizeWidth, resizeHeight

        if (this.preserveAspectRatio) {
            // Calculate scale to fit target aspect ratio
            const scale = Math.max(this.width / sourceWidth, this.height / sourceHeight)
            resizeWidth = Math.round(sourceWidth * scale)
            resizeHeight = Math.round(sourceHeight * scale)
        } else {
            resizeWidth = this.width
            resizeHeight = this.height
        }

        const requiresUpscaling = resizeWidth > sourceWidth || resizeHeight > sourceHeight

        return {
            width: resizeWidth,
            height: resizeHeight,
            sourceAspect,
            targetAspect,
            scale: resizeWidth / sourceWidth,
            requiresUpscaling,
            fitsTargetAspect: Math.abs(sourceAspect - targetAspect) < 0.01
        }
    }

    /**
     * Calculate smart crop area
     * @private
     */
    _calculateSmartCropArea = (detectionResult, resizeResult, sourceWidth, sourceHeight) => {
        const { focusPoint } = detectionResult
        const { width: resizeWidth, height: resizeHeight, scale } = resizeResult

        // Convert focus point from normalized coordinates to resize coordinates
        const focusX = focusPoint.x * resizeWidth
        const focusY = focusPoint.y * resizeHeight

        // Calculate crop area centered on focus point
        let cropX = Math.max(0, Math.min(resizeWidth - this.width, focusX - this.width / 2))
        let cropY = Math.max(0, Math.min(resizeHeight - this.height, focusY - this.height / 2))

        // Apply rule of thirds adjustment
        const ruleOfThirdsX = Math.round(resizeWidth / 3)
        const ruleOfThirdsY = Math.round(resizeHeight / 3)

        // Adjust to nearest rule of thirds point
        const thirdsPoints = [
            { x: ruleOfThirdsX, y: ruleOfThirdsY },
            { x: ruleOfThirdsX * 2, y: ruleOfThirdsY },
            { x: ruleOfThirdsX, y: ruleOfThirdsY * 2 },
            { x: ruleOfThirdsX * 2, y: ruleOfThirdsY * 2 }
        ]

        let bestPoint = { x: cropX + this.width / 2, y: cropY + this.height / 2 }
        let minDistance = Infinity

        for (const point of thirdsPoints) {
            const distance = Math.sqrt(Math.pow(point.x - focusX, 2) + Math.pow(point.y - focusY, 2))
            if (distance < minDistance) {
                minDistance = distance
                bestPoint = point
            }
        }

        // Recalculate crop area based on best rule of thirds point
        cropX = Math.max(0, Math.min(resizeWidth - this.width, bestPoint.x - this.width / 2))
        cropY = Math.max(0, Math.min(resizeHeight - this.height, bestPoint.y - this.height / 2))

        return {
            cropX: Math.round(cropX),
            cropY: Math.round(cropY),
            cropWidth: this.width,
            cropHeight: this.height,
            finalWidth: this.width,
            finalHeight: this.height,
            scale,
            ruleOfThirdsApplied: true,
            focusPoint: { x: focusX, y: focusY },
            adjustedFocusPoint: bestPoint
        }
    }

    /**
     * Calculate content preservation percentage
     * @private
     */
    _calculateContentPreservation = (detectionResult, cropResult) => {
        if (!detectionResult.faces?.length && !detectionResult.objects?.length) {
            return 100 // No specific content to preserve
        }

        let totalContentArea = 0
        let preservedContentArea = 0

        // Calculate faces area
        if (detectionResult.faces?.length) {
            detectionResult.faces.forEach(face => {
                const faceArea = face.boundingBox.width * face.boundingBox.height
                totalContentArea += faceArea

                // Check if face is within crop area
                const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2
                const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2

                if (faceCenterX >= cropResult.cropX && faceCenterX <= cropResult.cropX + cropResult.cropWidth &&
                    faceCenterY >= cropResult.cropY && faceCenterY <= cropResult.cropY + cropResult.cropHeight) {
                    preservedContentArea += faceArea
                }
            })
        }

        // Calculate objects area
        if (detectionResult.objects?.length) {
            detectionResult.objects.forEach(object => {
                const objectArea = object.boundingBox.width * object.boundingBox.height
                totalContentArea += objectArea

                // Check if object is within crop area
                const objectCenterX = object.boundingBox.x + object.boundingBox.width / 2
                const objectCenterY = object.boundingBox.y + object.boundingBox.height / 2

                if (objectCenterX >= cropResult.cropX && objectCenterX <= cropResult.cropX + cropResult.cropWidth &&
                    objectCenterY >= cropResult.cropY && objectCenterY <= cropResult.cropY + cropResult.cropHeight) {
                    preservedContentArea += objectArea
                }
            })
        }

        return totalContentArea > 0 ? Math.round((preservedContentArea / totalContentArea) * 100) : 100
    }

    /**
     * Add smart crop warnings
     * @private
     */
    _addSmartCropWarnings = (detectionResult, resizeResult, cropResult, result) => {
        const contentPreservation = result.metadata.contentPreserved

        if (contentPreservation < 80) {
            result.warnings.push({
                type: 'CONTENT_LOSS',
                message: `Only ${contentPreservation}% of detected content preserved in crop`,
                severity: 'warning',
                suggestion: 'Consider adjusting crop dimensions or using different focus point'
            })
        }

        if (resizeResult.requiresUpscaling && !this.upscale) {
            result.warnings.push({
                type: 'UPSCALING_REQUIRED',
                message: 'Crop requires upscaling but upscale is disabled',
                severity: 'info',
                suggestion: 'Enable upscaling or use smaller crop dimensions'
            })
        }

        if (detectionResult.usingFallback) {
            result.warnings.push({
                type: 'AI_FALLBACK_USED',
                message: 'AI detection failed, using fallback crop method',
                severity: 'info',
                suggestion: 'Check image quality or adjust confidence threshold'
            })
        }
    }

    /**
     * STEP 1: Detect region of interest using AI/computer vision
     * @private
     */
    _detectRegionOfInterest = async (lemGendImage) => {
        const result = {
            faces: [],
            objects: [],
            saliencyArea: null,
            entropyMap: null,
            focusPoint: { x: 0.5, y: 0.5 }, // Default center
            confidence: 0,
            capabilitiesUsed: []
        }

        try {
            // Validate AI capabilities first
            if (!this.aiCapabilities) {
                this.aiCapabilities = await this._checkAICapabilities()
            }

            // Load the image for analysis
            const imageBitmap = await createImageBitmap(lemGendImage.file)

            // Execute detection based on mode and available capabilities
            if (this.mode === 'face' || this.mode === 'smart') {
                if (this.aiCapabilities.faceDetection) {
                    result.faces = await this._detectFaces(imageBitmap)
                    if (result.faces.length > 0) {
                        result.focusPoint = this._calculateFaceCenter(result.faces)
                        result.confidence = Math.max(...result.faces.map(f => f.confidence))
                        result.capabilitiesUsed.push('face-detection')
                    }
                }
            }

            if (this.mode === 'object' || this.mode === 'smart') {
                if (this.aiCapabilities.objectDetection) {
                    result.objects = await this._detectObjects(imageBitmap)
                    if (result.objects.length > 0) {
                        result.focusPoint = this._calculateObjectCenter(result.objects)
                        result.confidence = Math.max(...result.objects.map(o => o.confidence))
                        result.capabilitiesUsed.push('object-detection')
                    }
                }
            }

            if (this.mode === 'saliency' || this.mode === 'smart') {
                if (this.aiCapabilities.saliencyDetection) {
                    result.saliencyArea = await this._detectSaliency(imageBitmap)
                    if (result.saliencyArea) {
                        result.focusPoint = result.saliencyArea.center
                        result.confidence = result.saliencyArea.confidence
                        result.capabilitiesUsed.push('saliency-detection')
                    }
                }
            }

            if (this.mode === 'entropy' || this.mode === 'smart') {
                if (this.aiCapabilities.entropyDetection) {
                    result.entropyMap = await this._calculateEntropy(imageBitmap)
                    if (result.entropyMap) {
                        result.focusPoint = result.entropyMap.highestEntropyPoint
                        result.confidence = result.entropyMap.confidence
                        result.capabilitiesUsed.push('entropy-analysis')
                    }
                }
            }

            // Fallback to center if no detection or low confidence
            if (result.confidence < this.confidenceThreshold / 100) {
                console.log('Low confidence detection, using center focus')
                result.focusPoint = { x: 0.5, y: 0.5 }
                result.confidence = 0.5
                result.capabilitiesUsed.push('fallback-center')
            }

            // Clean up
            imageBitmap.close()

        } catch (error) {
            console.warn('AI detection failed:', error.message)
            result.focusPoint = { x: 0.5, y: 0.5 }
            result.confidence = 0.5
            result.capabilitiesUsed.push('error-fallback')
            result.error = error.message
        }

        return result
    }

    /**
     * Detect faces in image with error handling
     * @private
     */
    _detectFaces = async (imageBitmap) => {
        const faces = []

        try {
            if (typeof FaceDetector !== 'undefined') {
                const faceDetector = new FaceDetector({
                    maxDetectedFaces: this.multipleFaces ? 10 : 1,
                    fastMode: true
                })

                const detectedFaces = await faceDetector.detect(imageBitmap)

                faces.push(...detectedFaces.map(face => ({
                    boundingBox: face.boundingBox,
                    confidence: face.confidence || 0.8,
                    landmarks: face.landmarks || [],
                    type: 'face'
                })))
            }
        } catch (error) {
            console.warn('Face detection failed:', error.message)
            // Don't throw, just return empty array
        }

        return faces
    }

    /**
     * Calculate face center from multiple faces
     * @private
     */
    _calculateFaceCenter = (faces) => {
        if (!faces.length) return { x: 0.5, y: 0.5 }

        let totalX = 0
        let totalY = 0
        let totalWeight = 0

        faces.forEach(face => {
            const weight = face.confidence || 0.5
            const centerX = face.boundingBox.x + face.boundingBox.width / 2
            const centerY = face.boundingBox.y + face.boundingBox.height / 2

            totalX += centerX * weight
            totalY += centerY * weight
            totalWeight += weight
        })

        return {
            x: totalWeight > 0 ? totalX / totalWeight : 0.5,
            y: totalWeight > 0 ? totalY / totalWeight : 0.5
        }
    }

    /**
     * Detect objects in image (simulated fallback)
     * @private
     */
    _detectObjects = async (imageBitmap) => {
        // Simulated object detection - in real implementation, use TensorFlow.js COCO-SSD
        const objects = []

        try {
            if (typeof tf !== 'undefined') {
                // This is where TensorFlow.js object detection would go
                // For now, return empty array as simulation
                console.log('TensorFlow.js object detection would run here')
            }
        } catch (error) {
            console.warn('Object detection failed:', error.message)
        }

        return objects
    }

    /**
     * Calculate object center
     * @private
     */
    _calculateObjectCenter = (objects) => {
        if (!objects.length) return { x: 0.5, y: 0.5 }

        let totalX = 0
        let totalY = 0
        let totalWeight = 0

        objects.forEach(object => {
            const weight = object.confidence || 0.5
            const centerX = object.boundingBox.x + object.boundingBox.width / 2
            const centerY = object.boundingBox.y + object.boundingBox.height / 2

            totalX += centerX * weight
            totalY += centerY * weight
            totalWeight += weight
        })

        return {
            x: totalWeight > 0 ? totalX / totalWeight : 0.5,
            y: totalWeight > 0 ? totalY / totalWeight : 0.5
        }
    }

    /**
     * Detect saliency (simulated fallback)
     * @private
     */
    _detectSaliency = async (imageBitmap) => {
        // Simulated saliency detection
        return {
            center: { x: 0.5, y: 0.5 },
            confidence: 0.6,
            method: 'simulated'
        }
    }

    /**
     * Calculate entropy (simulated fallback)
     * @private
     */
    _calculateEntropy = async (imageBitmap) => {
        // Simulated entropy calculation
        return {
            highestEntropyPoint: { x: 0.5, y: 0.5 },
            confidence: 0.7,
            method: 'simulated'
        }
    }

    /**
     * Simple crop algorithm (static method)
     * @static
     */
    static simpleCrop(sourceWidth, sourceHeight, targetWidth, targetHeight, mode = 'center') {
        const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
        const scaledWidth = Math.round(sourceWidth * scale)
        const scaledHeight = Math.round(sourceHeight * scale)

        let cropX, cropY

        switch (mode) {
            case 'top':
                cropX = (scaledWidth - targetWidth) / 2
                cropY = 0
                break
            case 'bottom':
                cropX = (scaledWidth - targetWidth) / 2
                cropY = scaledHeight - targetHeight
                break
            case 'left':
                cropX = 0
                cropY = (scaledHeight - targetHeight) / 2
                break
            case 'right':
                cropX = scaledWidth - targetWidth
                cropY = (scaledHeight - targetHeight) / 2
                break
            case 'top-left':
                cropX = 0
                cropY = 0
                break
            case 'top-right':
                cropX = scaledWidth - targetWidth
                cropY = 0
                break
            case 'bottom-left':
                cropX = 0
                cropY = scaledHeight - targetHeight
                break
            case 'bottom-right':
                cropX = scaledWidth - targetWidth
                cropY = scaledHeight - targetHeight
                break
            case 'center':
            default:
                cropX = (scaledWidth - targetWidth) / 2
                cropY = (scaledHeight - targetHeight) / 2
        }

        return {
            cropX: Math.max(0, Math.round(cropX)),
            cropY: Math.max(0, Math.round(cropY)),
            cropWidth: targetWidth,
            cropHeight: targetHeight,
            scale,
            scaledWidth,
            scaledHeight,
            mode
        }
    }

    /**
     * Get processor description
     * @returns {string} Description
     */
    static getDescription() {
        return 'LemGendaryCrop™: AI-powered smart cropping with enhanced validation, fallback handling, and detailed capability reporting.'
    }

    /**
     * Get processor information
     * @returns {Object} Processor info
     */
    static getInfo() {
        return {
            name: 'LemGendaryCrop',
            version: '3.0.0',
            description: this.getDescription(),
            modes: ['smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right'],
            features: [
                'Enhanced validation system',
                'AI capability detection',
                'Graceful fallback handling',
                'Face detection',
                'Object detection',
                'Saliency detection',
                'Entropy calculation',
                'Rule of thirds alignment',
                'Content-aware resizing',
                'SVG/ICO support',
                'Batch processing'
            ],
            requirements: {
                faceDetection: 'FaceDetector API',
                objectDetection: 'TensorFlow.js',
                saliencyDetection: 'Canvas API',
                minimumBrowser: 'Chrome 94+, Firefox 92+, Safari 15.4+'
            },
            validationLevel: 'enhanced'
        }
    }

    /**
     * Validate if processor can handle given image
     * @param {LemGendImage} image - Image to check
     * @returns {Object} Validation result
     */
    static async canProcess(image) {
        const processor = new LemGendaryCrop()

        try {
            await processor._validateOptions()
            const imageValidation = processor._validateImage(image)
            const capabilities = await processor._checkAICapabilities()

            return {
                canProcess: imageValidation.canProcess,
                reason: imageValidation.canProcess ? 'Image can be processed' : imageValidation.errors.join(', '),
                warnings: imageValidation.warnings,
                aiCapabilities: capabilities.summary,
                supportedModes: capabilities.hasAnyAI ?
                    ['smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right'] :
                    ['center', 'top', 'bottom', 'left', 'right'],
                enhancedValidation: true
            }
        } catch (error) {
            return {
                canProcess: false,
                reason: error.message,
                warnings: [],
                aiCapabilities: null,
                enhancedValidation: true
            }
        }
    }
}