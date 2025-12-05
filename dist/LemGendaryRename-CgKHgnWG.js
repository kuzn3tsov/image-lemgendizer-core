var D = Object.defineProperty;
var E = (u, e, t) => e in u ? D(u, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : u[e] = t;
var l = (u, e, t) => E(u, typeof e != "symbol" ? e + "" : e, t);
class v {
  /**
   * Create a LemGendaryResize processor
   * @param {Object} options - Resize options
   * @param {number} options.dimension - Target dimension for longest side of each image
   * @param {boolean} options.upscale - Allow upscaling (default: false)
   * @param {string} options.algorithm - Resize algorithm ('lanczos3', 'bilinear', 'nearest', 'cubic', 'mitchell')
   * @param {boolean} options.forceSquare - Force square output (for favicons/icons)
   * @param {boolean} options.preserveAspectRatio - Maintain aspect ratio (default: true)
   * @param {number} options.maxDimension - Maximum dimension limit
   * @param {boolean} options.skipSvg - Skip SVG files (default: true, as they're vector)
   * @param {string} options.mode - Resize mode: 'longest', 'width', 'height', 'auto'
   */
  constructor(e = {}) {
    /**
     * Validate processor options using enhanced validation system
     * @private
     */
    l(this, "_validateOptions", () => {
      const e = [], t = [];
      (typeof this.dimension != "number" || this.dimension <= 0) && e.push({
        code: "INVALID_DIMENSION",
        message: "Dimension must be a positive number",
        severity: "error"
      }), this.dimension > this.maxDimension && e.push({
        code: "DIMENSION_EXCEEDS_MAX",
        message: `Dimension exceeds maximum allowed value of ${this.maxDimension}`,
        severity: "error",
        suggestion: `Reduce dimension to ${this.maxDimension} or less`
      }), this.dimension < 10 && t.push({
        code: "VERY_SMALL_DIMENSION",
        message: `Very small target dimension (${this.dimension}px)`,
        severity: "warning",
        suggestion: "Consider at least 100px for usable images"
      }), this.dimension > 4e3 && t.push({
        code: "VERY_LARGE_DIMENSION",
        message: `Very large target dimension (${this.dimension}px)`,
        severity: "warning",
        suggestion: "Consider 1920px or less for web images"
      });
      const i = ["lanczos3", "bilinear", "nearest", "cubic", "mitchell"];
      i.includes(this.algorithm) || e.push({
        code: "INVALID_ALGORITHM",
        message: `Algorithm must be one of: ${i.join(", ")}`,
        severity: "error"
      });
      const s = ["longest", "width", "height", "auto"];
      if (s.includes(this.mode) || e.push({
        code: "INVALID_MODE",
        message: `Mode must be one of: ${s.join(", ")}`,
        severity: "error"
      }), Number.isInteger(this.dimension) || (t.push({
        code: "NON_INTEGER_DIMENSION",
        message: "Dimension should be an integer for best results",
        severity: "info"
      }), this.dimension = Math.round(this.dimension)), this.forceSquare && !this.preserveAspectRatio && t.push({
        code: "FORCE_SQUARE_NO_ASPECT",
        message: "Force square without preserving aspect ratio may cause issues",
        severity: "warning",
        suggestion: "Consider enabling preserveAspectRatio for forceSquare"
      }), e.length > 0) {
        const a = e.map((n) => n.message).join(", ");
        throw new Error(`Invalid resize options: ${a}`);
      }
      return t.length > 0 && console.warn("Resize warnings:", t.map((a) => a.message)), { errors: e, warnings: t };
    });
    /**
     * Validate if image can be processed
     * @private
     */
    l(this, "_validateImage", (e) => {
      const t = [], i = [];
      if (!e)
        return t.push("No image provided"), { canProcess: !1, errors: t, warnings: i };
      if (!e.width || !e.height)
        return t.push("Image missing dimensions"), { canProcess: !1, errors: t, warnings: i };
      if (e.type === "image/svg+xml") {
        if (this.skipSvg)
          return i.push({
            code: "SVG_SKIPPED",
            message: "SVG files are vector-based and will not be raster-resized",
            severity: "info",
            suggestion: "Consider converting to raster format first or disable skipSvg"
          }), { canProcess: !1, errors: t, warnings: i };
        i.push({
          code: "SVG_RASTERIZED",
          message: "SVG will be rasterized before resizing (quality loss possible)",
          severity: "warning"
        });
      }
      e.type.includes("icon") && i.push({
        code: "FAVICON_RESIZE",
        message: "ICO files contain multiple images; resizing may affect all frames",
        severity: "info"
      });
      const s = e.width / e.height;
      (s > 10 || s < 0.1) && i.push({
        code: "EXTREME_ASPECT_RATIO",
        message: `Extreme aspect ratio: ${s.toFixed(2)}`,
        severity: "warning",
        suggestion: "Consider cropping before resizing"
      }), (e.width < 50 || e.height < 50) && i.push({
        code: "VERY_SMALL_SOURCE",
        message: `Very small source image: ${e.width}x${e.height}`,
        severity: "warning",
        suggestion: "Consider using larger source image"
      });
      const a = e.width * e.height / 1e6;
      return a > 16 && i.push({
        code: "VERY_LARGE_SOURCE",
        message: `Very large source image: ${a.toFixed(1)}MP`,
        severity: "info",
        suggestion: "Resizing may take longer to process"
      }), {
        canProcess: !0,
        errors: t,
        warnings: i,
        imageType: e.type,
        dimensions: { width: e.width, height: e.height }
      };
    });
    /**
     * Process an image with resize operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @returns {Promise<Object>} Processing result with new dimensions
     */
    l(this, "process", async (e) => {
      const t = this._validateOptions(), i = this._validateImage(e);
      if (!i.canProcess)
        throw new Error(`Cannot process image: ${i.errors.join(", ")}`);
      const s = e.width, a = e.height, n = e.orientation, r = s / a, o = this._calculateDimensionsForImage(
        s,
        a,
        n
      ), h = this._validateUpscaling(s, a, o);
      if (!h.valid)
        throw new Error(h.message);
      const c = this._validateOutputDimensions(o), g = {
        success: !0,
        operation: this.name,
        originalDimensions: {
          width: s,
          height: a,
          orientation: n,
          aspectRatio: r
        },
        newDimensions: {
          width: o.width,
          height: o.height,
          orientation: o.width >= o.height ? "landscape" : "portrait",
          aspectRatio: o.width / o.height
        },
        settings: {
          targetLongestDimension: this.dimension,
          algorithm: this.algorithm,
          upscale: this.upscale,
          forceSquare: this.forceSquare,
          preserveAspectRatio: this.preserveAspectRatio,
          mode: this.mode,
          skipSvg: this.skipSvg
        },
        warnings: [...t.warnings, ...i.warnings, ...c.warnings],
        recommendations: [],
        metadata: {
          scaleFactor: o.width / s,
          aspectRatioPreserved: this.preserveAspectRatio,
          aspectRatioChange: Math.abs(o.width / o.height - r),
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          isSquare: o.width === o.height,
          longestDimensionApplied: o.width >= o.height ? "width" : "height",
          appliedTo: this._getAppliedDimension(s, a),
          targetValue: this.dimension,
          validation: {
            optionsValid: t.errors.length === 0,
            imageValid: i.canProcess,
            upscaleValid: h.valid,
            outputDimensionsValid: c.valid
          }
        }
      };
      return this._addWarningsAndRecommendations(e, s, a, o, g), g;
    });
    /**
     * Calculate new dimensions for THIS specific image
     * @private
     */
    l(this, "_calculateDimensionsForImage", (e, t, i) => {
      let s, a;
      switch (this.mode) {
        case "width":
          s = this.dimension, a = this.preserveAspectRatio ? Math.round(t / e * this.dimension) : this.dimension;
          break;
        case "height":
          a = this.dimension, s = this.preserveAspectRatio ? Math.round(e / t * this.dimension) : this.dimension;
          break;
        case "auto":
          e >= t ? (s = this.dimension, a = this.preserveAspectRatio ? Math.round(t / e * this.dimension) : this.dimension) : (a = this.dimension, s = this.preserveAspectRatio ? Math.round(e / t * this.dimension) : this.dimension);
          break;
        case "longest":
        default:
          this.forceSquare ? (s = this.dimension, a = this.dimension) : e >= t ? (s = this.dimension, a = this.preserveAspectRatio ? Math.round(t / e * this.dimension) : this.dimension) : (a = this.dimension, s = this.preserveAspectRatio ? Math.round(e / t * this.dimension) : this.dimension);
      }
      if (s = Math.max(1, s), a = Math.max(1, a), s > this.maxDimension || a > this.maxDimension) {
        const n = Math.min(this.maxDimension / s, this.maxDimension / a);
        s = Math.round(s * n), a = Math.round(a * n);
      }
      return { width: s, height: a };
    });
    /**
     * Get which dimension the target was applied to
     * @private
     */
    l(this, "_getAppliedDimension", (e, t) => {
      if (this.forceSquare)
        return "both (forced square)";
      switch (this.mode) {
        case "width":
          return "width";
        case "height":
          return "height";
        case "auto":
          return e >= t ? "width (auto)" : "height (auto)";
        case "longest":
        default:
          return e >= t ? "width (longest)" : "height (longest)";
      }
    });
    /**
     * Validate upscaling policy
     * @private
     */
    l(this, "_validateUpscaling", (e, t, i) => {
      const s = i.width > e, a = i.height > t;
      return (s || a) && !this.upscale ? {
        valid: !1,
        message: `Upscaling detected (${e}x${t} → ${i.width}x${i.height}). Set upscale: true to allow upscaling.`
      } : { valid: !0 };
    });
    /**
     * Validate output dimensions
     * @private
     */
    l(this, "_validateOutputDimensions", (e) => {
      const t = [];
      let i = !0;
      const { width: s, height: a } = e;
      (s < 10 || a < 10) && t.push({
        code: "OUTPUT_TOO_SMALL",
        message: `Output dimensions very small: ${s}x${a}`,
        severity: "warning",
        suggestion: "Consider larger target dimension"
      });
      const n = s / a;
      return (n > 10 || n < 0.1) && t.push({
        code: "EXTREME_OUTPUT_ASPECT",
        message: `Extreme output aspect ratio: ${n.toFixed(2)}`,
        severity: "warning",
        suggestion: "Consider cropping or different resize mode"
      }), s * a > 1e8 && t.push({
        code: "OUTPUT_TOO_LARGE",
        message: `Output image very large: ${Math.round(s * a / 1e6)}MP`,
        severity: "warning",
        suggestion: "Consider smaller target dimension"
      }), { valid: i, warnings: t };
    });
    /**
     * Add warnings and recommendations to result
     * @private
     */
    l(this, "_addWarningsAndRecommendations", (e, t, i, s, a) => {
      const n = s.width / t, r = s.width / s.height, o = t / i, h = Math.abs(o - r) / o;
      n < 0.1 && a.warnings.push({
        type: "EXTREME_DOWNSCALE",
        message: `Downscaling by ${((1 - n) * 100).toFixed(1)}% may cause severe pixelation`,
        severity: "warning",
        suggestion: this.algorithm === "nearest" ? "Nearest-neighbor algorithm selected for pixel art" : "Consider using nearest-neighbor algorithm for pixel art"
      }), n > 4 && a.warnings.push({
        type: "EXTREME_UPSCALE",
        message: `Upscaling by ${((n - 1) * 100).toFixed(1)}% may reduce quality`,
        severity: "warning",
        suggestion: "Consider using AI upscaling tools for better results"
      }), h > 0.01 && this.preserveAspectRatio && a.warnings.push({
        type: "ASPECT_DEVIATION",
        message: `Aspect ratio changed from ${o.toFixed(3)} to ${r.toFixed(3)}`,
        severity: "info",
        suggestion: "Check if this deviation is acceptable for your use case"
      }), !this.preserveAspectRatio && !this.forceSquare && a.warnings.push({
        type: "ASPECT_RATIO_NOT_PRESERVED",
        message: "Aspect ratio is not being preserved",
        severity: "info",
        suggestion: "Content may appear stretched or compressed"
      }), this.forceSquare && o !== 1 && a.warnings.push({
        type: "FORCED_SQUARE",
        message: "Image will be forced to square, cropping may occur",
        severity: "warning",
        suggestion: o > 1 ? "Consider cropping horizontally before resizing" : "Consider cropping vertically before resizing"
      }), (e.type === "image/jpeg" || e.type === "image/jpg") && a.recommendations.push({
        type: "FORMAT_SUGGESTION",
        message: "JPEG format selected",
        suggestion: "Consider WebP for better compression after resizing"
      }), e.transparency && (e.type === "image/png" || e.type === "image/webp") && a.warnings.push({
        type: "TRANSPARENCY_WARNING",
        message: "Image has transparency",
        severity: "info",
        suggestion: "Transparency will be preserved during resize"
      }), a.metadata.resizeInfo = `Target dimension ${this.dimension}px applied using ${this.mode} mode`, a.metadata.scaleDirection = n > 1 ? "upscale" : "downscale", a.metadata.scalePercentage = `${(Math.abs(n - 1) * 100).toFixed(1)}%`;
    });
    /**
     * Process multiple images in batch
     * @param {Array<LemGendImage>} images - Images to process
     * @returns {Promise<Array<Object>>} Array of processing results
     */
    l(this, "processBatch", async (e) => {
      if (this._validateOptions(), !Array.isArray(e))
        throw new Error("Images must be provided as an array");
      const t = [], i = [];
      e.length > 50 && i.push({
        code: "LARGE_BATCH",
        message: `Large batch size: ${e.length} images`,
        severity: "info",
        suggestion: "Consider processing in smaller batches for better performance"
      });
      for (const s of e)
        try {
          const a = await this.process(s);
          t.push(a);
        } catch (a) {
          t.push({
            success: !1,
            error: a.message,
            imageName: s?.originalName || "Unknown",
            imageType: s?.type || "Unknown",
            operation: this.name,
            warnings: i
          });
        }
      if (t.length > 0) {
        const s = t.filter((n) => n.success).length, a = t.filter((n) => !n.success).length;
        t.batchSummary = {
          total: t.length,
          successful: s,
          failed: a,
          successRate: (s / t.length * 100).toFixed(1) + "%",
          warnings: i
        };
      }
      return t;
    });
    this.dimension = e.dimension || 1080, this.upscale = e.upscale || !1, this.algorithm = e.algorithm || "lanczos3", this.forceSquare = e.forceSquare || !1, this.preserveAspectRatio = e.preserveAspectRatio !== !1, this.maxDimension = e.maxDimension || 1e4, this.skipSvg = e.skipSvg !== !1, this.mode = e.mode || "longest", this.name = "LemGendaryResize", this.version = "2.0.0";
  }
  /**
   * Get processor description
   * @returns {string} Description
   */
  static getDescription() {
    return "LemGendaryResize™: Intelligent image resizing with enhanced validation and multiple resize modes.";
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  static getInfo() {
    return {
      name: "LemGendaryResize",
      version: "2.0.0",
      description: this.getDescription(),
      operation: "Resizes images with multiple mode options and enhanced validation",
      algorithms: ["lanczos3", "bilinear", "nearest", "cubic", "mitchell"],
      modes: ["longest", "width", "height", "auto"],
      defaultDimension: 1080,
      minDimension: 1,
      maxDimension: 1e4,
      supportsSvg: !0,
      supportsFavicon: !0,
      features: [
        "Enhanced validation",
        "Multiple resize modes",
        "Batch processing",
        "Upscale control",
        "Aspect ratio preservation",
        "Square output option"
      ]
    };
  }
  /**
   * Create processor from configuration object
   * @param {Object} config - Processor configuration
   * @returns {LemGendaryResize} New processor instance
   */
  static fromConfig(e) {
    return new v(e);
  }
  /**
   * Preview resize for an image without processing
   * @param {number} originalWidth - Original width
   * @param {number} originalHeight - Original height
   * @param {number} targetDimension - Target dimension for longest side
   * @param {boolean} forceSquare - Force square output
   * @param {string} mode - Resize mode
   * @returns {Object} Preview dimensions with validation
   */
  static previewResize(e, t, i = 1080, s = !1, a = "longest") {
    const n = new v({
      dimension: i,
      forceSquare: s,
      mode: a
    }), r = n._calculateDimensionsForImage(
      e,
      t,
      e >= t ? "landscape" : "portrait"
    ), o = [], h = [], c = r.width / e;
    return c < 0.1 && o.push("Extreme downscaling may cause pixelation"), c > 4 && o.push("Extreme upscaling may reduce quality"), s && e / t !== 1 && h.push("Consider cropping before forcing square"), {
      original: `${e}x${t}`,
      new: `${r.width}x${r.height}`,
      appliedTo: n._getAppliedDimension(e, t),
      aspectRatio: {
        original: (e / t).toFixed(2),
        new: (r.width / r.height).toFixed(2)
      },
      scaleFactor: c.toFixed(2),
      warnings: o,
      recommendations: h
    };
  }
  /**
   * Validate if processor can handle given image
   * @param {LemGendImage} image - Image to check
   * @returns {Object} Validation result
   */
  static canProcess(e) {
    const t = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/avif"
    ], i = t.includes(e.type), s = i ? "Image type supported" : `Unsupported image type: ${e.type}`, a = [];
    return e.type === "image/svg+xml" && a.push("SVG files are vector-based and may be rasterized"), e.type.includes("icon") && a.push("ICO files contain multiple images"), {
      canProcess: i,
      reason: s,
      warnings: a,
      supportedTypes: t,
      enhancedValidation: !0
    };
  }
}
class x {
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
  constructor(e = {}) {
    /**
     * Validate processor options with enhanced validation
     * @private
     */
    l(this, "_validateOptions", async () => {
      const e = [], t = [];
      (typeof this.width != "number" || this.width <= 0) && e.push({
        code: "INVALID_WIDTH",
        message: "Width must be a positive number",
        severity: "error"
      }), (typeof this.height != "number" || this.height <= 0) && e.push({
        code: "INVALID_HEIGHT",
        message: "Height must be a positive number",
        severity: "error"
      }), (this.width < 10 || this.height < 10) && e.push({
        code: "EXTREME_SMALL_DIMENSIONS",
        message: `Target dimensions too small: ${this.width}x${this.height}`,
        severity: "error",
        suggestion: "Use dimensions of at least 100x100 pixels"
      }), (this.width > 1e4 || this.height > 1e4) && t.push({
        code: "EXTREME_LARGE_DIMENSIONS",
        message: `Target dimensions very large: ${this.width}x${this.height}`,
        severity: "warning",
        suggestion: "Consider smaller dimensions for better performance"
      });
      const i = this.width / this.height;
      (i > 10 || i < 0.1) && t.push({
        code: "EXTREME_ASPECT_RATIO",
        message: `Extreme aspect ratio: ${i.toFixed(2)}`,
        severity: "warning",
        suggestion: "Consider more balanced dimensions"
      });
      const s = [
        "smart",
        "face",
        "object",
        "saliency",
        "entropy",
        "center",
        "top",
        "bottom",
        "left",
        "right",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right"
      ];
      if (s.includes(this.mode) || e.push({
        code: "INVALID_MODE",
        message: `Mode must be one of: ${s.join(", ")}`,
        severity: "error"
      }), ["lanczos3", "bilinear", "nearest"].includes(this.algorithm) || e.push({
        code: "INVALID_ALGORITHM",
        message: 'Algorithm must be "lanczos3", "bilinear", or "nearest"',
        severity: "error"
      }), this.confidenceThreshold < 30 && t.push({
        code: "LOW_CONFIDENCE_THRESHOLD",
        message: `Low confidence threshold: ${this.confidenceThreshold}%`,
        severity: "warning",
        suggestion: "Use at least 50% for reliable detection"
      }), ["smart", "face", "object", "saliency", "entropy"].includes(this.mode) && (this.aiCapabilities = await this._checkAICapabilities(), this.mode === "face" && !this.aiCapabilities.faceDetection && t.push({
        code: "FACE_DETECTION_UNAVAILABLE",
        message: "Face detection API not available",
        severity: "warning",
        suggestion: "Browser may not support FaceDetector API, will use fallback"
      }), this.mode === "object" && !this.aiCapabilities.objectDetection && t.push({
        code: "OBJECT_DETECTION_UNAVAILABLE",
        message: "Object detection not available",
        severity: "warning",
        suggestion: "TensorFlow.js not loaded, will use saliency detection"
      }), this.mode === "saliency" && !this.aiCapabilities.canvasAvailable && e.push({
        code: "SALIENCY_DETECTION_UNAVAILABLE",
        message: "Canvas API not available for saliency detection",
        severity: "error"
      })), (!Number.isInteger(this.width) || !Number.isInteger(this.height)) && (t.push({
        code: "NON_INTEGER_DIMENSIONS",
        message: "Crop dimensions should be integers for best results",
        severity: "info"
      }), this.width = Math.round(this.width), this.height = Math.round(this.height)), Array.isArray(this.objectsToDetect) || e.push({
        code: "INVALID_OBJECTS_ARRAY",
        message: "objectsToDetect must be an array",
        severity: "error"
      }), this.mode === "object" && (!this.objectsToDetect || this.objectsToDetect.length === 0) && t.push({
        code: "NO_OBJECTS_SPECIFIED",
        message: "No objects specified for object detection",
        severity: "warning",
        suggestion: 'Add objects to detect like ["person", "car", "dog"]'
      }), e.length > 0) {
        const a = e.map((n) => n.message).join(", ");
        throw new Error(`Invalid crop options: ${a}`);
      }
      return { errors: e, warnings: t };
    });
    /**
     * Validate if image can be processed with smart crop
     * @private
     */
    l(this, "_validateImage", (e) => {
      const t = [], i = [];
      if (!e)
        return t.push("No image provided"), { canProcess: !1, errors: t, warnings: i };
      if (!e.width || !e.height)
        return t.push("Image missing dimensions"), { canProcess: !1, errors: t, warnings: i };
      if (e.type === "image/svg+xml") {
        if (this.skipSvg)
          return i.push({
            code: "SVG_SKIPPED",
            message: "SVG files are vector-based and smart cropping may not work well",
            severity: "info",
            suggestion: "Consider converting to raster format first"
          }), { canProcess: !1, errors: t, warnings: i };
        i.push({
          code: "SVG_RASTERIZED",
          message: "SVG will be rasterized before smart cropping",
          severity: "warning"
        });
      }
      e.type.includes("icon") && i.push({
        code: "FAVICON_SMART_CROP",
        message: "ICO files contain multiple images; smart cropping may affect all frames",
        severity: "info"
      }), ["smart", "face", "object", "saliency", "entropy"].includes(this.mode) && Math.min(e.width, e.height) < this.minSourceDimension && i.push({
        code: "SMALL_SOURCE_FOR_AI",
        message: `Source image small (${e.width}x${e.height}), AI may not work well`,
        severity: "warning",
        suggestion: "Use larger source image or simple crop mode"
      });
      const s = e.width / e.height, a = this.width / this.height;
      return Math.abs(s - a) / s > 2 && i.push({
        code: "EXTREME_ASPECT_MISMATCH",
        message: `Source aspect ratio (${s.toFixed(2)}) very different from target (${a.toFixed(2)})`,
        severity: "warning",
        suggestion: "Consider cropping before smart crop or adjust target dimensions"
      }), !this.upscale && (e.width < this.width || e.height < this.height) && i.push({
        code: "UPSCALING_REQUIRED",
        message: "Target dimensions larger than source, upscaling disabled",
        severity: "warning",
        suggestion: "Enable upscaling or use smaller target dimensions"
      }), {
        canProcess: !0,
        errors: t,
        warnings: i,
        imageType: e.type,
        dimensions: { width: e.width, height: e.height }
      };
    });
    /**
     * Check available AI capabilities with detailed reporting
     * @private
     */
    l(this, "_checkAICapabilities", async () => {
      const e = {
        faceDetection: !1,
        objectDetection: !1,
        saliencyDetection: !1,
        entropyDetection: !1,
        canvasAvailable: !1,
        workerAvailable: typeof Worker < "u",
        tensorFlowAvailable: typeof tf < "u",
        faceDetectorAvailable: typeof FaceDetector < "u"
      };
      try {
        const t = document.createElement("canvas");
        if (e.canvasAvailable = !!(t.getContext && t.getContext("2d")), typeof FaceDetector == "function")
          try {
            const i = new FaceDetector();
            e.faceDetection = !0;
          } catch (i) {
            console.warn("FaceDetector API available but failed to initialize:", i.message);
          }
        typeof tf < "u" && (e.tensorFlowAvailable = !0, e.objectDetection = !0, e.saliencyDetection = !0, e.entropyDetection = !0), typeof OffscreenCanvas < "u" && (e.offscreenCanvas = !0);
      } catch (t) {
        console.warn("Error checking AI capabilities:", t.message);
      }
      return e.summary = this._generateAISummary(e), e.hasAnyAI = e.faceDetection || e.objectDetection || e.saliencyDetection || e.entropyDetection, e;
    });
    /**
     * Generate AI capability summary
     * @private
     */
    l(this, "_generateAISummary", (e) => {
      const t = [], i = [];
      return e.faceDetection ? t.push("Face Detection") : i.push("Face Detection (requires FaceDetector API)"), e.objectDetection ? t.push("Object Detection") : i.push("Object Detection (requires TensorFlow.js)"), e.saliencyDetection ? t.push("Saliency Detection") : i.push("Saliency Detection (requires TensorFlow.js)"), e.entropyDetection ? t.push("Entropy Analysis") : i.push("Entropy Analysis (requires TensorFlow.js)"), {
        available: t,
        unavailable: i,
        hasAdvancedAI: e.tensorFlowAvailable,
        canUseWorkers: e.workerAvailable && e.offscreenCanvas,
        recommendedMode: e.faceDetection ? "face" : e.objectDetection ? "object" : e.saliencyDetection ? "saliency" : "center"
      };
    });
    /**
     * Process an image with smart crop operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @param {Object} previousDimensions - Optional dimensions from previous step
     * @returns {Promise<Object>} Processing result with smart crop details
     */
    l(this, "process", async (e, t = null) => {
      const i = await this._validateOptions(), s = this._validateImage(e);
      if (!s.canProcess) {
        if (this.fallbackToSimple && ["center", "top", "bottom", "left", "right"].includes(this.mode))
          return console.warn("Smart crop not possible, falling back to simple crop"), this._fallbackToSimpleCrop(e, t);
        throw new Error(`Cannot process image: ${s.errors.join(", ")}`);
      }
      const a = t?.width || e.width, n = t?.height || e.height;
      console.log(`Smart crop starting: ${a}x${n} -> ${this.width}x${this.height}`);
      let r;
      try {
        r = await this._detectRegionOfInterest(e), r.confidence < this.confidenceThreshold / 100 && this.fallbackToSimple && (console.warn(`Low confidence (${r.confidence}), falling back to ${this.mode} mode`), r.focusPoint = this._getFocusPointForMode(this.mode, a, n));
      } catch (p) {
        if (console.warn("Detection failed, using fallback:", p.message), this.fallbackToSimple)
          r = {
            focusPoint: this._getFocusPointForMode(this.mode, a, n),
            confidence: 0.5,
            usingFallback: !0
          };
        else
          throw new Error(`Detection failed: ${p.message}`);
      }
      const o = this._calculateResizeDimensions(
        a,
        n,
        r
      ), h = this._validateResizeDimensions(o, a, n);
      if (!h.valid) {
        if (this.fallbackToSimple)
          return console.warn("Resize validation failed, using simple crop"), this._fallbackToSimpleCrop(e, t);
        throw new Error(`Resize calculation failed: ${h.errors.join(", ")}`);
      }
      let c;
      try {
        c = await this._calculateSmartCropArea(
          r,
          o,
          a,
          n
        );
      } catch (p) {
        if (console.warn("Smart crop calculation failed:", p.message), this.fallbackToSimple)
          return this._fallbackToSimpleCrop(e, t);
        throw p;
      }
      const g = {
        success: !0,
        operation: this.name,
        smartCrop: !0,
        steps: {
          detection: r,
          resize: o,
          crop: c
        },
        sourceDimensions: {
          width: a,
          height: n,
          aspectRatio: a / n
        },
        targetDimensions: {
          width: this.width,
          height: this.height,
          aspectRatio: this.width / this.height
        },
        finalDimensions: {
          width: c.finalWidth || this.width,
          height: c.finalHeight || this.height
        },
        cropOffsets: {
          x: c.cropX,
          y: c.cropY,
          width: c.cropWidth || this.width,
          height: c.cropHeight || this.height
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
        warnings: [...i.warnings, ...s.warnings, ...h.warnings],
        recommendations: [],
        metadata: {
          detectedObjects: r.objects?.length || 0,
          hasFaces: r.faces?.length > 0,
          hasSaliency: r.saliencyArea !== null,
          contentPreserved: this._calculateContentPreservation(r, c),
          aiCapabilities: this.aiCapabilities?.summary,
          usingFallback: r.usingFallback || !1,
          validation: {
            optionsValid: i.errors.length === 0,
            imageValid: s.canProcess,
            resizeValid: h.valid,
            aiAvailable: this.aiCapabilities?.hasAnyAI || !1
          },
          processingTime: Date.now(),
          processedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      return this._addSmartCropWarnings(r, o, c, g), g;
    });
    /**
     * Fallback to simple crop when AI/smart crop fails
     * @private
     */
    l(this, "_fallbackToSimpleCrop", (e, t) => {
      const i = t?.width || e.width, s = t?.height || e.height, a = x.simpleCrop(
        i,
        s,
        this.width,
        this.height,
        this.mode
      );
      return {
        success: !0,
        operation: this.name,
        smartCrop: !1,
        fallbackUsed: !0,
        sourceDimensions: {
          width: i,
          height: s,
          aspectRatio: i / s
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
          x: a.cropX,
          y: a.cropY,
          width: a.cropWidth,
          height: a.cropHeight
        },
        settings: {
          mode: this.mode,
          width: this.width,
          height: this.height,
          usingSimpleCrop: !0
        },
        warnings: [{
          type: "AI_UNAVAILABLE",
          message: "AI features not available, using simple crop",
          severity: "warning",
          suggestion: "Check browser compatibility or use simple crop modes"
        }],
        metadata: {
          usingFallback: !0,
          fallbackReason: "AI not available or failed",
          scale: a.scale,
          processingTime: Date.now(),
          processedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    });
    /**
     * Get focus point for simple crop modes
     * @private
     */
    l(this, "_getFocusPointForMode", (e, t, i) => {
      switch (e) {
        case "center":
          return { x: t / 2, y: i / 2 };
        case "top":
          return { x: t / 2, y: i * 0.25 };
        case "bottom":
          return { x: t / 2, y: i * 0.75 };
        case "left":
          return { x: t * 0.25, y: i / 2 };
        case "right":
          return { x: t * 0.75, y: i / 2 };
        case "top-left":
          return { x: t * 0.25, y: i * 0.25 };
        case "top-right":
          return { x: t * 0.75, y: i * 0.25 };
        case "bottom-left":
          return { x: t * 0.25, y: i * 0.75 };
        case "bottom-right":
          return { x: t * 0.75, y: i * 0.75 };
        default:
          return { x: t / 2, y: i / 2 };
      }
    });
    /**
     * Validate resize dimensions
     * @private
     */
    l(this, "_validateResizeDimensions", (e, t, i) => {
      const s = [];
      let a = !0;
      const { width: n, height: r, requiresUpscaling: o } = e, h = n / t, c = r / i;
      return (h < 0.1 || c < 0.1) && s.push({
        code: "EXTREME_DOWNSCALING",
        message: `Extreme downscaling detected (scale: ${Math.min(h, c).toFixed(2)})`,
        severity: "warning",
        suggestion: "Consider larger target dimensions or source image"
      }), (h > 4 || c > 4) && !this.upscale && (s.push({
        code: "EXTREME_UPSCALING_NEEDED",
        message: "Extreme upscaling needed but upscale disabled",
        severity: "warning",
        suggestion: "Enable upscaling or use smaller target dimensions"
      }), a = !1), (n < 10 || r < 10) && s.push({
        code: "RESIZE_TOO_SMALL",
        message: `Resized dimensions very small: ${n}x${r}`,
        severity: "warning"
      }), n * r > 1e8 && s.push({
        code: "RESIZE_TOO_LARGE",
        message: `Resized image very large: ${Math.round(n * r / 1e6)}MP`,
        severity: "warning",
        suggestion: "Consider smaller target dimensions"
      }), { valid: a, warnings: s };
    });
    /**
     * Calculate resize dimensions
     * @private
     */
    l(this, "_calculateResizeDimensions", (e, t, i) => {
      const s = e / t, a = this.width / this.height;
      let n, r;
      if (this.preserveAspectRatio) {
        const h = Math.max(this.width / e, this.height / t);
        n = Math.round(e * h), r = Math.round(t * h);
      } else
        n = this.width, r = this.height;
      const o = n > e || r > t;
      return {
        width: n,
        height: r,
        sourceAspect: s,
        targetAspect: a,
        scale: n / e,
        requiresUpscaling: o,
        fitsTargetAspect: Math.abs(s - a) < 0.01
      };
    });
    /**
     * Calculate smart crop area
     * @private
     */
    l(this, "_calculateSmartCropArea", (e, t, i, s) => {
      const { focusPoint: a } = e, { width: n, height: r, scale: o } = t, h = a.x * n, c = a.y * r;
      let g = Math.max(0, Math.min(n - this.width, h - this.width / 2)), p = Math.max(0, Math.min(r - this.height, c - this.height / 2));
      const m = Math.round(n / 3), d = Math.round(r / 3), w = [
        { x: m, y: d },
        { x: m * 2, y: d },
        { x: m, y: d * 2 },
        { x: m * 2, y: d * 2 }
      ];
      let f = { x: g + this.width / 2, y: p + this.height / 2 }, y = 1 / 0;
      for (const b of w) {
        const S = Math.sqrt(Math.pow(b.x - h, 2) + Math.pow(b.y - c, 2));
        S < y && (y = S, f = b);
      }
      return g = Math.max(0, Math.min(n - this.width, f.x - this.width / 2)), p = Math.max(0, Math.min(r - this.height, f.y - this.height / 2)), {
        cropX: Math.round(g),
        cropY: Math.round(p),
        cropWidth: this.width,
        cropHeight: this.height,
        finalWidth: this.width,
        finalHeight: this.height,
        scale: o,
        ruleOfThirdsApplied: !0,
        focusPoint: { x: h, y: c },
        adjustedFocusPoint: f
      };
    });
    /**
     * Calculate content preservation percentage
     * @private
     */
    l(this, "_calculateContentPreservation", (e, t) => {
      if (!e.faces?.length && !e.objects?.length)
        return 100;
      let i = 0, s = 0;
      return e.faces?.length && e.faces.forEach((a) => {
        const n = a.boundingBox.width * a.boundingBox.height;
        i += n;
        const r = a.boundingBox.x + a.boundingBox.width / 2, o = a.boundingBox.y + a.boundingBox.height / 2;
        r >= t.cropX && r <= t.cropX + t.cropWidth && o >= t.cropY && o <= t.cropY + t.cropHeight && (s += n);
      }), e.objects?.length && e.objects.forEach((a) => {
        const n = a.boundingBox.width * a.boundingBox.height;
        i += n;
        const r = a.boundingBox.x + a.boundingBox.width / 2, o = a.boundingBox.y + a.boundingBox.height / 2;
        r >= t.cropX && r <= t.cropX + t.cropWidth && o >= t.cropY && o <= t.cropY + t.cropHeight && (s += n);
      }), i > 0 ? Math.round(s / i * 100) : 100;
    });
    /**
     * Add smart crop warnings
     * @private
     */
    l(this, "_addSmartCropWarnings", (e, t, i, s) => {
      const a = s.metadata.contentPreserved;
      a < 80 && s.warnings.push({
        type: "CONTENT_LOSS",
        message: `Only ${a}% of detected content preserved in crop`,
        severity: "warning",
        suggestion: "Consider adjusting crop dimensions or using different focus point"
      }), t.requiresUpscaling && !this.upscale && s.warnings.push({
        type: "UPSCALING_REQUIRED",
        message: "Crop requires upscaling but upscale is disabled",
        severity: "info",
        suggestion: "Enable upscaling or use smaller crop dimensions"
      }), e.usingFallback && s.warnings.push({
        type: "AI_FALLBACK_USED",
        message: "AI detection failed, using fallback crop method",
        severity: "info",
        suggestion: "Check image quality or adjust confidence threshold"
      });
    });
    /**
     * STEP 1: Detect region of interest using AI/computer vision
     * @private
     */
    l(this, "_detectRegionOfInterest", async (e) => {
      const t = {
        faces: [],
        objects: [],
        saliencyArea: null,
        entropyMap: null,
        focusPoint: { x: 0.5, y: 0.5 },
        // Default center
        confidence: 0,
        capabilitiesUsed: []
      };
      try {
        this.aiCapabilities || (this.aiCapabilities = await this._checkAICapabilities());
        const i = await createImageBitmap(e.file);
        (this.mode === "face" || this.mode === "smart") && this.aiCapabilities.faceDetection && (t.faces = await this._detectFaces(i), t.faces.length > 0 && (t.focusPoint = this._calculateFaceCenter(t.faces), t.confidence = Math.max(...t.faces.map((s) => s.confidence)), t.capabilitiesUsed.push("face-detection"))), (this.mode === "object" || this.mode === "smart") && this.aiCapabilities.objectDetection && (t.objects = await this._detectObjects(i), t.objects.length > 0 && (t.focusPoint = this._calculateObjectCenter(t.objects), t.confidence = Math.max(...t.objects.map((s) => s.confidence)), t.capabilitiesUsed.push("object-detection"))), (this.mode === "saliency" || this.mode === "smart") && this.aiCapabilities.saliencyDetection && (t.saliencyArea = await this._detectSaliency(i), t.saliencyArea && (t.focusPoint = t.saliencyArea.center, t.confidence = t.saliencyArea.confidence, t.capabilitiesUsed.push("saliency-detection"))), (this.mode === "entropy" || this.mode === "smart") && this.aiCapabilities.entropyDetection && (t.entropyMap = await this._calculateEntropy(i), t.entropyMap && (t.focusPoint = t.entropyMap.highestEntropyPoint, t.confidence = t.entropyMap.confidence, t.capabilitiesUsed.push("entropy-analysis"))), t.confidence < this.confidenceThreshold / 100 && (console.log("Low confidence detection, using center focus"), t.focusPoint = { x: 0.5, y: 0.5 }, t.confidence = 0.5, t.capabilitiesUsed.push("fallback-center")), i.close();
      } catch (i) {
        console.warn("AI detection failed:", i.message), t.focusPoint = { x: 0.5, y: 0.5 }, t.confidence = 0.5, t.capabilitiesUsed.push("error-fallback"), t.error = i.message;
      }
      return t;
    });
    /**
     * Detect faces in image with error handling
     * @private
     */
    l(this, "_detectFaces", async (e) => {
      const t = [];
      try {
        if (typeof FaceDetector < "u") {
          const s = await new FaceDetector({
            maxDetectedFaces: this.multipleFaces ? 10 : 1,
            fastMode: !0
          }).detect(e);
          t.push(...s.map((a) => ({
            boundingBox: a.boundingBox,
            confidence: a.confidence || 0.8,
            landmarks: a.landmarks || [],
            type: "face"
          })));
        }
      } catch (i) {
        console.warn("Face detection failed:", i.message);
      }
      return t;
    });
    /**
     * Calculate face center from multiple faces
     * @private
     */
    l(this, "_calculateFaceCenter", (e) => {
      if (!e.length) return { x: 0.5, y: 0.5 };
      let t = 0, i = 0, s = 0;
      return e.forEach((a) => {
        const n = a.confidence || 0.5, r = a.boundingBox.x + a.boundingBox.width / 2, o = a.boundingBox.y + a.boundingBox.height / 2;
        t += r * n, i += o * n, s += n;
      }), {
        x: s > 0 ? t / s : 0.5,
        y: s > 0 ? i / s : 0.5
      };
    });
    /**
     * Detect objects in image (simulated fallback)
     * @private
     */
    l(this, "_detectObjects", async (e) => {
      const t = [];
      try {
        typeof tf < "u" && console.log("TensorFlow.js object detection would run here");
      } catch (i) {
        console.warn("Object detection failed:", i.message);
      }
      return t;
    });
    /**
     * Calculate object center
     * @private
     */
    l(this, "_calculateObjectCenter", (e) => {
      if (!e.length) return { x: 0.5, y: 0.5 };
      let t = 0, i = 0, s = 0;
      return e.forEach((a) => {
        const n = a.confidence || 0.5, r = a.boundingBox.x + a.boundingBox.width / 2, o = a.boundingBox.y + a.boundingBox.height / 2;
        t += r * n, i += o * n, s += n;
      }), {
        x: s > 0 ? t / s : 0.5,
        y: s > 0 ? i / s : 0.5
      };
    });
    /**
     * Detect saliency (simulated fallback)
     * @private
     */
    l(this, "_detectSaliency", async (e) => ({
      center: { x: 0.5, y: 0.5 },
      confidence: 0.6,
      method: "simulated"
    }));
    /**
     * Calculate entropy (simulated fallback)
     * @private
     */
    l(this, "_calculateEntropy", async (e) => ({
      highestEntropyPoint: { x: 0.5, y: 0.5 },
      confidence: 0.7,
      method: "simulated"
    }));
    this.width = e.width || 1080, this.height = e.height || 1080, this.mode = e.mode || "smart", this.upscale = e.upscale || !1, this.algorithm = e.algorithm || "lanczos3", this.preserveAspectRatio = e.preserveAspectRatio !== !1, this.confidenceThreshold = Math.max(0, Math.min(100, e.confidenceThreshold || 70)), this.multipleFaces = e.multipleFaces || !1, this.objectsToDetect = e.objectsToDetect || ["person", "face", "car", "dog", "cat"], this.cropToFit = e.cropToFit !== !1, this.skipSvg = e.skipSvg !== !1, this.minSourceDimension = e.minSourceDimension || 200, this.fallbackToSimple = e.fallbackToSimple !== !1, this.name = "LemGendaryCrop", this.version = "3.0.0", this.aiCapabilities = null;
  }
  /**
   * Simple crop algorithm (static method)
   * @static
   */
  static simpleCrop(e, t, i, s, a = "center") {
    const n = Math.max(i / e, s / t), r = Math.round(e * n), o = Math.round(t * n);
    let h, c;
    switch (a) {
      case "top":
        h = (r - i) / 2, c = 0;
        break;
      case "bottom":
        h = (r - i) / 2, c = o - s;
        break;
      case "left":
        h = 0, c = (o - s) / 2;
        break;
      case "right":
        h = r - i, c = (o - s) / 2;
        break;
      case "top-left":
        h = 0, c = 0;
        break;
      case "top-right":
        h = r - i, c = 0;
        break;
      case "bottom-left":
        h = 0, c = o - s;
        break;
      case "bottom-right":
        h = r - i, c = o - s;
        break;
      case "center":
      default:
        h = (r - i) / 2, c = (o - s) / 2;
    }
    return {
      cropX: Math.max(0, Math.round(h)),
      cropY: Math.max(0, Math.round(c)),
      cropWidth: i,
      cropHeight: s,
      scale: n,
      scaledWidth: r,
      scaledHeight: o,
      mode: a
    };
  }
  /**
   * Get processor description
   * @returns {string} Description
   */
  static getDescription() {
    return "LemGendaryCrop™: AI-powered smart cropping with enhanced validation, fallback handling, and detailed capability reporting.";
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  static getInfo() {
    return {
      name: "LemGendaryCrop",
      version: "3.0.0",
      description: this.getDescription(),
      modes: ["smart", "face", "object", "saliency", "entropy", "center", "top", "bottom", "left", "right"],
      features: [
        "Enhanced validation system",
        "AI capability detection",
        "Graceful fallback handling",
        "Face detection",
        "Object detection",
        "Saliency detection",
        "Entropy calculation",
        "Rule of thirds alignment",
        "Content-aware resizing",
        "SVG/ICO support",
        "Batch processing"
      ],
      requirements: {
        faceDetection: "FaceDetector API",
        objectDetection: "TensorFlow.js",
        saliencyDetection: "Canvas API",
        minimumBrowser: "Chrome 94+, Firefox 92+, Safari 15.4+"
      },
      validationLevel: "enhanced"
    };
  }
  /**
   * Validate if processor can handle given image
   * @param {LemGendImage} image - Image to check
   * @returns {Object} Validation result
   */
  static async canProcess(e) {
    const t = new x();
    try {
      await t._validateOptions();
      const i = t._validateImage(e), s = await t._checkAICapabilities();
      return {
        canProcess: i.canProcess,
        reason: i.canProcess ? "Image can be processed" : i.errors.join(", "),
        warnings: i.warnings,
        aiCapabilities: s.summary,
        supportedModes: s.hasAnyAI ? ["smart", "face", "object", "saliency", "entropy", "center", "top", "bottom", "left", "right"] : ["center", "top", "bottom", "left", "right"],
        enhancedValidation: !0
      };
    } catch (i) {
      return {
        canProcess: !1,
        reason: i.message,
        warnings: [],
        aiCapabilities: null,
        enhancedValidation: !0
      };
    }
  }
}
class _ {
  /**
   * Create a LemGendaryOptimize processor
   * @param {Object} options - Optimization options
   * @param {number} options.quality - Quality percentage (1-100)
   * @param {string} options.format - Output format: 'auto', 'webp', 'jpg', 'png', 'avif', 'ico', 'svg', 'original'
   * @param {boolean} options.lossless - Use lossless compression (for PNG/WebP)
   * @param {boolean} options.stripMetadata - Remove metadata (EXIF, etc.)
   * @param {boolean} options.preserveTransparency - Preserve transparency when possible
   * @param {Array<number>} options.icoSizes - Specific sizes for ICO format
   * @param {number} options.maxDisplayWidth - Maximum display width for optimization (optional)
   * @param {Array} options.browserSupport - Browser support requirements ['modern', 'legacy']
   * @param {string} options.compressionMode - 'adaptive', 'aggressive', 'balanced'
   * @param {boolean} options.analyzeContent - Enable content analysis for smart optimization
   */
  constructor(e = {}) {
    /**
    * Validate processor options using enhanced validation
    * @private
    */
    l(this, "_validateOptions", () => {
      let e;
      try {
        e = require("./validation.js").validateOptimizationOptions;
      } catch {
        e = this._basicValidateOptimizationOptions;
      }
      const t = e({
        format: this.format,
        quality: this.quality,
        maxDisplayWidth: this.maxDisplayWidth,
        browserSupport: this.browserSupport,
        compressionMode: this.compressionMode,
        stripMetadata: this.stripMetadata,
        preserveTransparency: this.preserveTransparency,
        lossless: this.lossless,
        icoSizes: this.icoSizes
      });
      if (!t.valid) {
        const i = t.errors.map((s) => s.message).join(", ");
        throw new Error(`Invalid optimization options: ${i}`);
      }
      t.warnings.length > 0 && console.warn("Optimization warnings:", t.warnings.map((i) => i.message)), this.format === "avif" && (this.quality = Math.min(63, Math.round(this.quality * 0.63))), this.format === "png" && this.preserveTransparency && (this.lossless = !0), this.format === "ico" && this.icoSizes.sort((i, s) => i - s);
    });
    /**
     * Basic validation fallback
     * @private
     */
    l(this, "_basicValidateOptimizationOptions", (e) => {
      const t = [], i = [];
      return (e.quality < 1 || e.quality > 100) && t.push({
        code: "INVALID_QUALITY",
        message: `Quality must be between 1-100, got ${e.quality}`,
        severity: "error"
      }), ["auto", "webp", "jpg", "jpeg", "png", "avif", "ico", "svg", "original"].includes(e.format) || t.push({
        code: "INVALID_FORMAT",
        message: `Invalid format: ${e.format}`,
        severity: "error"
      }), { valid: t.length === 0, errors: t, warnings: i };
    });
    /**
     * Check format compatibility
     * @private
     */
    l(this, "_checkCompatibility", (e, t) => {
      const s = {
        jpg: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/x-icon"],
        jpeg: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/x-icon"],
        png: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", "image/x-icon"],
        webp: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", "image/x-icon"],
        avif: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-icon"],
        ico: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/x-icon"],
        svg: ["image/svg+xml", "image/png", "image/webp"],
        original: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/svg+xml", "image/x-icon"]
      }[t]?.includes(e.type) || !1;
      return {
        compatible: s,
        reason: s ? "Format supported" : `Cannot convert ${e.type} to ${t}`,
        requiresRasterization: e.type === "image/svg+xml" && t !== "original" && t !== "svg",
        requiresFaviconProcessing: t === "ico"
      };
    });
    /**
     * Process an image with optimization
     * @param {LemGendImage} lemGendImage - Image to process
     * @returns {Promise<Object>} Optimization result
     */
    l(this, "process", async (e) => {
      if (this._validateOptions(), !e)
        throw new Error("Invalid image");
      const t = await this._analyzeImage(e), i = this._selectBestFormat(t), s = this._checkCompatibility(e, i);
      if (!s.compatible)
        throw new Error(`Format not compatible: ${s.reason}`);
      const a = this._calculateResizeDimensions(t), n = this._calculateCompression(t, i), r = this._estimateSavings(t, i, n, a);
      return {
        success: !0,
        operation: this.name,
        originalInfo: {
          ...t.metadata,
          name: e.originalName
        },
        optimization: {
          selectedFormat: i === "original" ? e.extension : i,
          compression: n,
          resizeInfo: a,
          browserSupport: this.browserSupport,
          compressionMode: this.compressionMode,
          compatibility: s,
          recommendedForWeb: this._isRecommendedForWeb(t, i)
        },
        analysis: t,
        savings: r,
        recommendations: t.recommendations,
        warnings: t.warnings,
        metadata: {
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          processorVersion: this.version,
          optimizationLevel: this._getOptimizationLevel(n, r)
        }
      };
    });
    this.quality = Math.max(1, Math.min(100, e.quality || 85)), this.format = e.format || "auto", this.lossless = e.lossless || !1, this.stripMetadata = e.stripMetadata !== !1, this.preserveTransparency = e.preserveTransparency !== !1, this.icoSizes = e.icoSizes || [16, 32, 48, 64, 128, 256], this.maxDisplayWidth = e.maxDisplayWidth || null, this.browserSupport = e.browserSupport || ["modern", "legacy"], this.compressionMode = e.compressionMode || "adaptive", this.analyzeContent = e.analyzeContent !== !1, this.name = "LemGendaryOptimize", this.version = "2.0.0", this.formatPriorities = this._getFormatPriorities();
  }
  /**
   * Get format priorities based on browser support
   * @private
   */
  _getFormatPriorities() {
    return {
      avif: {
        quality: 0.9,
        browserSupport: this.browserSupport.includes("modern") ? 0.9 : 0.7,
        compression: 0.8,
        supportsTransparency: !0,
        maxQuality: 63
        // AVIF has different quality scale
      },
      webp: {
        quality: 0.8,
        browserSupport: this.browserSupport.includes("legacy") ? 0.9 : 0.98,
        compression: 0.7,
        supportsTransparency: !0,
        maxQuality: 100
      },
      jpg: {
        quality: 0.7,
        browserSupport: 1,
        compression: 0.6,
        supportsTransparency: !1,
        maxQuality: 100
      },
      png: {
        quality: 0.9,
        browserSupport: 1,
        compression: 0.5,
        supportsTransparency: !0,
        maxQuality: 100
      },
      ico: {
        quality: 1,
        browserSupport: 1,
        compression: 0.5,
        supportsTransparency: !0,
        maxQuality: 100
      }
    };
  }
  /**
   * Analyze image metadata and content for intelligent optimization
   * @private
   */
  async _analyzeImage(e) {
    const t = {
      metadata: {
        width: e.width,
        height: e.height,
        aspectRatio: e.aspectRatio,
        orientation: e.orientation,
        hasTransparency: e.transparency,
        fileSize: e.originalSize,
        format: e.extension,
        mimeType: e.type,
        isFavicon: e.type.includes("icon") || e.extension === "ico"
      },
      content: {
        isPhotographic: this._guessIsPhotographic(e),
        hasText: !1,
        isGraphic: this._guessIsGraphic(e),
        complexity: "medium"
      },
      recommendations: [],
      warnings: []
    };
    return e.type === "image/svg+xml" && (t.content.isGraphic = !0, t.content.complexity = "low", t.recommendations.push("SVG format detected - vector graphics optimized differently")), e.transparency && (t.content.isGraphic = !0, t.recommendations.push("Transparency detected - PNG or WebP recommended")), (e.width > 2e3 || e.height > 2e3) && t.recommendations.push("Large dimensions - consider resizing for web use"), e.originalSize > 1024 * 1024 && t.recommendations.push("Large file size - significant compression possible"), this.format === "jpg" && e.transparency && t.warnings.push({
      type: "transparency_loss",
      message: "JPEG format will remove transparency",
      severity: "warning"
    }), t;
  }
  /**
   * Guess if image is photographic
   * @private
   */
  _guessIsPhotographic(e) {
    const { width: t, height: i } = e, s = t / i;
    return [3 / 2, 4 / 3, 16 / 9, 1, 5 / 4].some(
      (r) => Math.abs(s - r) < 0.1
    ) && t * i > 5e5;
  }
  /**
   * Guess if image is graphic/illustration
   * @private
   */
  _guessIsGraphic(e) {
    return e.type === "image/svg+xml" || e.transparency || e.width <= 1e3 && e.height <= 1e3;
  }
  /**
   * Intelligent format selection when 'auto' is specified
   * @private
   */
  _selectBestFormat(e) {
    if (this.format !== "auto")
      return this.format;
    const t = {}, { hasTransparency: i, isFavicon: s } = e.metadata, { isGraphic: a } = e.content, { width: n, height: r } = e.metadata, o = s ? ["ico", "png", "webp"] : ["webp", "avif", "jpg", "png"];
    for (const c of o) {
      const g = this.formatPriorities[c];
      if (!g) continue;
      let p = g.browserSupport * 0.4 + g.compression * 0.3 + g.quality * 0.3;
      i && !g.supportsTransparency && (p *= 0.3), a && c === "png" && (p *= 1.3), n * r > 2e6 && c === "avif" && (p *= 1.2), s && c === "ico" && (p *= 2), t[c] = p;
    }
    return Object.keys(t).reduce((c, g) => t[c] > t[g] ? c : g) || "webp";
  }
  /**
   * Calculate adaptive compression settings
   * @private
   */
  _calculateCompression(e, t) {
    let i = this.quality, s = "balanced", a = this.lossless;
    const { hasTransparency: n } = e.metadata, { isGraphic: r, isPhotographic: o } = e.content, h = this.formatPriorities[t];
    switch (h && h.maxQuality && (i = Math.min(i, h.maxQuality)), r && t === "png" ? (a = !0, i = 100) : o && t === "jpg" && (i = Math.max(75, i)), this.compressionMode) {
      case "aggressive":
        i = Math.max(60, i * 0.8), s = "high";
        break;
      case "balanced":
        s = "medium";
        break;
      case "adaptive":
        e.metadata.width * e.metadata.height / 1e6 > 2 && (i = Math.max(70, i * 0.9), s = "high");
        break;
    }
    return n && t === "jpg" && (i = Math.max(85, i)), {
      quality: Math.round(i),
      compressionLevel: s,
      lossless: t === "png" && a,
      progressive: t === "jpg" || t === "webp",
      preserveTransparency: n && this.preserveTransparency
    };
  }
  /**
   * Calculate resizing if maxDisplayWidth is set
   * @private
   */
  _calculateResizeDimensions(e) {
    if (!this.maxDisplayWidth)
      return null;
    const { width: t, height: i } = e.metadata;
    if (t <= this.maxDisplayWidth && i <= this.maxDisplayWidth)
      return null;
    let s, a;
    t >= i ? (s = Math.min(t, this.maxDisplayWidth), a = Math.round(i / t * s)) : (a = Math.min(i, this.maxDisplayWidth), s = Math.round(t / i * a));
    const n = 100;
    return s < n && (s = n), a < n && (a = n), {
      width: s,
      height: a,
      originalWidth: t,
      originalHeight: i,
      resizeRatio: s / t,
      resizeNeeded: !0
    };
  }
  /**
   * Estimate file size savings
   * @private
   */
  _estimateSavings(e, t, i, s) {
    const a = e.metadata.fileSize;
    let n = a;
    const r = this.formatPriorities[t];
    if (r && (n *= r.compression), n *= i.quality / 100, s && s.resizeNeeded) {
      const h = s.width * s.height / (e.metadata.width * e.metadata.height);
      n *= h;
    }
    return i.compressionLevel === "high" ? n *= 0.9 : i.compressionLevel === "medium" && (n *= 0.95), e.metadata.hasTransparency && t !== "jpg" && (n *= 1.1), {
      originalSize: a,
      estimatedSize: Math.round(n),
      savings: a - Math.round(n),
      savingsPercent: Math.round((a - n) / a * 1e3) / 10,
      compressionRatio: (a / n).toFixed(2)
    };
  }
  /**
   * Determine if format is recommended for web
   * @private
   */
  _isRecommendedForWeb(e, t) {
    return ["webp", "avif", "jpg", "png"].includes(t) && e.metadata.fileSize < 5e6;
  }
  /**
   * Get optimization level
   * @private
   */
  _getOptimizationLevel(e, t) {
    return t.savingsPercent > 70 ? "high" : t.savingsPercent > 40 ? "medium" : "low";
  }
  /**
   * Apply optimization to create optimized file (for ZIP preparation)
   * @param {LemGendImage} lemGendImage - Image to optimize
   * @returns {Promise<File>} Optimized file
   */
  async applyOptimization(e) {
    const t = await this.process(e);
    return new Promise((i, s) => {
      const a = new Image();
      a.onload = () => {
        try {
          const n = document.createElement("canvas"), r = n.getContext("2d");
          let o = a.width, h = a.height;
          t.optimization.resizeInfo && t.optimization.resizeInfo.resizeNeeded && (o = t.optimization.resizeInfo.width, h = t.optimization.resizeInfo.height), n.width = o, n.height = h;
          const c = t.optimization.selectedFormat, g = t.originalInfo.hasTransparency;
          (c === "jpg" || c === "jpeg") && !g && (r.fillStyle = "#ffffff", r.fillRect(0, 0, o, h)), r.drawImage(a, 0, 0, o, h);
          let p;
          switch (c) {
            case "webp":
              p = "image/webp";
              break;
            case "avif":
              p = "image/avif";
              break;
            case "jpg":
            case "jpeg":
              p = "image/jpeg";
              break;
            case "png":
              p = "image/png";
              break;
            case "ico":
              p = "image/x-icon";
              break;
            default:
              p = "image/webp";
          }
          const m = t.optimization.compression.quality / 100;
          n.toBlob(
            (d) => {
              if (!d) {
                s(new Error("Failed to create blob"));
                return;
              }
              const w = c, y = `${e.originalName.replace(/\.[^/.]+$/, "")}-optimized.${w}`;
              i(new File([d], y, { type: p }));
            },
            p,
            m
          );
        } catch (n) {
          s(n);
        }
      }, a.onerror = () => s(new Error("Failed to load image")), a.src = URL.createObjectURL(e.file);
    });
  }
  /**
   * Prepare images for ZIP with optimization
   * @param {Array<LemGendImage>} images - Images to prepare
   * @returns {Promise<Array>} Prepared images with optimization results
   */
  async prepareForZip(e) {
    const t = [];
    for (const i of e)
      try {
        const s = await this.process(i), a = await this.applyOptimization(i);
        t.push({
          original: i,
          optimized: a,
          result: s,
          success: !0
        });
      } catch (s) {
        t.push({
          original: i,
          error: s.message,
          success: !1
        });
      }
    return t;
  }
  /**
   * Generate optimization report
   * @param {Array} optimizationResults - Results from prepareForZip
   * @returns {Object} Optimization report
   */
  generateOptimizationReport(e) {
    const t = e.filter((o) => o.success), i = e.filter((o) => !o.success), s = t.reduce((o, h) => o + h.original.originalSize, 0), a = t.reduce((o, h) => o + h.result.savings.estimatedSize, 0), n = s - a, r = (n / s * 100).toFixed(1);
    return {
      summary: {
        totalImages: e.length,
        successful: t.length,
        failed: i.length,
        totalOriginalSize: s,
        totalOptimizedSize: a,
        totalSavings: n,
        savingsPercentage: `${r}%`,
        averageCompressionRatio: (s / a).toFixed(2),
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      successfulImages: t.map((o) => ({
        name: o.original.originalName,
        originalSize: o.original.originalSize,
        optimizedSize: o.result.savings.estimatedSize,
        savings: o.result.savings.savings,
        savingsPercent: o.result.savings.savingsPercent,
        format: o.result.optimization.selectedFormat,
        dimensions: `${o.result.originalInfo.width}x${o.result.originalInfo.height}`,
        optimizedDimensions: o.result.optimization.resizeInfo ? `${o.result.optimization.resizeInfo.width}x${o.result.optimization.resizeInfo.height}` : `${o.result.originalInfo.width}x${o.result.originalInfo.height}`
      })),
      failedImages: i.map((o) => ({
        name: o.original.originalName,
        error: o.error
      })),
      recommendations: this._extractRecommendations(t)
    };
  }
  /**
   * Extract recommendations from optimization results
   * @private
   */
  _extractRecommendations(e) {
    const t = [], i = e.map((n) => n.result.optimization.selectedFormat), s = [...new Set(i)];
    s.length > 2 && t.push({
      type: "format_standardization",
      message: `Multiple formats used: ${s.join(", ")}`,
      suggestion: "Consider standardizing on 1-2 formats for consistency"
    });
    const a = e.filter(
      (n) => n.original.originalSize > 5 * 1024 * 1024
      // > 5MB
    );
    return a.length > 0 && t.push({
      type: "large_source_files",
      message: `${a.length} images were originally very large`,
      suggestion: "Consider using smaller source images for web"
    }), t;
  }
  /**
   * Get processor description
   * @returns {string} Description
   */
  static getDescription() {
    return "LemGendaryOptimize™: Advanced image optimization with intelligent format selection, adaptive compression, and ZIP preparation.";
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  static getInfo() {
    return {
      name: "LemGendaryOptimize",
      version: "2.0.0",
      description: this.getDescription(),
      supportedFormats: ["auto", "webp", "jpg", "jpeg", "png", "avif", "ico", "svg", "original"],
      features: [
        "Intelligent format selection",
        "Adaptive compression",
        "Content-aware optimization",
        "Browser compatibility analysis",
        "Pre-ZIP optimization",
        "Size estimation",
        "Optimization reporting"
      ],
      optimizationModes: ["adaptive", "aggressive", "balanced"]
    };
  }
  /**
   * Create processor from configuration object
   * @param {Object} config - Processor configuration
   * @returns {LemGendaryOptimize} New processor instance
   */
  static fromConfig(e) {
    return new _(e);
  }
}
class A {
  /**
   * Create a LemGendaryRename processor
   * @param {Object} options - Rename options
   * @param {string} options.pattern - Rename pattern
   * @param {number} options.startIndex - Starting index for {index} variable
   * @param {boolean} options.preserveExtension - Keep original file extension
   * @param {string} options.dateFormat - Date format for {date} variable
   * @param {string} options.timeFormat - Time format for {time} variable
   */
  constructor(e = {}) {
    /**
     * Validate processor options
     * @private
     */
    l(this, "_validateOptions", () => {
      if (!this.pattern || this.pattern.trim() === "")
        throw new Error("Rename pattern cannot be empty");
      if (/[<>:"/\\|?*\x00-\x1F]/.test(this.pattern))
        throw new Error("Pattern contains invalid filename characters");
      if (typeof this.startIndex != "number" || this.startIndex < 0)
        throw new Error("Start index must be a positive number");
    });
    /**
     * Process an image with rename operation
     * @param {LemGendImage} lemGendImage - Image to process
     * @param {number} imageIndex - Index of image in batch
     * @param {number} totalImages - Total number of images
     * @returns {Promise<Object>} Processing result with new filename
     */
    l(this, "process", async (e, t = 0, i = 1) => {
      if (this._validateOptions(), !e)
        throw new Error("Invalid image");
      const s = this._generateVariables(e, t), a = this._applyPattern(this.pattern, s), n = {
        success: !0,
        operation: this.name,
        originalName: e.originalName,
        newName: a,
        variables: s,
        settings: {
          pattern: this.pattern,
          startIndex: this.startIndex,
          preserveExtension: this.preserveExtension
        },
        warnings: [],
        recommendations: [],
        metadata: {
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          patternVariables: Object.keys(s),
          nameLength: a.length
        }
      };
      return this._addWarningsAndRecommendations(e, a, n), n;
    });
    /**
     * Generate variables for pattern replacement
     * @private
     */
    l(this, "_generateVariables", (e, t) => {
      const i = /* @__PURE__ */ new Date(), s = {
        name: e.originalName.replace(/\.[^/.]+$/, ""),
        originalName: e.originalName,
        index: this.startIndex + t,
        width: e.width || 0,
        height: e.height || 0,
        dimensions: `${e.width || 0}x${e.height || 0}`,
        aspectRatio: e.aspectRatio ? e.aspectRatio.toFixed(2) : "0",
        orientation: e.orientation || "unknown",
        timestamp: i.getTime(),
        date: this._formatDate(i, this.dateFormat),
        time: this._formatDate(i, this.timeFormat),
        year: i.getFullYear(),
        month: String(i.getMonth() + 1).padStart(2, "0"),
        day: String(i.getDate()).padStart(2, "0"),
        hour: String(i.getHours()).padStart(2, "0"),
        minute: String(i.getMinutes()).padStart(2, "0"),
        second: String(i.getSeconds()).padStart(2, "0"),
        extension: e.extension || "unknown",
        fileSize: e.originalSize || 0,
        transparency: e.transparency ? "transparent" : "opaque"
      };
      s.dimensions_wxh = `${s.width}x${s.height}`, s.dimensions_hxw = `${s.height}x${s.width}`;
      const a = Math.max(3, String(s.index + 100).length - 1);
      return s.index_padded = String(s.index).padStart(a, "0"), s;
    });
    /**
     * Format date according to pattern
     * @private
     */
    l(this, "_formatDate", (e, t) => {
      const i = {
        YYYY: e.getFullYear(),
        YY: String(e.getFullYear()).slice(-2),
        MM: String(e.getMonth() + 1).padStart(2, "0"),
        M: e.getMonth() + 1,
        DD: String(e.getDate()).padStart(2, "0"),
        D: e.getDate(),
        HH: String(e.getHours()).padStart(2, "0"),
        H: e.getHours(),
        mm: String(e.getMinutes()).padStart(2, "0"),
        m: e.getMinutes(),
        ss: String(e.getSeconds()).padStart(2, "0"),
        s: e.getSeconds()
      };
      let s = t;
      for (const [a, n] of Object.entries(i))
        s = s.replace(new RegExp(a, "g"), n);
      return s;
    });
    /**
     * Apply pattern with variables
     * @private
     */
    l(this, "_applyPattern", (e, t) => {
      let i = e;
      for (const [s, a] of Object.entries(t)) {
        const n = `{${s}}`;
        i.includes(n) && (i = i.replace(new RegExp(this._escapeRegExp(n), "g"), String(a)));
      }
      return i = i.replace(/{[^}]+}/g, ""), i = i.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_"), i = i.replace(/[-_]{2,}/g, "-"), i = i.replace(/[ _]{2,}/g, " "), i = i.trim(), i = i.replace(/^[-_.]+|[-_.]+$/g, ""), i;
    });
    /**
     * Escape regex special characters
     * @private
     */
    l(this, "_escapeRegExp", (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    /**
     * Add warnings and recommendations to result
     * @private
     */
    l(this, "_addWarningsAndRecommendations", (e, t, i) => {
      !(this.pattern.match(/{[^}]+}/g) || []).map((c) => c.slice(1, -1)).some(
        (c) => ["index", "timestamp", "time"].includes(c)
      ) && !this.pattern.includes("{name}") && i.warnings.push({
        type: "no_unique_identifier",
        message: "Pattern may create duplicate filenames",
        severity: "warning",
        suggestion: "Include {index}, {timestamp}, or {time} for unique filenames"
      }), t.length < 3 && i.warnings.push({
        type: "very_short_name",
        message: "Filename is very short",
        severity: "warning",
        suggestion: "Consider adding more variables to the pattern"
      }), t.length > 255 && i.warnings.push({
        type: "very_long_name",
        message: "Filename exceeds 255 characters",
        severity: "error",
        suggestion: "Simplify pattern or use shorter variable names"
      }), /[~`!@#$%^&*()+=[]{}|;:',<>?]/.test(t) && i.warnings.push({
        type: "special_characters",
        message: "Filename contains special characters that may cause issues",
        severity: "warning",
        suggestion: "Use only letters, numbers, hyphens, and underscores"
      });
      const o = e.originalName.replace(/\.[^/.]+$/, "");
      this._calculateSimilarity(o, t) < 0.3 && i.recommendations.push({
        type: "significant_name_change",
        message: "Filename changed significantly from original",
        suggestion: "Consider including {name} variable to preserve original name reference"
      }), this.pattern.includes("{index}") && (i.metadata.sequentialNumbering = !0, i.metadata.startIndex = this.startIndex, i.metadata.indexPadding = this.pattern.includes("{index_padded}") ? "padded" : "unpadded");
    });
    /**
     * Calculate string similarity
     * @private
     */
    l(this, "_calculateSimilarity", (e, t) => {
      const i = e.length > t.length ? e : t, s = e.length > t.length ? t : e;
      return i.length === 0 ? 1 : s.split("").filter((n) => i.includes(n)).length / i.length;
    });
    this.pattern = e.pattern || "{name}-{index}", this.startIndex = e.startIndex || 1, this.preserveExtension = e.preserveExtension !== !1, this.dateFormat = e.dateFormat || "YYYY-MM-DD", this.timeFormat = e.timeFormat || "HH-mm-ss", this.name = "LemGendaryRename", this.version = "1.0.0";
  }
  /**
   * Get common rename patterns
   * @returns {Object} Common pattern templates
   */
  static getCommonPatterns() {
    return {
      sequential: "{name}-{index_padded}",
      dated: "{name}-{date}",
      timestamped: "{name}-{timestamp}",
      dimensioned: "{name}-{dimensions}",
      simple: "{index_padded}",
      descriptive: "{name}-{dimensions}-{date}",
      batch: "batch-{date}-{index_padded}",
      export: "export-{timestamp}",
      web: "{name}-{width}w",
      social: "{name}-{dimensions}-social"
    };
  }
  /**
   * Get processor description
   * @returns {string} Description
   */
  static getDescription() {
    return "LemGendaryRename™: Batch rename images with pattern support.";
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  static getInfo() {
    return {
      name: "LemGendaryRename",
      version: "1.0.0",
      description: this.getDescription(),
      variables: [
        "{name}",
        "{index}",
        "{index_padded}",
        "{width}",
        "{height}",
        "{dimensions}",
        "{dimensions_wxh}",
        "{dimensions_hxw}",
        "{aspectRatio}",
        "{orientation}",
        "{timestamp}",
        "{date}",
        "{time}",
        "{year}",
        "{month}",
        "{day}",
        "{hour}",
        "{minute}",
        "{second}",
        "{extension}",
        "{fileSize}",
        "{transparency}"
      ],
      commonPatterns: this.getCommonPatterns()
    };
  }
  /**
   * Create processor from configuration object
   * @param {Object} config - Processor configuration
   * @returns {LemGendaryRename} New processor instance
   */
  static fromConfig(e) {
    return new A(e);
  }
}
export {
  A as L,
  _ as a,
  x as b,
  v as c
};
//# sourceMappingURL=LemGendaryRename-CgKHgnWG.js.map
