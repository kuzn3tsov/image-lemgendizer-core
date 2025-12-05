var j = Object.defineProperty;
var G = (l, e, t) => e in l ? j(l, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : l[e] = t;
var c = (l, e, t) => G(l, typeof e != "symbol" ? e + "" : e, t);
import { v as L, V as $, a as M, g as U, b as V, c as N, d as B, e as q, f as Z, h as H, i as J, p as b, j as Q } from "./validation-D92jbWMx.js";
import { L as C, a as S, b as D, c as A } from "./LemGendaryRename-CgKHgnWG.js";
import { getTemplatesForImage as Y, getFlexibleTemplates as X, getTemplateAspectRatio as K, searchTemplates as ee, getTemplatesGroupedByPlatform as te, getAllPlatforms as ie, addCustomTemplate as se, validateTemplate as oe, exportTemplates as ae, getTemplateStats as ne, getRecommendedTemplates as re, getTemplatesByDimensions as pe, getTemplateById as W, getTemplatesByCategory as ce, getTemplatesByPlatform as le, PLATFORMS as I, TEMPLATE_CATEGORIES as P, LemGendTemplates as k } from "./templates/index.es.js";
import { batchProcess as me, createThumbnail as de, validateImageFile as he, getFileExtension as ge, formatFileSize as ue, calculateAspectRatioFit as fe, cropImage as ve, resizeImage as ye, dataURLtoFile as we, fileToDataURL as ze, hasTransparency as be, getImageDimensions as Se, createZipWithProgress as _e, getZipInfo as $e, extractZip as Ie, createSimpleZip as Re, createLemGendaryZip as R } from "./utils/index.es.js";
class u {
  /**
   * Create a new LemGendImage instance
   * @param {File} file - The original image file
   * @param {Object} options - Configuration options
   */
  constructor(e, t = {}) {
    /**
     * Load and analyze the image
     * @returns {Promise<LemGendImage>} The loaded image instance
     */
    c(this, "load", async () => {
      try {
        return this.type === "image/svg+xml" ? await this._loadSVG() : this.type === "image/x-icon" || this.type === "image/vnd.microsoft.icon" ? await this._loadFavicon() : await this._loadRaster(), this.width && this.height && (this.aspectRatio = this.width / this.height, this.orientation = this.width >= this.height ? "landscape" : "portrait"), this.metadata.originalDimensions = {
          width: this.width,
          height: this.height,
          orientation: this.orientation,
          aspectRatio: this.aspectRatio
        }, await this._analyzeForOptimization(), (this.type === "image/png" || this.type === "image/webp" || this.type.includes("icon")) && await this._checkTransparency(), this;
      } catch (e) {
        throw new Error(`Failed to load image: ${e.message}`);
      }
    });
    /**
     * Analyze image for optimization potential
     * @private
     */
    c(this, "_analyzeForOptimization", async () => {
      const e = {
        fileSize: this.originalSize,
        dimensions: { width: this.width, height: this.height },
        aspectRatio: this.aspectRatio,
        orientation: this.orientation,
        mimeType: this.type,
        extension: this.extension,
        optimizationScore: 0,
        recommendations: []
      };
      let t = 0;
      this.originalSize > 5 * 1024 * 1024 ? (t += 40, e.recommendations.push("File is very large - high optimization potential")) : this.originalSize > 1 * 1024 * 1024 ? t += 20 : this.originalSize > 100 * 1024 && (t += 10);
      const i = this.width * this.height / 1e6;
      return i > 16 ? (t += 30, e.recommendations.push("Very high resolution - consider resizing")) : i > 4 && (t += 15), ["webp", "avif", "svg"].includes(this.extension) || (t += 20, e.recommendations.push(`Consider converting from ${this.extension} to modern format`)), this.optimizationScore = Math.min(100, t), this.optimizationRecommendations = e.recommendations, this.metadata.analysis = e, this.metadata.optimizationLevel = t > 50 ? "high" : t > 25 ? "medium" : "low", e;
    });
    /**
     * Load and analyze favicon (ICO) file
     * @private
     */
    c(this, "_loadFavicon", async () => {
      try {
        return this.width = 32, this.height = 32, this.aspectRatio = 1, this.orientation = "square", this.metadata.favicon = !0, this.metadata.possibleSizes = [16, 32, 48, 64, 128, 256], this;
      } catch (e) {
        throw new Error(`Failed to load favicon: ${e.message}`);
      }
    });
    /**
     * Load and analyze SVG image
     * @private
     */
    c(this, "_loadSVG", async () => {
      try {
        const e = await this.file.text(), i = new DOMParser().parseFromString(e, "image/svg+xml"), s = i.documentElement;
        if (i.querySelector("parsererror"))
          throw new Error("Invalid SVG format");
        const o = s.getAttribute("width"), a = s.getAttribute("height"), r = s.getAttribute("viewBox");
        if (o && a)
          this.width = this._parseSVGLength(o), this.height = this._parseSVGLength(a);
        else if (r) {
          const [m, h, p, d] = r.split(/\s+|,/).map(parseFloat);
          this.width = p || 100, this.height = d || 100;
        } else
          this.width = 100, this.height = 100;
        this._svgDocument = i, this.metadata.svgContent = e, this.metadata.svgElement = s, this.transparency = this._checkSVGTransparency(e);
      } catch (e) {
        throw new Error(`Failed to load SVG: ${e.message}`);
      }
    });
    /**
     * Parse SVG length string to pixels
     * @private
     */
    c(this, "_parseSVGLength", (e) => {
      const t = e.match(/^([\d.]+)(px|pt|pc|mm|cm|in|em|ex|%)?$/);
      if (!t) return 100;
      const i = parseFloat(t[1]), s = t[2] || "px";
      return i * ({
        px: 1,
        pt: 1.33,
        pc: 16,
        mm: 3.78,
        cm: 37.8,
        in: 96,
        em: 16,
        ex: 8,
        "%": i
      }[s] || 1);
    });
    /**
     * Check if SVG has transparent elements
     * @private
     */
    c(this, "_checkSVGTransparency", (e) => [
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
    ].some(
      (i) => e.includes(i)
    ));
    /**
     * Load and analyze raster image
     * @private
     */
    c(this, "_loadRaster", async () => new Promise((e, t) => {
      const i = new Image();
      i.onload = () => {
        this.width = i.naturalWidth || i.width, this.height = i.naturalHeight || i.height, this._imageElement = i, this._objectURL = i.src, e(this);
      }, i.onerror = () => {
        t(new Error("Failed to load raster image"));
      }, i.src = URL.createObjectURL(this.file);
    }));
    /**
     * Check raster image for transparency
     * @private
     */
    c(this, "_checkTransparency", async () => new Promise((e) => {
      const t = new Image();
      t.onload = () => {
        const i = document.createElement("canvas");
        i.width = t.width, i.height = t.height;
        const s = i.getContext("2d");
        s.drawImage(t, 0, 0);
        const o = s.getImageData(0, 0, i.width, i.height).data;
        for (let a = 3; a < o.length; a += 4)
          if (o[a] < 255) {
            this.transparency = !0, e(!0);
            return;
          }
        this.transparency = !1, e(!1);
      }, t.onerror = () => {
        this.transparency = !1, e(!1);
      }, t.src = URL.createObjectURL(this.file);
    }));
    /**
     * Update image dimensions
     * @param {number} width - New width in pixels
     * @param {number} height - New height in pixels
     */
    c(this, "updateDimensions", (e, t) => {
      if (typeof e != "number" || typeof t != "number" || e <= 0 || t <= 0)
        throw new Error("Dimensions must be positive numbers");
      this.width = e, this.height = t, this.aspectRatio = e / t, this.orientation = e >= t ? "landscape" : "portrait", this.metadata.processedDimensions = { width: e, height: t, aspectRatio: this.aspectRatio }, this.metadata.lastModified = (/* @__PURE__ */ new Date()).toISOString();
    });
    /**
     * Add an operation to metadata
     * @param {string} operation - Operation name
     * @param {Object} details - Operation details
     */
    c(this, "addOperation", (e, t) => {
      this.metadata.operations.push({
        operation: e,
        details: t,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        previousDimensions: this.metadata.processedDimensions || this.metadata.originalDimensions
      }), e === "optimize" && this.metadata.optimizationHistory.push({
        ...t,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    /**
     * Add processed output
     * @param {string} format - Output format
     * @param {File} file - Processed file
     * @param {Object} template - Template used (if any)
     */
    c(this, "addOutput", (e, t, i = null) => {
      if (!(t instanceof File))
        throw new TypeError("Output must be a File object");
      this.outputs.set(e, {
        file: t,
        format: e,
        template: i,
        dimensions: { width: this.width, height: this.height },
        size: t.size,
        addedAt: (/* @__PURE__ */ new Date()).toISOString()
      }), this.processed = !0;
    });
    /**
     * Get output by format
     * @param {string} format - Output format
     * @returns {Object|null} Output object or null
     */
    c(this, "getOutput", (e) => this.outputs.get(e) || null);
    /**
     * Get all outputs
     * @returns {Array} Array of output objects
     */
    c(this, "getAllOutputs", () => Array.from(this.outputs.values()));
    /**
     * Get output as Data URL
     * @param {string} format - Output format
     * @returns {Promise<string>} Data URL
     */
    c(this, "getOutputAsDataURL", async (e) => {
      const t = this.getOutput(e);
      if (!t)
        throw new Error(`No output found for format: ${e}`);
      return new Promise((i, s) => {
        const n = new FileReader();
        n.onload = () => i(n.result), n.onerror = s, n.readAsDataURL(t.file);
      });
    });
    /**
     * Get original image as Data URL
     * @returns {Promise<string>} Data URL
     */
    c(this, "toDataURL", async () => new Promise((e, t) => {
      const i = new FileReader();
      i.onload = () => e(i.result), i.onerror = t, i.readAsDataURL(this.file);
    }));
    /**
     * Get optimization recommendations based on image analysis
     * @returns {Object} Optimization recommendations
     */
    c(this, "getOptimizationRecommendations", () => {
      const e = {
        format: this._recommendFormat(),
        quality: this._recommendQuality(),
        resize: this._recommendResize(),
        warnings: this.optimizationRecommendations,
        suggestions: [],
        priority: this._getOptimizationPriority()
      };
      return this.transparency && this.extension === "jpg" && e.suggestions.push("JPEG format does not support transparency - consider PNG or WebP"), (this.width > 4e3 || this.height > 4e3) && e.suggestions.push("Image dimensions very large - consider resizing for web"), this.originalSize > 10 * 1024 * 1024 && e.suggestions.push("Image is very large (>10MB) - consider aggressive compression"), e;
    });
    /**
     * Recommend best format based on image characteristics
     * @private
     */
    c(this, "_recommendFormat", () => this.type === "image/svg+xml" ? "svg" : this.type.includes("icon") ? "ico" : this.transparency ? "webp" : this.width * this.height > 1e6 ? "avif" : "webp");
    /**
     * Recommend quality setting
     * @private
     */
    c(this, "_recommendQuality", () => this.type === "image/svg+xml" || this.type.includes("icon") ? 100 : this.transparency ? 90 : this.width * this.height > 2e6 ? 80 : 85);
    /**
     * Recommend resize dimensions
     * @private
     */
    c(this, "_recommendResize", () => {
      if (this.width <= 1920 && this.height <= 1920)
        return null;
      let t, i;
      return this.width >= this.height ? (t = Math.min(this.width, 1920), i = Math.round(this.height / this.width * t)) : (i = Math.min(this.height, 1920), t = Math.round(this.width / this.height * i)), {
        width: t,
        height: i,
        reason: `Resize to ${t}x${i} for web display`
      };
    });
    /**
     * Get optimization priority
     * @private
     */
    c(this, "_getOptimizationPriority", () => {
      const e = this.width * this.height / 1e6, t = this.originalSize / (1024 * 1024);
      return t > 10 || e > 16 ? "high" : t > 2 || e > 4 ? "medium" : "low";
    });
    /**
     * Get optimization summary for reporting
     * @returns {Object} Optimization summary
     */
    c(this, "getOptimizationSummary", () => {
      const e = this.getOptimizationRecommendations();
      return {
        original: {
          name: this.originalName,
          size: this.originalSize,
          dimensions: `${this.width}x${this.height}`,
          format: this.extension,
          hasTransparency: this.transparency,
          mimeType: this.type
        },
        recommendations: e,
        estimatedSavings: this._estimateOptimizationSavings(e),
        priority: e.priority,
        optimizationScore: this.optimizationScore,
        optimizationLevel: this.metadata.optimizationLevel || "unknown"
      };
    });
    /**
     * Estimate optimization savings
     * @private
     */
    c(this, "_estimateOptimizationSavings", (e) => {
      let t = this.originalSize;
      switch (e.format) {
        case "webp":
          t *= 0.7;
          break;
        case "avif":
          t *= 0.6;
          break;
        case "png":
          t *= 0.9;
          break;
        case "jpg":
          t *= 0.8;
          break;
        case "svg":
          t *= 0.3;
          break;
      }
      if (t *= e.quality / 100, e.resize) {
        const s = e.resize.width * e.resize.height / (this.width * this.height);
        t *= s;
      }
      const i = this.originalSize - t;
      return {
        originalSize: this.originalSize,
        estimatedSize: Math.round(t),
        savings: Math.round(i),
        savingsPercent: Math.round(i / this.originalSize * 1e3) / 10
      };
    });
    /**
     * Get image info summary
     * @returns {Object} Image information
     */
    c(this, "getInfo", () => ({
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
      outputs: this.getAllOutputs().map((e) => e.format),
      metadata: { ...this.metadata },
      optimization: {
        score: this.optimizationScore,
        level: this.metadata.optimizationLevel,
        recommendations: this.optimizationRecommendations.length
      }
    }));
    /**
     * Get detailed optimization report
     * @returns {Object} Detailed optimization report
     */
    c(this, "getOptimizationReport", () => {
      const e = this.getOptimizationSummary(), t = this.getInfo();
      return {
        ...e,
        imageInfo: {
          id: t.id,
          name: t.name,
          type: t.type,
          processed: t.processed
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
    c(this, "needsOptimization", (e = 30) => this.optimizationScore >= e);
    /**
     * Get recommended optimization settings
     * @param {string} useCase - Use case identifier
     * @returns {Object} Recommended settings
     */
    c(this, "getRecommendedSettings", (e = "web") => {
      const t = this.getOptimizationRecommendations(), i = {
        web: {
          quality: t.quality,
          format: t.format,
          maxDisplayWidth: 1920,
          compressionMode: "adaptive",
          browserSupport: ["modern", "legacy"]
        },
        social: {
          quality: 90,
          format: "jpg",
          maxDisplayWidth: 1080,
          compressionMode: "balanced",
          stripMetadata: !1
        },
        ecommerce: {
          quality: 92,
          format: "webp",
          maxDisplayWidth: 1200,
          compressionMode: "balanced",
          preserveTransparency: !0
        },
        print: {
          quality: 100,
          format: "png",
          maxDisplayWidth: null,
          compressionMode: "balanced",
          lossless: !0
        }
      };
      return i[e] || i.web;
    });
    /**
     * Clean up resources
     */
    c(this, "destroy", () => {
      this._objectURL && URL.revokeObjectURL(this._objectURL), this._imageElement?.src && this._imageElement.src.startsWith("blob:") && URL.revokeObjectURL(this._imageElement.src), this._imageElement = null, this._svgDocument = null, this._objectURL = null, this.outputs.clear();
    });
    /**
     * Clone the image instance (without outputs)
     * @returns {LemGendImage} Cloned instance
     */
    c(this, "clone", () => {
      const e = new u(this.file, {
        orientation: this.orientation,
        width: this.width,
        height: this.height
      });
      return e.metadata = JSON.parse(JSON.stringify(this.metadata)), e.transparency = this.transparency, e.aspectRatio = this.aspectRatio, e.optimizationScore = this.optimizationScore, e.optimizationRecommendations = [...this.optimizationRecommendations], e;
    });
    /**
     * Create thumbnail preview
     * @param {number} maxSize - Maximum thumbnail dimension
     * @returns {Promise<string>} Thumbnail as Data URL
     */
    c(this, "createThumbnail", async (e = 200) => new Promise((t, i) => {
      if (this.type === "image/svg+xml") {
        this.toDataURL().then(t).catch(i);
        return;
      }
      if (this.type === "image/x-icon" || this.type === "image/vnd.microsoft.icon") {
        t("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM4ODJlZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMzg4MmVmIi8+PC9zdmc+");
        return;
      }
      const s = new Image(), n = URL.createObjectURL(this.file);
      s.onload = () => {
        let o, a;
        s.width > s.height ? (o = e, a = Math.round(s.height / s.width * e)) : (a = e, o = Math.round(s.width / s.height * e));
        const r = document.createElement("canvas");
        r.width = o, r.height = a, r.getContext("2d").drawImage(s, 0, 0, o, a);
        const h = r.toDataURL("image/jpeg", 0.7);
        URL.revokeObjectURL(n), t(h);
      }, s.onerror = () => {
        URL.revokeObjectURL(n), i(new Error("Failed to create thumbnail"));
      }, s.src = n;
    }));
    if (!(e instanceof File))
      throw new TypeError("LemGendImage requires a File object");
    this.id = `lemgend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, this.file = e, this.originalName = e.name, this.originalSize = e.size, this.type = e.type, this.mimeType = e.type, this.extension = e.name.split(".").pop().toLowerCase(), this.extension === "ico" && !this.type.includes("image") && (this.type = "image/x-icon", this.mimeType = "image/x-icon"), this.metadata = {
      originalDimensions: null,
      processedDimensions: null,
      operations: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModified: (/* @__PURE__ */ new Date()).toISOString(),
      optimizationHistory: [],
      analysis: null
    }, this.outputs = /* @__PURE__ */ new Map(), this.processed = !1, this.orientation = t.orientation || null, this.width = t.width || null, this.height = t.height || null, this.aspectRatio = null, this.transparency = null, this._imageElement = null, this._svgDocument = null, this._objectURL = null, this.optimizationScore = 0, this.optimizationRecommendations = [], this.width && this.height && (this.aspectRatio = this.width / this.height, this.orientation = this.width >= this.height ? "landscape" : "portrait");
  }
}
class z {
  /**
   * Create a new LemGendTask
   * @param {string} name - Task name
   * @param {string} description - Task description
   */
  constructor(e = "Untitled Task", t = "") {
    /**
     * Add a processing step
     * @param {string} processor - Processor name ('resize', 'crop', 'optimize', 'rename', 'template', 'favicon')
     * @param {Object} options - Processor options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addStep", (e, t) => {
      const i = ["resize", "crop", "optimize", "rename", "template", "favicon"];
      if (!i.includes(e))
        throw new Error(`Invalid processor: ${e}. Valid options: ${i.join(", ")}`);
      const s = {
        id: `step_${this.steps.length + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        processor: e,
        options: this._validateStepOptions(e, t),
        order: this.steps.length + 1,
        addedAt: (/* @__PURE__ */ new Date()).toISOString(),
        enabled: !0,
        metadata: {
          requiresFavicon: e === "favicon",
          isBatchable: !["favicon", "template"].includes(e),
          outputType: this._getStepOutputType(e, t),
          supportsOptimizationFirst: e === "optimize"
        }
      };
      return this.steps.push(s), this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), this._updateMetadata(), this;
    });
    /**
     * Validate step options based on processor type
     * @private
     */
    c(this, "_validateStepOptions", (e, t) => {
      const s = { ...{
        resize: {
          dimension: 1024,
          mode: "longest",
          maintainAspectRatio: !0,
          upscale: !0,
          algorithm: "lanczos3"
        },
        crop: {
          width: 500,
          height: 500,
          mode: "smart",
          upscale: !1,
          preserveAspectRatio: !0,
          confidenceThreshold: 70,
          cropToFit: !0,
          objectsToDetect: ["person", "face", "car", "dog", "cat"]
        },
        optimize: {
          quality: 85,
          format: "auto",
          lossless: !1,
          stripMetadata: !0,
          preserveTransparency: !0,
          maxDisplayWidth: null,
          browserSupport: ["modern", "legacy"],
          compressionMode: "adaptive",
          analyzeContent: !0,
          icoSizes: [16, 32, 48, 64, 128, 256]
        },
        rename: {
          pattern: "{name}-{dimensions}",
          preserveExtension: !0,
          addIndex: !0,
          addTimestamp: !1,
          customSeparator: "-"
        },
        template: {
          templateId: null,
          applyToAll: !0,
          preserveOriginal: !1
        },
        favicon: {
          sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
          formats: ["png", "ico"],
          generateManifest: !0,
          generateHTML: !0,
          includeAppleTouch: !0,
          includeAndroid: !0,
          roundCorners: !0,
          backgroundColor: "#ffffff"
        }
      }[e], ...t };
      switch (e) {
        case "favicon":
          s.sizes = [...new Set(s.sizes.sort((r, m) => r - m))], s.sizes = s.sizes.filter((r) => r >= 16 && r <= 512);
          break;
        case "optimize":
          s.format === "jpg" && t.preserveTransparency && (s.format = "png");
          const n = ["modern", "legacy", "all"];
          s.browserSupport = s.browserSupport.filter(
            (r) => n.includes(r)
          ), s.browserSupport.length === 0 && (s.browserSupport = ["modern", "legacy"]), ["adaptive", "aggressive", "balanced"].includes(s.compressionMode) || (s.compressionMode = "adaptive"), s.format === "avif" && (s.quality = Math.min(63, s.quality));
          break;
        case "crop":
          ["smart", "face", "object", "saliency", "entropy"].includes(s.mode) && (s.confidenceThreshold = Math.max(0, Math.min(100, s.confidenceThreshold || 70)), s.multipleFaces = s.multipleFaces || !1, Array.isArray(s.objectsToDetect) || (s.objectsToDetect = ["person", "face", "car", "dog", "cat"]));
          break;
        case "rename":
          ["{name}", "{index}", "{timestamp}", "{width}", "{height}", "{dimensions}"].some((r) => s.pattern.includes(r)) || (s.pattern = "{name}-{index}");
          break;
      }
      return s;
    });
    /**
     * Get step output type
     * @private
     */
    c(this, "_getStepOutputType", (e, t) => {
      switch (e) {
        case "optimize":
          return t.format === "auto" ? "optimized-auto" : `optimized-${t.format}`;
        case "favicon":
          return "favicon-set";
        case "template":
          return "template-applied";
        default:
          return "processed";
      }
    });
    /**
     * Add resize step
     * @param {number} dimension - Target dimension
     * @param {string} mode - 'auto', 'width', 'height', 'longest', or 'fit'
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addResize", (e, t = "longest", i = {}) => this.addStep("resize", {
      dimension: e,
      mode: t,
      ...i
    }));
    /**
     * Add crop step
     * @param {number} width - Crop width
     * @param {number} height - Crop height
     * @param {string} mode - Crop mode: 'smart', 'face', 'object', 'saliency', 'entropy', 'center', 'top', 'bottom', 'left', 'right'
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addCrop", (e, t, i = "smart", s = {}) => this.addStep("crop", {
      width: e,
      height: t,
      mode: i,
      ...s
    }));
    /**
     * Add smart crop step with AI detection
     * @param {number} width - Crop width
     * @param {number} height - Crop height
     * @param {Object} options - Smart crop options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addSmartCrop", (e, t, i = {}) => this.addStep("crop", {
      width: e,
      height: t,
      mode: "smart",
      confidenceThreshold: 70,
      multipleFaces: !0,
      cropToFit: !0,
      ...i
    }));
    /**
     * Add optimization step with enhanced options
     * @param {number} quality - Quality percentage
     * @param {string} format - Output format ('auto', 'webp', 'jpg', 'png', 'avif', 'original')
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addOptimize", (e = 85, t = "auto", i = {}) => this.addStep("optimize", {
      quality: e,
      format: t,
      maxDisplayWidth: i.maxDisplayWidth || null,
      browserSupport: i.browserSupport || ["modern", "legacy"],
      compressionMode: i.compressionMode || "adaptive",
      analyzeContent: i.analyzeContent !== !1,
      ...i
    }));
    /**
     * Add optimization-first step for web delivery
     * @param {Object} options - Optimization options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addWebOptimization", (e = {}) => this.addStep("optimize", {
      quality: 85,
      format: "auto",
      maxDisplayWidth: 1920,
      browserSupport: ["modern", "legacy"],
      compressionMode: "adaptive",
      stripMetadata: !0,
      preserveTransparency: !0,
      ...e
    }));
    /**
     * Add rename step
     * @param {string} pattern - Rename pattern (supports {name}, {width}, {height}, {dimensions}, {index}, {timestamp})
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addRename", (e, t = {}) => this.addStep("rename", {
      pattern: e,
      ...t
    }));
    /**
     * Add template step
     * @param {string} templateId - Template ID
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addTemplate", (e, t = {}) => this.addStep("template", {
      templateId: e,
      ...t
    }));
    /**
     * Add favicon generation step
     * @param {Array<number>} sizes - Array of sizes to generate
     * @param {Array<string>} formats - Formats to generate ('png', 'ico', 'svg')
     * @param {Object} additionalOptions - Additional options
     * @returns {LemGendTask} This task instance for chaining
     */
    c(this, "addFavicon", (e = [16, 32, 48, 64, 128, 180, 192, 256, 512], t = ["png", "ico"], i = {}) => this.addStep("favicon", {
      sizes: e,
      formats: t,
      ...i
    }));
    /**
     * Remove a step by ID or index
     * @param {string|number} identifier - Step ID or index
     * @returns {boolean} True if step was removed
     */
    c(this, "removeStep", (e) => {
      let t;
      return typeof e == "number" ? t = e : t = this.steps.findIndex((i) => i.id === e), t >= 0 && t < this.steps.length ? (this.steps.splice(t, 1), this.steps.forEach((i, s) => {
        i.order = s + 1;
      }), this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), this._updateMetadata(), !0) : !1;
    });
    /**
     * Move step up in order
     * @param {number} index - Step index
     * @returns {boolean} True if step was moved
     */
    c(this, "moveStepUp", (e) => e <= 0 || e >= this.steps.length ? !1 : ([this.steps[e - 1], this.steps[e]] = [this.steps[e], this.steps[e - 1]], this.steps.forEach((t, i) => {
      t.order = i + 1;
    }), this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), !0));
    /**
     * Move step down in order
     * @param {number} index - Step index
     * @returns {boolean} True if step was moved
     */
    c(this, "moveStepDown", (e) => e < 0 || e >= this.steps.length - 1 ? !1 : ([this.steps[e], this.steps[e + 1]] = [this.steps[e + 1], this.steps[e]], this.steps.forEach((t, i) => {
      t.order = i + 1;
    }), this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), !0));
    /**
     * Enable/disable a step
     * @param {number} index - Step index
     * @param {boolean} enabled - Enable state
     * @returns {boolean} True if step was updated
     */
    c(this, "setStepEnabled", (e, t = !0) => e >= 0 && e < this.steps.length ? (this.steps[e].enabled = t, this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), this._updateMetadata(), !0) : !1);
    /**
     * Get enabled steps only
     * @returns {Array} Enabled steps
     */
    c(this, "getEnabledSteps", () => this.steps.filter((e) => e.enabled));
    /**
     * Get steps by processor type
     * @param {string} processor - Processor type
     * @returns {Array} Matching steps
     */
    c(this, "getStepsByProcessor", (e) => this.steps.filter((t) => t.processor === e));
    /**
     * Check if task has specific processor
     * @param {string} processor - Processor type
     * @returns {boolean} True if processor exists
     */
    c(this, "hasProcessor", (e) => this.getEnabledSteps().some((t) => t.processor === e));
    /**
     * Check if task has optimization step
     * @returns {boolean} True if has optimization
     */
    c(this, "hasOptimization", () => this.hasProcessor("optimize"));
    /**
     * Get optimization step if exists
     * @returns {Object|null} Optimization step
     */
    c(this, "getOptimizationStep", () => this.getEnabledSteps().find((e) => e.processor === "optimize") || null);
    /**
     * Validate task against an image
     * @param {LemGendImage} lemGendImage - Image to validate against
     * @returns {Promise<Object>} Validation result
     */
    c(this, "validate", async (e) => {
      if (this.validationWarnings = [], this.validationErrors = [], !e) {
        const i = this.getEnabledSteps();
        i.length === 0 && this.validationWarnings.push({
          type: "empty_task",
          message: "Task has no enabled processing steps",
          severity: "warning"
        });
        for (const s of i)
          await this._validateStep(s, null);
        return this._validateTaskLogic(), {
          isValid: this.validationErrors.length === 0,
          hasWarnings: this.validationWarnings.length > 0,
          errors: [...this.validationErrors],
          warnings: [...this.validationWarnings],
          summary: this.getValidationSummary()
        };
      }
      (!e.file || !(e.file instanceof File)) && this.validationErrors.push({
        type: "invalid_image",
        message: "Image missing valid file property",
        severity: "error"
      });
      const t = this.getEnabledSteps();
      t.length === 0 && this.validationWarnings.push({
        type: "empty_task",
        message: "Task has no enabled processing steps",
        severity: "warning"
      });
      for (const i of t)
        await this._validateStep(i, e);
      return this._validateTaskLogic(), e.file && e.file instanceof File && this._validateImageCompatibility(e), {
        isValid: this.validationErrors.length === 0,
        hasWarnings: this.validationWarnings.length > 0,
        errors: [...this.validationErrors],
        warnings: [...this.validationWarnings],
        summary: this.getValidationSummary()
      };
    });
    /**
     * Validate individual step
     * @private
     */
    c(this, "_validateStep", async (e, t) => {
      if (!t) {
        switch (e.processor) {
          case "optimize":
            this._validateOptimizeStep(e, null);
            break;
          case "rename":
            this._validateRenameStep(e);
            break;
          case "template":
            this._validateTemplateStep(e);
            break;
          case "favicon":
            this._validateFaviconStep(e, null);
            break;
          case "resize":
          case "crop":
            this._validateBasicStepOptions(e);
            break;
        }
        return;
      }
      switch (e.processor) {
        case "resize":
          this._validateResizeStep(e, t);
          break;
        case "crop":
          this._validateCropStep(e, t);
          break;
        case "optimize":
          this._validateOptimizeStep(e, t);
          break;
        case "rename":
          this._validateRenameStep(e);
          break;
        case "template":
          this._validateTemplateStep(e);
          break;
        case "favicon":
          this._validateFaviconStep(e, t);
          break;
      }
    });
    /**
     * Validate basic step options (without image)
     * @private
     */
    c(this, "_validateBasicStepOptions", (e) => {
      switch (e.processor) {
        case "resize":
          const { dimension: t } = e.options;
          t <= 0 && this.validationErrors.push({
            type: "invalid_resize",
            step: e.order,
            message: `Resize dimension must be positive: ${t}`,
            severity: "error"
          });
          break;
        case "crop":
          const { width: i, height: s } = e.options;
          (i <= 0 || s <= 0) && this.validationErrors.push({
            type: "invalid_crop",
            step: e.order,
            message: `Crop dimensions must be positive: ${i}x${s}`,
            severity: "error"
          });
          break;
      }
    });
    /**
     * Validate favicon step
     * @private
     */
    c(this, "_validateFaviconStep", (e, t) => {
      const { sizes: i, formats: s } = e.options;
      if ((!Array.isArray(i) || i.length === 0) && this.validationErrors.push({
        type: "invalid_favicon_sizes",
        step: e.order,
        message: "Favicon sizes must be a non-empty array",
        severity: "error"
      }), i.forEach((o) => {
        o < 16 && this.validationWarnings.push({
          type: "small_favicon_size",
          step: e.order,
          message: `Favicon size ${o}px is below recommended minimum (16px)`,
          severity: "warning"
        }), o > 1024 && this.validationWarnings.push({
          type: "large_favicon_size",
          step: e.order,
          message: `Favicon size ${o}px is unusually large`,
          severity: "info"
        });
      }), t) {
        const o = Math.min(...i);
        (t.width < o || t.height < o) && this.validationWarnings.push({
          type: "small_source_favicon",
          step: e.order,
          message: `Source image (${t.width}x${t.height}) smaller than smallest favicon size (${o}px)`,
          severity: "warning",
          suggestion: "Consider using a larger source image or enable upscaling"
        }), Math.abs(t.width / t.height - 1) > 0.1 && this.validationWarnings.push({
          type: "non_square_favicon",
          step: e.order,
          message: "Source image is not square; favicons may be distorted",
          severity: "warning",
          suggestion: "Consider adding a crop step before favicon generation"
        });
      }
      const n = ["png", "ico", "svg"];
      s.forEach((o) => {
        n.includes(o) || this.validationWarnings.push({
          type: "unsupported_favicon_format",
          step: e.order,
          message: `Unsupported favicon format: ${o}`,
          severity: "warning",
          suggestion: `Use one of: ${n.join(", ")}`
        });
      });
    });
    /**
     * Validate resize step
     * @private
     */
    c(this, "_validateResizeStep", (e, t) => {
      if (!t) return;
      const { dimension: i, mode: s, upscale: n } = e.options;
      i <= 0 && this.validationErrors.push({
        type: "invalid_resize",
        step: e.order,
        message: `Resize dimension must be positive: ${i}`,
        severity: "error"
      }), i < 10 && this.validationWarnings.push({
        type: "very_small_resize",
        step: e.order,
        message: `Resize dimension very small (${i}px)`,
        severity: "warning",
        suggestion: "Consider larger dimensions for usable output"
      }), i > 1e4 && this.validationWarnings.push({
        type: "very_large_resize",
        step: e.order,
        message: `Resize dimension very large (${i}px)`,
        severity: "warning",
        suggestion: "Large dimensions may cause performance issues"
      }), i > Math.max(t.width, t.height) && !n && this.validationWarnings.push({
        type: "upscale_needed",
        step: e.order,
        message: `Target size (${i}px) larger than source, upscaling disabled`,
        severity: "warning",
        suggestion: "Enable upscaling or use smaller target dimension"
      });
    });
    /**
     * Validate crop step
     * @private
     */
    c(this, "_validateCropStep", (e, t) => {
      if (!t) return;
      const { width: i, height: s, mode: n, upscale: o, confidenceThreshold: a } = e.options;
      (i <= 0 || s <= 0) && this.validationErrors.push({
        type: "invalid_crop",
        step: e.order,
        message: `Crop dimensions must be positive: ${i}x${s}`,
        severity: "error"
      }), ["smart", "face", "object"].includes(n) && (this.validationWarnings.push({
        type: "ai_crop_mode",
        step: e.order,
        message: `Using AI-powered ${n} cropping`,
        severity: "info",
        suggestion: "Ensure images have clear subjects for best results"
      }), a < 50 && this.validationWarnings.push({
        type: "low_confidence_threshold",
        step: e.order,
        message: `Low confidence threshold (${a}%) may result in poor detection`,
        severity: "warning",
        suggestion: "Increase confidence threshold to 70% or higher for better accuracy"
      })), (i < 10 || s < 10) && this.validationWarnings.push({
        type: "very_small_crop",
        step: e.order,
        message: `Crop dimensions very small (${i}x${s})`,
        severity: "warning",
        suggestion: "Consider larger crop area for usable output"
      });
      const r = i / s;
      (r > 10 || r < 0.1) && this.validationWarnings.push({
        type: "extreme_aspect",
        step: e.order,
        message: `Extreme aspect ratio: ${r.toFixed(2)}`,
        severity: "warning",
        suggestion: "Consider more balanced dimensions"
      }), (i > t.width || s > t.height) && !o && this.validationWarnings.push({
        type: "crop_larger_than_source",
        step: e.order,
        message: `Crop area (${i}x${s}) larger than source (${t.width}x${t.height})`,
        severity: "warning",
        suggestion: "Enable upscaling or resize first"
      });
    });
    /**
    * Validate optimize step with enhanced validation
    * @private
    */
    c(this, "_validateOptimizeStep", (e, t) => {
      const i = L(e.options);
      i.errors.forEach((s) => {
        this.validationErrors.push({
          type: s.code,
          step: e.order,
          message: s.message,
          severity: "error",
          suggestion: s.suggestion
        });
      }), i.warnings.forEach((s) => {
        this.validationWarnings.push({
          type: s.code,
          step: e.order,
          message: s.message,
          severity: "warning",
          suggestion: s.suggestion
        });
      }), t && ((e.options.format === "jpg" || e.options.format === "jpeg") && (t.transparency || e.options.preserveTransparency) && this.validationWarnings.push({
        type: $.TRANSPARENCY_LOSS,
        step: e.order,
        message: "JPEG format will remove transparency",
        severity: "warning",
        suggestion: "Use PNG or WebP to preserve transparency"
      }), e.options.maxDisplayWidth && (t.width > e.options.maxDisplayWidth || t.height > e.options.maxDisplayWidth) && this.validationWarnings.push({
        type: "resize_optimization",
        step: e.order,
        message: `Image will be resized to ${e.options.maxDisplayWidth}px maximum dimension`,
        severity: "info"
      }), e.options.format === "avif" && this.validationWarnings.push({
        type: $.AVIF_BROWSER_SUPPORT,
        step: e.order,
        message: "AVIF format provides excellent compression but limited browser support",
        severity: "info",
        suggestion: "Consider providing WebP fallback"
      }), e.options.compressionMode === "aggressive" && t.width * t.height > 4e6 && this.validationWarnings.push({
        type: "aggressive_compression_large",
        step: e.order,
        message: "Aggressive compression on large images may take longer",
        severity: "info"
      }));
    });
    /**
     * Validate rename step
     * @private
     */
    c(this, "_validateRenameStep", (e) => {
      const { pattern: t, preserveExtension: i } = e.options;
      (!t || t.trim() === "") && this.validationErrors.push({
        type: "empty_pattern",
        step: e.order,
        message: "Rename pattern cannot be empty",
        severity: "error"
      }), /[<>:"/\\|?*\x00-\x1F]/.test(t) && this.validationErrors.push({
        type: "invalid_pattern_chars",
        step: e.order,
        message: "Pattern contains invalid filename characters",
        severity: "error",
        suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
      }), !t.includes("{name}") && !t.includes("{index}") && this.validationWarnings.push({
        type: "no_unique_placeholder",
        step: e.order,
        message: "Pattern may create duplicate filenames",
        severity: "warning",
        suggestion: "Include {index} or {timestamp} for unique filenames"
      });
    });
    /**
     * Validate template step
     * @private
     */
    c(this, "_validateTemplateStep", (e) => {
      const { templateId: t } = e.options;
      t || this.validationErrors.push({
        type: "missing_template",
        step: e.order,
        message: "Template ID is required",
        severity: "error"
      });
    });
    /**
     * Validate image compatibility
     * @private
     */
    c(this, "_validateImageCompatibility", (e) => {
      const t = this.getEnabledSteps(), i = t.some((a) => a.processor === "favicon"), s = t.some((a) => a.processor === "crop" && ["smart", "face", "object"].includes(a.options.mode)), n = t.some((a) => a.processor === "optimize");
      if (i && (e.type === "image/svg+xml" && this.validationWarnings.push({
        type: "svg_favicon",
        message: "SVG images may not convert well to favicon formats",
        severity: "warning",
        suggestion: "Consider using raster image for favicon generation"
      }), e.type.includes("gif") && this.validationWarnings.push({
        type: "animated_favicon",
        message: "Animated GIFs will lose animation in favicon conversion",
        severity: "info"
      })), s && (e.width < 200 || e.height < 200) && this.validationWarnings.push({
        type: "small_image_smart_crop",
        message: "Smart crop works best with images larger than 200x200 pixels",
        severity: "warning",
        suggestion: "Consider resizing before smart crop or use larger source images"
      }), n) {
        const a = t.find((r) => r.processor === "optimize");
        a && a.options.format === "auto" && this.validationWarnings.push({
          type: "auto_format_selection",
          message: "Format will be automatically selected based on image content and browser support",
          severity: "info"
        });
      }
      Math.min(e.width, e.height) < 100 && this.validationWarnings.push({
        type: "low_resolution",
        message: `Source image resolution low (${e.width}x${e.height})`,
        severity: "warning",
        suggestion: "Consider using higher resolution source for better quality"
      });
    });
    /**
     * Validate task logic
     * @private
     */
    c(this, "_validateTaskLogic", () => {
      const e = this.getEnabledSteps(), t = e.some((m) => m.processor === "resize"), i = e.some((m) => m.processor === "crop"), s = e.some((m) => m.processor === "optimize");
      i && !t && this.validationWarnings.push({
        type: "crop_without_resize",
        message: "Crop without resize may result in unexpected output",
        severity: "info",
        suggestion: "Consider adding resize step before crop for better control"
      });
      const n = e.filter((m) => m.processor === "optimize");
      n.length > 1 && this.validationWarnings.push({
        type: "multiple_optimize",
        message: `Multiple optimization steps (${n.length})`,
        severity: "warning",
        suggestion: "Multiple optimizations may degrade quality unnecessarily"
      });
      const o = e.findIndex((m) => m.processor === "rename");
      o >= 0 && o < e.length - 2 && this.validationWarnings.push({
        type: "early_rename",
        message: "Rename step placed before other operations",
        severity: "info",
        suggestion: "Consider moving rename to end to reflect final output"
      });
      const a = e.findIndex((m) => m.processor === "favicon");
      if (a >= 0) {
        const m = e.slice(0, a), h = m.some((d) => d.processor === "resize"), p = m.some((d) => d.processor === "crop");
        !h && !p && this.validationWarnings.push({
          type: "favicon_without_preparation",
          message: "Favicon generation without prior resize/crop",
          severity: "warning",
          suggestion: "Add resize/crop step before favicon for optimal results"
        });
      }
      e.filter((m) => m.processor === "favicon").forEach((m) => {
        e.filter((p) => p.processor === "optimize").some((p) => p.order > m.order) && this.validationWarnings.push({
          type: "optimize_after_favicon",
          message: "Optimization after favicon generation may affect favicon quality",
          severity: "warning",
          suggestion: "Move optimization step before favicon generation"
        });
      }), s && !t && !i && this.validationWarnings.push({
        type: "optimization_only",
        message: "Task contains only optimization step",
        severity: "info",
        suggestion: "Consider adding resize/crop steps for complete image processing"
      });
    });
    /**
     * Get validation summary
     * @returns {Object} Validation summary
     */
    c(this, "getValidationSummary", () => {
      const e = this.getEnabledSteps(), t = this.validationErrors.length, i = this.validationWarnings.length, s = {};
      e.forEach((r) => {
        s[r.processor] = (s[r.processor] || 0) + 1;
      });
      let n = "general";
      e.some((r) => r.processor === "favicon") ? n = "favicon" : e.some((r) => r.processor === "template") ? n = "template" : e.every((r) => ["resize", "crop", "optimize"].includes(r.processor)) ? n = "basic" : e.length === 1 && e[0].processor === "optimize" && (n = "optimization-only");
      const o = e.some((r) => r.processor === "crop" && ["smart", "face", "object"].includes(r.options.mode)), a = e.some(
        (r) => r.processor === "optimize" && r.options.format === "auto"
      );
      return {
        totalSteps: e.length,
        enabledSteps: e.length,
        disabledSteps: this.steps.length - e.length,
        errorCount: t,
        warningCount: i,
        processorCount: s,
        taskType: n,
        status: t > 0 ? "invalid" : i > 0 ? "has_warnings" : "valid",
        canProceed: t === 0,
        requiresImage: e.some((r) => ["resize", "crop", "optimize", "favicon"].includes(r.processor)),
        hasFavicon: s.favicon > 0,
        hasSmartCrop: o,
        hasAutoOptimization: a,
        estimatedOutputs: this._estimateOutputCount(),
        optimizationLevel: this._getOptimizationLevel()
      };
    });
    /**
     * Get optimization level based on settings
     * @private
     */
    c(this, "_getOptimizationLevel", () => {
      const e = this.getEnabledSteps().find((n) => n.processor === "optimize");
      if (!e) return "none";
      const { compressionMode: t, quality: i, format: s } = e.options;
      return t === "aggressive" && i < 70 ? "aggressive" : t === "adaptive" || i >= 70 && i <= 90 ? "balanced" : t === "balanced" && i > 90 ? "high-quality" : "standard";
    });
    /**
     * Estimate number of outputs
     * @private
     */
    c(this, "_estimateOutputCount", () => {
      const e = this.getEnabledSteps();
      let t = 1;
      return e.forEach((i) => {
        if (i.processor === "favicon") {
          const { sizes: s = [], formats: n = [] } = i.options;
          t += s.length * n.length, i.options.generateManifest && t++, i.options.generateHTML && t++, i.options.includeAppleTouch && t++, i.options.includeAndroid && t++;
        } else if (i.processor === "optimize") {
          const { format: s } = i.options;
          Array.isArray(s) && (t += s.length - 1);
        }
      }), t;
    });
    /**
     * Get task description
     * @returns {string} Human-readable description
     */
    c(this, "getDescription", () => {
      const e = this.getEnabledSteps();
      return e.length === 0 ? "No processing steps configured" : e.map((t, i) => {
        const s = i + 1, n = t.processor.charAt(0).toUpperCase() + t.processor.slice(1);
        switch (t.processor) {
          case "resize":
            return `${s}. LemGendaryResize™ to ${t.options.dimension}px (${t.options.mode})`;
          case "crop":
            const { mode: o, width: a, height: r } = t.options;
            let m = `${s}. LemGendaryCrop™ to ${a}×${r}`;
            return ["smart", "face", "object", "saliency", "entropy"].includes(o) ? m += ` (AI ${o} mode)` : m += ` (${o})`, m;
          case "optimize":
            const h = t.options.format === "auto" ? "auto (intelligent selection)" : t.options.format.toUpperCase();
            let p = `${s}. LemGendaryOptimize™ to ${h} (${t.options.quality}%)`;
            return t.options.maxDisplayWidth && (p += `, max ${t.options.maxDisplayWidth}px`), t.options.compressionMode && t.options.compressionMode !== "adaptive" && (p += `, ${t.options.compressionMode} compression`), t.options.browserSupport && (p += `, ${t.options.browserSupport.join("+")} browsers`), p;
          case "rename":
            return `${s}. Rename with pattern: "${t.options.pattern}"`;
          case "template":
            return `${s}. Apply template: ${t.options.templateId}`;
          case "favicon":
            const d = t.options.sizes?.length || 0, g = t.options.formats?.length || 0;
            return `${s}. Generate favicon set (${d} sizes, ${g} formats)`;
          default:
            return `${s}. ${n}`;
        }
      }).join(`
`);
    });
    /**
     * Get estimated processing time
     * @param {number} imageCount - Number of images
     * @returns {Object} Time estimates
     */
    c(this, "getTimeEstimate", (e = 1) => {
      const t = this.getEnabledSteps(), i = {
        resize: 100,
        crop: 150,
        optimize: 200,
        rename: 10,
        template: 300,
        favicon: 500
      };
      let s = 0, n = 1;
      return t.forEach((o) => {
        const a = i[o.processor] || 100;
        if (o.processor === "favicon") {
          const r = o.options.sizes?.length || 1, m = o.options.formats?.length || 1;
          n = r * m;
        } else o.processor === "crop" && ["smart", "face", "object"].includes(o.options.mode) ? n = 3 : o.processor === "optimize" && (o.options.compressionMode === "aggressive" && (n = 1.5), o.options.analyzeContent && (n *= 1.2));
        s += a * n;
      }), s *= e, {
        perImage: s / e,
        total: s,
        formatted: this._formatTime(s),
        stepCount: t.length,
        imageCount: e,
        complexityFactor: Math.round(n * 10) / 10
      };
    });
    /**
     * Format time in milliseconds
     * @private
     */
    c(this, "_formatTime", (e) => {
      if (e < 1e3) return `${Math.round(e)}ms`;
      if (e < 6e4) return `${(e / 1e3).toFixed(1)}s`;
      const t = Math.floor(e / 6e4), i = Math.round(e % 6e4 / 1e3);
      return `${t}m ${i}s`;
    });
    /**
     * Export task configuration
     * @returns {Object} Task configuration
     */
    c(this, "exportConfig", () => ({
      id: this.id,
      name: this.name,
      description: this.description,
      version: "2.2.0",
      steps: this.steps.map((e) => ({
        id: e.id,
        processor: e.processor,
        options: { ...e.options },
        enabled: e.enabled,
        order: e.order,
        metadata: e.metadata
      })),
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      validation: {
        warnings: this.validationWarnings,
        errors: this.validationErrors
      }
    }));
    /**
     * Update metadata
     * @private
     */
    c(this, "_updateMetadata", () => {
      const e = this.getEnabledSteps();
      this.metadata.estimatedDuration = this.getTimeEstimate().total, this.metadata.estimatedOutputs = this._estimateOutputCount(), this.metadata.stepCount = e.length;
      const t = {};
      e.forEach((i) => {
        t[i.processor] = (t[i.processor] || 0) + 1;
      }), this.metadata.processorCount = t, t.favicon > 0 ? this.metadata.category = "favicon" : t.template > 0 ? this.metadata.category = "template" : t.optimize > 0 && t.resize === 0 && t.crop === 0 ? this.metadata.category = "optimization-only" : this.metadata.category = "general", this.metadata.hasSmartCrop = e.some((i) => i.processor === "crop" && ["smart", "face", "object"].includes(i.options.mode)), this.metadata.hasAutoOptimization = e.some(
        (i) => i.processor === "optimize" && i.options.format === "auto"
      );
    });
    /**
     * Clone the task
     * @returns {LemGendTask} Cloned task
     */
    c(this, "clone", () => z.importConfig(this.exportConfig()));
    /**
     * Create a simplified version of the task for UI display
     * @returns {Object} Simplified task info
     */
    c(this, "toSimpleObject", () => {
      const e = this.getValidationSummary();
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        stepCount: this.steps.length,
        enabledStepCount: this.getEnabledSteps().length,
        hasFavicon: e.hasFavicon,
        hasSmartCrop: e.hasSmartCrop,
        hasAutoOptimization: e.hasAutoOptimization,
        taskType: e.taskType,
        status: e.status,
        canProceed: e.canProceed,
        estimatedOutputs: e.estimatedOutputs,
        optimizationLevel: e.optimizationLevel,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    });
    /**
     * Check if task is compatible with image type
     * @param {string} mimeType - Image MIME type
     * @returns {Object} Compatibility result
     */
    c(this, "checkCompatibility", (e) => {
      const t = this.getEnabledSteps(), i = t.some((m) => m.processor === "favicon"), s = t.some((m) => m.processor === "crop" && ["smart", "face", "object"].includes(m.options.mode)), n = t.some((m) => m.processor === "optimize");
      let o = !0;
      const a = [], r = [];
      return e === "image/svg+xml" && (i && a.push("SVG to favicon conversion may not preserve all features"), s && a.push("SVG images will be rasterized before smart cropping")), e === "image/gif" && (i && a.push("Animated GIFs will lose animation in favicon conversion"), s && a.push("Smart crop will use first frame of animated GIF"), n && a.push("GIF optimization may reduce animation quality")), (e === "image/x-icon" || e === "image/vnd.microsoft.icon") && a.push("ICO files contain multiple images; processing may use first frame only"), {
        compatible: o,
        warnings: a,
        errors: r,
        recommended: a.length === 0 && r.length === 0
      };
    });
    this.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, this.name = e, this.description = t, this.steps = [], this.validationWarnings = [], this.validationErrors = [], this.createdAt = (/* @__PURE__ */ new Date()).toISOString(), this.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), this.metadata = {
      version: "2.2.0",
      processorVersions: {
        resize: "1.2.1",
        crop: "2.0.0",
        optimize: "2.0.0",
        // Updated version
        rename: "1.0.0",
        template: "1.3.0",
        favicon: "2.0.0"
      },
      estimatedDuration: null,
      estimatedOutputs: 0,
      supportsFavicon: !0,
      supportsSVG: !0,
      supportsAICropping: !0,
      maxBatchSize: 50,
      defaultResizeMode: "longest",
      supportsOptimizationFirst: !0,
      optimizationModes: ["adaptive", "aggressive", "balanced"]
    };
  }
  /**
   * Import task configuration
   * @param {Object} config - Task configuration
   * @returns {LemGendTask} New task instance
   */
  static importConfig(e) {
    const t = new z(e.name, e.description);
    return t.id = e.id || t.id, t.createdAt = e.createdAt || t.createdAt, t.updatedAt = e.updatedAt || t.updatedAt, t.metadata = e.metadata || t.metadata, t.validationWarnings = e.validation?.warnings || [], t.validationErrors = e.validation?.errors || [], e.steps?.forEach((i) => {
      t.addStep(i.processor, i.options);
      const s = t.steps[t.steps.length - 1];
      s.enabled = i.enabled !== !1, s.id = i.id || s.id, s.metadata = i.metadata || s.metadata;
    }), t;
  }
  /**
   * Create task from template
   * @param {string} templateName - Template name
   * @returns {LemGendTask} New task instance
   */
  static fromTemplate(e) {
    const i = {
      "web-optimized": {
        name: "Web Optimization",
        description: "Optimize images for web with modern formats",
        steps: [
          { processor: "resize", options: { dimension: 1920, mode: "longest" } },
          { processor: "optimize", options: { quality: 85, format: "auto", compressionMode: "adaptive" } },
          { processor: "rename", options: { pattern: "{name}-{width}w" } }
        ]
      },
      "social-media": {
        name: "Social Media Posts",
        description: "Prepare images for social media platforms",
        steps: [
          { processor: "resize", options: { dimension: 1080, mode: "longest" } },
          {
            processor: "crop",
            options: {
              width: 1080,
              height: 1080,
              mode: "smart",
              confidenceThreshold: 70,
              multipleFaces: !0
            }
          },
          { processor: "optimize", options: { quality: 90, format: "auto", compressionMode: "balanced" } }
        ]
      },
      "portrait-smart": {
        name: "Smart Portrait Cropping",
        description: "AI-powered portrait cropping with face detection",
        steps: [
          { processor: "resize", options: { dimension: 1080, mode: "longest" } },
          {
            processor: "crop",
            options: {
              width: 1080,
              height: 1350,
              mode: "face",
              confidenceThreshold: 80,
              preserveAspectRatio: !0
            }
          },
          { processor: "optimize", options: { quality: 95, format: "auto", compressionMode: "adaptive" } }
        ]
      },
      "product-showcase": {
        name: "Product Showcase",
        description: "Smart cropping for product images",
        steps: [
          { processor: "resize", options: { dimension: 1200, mode: "longest" } },
          {
            processor: "crop",
            options: {
              width: 1200,
              height: 1200,
              mode: "object",
              objectsToDetect: ["product", "item"],
              confidenceThreshold: 75
            }
          },
          { processor: "optimize", options: { quality: 90, format: "auto", compressionMode: "balanced" } }
        ]
      },
      "favicon-package": {
        name: "Favicon Package",
        description: "Generate complete favicon set for all devices",
        steps: [
          { processor: "resize", options: { dimension: 512, mode: "longest" } },
          {
            processor: "crop",
            options: {
              width: 512,
              height: 512,
              mode: "smart",
              confidenceThreshold: 70
            }
          },
          {
            processor: "favicon",
            options: {
              sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
              formats: ["png", "ico"],
              generateManifest: !0,
              generateHTML: !0
            }
          },
          { processor: "rename", options: { pattern: "{name}-favicon-{size}" } }
        ]
      },
      "optimization-only": {
        name: "Optimization Only",
        description: "Optimize images without resizing or cropping",
        steps: [
          {
            processor: "optimize",
            options: {
              quality: 85,
              format: "auto",
              maxDisplayWidth: 1920,
              compressionMode: "adaptive",
              browserSupport: ["modern", "legacy"]
            }
          }
        ]
      }
    }[e];
    if (!i)
      throw new Error(`Unknown template: ${e}`);
    return z.importConfig(i);
  }
}
async function xe(l, e, t, i = "lanczos3") {
  return new Promise((s, n) => {
    const o = new Image();
    o.onload = () => {
      try {
        const a = document.createElement("canvas");
        a.width = e, a.height = t;
        const r = a.getContext("2d");
        if (!r) {
          n(new Error("Canvas context not supported"));
          return;
        }
        r.imageSmoothingEnabled = !0, r.imageSmoothingQuality = "high", r.drawImage(o, 0, 0, e, t), a.toBlob((m) => {
          if (!m) {
            n(new Error("Failed to create blob from canvas"));
            return;
          }
          const h = new File(
            [m],
            l.name,
            { type: l.type }
          );
          URL.revokeObjectURL(o.src), s(h);
        }, l.type, 0.95);
      } catch (a) {
        URL.revokeObjectURL(o.src), n(new Error(`Resize failed: ${a.message}`));
      }
    }, o.onerror = () => {
      n(new Error("Failed to load image for resizing"));
    }, o.src = URL.createObjectURL(l);
  });
}
async function Oe(l, e, t, i, s, n, o) {
  return new Promise((a, r) => {
    const m = new Image();
    m.onload = () => {
      try {
        const h = document.createElement("canvas");
        h.width = i, h.height = s;
        const p = h.getContext("2d");
        if (!p) {
          r(new Error("Canvas context not supported"));
          return;
        }
        p.drawImage(
          m,
          n,
          o,
          i,
          s,
          0,
          0,
          i,
          s
        ), h.toBlob((d) => {
          if (!d) {
            r(new Error("Failed to create blob from canvas"));
            return;
          }
          const g = new File(
            [d],
            l.name,
            { type: l.type }
          );
          URL.revokeObjectURL(m.src), a(g);
        }, l.type, 0.95);
      } catch (h) {
        URL.revokeObjectURL(m.src), r(new Error(`Crop failed: ${h.message}`));
      }
    }, m.onerror = () => {
      r(new Error("Failed to load image for cropping"));
    }, m.src = URL.createObjectURL(l);
  });
}
function F(l) {
  return l.name.split(".").pop().toLowerCase();
}
async function T(l, e, t) {
  console.log("processSingleFile called with:", {
    fileType: l?.constructor?.name,
    isLemGendImage: l instanceof u,
    hasFileProperty: !!l?.file,
    filePropertyType: l?.file?.constructor?.name
  });
  let i;
  try {
    if (l instanceof u) {
      if (i = l, console.log("Using existing LemGendImage:", {
        hasFile: !!i.file,
        fileType: i.file?.constructor?.name,
        width: i.width,
        height: i.height,
        originalName: i.originalName
      }), !i.file || !(i.file instanceof File))
        throw console.warn("LemGendImage missing valid file property"), new Error("LemGendImage has no valid file property");
      if (!i.width || !i.height)
        try {
          console.log("LemGendImage missing dimensions, loading..."), await i.load();
        } catch (p) {
          throw console.warn("Failed to load existing LemGendImage:", p), new Error(`Failed to load LemGendImage: ${p.message}`);
        }
    } else if (l && l.file && l.file instanceof File)
      console.log("Creating new LemGendImage from file object..."), i = new u(l.file), await i.load();
    else if (l instanceof File || l instanceof Blob)
      console.log("Creating new LemGendImage from File/Blob..."), i = new u(l), await i.load();
    else
      throw new Error(`Invalid file type provided for processing. Got: ${typeof l}, constructor: ${l?.constructor?.name}`);
    if (!i || !(i instanceof u))
      throw new Error("Failed to create valid LemGendImage instance");
    if (!i.file || !(i.file instanceof File))
      throw new Error("LemGendImage missing file property");
    if (!i.width || !i.height)
      throw new Error("LemGendImage missing dimensions");
    console.log("Validating task with LemGendImage...", {
      originalName: i.originalName,
      width: i.width,
      height: i.height,
      hasFile: !!i.file,
      fileType: i.file?.constructor?.name
    });
    const s = await e.validate(i);
    if (!s.isValid) {
      const p = s.errors.map((d) => d.message).join(", ");
      throw console.error("Task validation failed:", p), new Error(`Task validation failed: ${p}`);
    }
    console.log("Task validation passed successfully");
    const n = e.getEnabledSteps();
    let o = i.file, a = {
      width: i.width,
      height: i.height
    };
    const r = ["resize", "crop", "optimize", "rename"], m = n.sort((p, d) => {
      const g = r.indexOf(p.processor), w = r.indexOf(d.processor);
      return g - w;
    });
    console.log("Processing steps in order:", m.map((p) => `${p.order}.${p.processor}`)), console.log("Starting image dimensions:", a);
    for (const p of m)
      try {
        switch (console.log(`
=== Processing step ${p.order}: ${p.processor} ===`), p.processor) {
          case "resize":
            const g = await new A(p.options).process(i);
            console.log("Resize result:", {
              original: `${g.originalDimensions.width}x${g.originalDimensions.height}`,
              target: `${g.newDimensions.width}x${g.newDimensions.height}`,
              mode: p.options.mode,
              dimension: p.options.dimension
            }), o = await xe(
              o,
              g.newDimensions.width,
              g.newDimensions.height,
              p.options.algorithm || "lanczos3"
            ), a = g.newDimensions, i.updateDimensions(a.width, a.height), i.addOperation("resize", g), console.log(`✓ Resized to: ${a.width}x${a.height}`), console.log("File after resize:", {
              name: o.name,
              size: o.size,
              type: o.type
            });
            break;
          case "crop":
            const f = await new D(p.options).process(i, a);
            console.log("Crop result:", {
              current: `${a.width}x${a.height}`,
              target: `${f.finalDimensions.width}x${f.finalDimensions.height}`,
              mode: p.options.mode,
              smartCrop: f.smartCrop
            }), f.smartCrop && console.log("Smart crop detected with steps:", {
              detection: f.steps.detection.confidence,
              resize: f.steps.resize,
              crop: f.cropOffsets
            }), o = await Oe(
              o,
              a.width,
              a.height,
              f.cropOffsets.width,
              f.cropOffsets.height,
              f.cropOffsets.x,
              f.cropOffsets.y
            ), a = f.finalDimensions, i.updateDimensions(a.width, a.height), i.addOperation("crop", f), console.log(`✓ Cropped to: ${a.width}x${a.height}`), console.log("File after crop:", {
              name: o.name,
              size: o.size,
              type: o.type
            });
            break;
          case "optimize":
            const y = new S(p.options), v = await y.process(i);
            console.log("Optimize result:", {
              format: p.options.format,
              quality: p.options.quality,
              originalFormat: v.originalInfo.format,
              transparency: v.originalInfo.transparency,
              savings: v.savings
            }), o = await y.applyOptimization(i), i.addOperation("optimize", v), console.log(`✓ Optimized to: ${v.optimization.selectedFormat} at ${v.optimization.compression.quality}%`), console.log("File after optimize:", {
              name: o.name,
              size: o.size,
              type: o.type,
              savings: `${v.savings.savingsPercent}%`
            });
            break;
          case "rename":
            const _ = await new C(p.options).process(i, t, e.steps.length), E = F(o);
            o = new File(
              [o],
              `${_.newName}.${E}`,
              { type: o.type }
            ), i.addOperation("rename", _), console.log(`✓ Renamed to: ${_.newName}.${E}`);
            break;
          default:
            console.warn(`Unknown processor: ${p.processor}`);
        }
      } catch (d) {
        throw console.error(`Error in step ${p.order} (${p.processor}):`, d), new Error(`Step ${p.order} (${p.processor}) failed: ${d.message}`);
      }
    const h = F(o);
    return i.addOutput(
      h,
      o,
      null
    ), console.log(`
=== Processing Complete ===`), console.log("Final result:", {
      originalName: i.originalName,
      finalName: o.name,
      originalSize: i.originalSize,
      finalSize: o.size,
      dimensions: `${a.width}x${a.height}`,
      format: h,
      sizeReduction: `${((i.originalSize - o.size) / i.originalSize * 100).toFixed(1)}%`
    }), {
      image: i,
      file: o,
      success: !0,
      metadata: i.getInfo()
    };
  } catch (s) {
    return console.error("Error in processSingleFile:", s), {
      image: i || l,
      file: i?.file || l,
      error: s.message,
      success: !1
    };
  }
}
async function x(l, e, t = {}) {
  const {
    onProgress: i = null,
    onWarning: s = null,
    onError: n = null,
    parallel: o = !1,
    maxParallel: a = 4
  } = t, r = [], m = l.length;
  console.log("=== lemGendaryProcessBatch START ==="), console.log("Batch processing:", {
    totalFiles: m,
    hasTask: !!e,
    steps: e?.getEnabledSteps()?.length || 0,
    options: t
  }), console.log("Validating task...");
  const h = l.length > 0 ? await e.validate(l[0]) : await e.validate();
  if (!h.isValid)
    if (console.error("Task validation failed:", h.errors), h.errors.every(
      (d) => d.type === "invalid_image" || d.message.includes("No image provided")
    ) && l.length > 0)
      console.warn("Task validation has image-related warnings but proceeding anyway...");
    else
      throw new Error(`Task validation failed: ${h.errors.map((d) => d.message).join(", ")}`);
  if (h.hasWarnings && s && h.warnings.forEach((p) => s(p)), o) {
    const p = [];
    for (let d = 0; d < l.length; d += a)
      p.push(l.slice(d, d + a));
    for (let d = 0; d < p.length; d++) {
      const g = p[d], w = g.map(
        (y, v) => T(y, e, d * a + v)
      );
      if ((await Promise.allSettled(w)).forEach((y, v) => {
        if (y.status === "fulfilled")
          r.push(y.value);
        else {
          const O = {
            file: g[v],
            error: y.reason.message,
            success: !1
          };
          r.push(O), n && n(y.reason, g[v]);
        }
      }), i) {
        const y = r.length / m;
        i(y, r.length, m);
      }
    }
  } else
    for (let p = 0; p < l.length; p++)
      try {
        console.log(`
=== Processing file ${p + 1}/${m} ===`);
        const d = l[p];
        console.log("File to process:", {
          type: d?.constructor?.name,
          isLemGendImage: d instanceof u,
          name: d?.name || d?.originalName || d?.file?.name
        });
        const g = await T(d, e, p);
        if (r.push(g), i) {
          const w = (p + 1) / m;
          i(w, p + 1, m);
        }
      } catch (d) {
        console.error(`Failed to process file ${p}:`, d);
        const g = {
          file: l[p],
          error: d.message,
          success: !1
        };
        r.push(g), n && n(d, l[p]);
      }
  return console.log(`
=== Processing complete ===`), console.log("Summary:", {
    totalFiles: m,
    successful: r.filter((p) => p.success).length,
    failed: r.filter((p) => !p.success).length
  }), r.forEach((p, d) => {
    p.success ? console.log(`✓ File ${d + 1}: ${p.image?.originalName || "Unknown"}`, {
      success: !0,
      size: p.file?.size,
      dimensions: p.image ? `${p.image.width}x${p.image.height}` : "N/A"
    }) : console.log(`✗ File ${d + 1}: Failed`, {
      error: p.error,
      fileName: p.file?.name || "Unknown"
    });
  }), r;
}
async function Ee(l, e = {}) {
  const t = new S(e), i = [];
  for (const s of l)
    try {
      let n;
      s instanceof u ? n = s : (n = new u(s), await n.load());
      const o = await t.process(n), a = await t.applyOptimization(n), r = new u(a);
      await r.load(), i.push({
        original: n,
        optimized: r,
        result: o,
        success: !0
      });
    } catch (n) {
      console.error("Optimization failed:", n), i.push({
        original: s,
        error: n.message,
        success: !1
      });
    }
  return i;
}
async function Fe(l, e = {}) {
  const {
    optimization: t = {},
    zipOptions: i = {},
    includeReport: s = !0
  } = e, n = new S(t), o = await Promise.all(
    l.map(async (d) => {
      if (d instanceof u)
        return d;
      {
        const g = new u(d);
        return await g.load(), g;
      }
    })
  );
  console.log(`Optimizing ${o.length} images...`);
  const a = await n.prepareForZip(o), r = a.filter((d) => d.success), m = a.filter((d) => !d.success);
  if (console.log(`Optimization complete: ${r.length} successful, ${m.length} failed`), r.length === 0)
    throw new Error("No images could be optimized");
  const h = r.map((d) => {
    const g = new u(d.optimized);
    return g.originalName = d.original.originalName, g;
  });
  if (s) {
    const d = n.generateOptimizationReport(a), g = new File(
      [JSON.stringify(d, null, 2)],
      "optimization-report.json",
      { type: "application/json" }
    ), w = new u(g);
    w.originalName = "optimization-report.json", h.push(w);
  }
  return console.log("Creating ZIP from optimized images..."), await R(h, {
    zipName: "optimized-images.zip",
    ...i
  });
}
async function Te(l, e = {}) {
  const t = l.filter((i) => i.success).map((i) => i.image);
  return R(t, e);
}
function Le() {
  return {
    name: "LemGendary Image Processor",
    version: "2.2.0",
    // Updated to match LemGendTask version
    description: "Batch image processing with intelligent operations, AI-powered smart cropping, and advanced optimization",
    author: "LemGenda",
    license: "MIT",
    homepage: "https://github.com/lemgenda/image-lemgendizer-core",
    processors: {
      LemGendaryResize: {
        name: "LemGendaryResize",
        description: "Intelligent image resizing using longest dimension",
        version: "1.2.1"
      },
      LemGendaryCrop: {
        name: "LemGendaryCrop",
        description: "AI-powered smart cropping with face and object detection",
        version: "2.0.0"
      },
      LemGendaryOptimize: {
        name: "LemGendaryOptimize",
        description: "Advanced image optimization with intelligent format selection and adaptive compression",
        version: "2.0.0"
      },
      LemGendaryRename: {
        name: "LemGendaryRename",
        description: "Batch renaming"
      }
    },
    templates: {
      total: k?.ALL?.length || 0,
      categories: P?.length || 0,
      platforms: I ? Object.keys(I).length : 0
    },
    features: [
      "Smart AI cropping",
      "Face detection",
      "Object detection",
      "Content-aware resizing",
      "Advanced optimization",
      "Intelligent format selection",
      "Adaptive compression",
      "Batch processing",
      "Favicon generation",
      "Multiple format support",
      "Optimization-first ZIP creation",
      "Flexible dimension templates",
      "Variable height/width support"
    ]
  };
}
async function Me(l, e = {}) {
  const {
    sizes: t = [16, 32, 48, 64, 128, 256],
    formats: i = ["png", "ico"],
    includeManifest: s = !0,
    includeHTML: n = !0
  } = e, o = [], a = new u(l);
  await a.load();
  for (const r of t)
    for (const m of i) {
      const h = await Ce(a, r, m);
      o.push(h);
    }
  return s && o.push(De(a, t)), n && o.push(Ae(a, t, i)), o;
}
async function Ce(l, e, t) {
  return {
    size: e,
    format: t,
    width: e,
    height: e,
    name: `favicon-${e}x${e}.${t}`
  };
}
function De(l, e) {
  return {
    type: "json",
    name: "manifest.json",
    content: JSON.stringify({
      name: "App Icon",
      icons: e.map((t) => ({
        src: `/favicon-${t}x${t}.png`,
        sizes: `${t}x${t}`,
        type: "image/png"
      }))
    }, null, 2)
  };
}
function Ae(l, e, t) {
  const i = [
    "<!-- Favicon tags for HTML -->",
    '<link rel="icon" href="/favicon.ico" sizes="any">'
  ];
  for (const s of e)
    for (const n of t)
      n === "png" && i.push(`<link rel="icon" type="image/png" sizes="${s}x${s}" href="/favicon-${s}x${s}.png">`);
  return i.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">'), i.push('<link rel="manifest" href="/manifest.json">'), {
    type: "html",
    name: "favicon-tags.html",
    content: i.join(`
`)
  };
}
async function We(l, e, t = {}) {
  try {
    const i = W(e);
    if (!i)
      throw new Error(`Template not found: ${e}`);
    const s = M(i, {
      width: l.width,
      height: l.height
    });
    if (!s.compatible)
      throw new Error(`Template incompatible: ${s.errors.map((m) => m.message).join(", ")}`);
    const n = new z(`Template: ${i.displayName}`, i.description), o = b(i.width), a = b(i.height);
    if (!o.isVariable && !a.isVariable) {
      const m = o.value / a.value, h = l.width / l.height;
      Math.abs(m - h) > 0.1 ? n.addCrop(o.value, a.value, "smart") : n.addResize(Math.max(o.value, a.value), "longest");
    } else o.isVariable && !a.isVariable ? n.addResize(a.value, "height") : !o.isVariable && a.isVariable && n.addResize(o.value, "width");
    n.addOptimize(85, "auto", {
      compressionMode: "adaptive",
      preserveTransparency: i.recommendedFormats.includes("png") || i.recommendedFormats.includes("svg")
    });
    const r = await x([l], n);
    if (r.length === 0 || !r[0].success)
      throw new Error("Template processing failed");
    return {
      success: !0,
      template: i,
      image: r[0].image,
      file: r[0].file,
      compatibility: s,
      warnings: s.warnings
    };
  } catch (i) {
    return console.error("Template processing failed:", i), {
      success: !1,
      error: i.message,
      templateId: e
    };
  }
}
async function Pe(l, e, t = {}) {
  const i = b(e.width), s = b(e.height), n = new z(`Flexible: ${e.displayName}`, e.description);
  if (i.isVariable && !s.isVariable) {
    const a = s.value / l.height;
    Math.round(l.width * a), n.addResize(s.value, "height");
  } else if (!i.isVariable && s.isVariable) {
    const a = i.value / l.width;
    Math.round(l.height * a), n.addResize(i.value, "width");
  } else i.isVariable && s.isVariable && n.addOptimize(85, "auto");
  return (await x([l], n))[0] || { success: !1, error: "Processing failed" };
}
const Be = {
  // Core classes
  LemGendImage: u,
  LemGendTask: z,
  // Processors
  LemGendaryResize: A,
  LemGendaryCrop: D,
  LemGendaryOptimize: S,
  LemGendaryRename: C,
  // Main functions
  lemGendaryProcessBatch: x,
  lemGendBuildZip: Te,
  getLibraryInfo: Le,
  processFaviconSet: Me,
  optimizeForZip: Ee,
  createOptimizedZip: Fe,
  processWithTemplate: We,
  processFlexibleTemplate: Pe,
  // Templates
  LemGendTemplates: k,
  TEMPLATE_CATEGORIES: P,
  PLATFORMS: I,
  getTemplatesByPlatform: le,
  getTemplatesByCategory: ce,
  getTemplateById: W,
  getTemplatesByDimensions: pe,
  getRecommendedTemplates: re,
  getTemplateStats: ne,
  exportTemplates: ae,
  validateTemplate: oe,
  addCustomTemplate: se,
  getAllPlatforms: ie,
  getTemplatesGroupedByPlatform: te,
  searchTemplates: ee,
  getTemplateAspectRatio: K,
  getFlexibleTemplates: X,
  getTemplatesForImage: Y,
  isVariableDimension: Q,
  parseDimension: b,
  // Utilities
  createLemGendaryZip: R,
  createSimpleZip: Re,
  extractZip: Ie,
  getZipInfo: $e,
  createZipWithProgress: _e,
  // Image utils
  getImageDimensions: Se,
  hasTransparency: be,
  fileToDataURL: ze,
  dataURLtoFile: we,
  resizeImage: ye,
  cropImage: ve,
  calculateAspectRatioFit: fe,
  formatFileSize: ue,
  getFileExtension: ge,
  validateImageFile: he,
  createThumbnail: de,
  batchProcess: me,
  // Validation
  ValidationErrors: J,
  ValidationWarnings: $,
  validateImage: H,
  validateDimensions: Z,
  validateResize: q,
  validateCrop: B,
  validateOptimization: N,
  validateRenamePattern: V,
  getValidationSummary: U,
  validateOptimizationOptions: L,
  validateTemplateCompatibility: M
};
export {
  u as LemGendImage,
  z as LemGendTask,
  k as LemGendTemplates,
  D as LemGendaryCrop,
  S as LemGendaryOptimize,
  C as LemGendaryRename,
  A as LemGendaryResize,
  I as PLATFORMS,
  P as TEMPLATE_CATEGORIES,
  J as ValidationErrors,
  $ as ValidationWarnings,
  se as addCustomTemplate,
  me as batchProcess,
  fe as calculateAspectRatioFit,
  R as createLemGendaryZip,
  Fe as createOptimizedZip,
  Re as createSimpleZip,
  de as createThumbnail,
  _e as createZipWithProgress,
  ve as cropImage,
  we as dataURLtoFile,
  Be as default,
  ae as exportTemplates,
  Ie as extractZip,
  ze as fileToDataURL,
  ue as formatFileSize,
  ie as getAllPlatforms,
  ge as getFileExtension,
  X as getFlexibleTemplates,
  Se as getImageDimensions,
  Le as getLibraryInfo,
  re as getRecommendedTemplates,
  K as getTemplateAspectRatio,
  W as getTemplateById,
  ne as getTemplateStats,
  ce as getTemplatesByCategory,
  pe as getTemplatesByDimensions,
  le as getTemplatesByPlatform,
  Y as getTemplatesForImage,
  te as getTemplatesGroupedByPlatform,
  U as getValidationSummary,
  $e as getZipInfo,
  be as hasTransparency,
  Q as isVariableDimension,
  Te as lemGendBuildZip,
  x as lemGendaryProcessBatch,
  Ee as optimizeForZip,
  b as parseDimension,
  Me as processFaviconSet,
  Pe as processFlexibleTemplate,
  We as processWithTemplate,
  ye as resizeImage,
  ee as searchTemplates,
  B as validateCrop,
  Z as validateDimensions,
  H as validateImage,
  he as validateImageFile,
  N as validateOptimization,
  L as validateOptimizationOptions,
  V as validateRenamePattern,
  q as validateResize,
  oe as validateTemplate,
  M as validateTemplateCompatibility
};
//# sourceMappingURL=index.es.js.map
