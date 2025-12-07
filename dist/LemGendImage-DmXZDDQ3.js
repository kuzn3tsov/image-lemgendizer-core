var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { g as getFileExtension, a as analyzeForOptimization, h as hasTransparency, f as fileToDataURL, c as createThumbnail } from "./index-BOe4KKSA.js";
class LemGendImage {
  /**
   * Create a new LemGendImage instance
   * @param {File} file - The original image file
   * @param {Object} options - Configuration options
   */
  constructor(file, options = {}) {
    /**
     * Load and analyze the image
     * @returns {Promise<LemGendImage>} The loaded image instance
     */
    __publicField(this, "load", async () => {
      try {
        if (this.type === "image/svg+xml") {
          await this._loadSVG();
        } else if (this.type === "image/x-icon" || this.type === "image/vnd.microsoft.icon") {
          await this._loadFavicon();
        } else {
          await this._loadRaster();
        }
        if (this.width && this.height) {
          this.aspectRatio = this.width / this.height;
          this.orientation = this.width >= this.height ? "landscape" : "portrait";
        }
        this.metadata.originalDimensions = {
          width: this.width,
          height: this.height,
          orientation: this.orientation,
          aspectRatio: this.aspectRatio
        };
        const analysis = await analyzeForOptimization(this.file);
        this.optimizationScore = analysis.optimizationScore;
        this.optimizationRecommendations = analysis.recommendations;
        this.metadata.analysis = analysis;
        this.metadata.optimizationLevel = analysis.optimizationLevel;
        if (this.type === "image/png" || this.type === "image/webp" || this.type.includes("icon")) {
          this.transparency = await hasTransparency(this.file);
        }
        return this;
      } catch (error) {
        throw new Error(`Failed to load image: ${error.message}`);
      }
    });
    /**
     * Load and analyze favicon (ICO) file
     * @private
     */
    __publicField(this, "_loadFavicon", async () => {
      try {
        this.width = 32;
        this.height = 32;
        this.aspectRatio = 1;
        this.orientation = "square";
        this.metadata.favicon = true;
        this.metadata.possibleSizes = [16, 32, 48, 64, 128, 256];
        return this;
      } catch (error) {
        throw new Error(`Failed to load favicon: ${error.message}`);
      }
    });
    /**
     * Load and analyze SVG image
     * @private
     */
    __publicField(this, "_loadSVG", async () => {
      try {
        const text = await this.file.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        const parserError = svgDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error("Invalid SVG format");
        }
        const widthAttr = svgElement.getAttribute("width");
        const heightAttr = svgElement.getAttribute("height");
        const viewBox = svgElement.getAttribute("viewBox");
        if (widthAttr && heightAttr) {
          this.width = this._parseSVGLength(widthAttr);
          this.height = this._parseSVGLength(heightAttr);
        } else if (viewBox) {
          const [x, y, vbWidth, vbHeight] = viewBox.split(/\s+|,/).map(parseFloat);
          this.width = vbWidth || 100;
          this.height = vbHeight || 100;
        } else {
          this.width = 100;
          this.height = 100;
        }
        this._svgDocument = svgDoc;
        this.metadata.svgContent = text;
        this.metadata.svgElement = svgElement;
        this.transparency = this._checkSVGTransparency(text);
      } catch (error) {
        throw new Error(`Failed to load SVG: ${error.message}`);
      }
    });
    /**
     * Parse SVG length string to pixels
     * @private
     */
    __publicField(this, "_parseSVGLength", (lengthStr) => {
      const match = lengthStr.match(/^([\d.]+)(px|pt|pc|mm|cm|in|em|ex|%)?$/);
      if (!match) return 100;
      const value = parseFloat(match[1]);
      const unit = match[2] || "px";
      const unitMap = {
        "px": 1,
        "pt": 1.33,
        "pc": 16,
        "mm": 3.78,
        "cm": 37.8,
        "in": 96,
        "em": 16,
        "ex": 8,
        "%": value
      };
      return value * (unitMap[unit] || 1);
    });
    /**
     * Check if SVG has transparent elements
     * @private
     */
    __publicField(this, "_checkSVGTransparency", (svgText) => {
      const transparencyIndicators = [
        'fill="none"',
        'fill="transparent"',
        "fill-opacity",
        "opacity=",
        "rgba(",
        "hsla(",
        "fill:#00000000",
        "fill:transparent",
        "stroke-opacity",
        "stop-opacity"
      ];
      return transparencyIndicators.some(
        (indicator) => svgText.includes(indicator)
      );
    });
    /**
     * Load and analyze raster image
     * @private
     */
    __publicField(this, "_loadRaster", async () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.width = img.naturalWidth || img.width;
          this.height = img.naturalHeight || img.height;
          this._imageElement = img;
          this._objectURL = img.src;
          resolve(this);
        };
        img.onerror = () => {
          reject(new Error("Failed to load raster image"));
        };
        img.src = URL.createObjectURL(this.file);
      });
    });
    /**
     * Update image dimensions
     * @param {number} width - New width in pixels
     * @param {number} height - New height in pixels
     */
    __publicField(this, "updateDimensions", (width, height) => {
      if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) {
        throw new Error("Dimensions must be positive numbers");
      }
      this.width = width;
      this.height = height;
      this.aspectRatio = width / height;
      this.orientation = width >= height ? "landscape" : "portrait";
      this.metadata.processedDimensions = { width, height, aspectRatio: this.aspectRatio };
      this.metadata.lastModified = (/* @__PURE__ */ new Date()).toISOString();
    });
    /**
     * Add an operation to metadata
     * @param {string} operation - Operation name
     * @param {Object} details - Operation details
     */
    __publicField(this, "addOperation", (operation, details) => {
      this.metadata.operations.push({
        operation,
        details,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        previousDimensions: this.metadata.processedDimensions || this.metadata.originalDimensions
      });
      if (operation === "optimize") {
        this.metadata.optimizationHistory.push({
          ...details,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    /**
     * Add processed output
     * @param {string} format - Output format
     * @param {File} file - Processed file
     * @param {Object} template - Template used (if any)
     */
    __publicField(this, "addOutput", (format, file, template = null) => {
      if (!(file instanceof File)) {
        throw new TypeError("Output must be a File object");
      }
      this.outputs.set(format, {
        file,
        format,
        template,
        dimensions: { width: this.width, height: this.height },
        size: file.size,
        addedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.processed = true;
    });
    /**
     * Get output by format
     * @param {string} format - Output format
     * @returns {Object|null} Output object or null
     */
    __publicField(this, "getOutput", (format) => {
      return this.outputs.get(format) || null;
    });
    /**
     * Get all outputs
     * @returns {Array} Array of output objects
     */
    __publicField(this, "getAllOutputs", () => {
      return Array.from(this.outputs.values());
    });
    /**
     * Get output as Data URL
     * @param {string} format - Output format
     * @returns {Promise<string>} Data URL
     */
    __publicField(this, "getOutputAsDataURL", async (format) => {
      const output = this.getOutput(format);
      if (!output) {
        throw new Error(`No output found for format: ${format}`);
      }
      return fileToDataURL(output.file);
    });
    /**
     * Get original image as Data URL
     * @returns {Promise<string>} Data URL
     */
    __publicField(this, "toDataURL", async () => {
      return fileToDataURL(this.file);
    });
    /**
     * Get optimization recommendations based on image analysis
     * @returns {Object} Optimization recommendations
     */
    __publicField(this, "getOptimizationRecommendations", () => {
      const recommendations = {
        format: this._recommendFormat(),
        quality: this._recommendQuality(),
        resize: this._recommendResize(),
        warnings: this.optimizationRecommendations,
        suggestions: [],
        priority: this._getOptimizationPriority()
      };
      if (this.transparency && this.extension === "jpg") {
        recommendations.suggestions.push("JPEG format does not support transparency - consider PNG or WebP");
      }
      if (this.width > 4e3 || this.height > 4e3) {
        recommendations.suggestions.push("Image dimensions very large - consider resizing for web");
      }
      if (this.originalSize > 10 * 1024 * 1024) {
        recommendations.suggestions.push("Image is very large (>10MB) - consider aggressive compression");
      }
      return recommendations;
    });
    /**
     * Recommend best format based on image characteristics
     * @private
     */
    __publicField(this, "_recommendFormat", () => {
      if (this.type === "image/svg+xml") return "svg";
      if (this.type.includes("icon")) return "ico";
      if (this.transparency) {
        return "webp";
      }
      if (this.width * this.height > 1e6) {
        return "avif";
      }
      return "webp";
    });
    /**
     * Recommend quality setting
     * @private
     */
    __publicField(this, "_recommendQuality", () => {
      if (this.type === "image/svg+xml" || this.type.includes("icon")) {
        return 100;
      }
      if (this.transparency) {
        return 90;
      }
      if (this.width * this.height > 2e6) {
        return 80;
      }
      return 85;
    });
    /**
     * Recommend resize dimensions
     * @private
     */
    __publicField(this, "_recommendResize", () => {
      const maxWebDimension = 1920;
      if (this.width <= maxWebDimension && this.height <= maxWebDimension) {
        return null;
      }
      let newWidth, newHeight;
      if (this.width >= this.height) {
        newWidth = Math.min(this.width, maxWebDimension);
        newHeight = Math.round(this.height / this.width * newWidth);
      } else {
        newHeight = Math.min(this.height, maxWebDimension);
        newWidth = Math.round(this.width / this.height * newHeight);
      }
      return {
        width: newWidth,
        height: newHeight,
        reason: `Resize to ${newWidth}x${newHeight} for web display`
      };
    });
    /**
     * Get optimization priority
     * @private
     */
    __publicField(this, "_getOptimizationPriority", () => {
      const megapixels = this.width * this.height / 1e6;
      const mbSize = this.originalSize / (1024 * 1024);
      if (mbSize > 10 || megapixels > 16) {
        return "high";
      }
      if (mbSize > 2 || megapixels > 4) {
        return "medium";
      }
      return "low";
    });
    /**
     * Get optimization summary for reporting
     * @returns {Object} Optimization summary
     */
    __publicField(this, "getOptimizationSummary", () => {
      const recommendations = this.getOptimizationRecommendations();
      return {
        original: {
          name: this.originalName,
          size: this.originalSize,
          dimensions: `${this.width}x${this.height}`,
          format: this.extension,
          hasTransparency: this.transparency,
          mimeType: this.type
        },
        recommendations,
        estimatedSavings: this._estimateOptimizationSavings(recommendations),
        priority: recommendations.priority,
        optimizationScore: this.optimizationScore,
        optimizationLevel: this.metadata.optimizationLevel || "unknown"
      };
    });
    /**
     * Estimate optimization savings
     * @private
     */
    __publicField(this, "_estimateOptimizationSavings", (recommendations) => {
      let estimatedSize = this.originalSize;
      switch (recommendations.format) {
        case "webp":
          estimatedSize *= 0.7;
          break;
        case "avif":
          estimatedSize *= 0.6;
          break;
        case "png":
          estimatedSize *= 0.9;
          break;
        case "jpg":
          estimatedSize *= 0.8;
          break;
        case "svg":
          estimatedSize *= 0.3;
          break;
      }
      estimatedSize *= recommendations.quality / 100;
      if (recommendations.resize) {
        const areaReduction = recommendations.resize.width * recommendations.resize.height / (this.width * this.height);
        estimatedSize *= areaReduction;
      }
      const savings = this.originalSize - estimatedSize;
      return {
        originalSize: this.originalSize,
        estimatedSize: Math.round(estimatedSize),
        savings: Math.round(savings),
        savingsPercent: Math.round(savings / this.originalSize * 1e3) / 10
      };
    });
    /**
     * Get image info summary
     * @returns {Object} Image information
     */
    __publicField(this, "getInfo", () => {
      return {
        id: this.id,
        name: this.originalName,
        type: this.type,
        originalSize: this.originalSize,
        width: this.width,
        height: this.height,
        orientation: this.orientation,
        aspectRatio: this.aspectRatio,
        transparency: this.transparency,
        processed: this.processed,
        outputs: this.getAllOutputs().map((output) => output.format),
        metadata: { ...this.metadata },
        optimization: {
          score: this.optimizationScore,
          level: this.metadata.optimizationLevel,
          recommendations: this.optimizationRecommendations.length
        }
      };
    });
    /**
     * Get detailed optimization report
     * @returns {Object} Detailed optimization report
     */
    __publicField(this, "getOptimizationReport", () => {
      const summary = this.getOptimizationSummary();
      const info = this.getInfo();
      return {
        ...summary,
        imageInfo: {
          id: info.id,
          name: info.name,
          type: info.type,
          processed: info.processed
        },
        analysis: this.metadata.analysis,
        optimizationHistory: this.metadata.optimizationHistory,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    /**
     * Check if image needs optimization
     * @param {number} threshold - Optimization score threshold (0-100)
     * @returns {boolean} True if optimization needed
     */
    __publicField(this, "needsOptimization", (threshold = 30) => {
      return this.optimizationScore >= threshold;
    });
    /**
     * Get recommended optimization settings
     * @param {string} useCase - Use case identifier
     * @returns {Object} Recommended settings
     */
    __publicField(this, "getRecommendedSettings", (useCase = "web") => {
      const recommendations = this.getOptimizationRecommendations();
      const presets = {
        "web": {
          quality: recommendations.quality,
          format: recommendations.format,
          maxDisplayWidth: 1920,
          compressionMode: "adaptive",
          browserSupport: ["modern", "legacy"]
        },
        "social": {
          quality: 90,
          format: "jpg",
          maxDisplayWidth: 1080,
          compressionMode: "balanced",
          stripMetadata: false
        },
        "ecommerce": {
          quality: 92,
          format: "webp",
          maxDisplayWidth: 1200,
          compressionMode: "balanced",
          preserveTransparency: true
        },
        "print": {
          quality: 100,
          format: "png",
          maxDisplayWidth: null,
          compressionMode: "balanced",
          lossless: true
        }
      };
      return presets[useCase] || presets["web"];
    });
    /**
     * Create thumbnail preview - uses utility function
     * @param {number} maxSize - Maximum thumbnail dimension
     * @returns {Promise<string>} Thumbnail as Data URL
     */
    __publicField(this, "createThumbnail", async (maxSize = 200) => {
      return createThumbnail(this, maxSize);
    });
    /**
     * Clean up resources
     */
    __publicField(this, "destroy", () => {
      if (this._objectURL) {
        URL.revokeObjectURL(this._objectURL);
      }
      if (this._imageElement?.src && this._imageElement.src.startsWith("blob:")) {
        URL.revokeObjectURL(this._imageElement.src);
      }
      this._imageElement = null;
      this._svgDocument = null;
      this._objectURL = null;
      this.outputs.clear();
    });
    /**
     * Clone the image instance (without outputs)
     * @returns {LemGendImage} Cloned instance
     */
    __publicField(this, "clone", () => {
      const clone = new LemGendImage(this.file, {
        orientation: this.orientation,
        width: this.width,
        height: this.height
      });
      clone.metadata = JSON.parse(JSON.stringify(this.metadata));
      clone.transparency = this.transparency;
      clone.aspectRatio = this.aspectRatio;
      clone.optimizationScore = this.optimizationScore;
      clone.optimizationRecommendations = [...this.optimizationRecommendations];
      return clone;
    });
    if (!(file instanceof File)) {
      throw new TypeError("LemGendImage requires a File object");
    }
    this.id = `lemgend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.file = file;
    this.originalName = file.name;
    this.originalSize = file.size;
    this.type = file.type;
    this.mimeType = file.type;
    this.extension = getFileExtension(file);
    if (this.extension === "ico" && !this.type.includes("image")) {
      this.type = "image/x-icon";
      this.mimeType = "image/x-icon";
    }
    this.metadata = {
      originalDimensions: null,
      processedDimensions: null,
      operations: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModified: (/* @__PURE__ */ new Date()).toISOString(),
      optimizationHistory: [],
      analysis: null
    };
    this.outputs = /* @__PURE__ */ new Map();
    this.processed = false;
    this.orientation = options.orientation || null;
    this.width = options.width || null;
    this.height = options.height || null;
    this.aspectRatio = null;
    this.transparency = null;
    this._imageElement = null;
    this._svgDocument = null;
    this._objectURL = null;
    this.optimizationScore = 0;
    this.optimizationRecommendations = [];
    if (this.width && this.height) {
      this.aspectRatio = this.width / this.height;
      this.orientation = this.width >= this.height ? "landscape" : "portrait";
    }
  }
}
export {
  LemGendImage
};
//# sourceMappingURL=LemGendImage-DmXZDDQ3.js.map
