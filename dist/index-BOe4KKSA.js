var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error("Invalid file provided"));
      return;
    }
    if (file.type === "image/x-icon" || file.type === "image/vnd.microsoft.icon") {
      getIcoDimensions().then(resolve).catch(() => resolve({ width: 32, height: 32, orientation: "square", aspectRatio: 1 }));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        orientation: img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait",
        aspectRatio: img.naturalWidth / img.naturalHeight
      };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (file.type === "image/svg+xml") {
        getSVGDimensions(file).then(resolve).catch(() => reject(new Error("Failed to load image dimensions")));
      } else {
        reject(new Error("Failed to load image"));
      }
    };
    img.src = objectUrl;
  });
}
async function getSVGDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const svgText = e.target.result;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        if (svgDoc.querySelector("parsererror")) {
          reject(new Error("Invalid SVG format"));
          return;
        }
        const width = parseFloat(svgElement.getAttribute("width")) || svgElement.viewBox?.baseVal?.width || 100;
        const height = parseFloat(svgElement.getAttribute("height")) || svgElement.viewBox?.baseVal?.height || 100;
        resolve({
          width,
          height,
          orientation: width >= height ? "landscape" : "portrait",
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
async function getIcoDimensions(file) {
  return new Promise((resolve) => {
    resolve({
      width: 32,
      height: 32,
      orientation: "square",
      aspectRatio: 1
    });
  });
}
async function hasTransparency(file) {
  if (!file || file.type !== "image/png" && file.type !== "image/webp") {
    return false;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
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
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function getFileExtension(fileOrName) {
  if (fileOrName instanceof File) {
    const nameExt = fileOrName.name.split(".").pop().toLowerCase();
    if (nameExt && nameExt.length <= 4) {
      return nameExt;
    }
    const mimeExt = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
      "image/tiff": "tiff",
      "image/avif": "avif",
      "image/x-icon": "ico",
      "image/vnd.microsoft.icon": "ico"
    }[fileOrName.type];
    return mimeExt || "unknown";
  }
  const name = typeof fileOrName === "string" ? fileOrName : "";
  const ext = name.split(".").pop().toLowerCase();
  return ext && ext.length <= 4 ? ext : "unknown";
}
async function createThumbnail(imageOrFile, maxSize = 200) {
  let file;
  if (imageOrFile instanceof File) {
    file = imageOrFile;
  } else if (imageOrFile && imageOrFile.file instanceof File) {
    file = imageOrFile.file;
  } else {
    throw new Error("Invalid input: must be File or object with file property");
  }
  return new Promise((resolve, reject) => {
    if (file.type === "image/x-icon" || file.type === "image/vnd.microsoft.icon") {
      resolve("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM4ODJlZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMzg4MmVmIi8+PC9zdmc+");
      return;
    }
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let width, height;
      if (img.width > img.height) {
        width = maxSize;
        height = Math.round(img.height / img.width * maxSize);
      } else {
        height = maxSize;
        width = Math.round(img.width / img.height * maxSize);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(objectUrl);
      resolve(thumbnail);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to create thumbnail"));
    };
    img.src = objectUrl;
  });
}
async function analyzeForOptimization(file) {
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
  let score = 0;
  if (file.size > 5 * 1024 * 1024) {
    score += 40;
    analysis.recommendations.push("File is very large - high optimization potential");
  } else if (file.size > 1 * 1024 * 1024) {
    score += 20;
  } else if (file.size > 100 * 1024) {
    score += 10;
  }
  const megapixels = dimensions.width * dimensions.height / 1e6;
  if (megapixels > 16) {
    score += 30;
    analysis.recommendations.push("Very high resolution - consider resizing");
  } else if (megapixels > 4) {
    score += 15;
  }
  const modernFormats = ["webp", "avif", "svg"];
  const currentFormat = getFileExtension(file);
  if (!modernFormats.includes(currentFormat)) {
    score += 20;
    analysis.recommendations.push(`Consider converting from ${currentFormat} to modern format`);
  }
  if (transparency && currentFormat === "jpg") {
    score += 10;
    analysis.recommendations.push("JPEG with transparency - convert to PNG or WebP");
  }
  analysis.optimizationScore = Math.min(100, score);
  analysis.optimizationLevel = score > 50 ? "high" : score > 25 ? "medium" : "low";
  return analysis;
}
const ValidationErrors = {
  INVALID_DIMENSIONS: "INVALID_DIMENSIONS"
};
const ValidationWarnings = {
  CONTENT_LOSS: "CONTENT_LOSS",
  SMALL_WIDTH: "SMALL_WIDTH",
  LARGE_DIMENSIONS: "LARGE_DIMENSIONS",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT"
};
function isVariableDimension(dimension) {
  if (typeof dimension === "string") {
    return dimension.includes("{") || dimension.includes("*") || dimension.toLowerCase().includes("variable") || dimension.toLowerCase().includes("flexible") || dimension === "auto" || dimension === "any";
  }
  return false;
}
function parseDimension(dimension) {
  if (typeof dimension === "number") {
    return { value: dimension, isVariable: false, unit: "px" };
  }
  if (typeof dimension === "string") {
    if (isVariableDimension(dimension)) {
      return { value: null, isVariable: true, expression: dimension };
    }
    const match = dimension.match(/(\d+)/);
    if (match) {
      return { value: parseInt(match[1]), isVariable: false, unit: "px" };
    }
  }
  return { value: null, isVariable: false };
}
function validateOptimizationOptions(options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  const { quality, format, compressionMode, browserSupport } = options;
  if (quality !== void 0) {
    if (typeof quality !== "number" || quality < 1 || quality > 100) {
      result.valid = false;
      result.errors.push({
        code: "INVALID_QUALITY",
        message: `Quality must be between 1 and 100, got ${quality}`,
        severity: "error",
        suggestion: "Use a value between 1 and 100"
      });
    }
  }
  const validFormats = ["auto", "webp", "jpg", "jpeg", "png", "avif", "original"];
  if (format && !validFormats.includes(format.toLowerCase())) {
    result.warnings.push({
      code: "UNSUPPORTED_FORMAT",
      message: `Format ${format} may not be supported`,
      severity: "warning",
      suggestion: `Use one of: ${validFormats.join(", ")}`
    });
  }
  return result;
}
function getValidationSummary(validationResult) {
  return {
    isValid: validationResult.valid,
    hasWarnings: validationResult.warnings.length > 0,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    errors: validationResult.errors,
    warnings: validationResult.warnings
  };
}
function validateResize(dimension, mode, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  if (!dimension || dimension <= 0) {
    result.valid = false;
    result.errors.push({
      code: "INVALID_DIMENSION",
      message: `Invalid resize dimension: ${dimension}`,
      severity: "error",
      suggestion: "Dimension must be a positive number"
    });
  }
  const validModes = ["auto", "width", "height", "longest", "fit"];
  if (!validModes.includes(mode)) {
    result.valid = false;
    result.errors.push({
      code: "INVALID_MODE",
      message: `Invalid resize mode: ${mode}`,
      severity: "error",
      suggestion: `Use one of: ${validModes.join(", ")}`
    });
  }
  return result;
}
function validateCrop(width, height, mode, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  if (!width || width <= 0 || !height || height <= 0) {
    result.valid = false;
    result.errors.push({
      code: "INVALID_CROP_DIMENSIONS",
      message: `Invalid crop dimensions: ${width}x${height}`,
      severity: "error",
      suggestion: "Dimensions must be positive numbers"
    });
  }
  const validModes = ["smart", "face", "object", "saliency", "entropy", "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"];
  if (!validModes.includes(mode)) {
    result.valid = false;
    result.errors.push({
      code: "INVALID_CROP_MODE",
      message: `Invalid crop mode: ${mode}`,
      severity: "error",
      suggestion: `Use one of: ${validModes.join(", ")}`
    });
  }
  return result;
}
function validateOptimization(options = {}) {
  return validateOptimizationOptions(options);
}
function validateRenamePattern(pattern) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  if (!pattern || typeof pattern !== "string" || pattern.trim() === "") {
    result.valid = false;
    result.errors.push({
      code: "EMPTY_PATTERN",
      message: "Rename pattern cannot be empty",
      severity: "error"
    });
    return result;
  }
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (invalidChars.test(pattern)) {
    result.errors.push({
      code: "INVALID_CHARS",
      message: "Pattern contains invalid filename characters",
      severity: "error",
      suggestion: 'Remove <>:"/\\|?* and control characters from pattern'
    });
    result.valid = false;
  }
  const placeholders = ["{name}", "{index}", "{timestamp}", "{width}", "{height}", "{dimensions}", "{date}", "{time}"];
  const hasPlaceholder = placeholders.some((ph) => pattern.includes(ph));
  if (!hasPlaceholder) {
    result.warnings.push({
      code: "NO_PLACEHOLDERS",
      message: "Pattern may create duplicate filenames",
      severity: "warning",
      suggestion: "Include {index} or {timestamp} for unique filenames"
    });
  }
  return result;
}
function validateFaviconOptions(options, imageInfo = null) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  const { sizes, formats } = options;
  if (!Array.isArray(sizes) || sizes.length === 0) {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_DIMENSIONS,
      message: "Favicon sizes must be a non-empty array",
      severity: "error"
    });
  }
  sizes?.forEach((size) => {
    if (size < 16) {
      result.warnings.push({
        code: ValidationWarnings.SMALL_WIDTH,
        message: `Favicon size ${size}px is below recommended minimum (16px)`,
        severity: "warning"
      });
    }
    if (size > 1024) {
      result.warnings.push({
        code: ValidationWarnings.LARGE_DIMENSIONS,
        message: `Favicon size ${size}px is unusually large`,
        severity: "info"
      });
    }
  });
  if (imageInfo) {
    const minSize = Math.min(...sizes);
    if (imageInfo.width < minSize || imageInfo.height < minSize) {
      result.warnings.push({
        code: ValidationWarnings.SMALL_WIDTH,
        message: `Source image (${imageInfo.width}x${imageInfo.height}) smaller than smallest favicon size (${minSize}px)`,
        severity: "warning",
        suggestion: "Consider using a larger source image or enable upscaling"
      });
    }
    if (Math.abs(imageInfo.width / imageInfo.height - 1) > 0.1) {
      result.warnings.push({
        code: ValidationWarnings.CONTENT_LOSS,
        message: "Source image is not square; favicons may be distorted",
        severity: "warning",
        suggestion: "Consider adding a crop step before favicon generation"
      });
    }
  }
  const validFormats = ["png", "ico", "svg"];
  formats?.forEach((format) => {
    if (!validFormats.includes(format)) {
      result.warnings.push({
        code: ValidationWarnings.UNSUPPORTED_FORMAT,
        message: `Unsupported favicon format: ${format}`,
        severity: "warning",
        suggestion: `Use one of: ${validFormats.join(", ")}`
      });
    }
  });
  return result;
}
function validateTaskSteps(steps, imageInfo = null) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  steps.forEach((step, index2) => {
    switch (step.processor) {
      case "resize":
        const resizeValidation = validateResize(
          step.options.dimension,
          step.options.mode
        );
        if (!resizeValidation.valid) {
          resizeValidation.errors.forEach((error) => {
            error.step = index2 + 1;
            result.errors.push(error);
          });
          resizeValidation.warnings.forEach((warning) => {
            warning.step = index2 + 1;
            result.warnings.push(warning);
          });
          result.valid = false;
        }
        break;
      case "crop":
        const cropValidation = validateCrop(
          step.options.width,
          step.options.height,
          step.options.mode
        );
        if (!cropValidation.valid) {
          cropValidation.errors.forEach((error) => {
            error.step = index2 + 1;
            result.errors.push(error);
          });
          cropValidation.warnings.forEach((warning) => {
            warning.step = index2 + 1;
            result.warnings.push(warning);
          });
          result.valid = false;
        }
        break;
      case "optimize":
        const optimizeValidation = validateOptimization(step.options);
        optimizeValidation.errors.forEach((error) => {
          error.step = index2 + 1;
          result.errors.push(error);
        });
        optimizeValidation.warnings.forEach((warning) => {
          warning.step = index2 + 1;
          result.warnings.push(warning);
        });
        result.valid = result.valid && optimizeValidation.valid;
        break;
      case "rename":
        const renameValidation = validateRenamePattern(step.options.pattern);
        renameValidation.errors.forEach((error) => {
          error.step = index2 + 1;
          result.errors.push(error);
        });
        renameValidation.warnings.forEach((warning) => {
          warning.step = index2 + 1;
          result.warnings.push(warning);
        });
        result.valid = result.valid && renameValidation.valid;
        break;
      case "favicon":
        const faviconValidation = validateFaviconOptions(step.options, imageInfo);
        faviconValidation.errors.forEach((error) => {
          error.step = index2 + 1;
          result.errors.push(error);
        });
        faviconValidation.warnings.forEach((warning) => {
          warning.step = index2 + 1;
          result.warnings.push(warning);
        });
        result.valid = result.valid && faviconValidation.valid;
        break;
    }
  });
  return result;
}
function validateTaskLogic(steps) {
  const result = {
    valid: true,
    warnings: []
  };
  const enabledSteps = steps.filter((step) => step.enabled !== false);
  const hasResize = enabledSteps.some((s) => s.processor === "resize");
  const hasCrop = enabledSteps.some((s) => s.processor === "crop");
  const hasOptimize = enabledSteps.some((s) => s.processor === "optimize");
  if (hasCrop && !hasResize) {
    result.warnings.push({
      type: "crop_without_resize",
      message: "Crop without resize may result in unexpected output",
      severity: "info",
      suggestion: "Consider adding resize step before crop for better control"
    });
  }
  const optimizeSteps = enabledSteps.filter((s) => s.processor === "optimize");
  if (optimizeSteps.length > 1) {
    result.warnings.push({
      type: "multiple_optimize",
      message: `Multiple optimization steps (${optimizeSteps.length})`,
      severity: "warning",
      suggestion: "Multiple optimizations may degrade quality unnecessarily"
    });
  }
  const renameIndex = enabledSteps.findIndex((s) => s.processor === "rename");
  if (renameIndex >= 0 && renameIndex < enabledSteps.length - 2) {
    result.warnings.push({
      type: "early_rename",
      message: "Rename step placed before other operations",
      severity: "info",
      suggestion: "Consider moving rename to end to reflect final output"
    });
  }
  const faviconIndex = enabledSteps.findIndex((s) => s.processor === "favicon");
  if (faviconIndex >= 0) {
    const stepsBefore = enabledSteps.slice(0, faviconIndex);
    const hasResizeBefore = stepsBefore.some((s) => s.processor === "resize");
    const hasCropBefore = stepsBefore.some((s) => s.processor === "crop");
    if (!hasResizeBefore && !hasCropBefore) {
      result.warnings.push({
        type: "favicon_without_preparation",
        message: "Favicon generation without prior resize/crop",
        severity: "warning",
        suggestion: "Add resize/crop step before favicon for optimal results"
      });
    }
  }
  const faviconSteps = enabledSteps.filter((s) => s.processor === "favicon");
  faviconSteps.forEach((faviconStep) => {
    const optimizeAfter = enabledSteps.filter((s) => s.processor === "optimize").some((optimizeStep) => optimizeStep.order > faviconStep.order);
    if (optimizeAfter) {
      result.warnings.push({
        type: "optimize_after_favicon",
        message: "Optimization after favicon generation may affect favicon quality",
        severity: "warning",
        suggestion: "Move optimization step before favicon generation"
      });
    }
  });
  if (hasOptimize && !hasResize && !hasCrop) {
    result.warnings.push({
      type: "optimization_only",
      message: "Task contains only optimization step",
      severity: "info",
      suggestion: "Consider adding resize/crop steps for complete image processing"
    });
  }
  return result;
}
async function validateTask(task, lemGendImage) {
  const result = {
    isValid: true,
    hasWarnings: false,
    errors: [],
    warnings: [],
    summary: null
  };
  const enabledSteps = task.getEnabledSteps();
  if (enabledSteps.length === 0) {
    result.warnings.push({
      type: "empty_task",
      message: "Task has no enabled processing steps",
      severity: "warning"
    });
  }
  if (lemGendImage) {
    if (!lemGendImage.file) {
      result.warnings.push({
        type: "missing_file_property",
        message: "Image missing file property (may be from session storage)",
        severity: "warning",
        suggestion: "File will be reconstructed for processing"
      });
    } else if (!(lemGendImage.file instanceof File)) {
      result.warnings.push({
        type: "invalid_file_type",
        message: "Image file property is not a File instance",
        severity: "warning",
        suggestion: "File will be reconstructed for processing"
      });
    }
    const stepValidation = validateTaskSteps(enabledSteps, {
      width: lemGendImage.width,
      height: lemGendImage.height
    });
    result.errors.push(...stepValidation.errors);
    result.warnings.push(...stepValidation.warnings);
    result.isValid = stepValidation.valid;
    const logicValidation = validateTaskLogic(enabledSteps);
    result.warnings.push(...logicValidation.warnings);
  } else {
    const stepValidation = validateTaskSteps(enabledSteps);
    result.errors.push(...stepValidation.errors);
    result.warnings.push(...stepValidation.warnings);
    result.isValid = stepValidation.valid;
  }
  result.hasWarnings = result.warnings.length > 0;
  result.summary = getValidationSummary({
    valid: result.isValid,
    errors: result.errors,
    warnings: result.warnings
  });
  return result;
}
class LemGendTask {
  /**
   * Create a new LemGendTask
   * @param {string} name - Task name
   * @param {string} description - Task description
   */
  constructor(name = "Untitled Task", description = "") {
    /**
     * Add a processing step
     * @param {string} processor - Processor name
     * @param {Object} options - Processor options
     * @returns {LemGendTask} This task instance for chaining
     */
    __publicField(this, "addStep", (processor, options) => {
      const validProcessors = ["resize", "crop", "optimize", "rename", "template", "favicon"];
      if (!validProcessors.includes(processor)) {
        throw new Error(`Invalid processor: ${processor}. Valid options: ${validProcessors.join(", ")}`);
      }
      const step = {
        id: `step_${this.steps.length + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        processor,
        options: this._validateStepOptions(processor, options),
        order: this.steps.length + 1,
        addedAt: (/* @__PURE__ */ new Date()).toISOString(),
        enabled: true,
        metadata: {
          requiresFavicon: processor === "favicon",
          isBatchable: !["favicon", "template"].includes(processor),
          outputType: this._getStepOutputType(processor, options),
          supportsOptimizationFirst: processor === "optimize"
        }
      };
      this.steps.push(step);
      this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this._updateMetadata();
      return this;
    });
    /**
     * Validate step options based on processor type
     * @private
     */
    __publicField(this, "_validateStepOptions", (processor, options) => {
      const defaults = {
        resize: {
          dimension: 1024,
          mode: "longest",
          maintainAspectRatio: true,
          upscale: true,
          algorithm: "lanczos3"
        },
        crop: {
          width: 500,
          height: 500,
          mode: "smart",
          upscale: false,
          preserveAspectRatio: true,
          confidenceThreshold: 70,
          cropToFit: true,
          objectsToDetect: ["person", "face", "car", "dog", "cat"]
        },
        optimize: {
          quality: 85,
          format: "auto",
          lossless: false,
          stripMetadata: true,
          preserveTransparency: true,
          maxDisplayWidth: null,
          browserSupport: ["modern", "legacy"],
          compressionMode: "adaptive",
          analyzeContent: true,
          icoSizes: [16, 32, 48, 64, 128, 256]
        },
        rename: {
          pattern: "{name}-{dimensions}",
          preserveExtension: true,
          addIndex: true,
          addTimestamp: false,
          customSeparator: "-"
        },
        template: {
          templateId: null,
          applyToAll: true,
          preserveOriginal: false
        },
        favicon: {
          sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
          formats: ["png", "ico"],
          generateManifest: true,
          generateHTML: true,
          includeAppleTouch: true,
          includeAndroid: true,
          roundCorners: true,
          backgroundColor: "#ffffff"
        }
      };
      const validatedOptions = { ...defaults[processor], ...options };
      switch (processor) {
        case "favicon":
          validatedOptions.sizes = [...new Set(validatedOptions.sizes.sort((a, b) => a - b))];
          validatedOptions.sizes = validatedOptions.sizes.filter((size) => size >= 16 && size <= 512);
          break;
        case "optimize":
          if (validatedOptions.format === "jpg" && options.preserveTransparency) {
            validatedOptions.format = "png";
          }
          const validBrowserSupport = ["modern", "legacy", "all"];
          validatedOptions.browserSupport = validatedOptions.browserSupport.filter(
            (support) => validBrowserSupport.includes(support)
          );
          if (validatedOptions.browserSupport.length === 0) {
            validatedOptions.browserSupport = ["modern", "legacy"];
          }
          const validCompressionModes = ["adaptive", "aggressive", "balanced"];
          if (!validCompressionModes.includes(validatedOptions.compressionMode)) {
            validatedOptions.compressionMode = "adaptive";
          }
          if (validatedOptions.format === "avif") {
            validatedOptions.quality = Math.min(63, validatedOptions.quality);
          }
          break;
        case "crop":
          if (["smart", "face", "object", "saliency", "entropy"].includes(validatedOptions.mode)) {
            validatedOptions.confidenceThreshold = Math.max(0, Math.min(100, validatedOptions.confidenceThreshold || 70));
            validatedOptions.multipleFaces = validatedOptions.multipleFaces || false;
            if (!Array.isArray(validatedOptions.objectsToDetect)) {
              validatedOptions.objectsToDetect = ["person", "face", "car", "dog", "cat"];
            }
          }
          break;
        case "rename":
          const placeholders = ["{name}", "{index}", "{timestamp}", "{width}", "{height}", "{dimensions}"];
          if (!placeholders.some((ph) => validatedOptions.pattern.includes(ph))) {
            validatedOptions.pattern = "{name}-{index}";
          }
          break;
      }
      return validatedOptions;
    });
    /**
     * Get step output type
     * @private
     */
    __publicField(this, "_getStepOutputType", (processor, options) => {
      switch (processor) {
        case "optimize":
          return options.format === "auto" ? "optimized-auto" : `optimized-${options.format}`;
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
     */
    __publicField(this, "addResize", (dimension, mode = "longest", additionalOptions = {}) => {
      return this.addStep("resize", {
        dimension,
        mode,
        ...additionalOptions
      });
    });
    /**
     * Add crop step
     */
    __publicField(this, "addCrop", (width, height, mode = "smart", additionalOptions = {}) => {
      return this.addStep("crop", {
        width,
        height,
        mode,
        ...additionalOptions
      });
    });
    /**
     * Add smart crop step with AI detection
     */
    __publicField(this, "addSmartCrop", (width, height, options = {}) => {
      return this.addStep("crop", {
        width,
        height,
        mode: "smart",
        confidenceThreshold: 70,
        multipleFaces: true,
        cropToFit: true,
        ...options
      });
    });
    /**
     * Add optimization step with enhanced options
     */
    __publicField(this, "addOptimize", (quality = 85, format = "auto", additionalOptions = {}) => {
      return this.addStep("optimize", {
        quality,
        format,
        maxDisplayWidth: additionalOptions.maxDisplayWidth || null,
        browserSupport: additionalOptions.browserSupport || ["modern", "legacy"],
        compressionMode: additionalOptions.compressionMode || "adaptive",
        analyzeContent: additionalOptions.analyzeContent !== false,
        ...additionalOptions
      });
    });
    /**
     * Add optimization-first step for web delivery
     */
    __publicField(this, "addWebOptimization", (options = {}) => {
      return this.addStep("optimize", {
        quality: 85,
        format: "auto",
        maxDisplayWidth: 1920,
        browserSupport: ["modern", "legacy"],
        compressionMode: "adaptive",
        stripMetadata: true,
        preserveTransparency: true,
        ...options
      });
    });
    /**
     * Add rename step
     */
    __publicField(this, "addRename", (pattern, additionalOptions = {}) => {
      return this.addStep("rename", {
        pattern,
        ...additionalOptions
      });
    });
    /**
     * Add template step
     */
    __publicField(this, "addTemplate", (templateId, additionalOptions = {}) => {
      return this.addStep("template", {
        templateId,
        ...additionalOptions
      });
    });
    /**
     * Add favicon generation step
     */
    __publicField(this, "addFavicon", (sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512], formats = ["png", "ico"], additionalOptions = {}) => {
      return this.addStep("favicon", {
        sizes,
        formats,
        ...additionalOptions
      });
    });
    /**
     * Remove a step by ID or index
     */
    __publicField(this, "removeStep", (identifier) => {
      let index2;
      if (typeof identifier === "number") {
        index2 = identifier;
      } else {
        index2 = this.steps.findIndex((step) => step.id === identifier);
      }
      if (index2 >= 0 && index2 < this.steps.length) {
        this.steps.splice(index2, 1);
        this.steps.forEach((step, idx) => {
          step.order = idx + 1;
        });
        this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this._updateMetadata();
        return true;
      }
      return false;
    });
    /**
     * Move step up in order
     */
    __publicField(this, "moveStepUp", (index2) => {
      if (index2 <= 0 || index2 >= this.steps.length) {
        return false;
      }
      [this.steps[index2 - 1], this.steps[index2]] = [this.steps[index2], this.steps[index2 - 1]];
      this.steps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      return true;
    });
    /**
     * Move step down in order
     */
    __publicField(this, "moveStepDown", (index2) => {
      if (index2 < 0 || index2 >= this.steps.length - 1) {
        return false;
      }
      [this.steps[index2], this.steps[index2 + 1]] = [this.steps[index2 + 1], this.steps[index2]];
      this.steps.forEach((step, idx) => {
        step.order = idx + 1;
      });
      this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      return true;
    });
    /**
     * Enable/disable a step
     */
    __publicField(this, "setStepEnabled", (index2, enabled = true) => {
      if (index2 >= 0 && index2 < this.steps.length) {
        this.steps[index2].enabled = enabled;
        this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this._updateMetadata();
        return true;
      }
      return false;
    });
    /**
     * Get enabled steps only
     */
    __publicField(this, "getEnabledSteps", () => {
      return this.steps.filter((step) => step.enabled);
    });
    /**
     * Get steps by processor type
     */
    __publicField(this, "getStepsByProcessor", (processor) => {
      return this.steps.filter((step) => step.processor === processor);
    });
    /**
     * Check if task has specific processor
     */
    __publicField(this, "hasProcessor", (processor) => {
      return this.getEnabledSteps().some((step) => step.processor === processor);
    });
    /**
     * Check if task has optimization step
     */
    __publicField(this, "hasOptimization", () => {
      return this.hasProcessor("optimize");
    });
    /**
     * Get optimization step if exists
     */
    __publicField(this, "getOptimizationStep", () => {
      return this.getEnabledSteps().find((step) => step.processor === "optimize") || null;
    });
    /**
     * Validate task against an image
     */
    __publicField(this, "validate", async (lemGendImage) => {
      const validation = await validateTask(this, lemGendImage);
      this.validationWarnings = validation.warnings || [];
      this.validationErrors = validation.errors || [];
      return validation;
    });
    /**
     * Get validation summary
     */
    __publicField(this, "getValidationSummary", () => {
      const enabledSteps = this.getEnabledSteps();
      const errorCount = this.validationErrors.length;
      const warningCount = this.validationWarnings.length;
      const processorCount = {};
      enabledSteps.forEach((step) => {
        processorCount[step.processor] = (processorCount[step.processor] || 0) + 1;
      });
      let taskType = "general";
      if (enabledSteps.some((s) => s.processor === "favicon")) {
        taskType = "favicon";
      } else if (enabledSteps.some((s) => s.processor === "template")) {
        taskType = "template";
      } else if (enabledSteps.every((s) => ["resize", "crop", "optimize"].includes(s.processor))) {
        taskType = "basic";
      } else if (enabledSteps.length === 1 && enabledSteps[0].processor === "optimize") {
        taskType = "optimization-only";
      }
      const hasSmartCrop = enabledSteps.some((s) => s.processor === "crop" && ["smart", "face", "object"].includes(s.options.mode));
      const hasAutoOptimization = enabledSteps.some(
        (s) => s.processor === "optimize" && s.options.format === "auto"
      );
      return {
        totalSteps: enabledSteps.length,
        enabledSteps: enabledSteps.length,
        disabledSteps: this.steps.length - enabledSteps.length,
        errorCount,
        warningCount,
        processorCount,
        taskType,
        status: errorCount > 0 ? "invalid" : warningCount > 0 ? "has_warnings" : "valid",
        canProceed: errorCount === 0,
        requiresImage: enabledSteps.some((s) => ["resize", "crop", "optimize", "favicon"].includes(s.processor)),
        hasFavicon: processorCount.favicon > 0,
        hasSmartCrop,
        hasAutoOptimization,
        estimatedOutputs: this._estimateOutputCount(),
        optimizationLevel: this._getOptimizationLevel()
      };
    });
    /**
     * Get optimization level based on settings
     * @private
     */
    __publicField(this, "_getOptimizationLevel", () => {
      const optimizeStep = this.getEnabledSteps().find((s) => s.processor === "optimize");
      if (!optimizeStep) return "none";
      const { compressionMode, quality, format } = optimizeStep.options;
      if (compressionMode === "aggressive" && quality < 70) {
        return "aggressive";
      } else if (compressionMode === "adaptive" || quality >= 70 && quality <= 90) {
        return "balanced";
      } else if (compressionMode === "balanced" && quality > 90) {
        return "high-quality";
      }
      return "standard";
    });
    /**
     * Estimate number of outputs
     * @private
     */
    __publicField(this, "_estimateOutputCount", () => {
      const enabledSteps = this.getEnabledSteps();
      let count = 1;
      enabledSteps.forEach((step) => {
        if (step.processor === "favicon") {
          const { sizes = [], formats = [] } = step.options;
          count += sizes.length * formats.length;
          if (step.options.generateManifest) count++;
          if (step.options.generateHTML) count++;
          if (step.options.includeAppleTouch) count++;
          if (step.options.includeAndroid) count++;
        } else if (step.processor === "optimize") {
          const { format } = step.options;
          if (Array.isArray(format)) {
            count += format.length - 1;
          }
        }
      });
      return count;
    });
    /**
     * Get task description
     */
    __publicField(this, "getDescription", () => {
      const enabledSteps = this.getEnabledSteps();
      if (enabledSteps.length === 0) {
        return "No processing steps configured";
      }
      return enabledSteps.map((step, index2) => {
        const stepNum = index2 + 1;
        const processor = step.processor.charAt(0).toUpperCase() + step.processor.slice(1);
        switch (step.processor) {
          case "resize":
            return `${stepNum}. LemGendaryResize™ to ${step.options.dimension}px (${step.options.mode})`;
          case "crop":
            const { mode, width, height } = step.options;
            let cropDesc = `${stepNum}. LemGendaryCrop™ to ${width}×${height}`;
            if (["smart", "face", "object", "saliency", "entropy"].includes(mode)) {
              cropDesc += ` (AI ${mode} mode)`;
            } else {
              cropDesc += ` (${mode})`;
            }
            return cropDesc;
          case "optimize":
            const formatStr = step.options.format === "auto" ? "auto (intelligent selection)" : step.options.format.toUpperCase();
            let optimizeDesc = `${stepNum}. LemGendaryOptimize™ to ${formatStr} (${step.options.quality}%)`;
            if (step.options.maxDisplayWidth) {
              optimizeDesc += `, max ${step.options.maxDisplayWidth}px`;
            }
            if (step.options.compressionMode && step.options.compressionMode !== "adaptive") {
              optimizeDesc += `, ${step.options.compressionMode} compression`;
            }
            if (step.options.browserSupport) {
              optimizeDesc += `, ${step.options.browserSupport.join("+")} browsers`;
            }
            return optimizeDesc;
          case "rename":
            return `${stepNum}. Rename with pattern: "${step.options.pattern}"`;
          case "template":
            return `${stepNum}. Apply template: ${step.options.templateId}`;
          case "favicon":
            const sizeCount = step.options.sizes?.length || 0;
            const formatCount = step.options.formats?.length || 0;
            return `${stepNum}. Generate favicon set (${sizeCount} sizes, ${formatCount} formats)`;
          default:
            return `${stepNum}. ${processor}`;
        }
      }).join("\n");
    });
    /**
     * Get estimated processing time
     */
    __publicField(this, "getTimeEstimate", (imageCount = 1) => {
      const enabledSteps = this.getEnabledSteps();
      const stepTimes = {
        "resize": 100,
        "crop": 150,
        "optimize": 200,
        "rename": 10,
        "template": 300,
        "favicon": 500
      };
      let totalMs = 0;
      let complexityFactor = 1;
      enabledSteps.forEach((step) => {
        const baseTime = stepTimes[step.processor] || 100;
        if (step.processor === "favicon") {
          const sizeCount = step.options.sizes?.length || 1;
          const formatCount = step.options.formats?.length || 1;
          complexityFactor = sizeCount * formatCount;
        } else if (step.processor === "crop" && ["smart", "face", "object"].includes(step.options.mode)) {
          complexityFactor = 3;
        } else if (step.processor === "optimize") {
          if (step.options.compressionMode === "aggressive") {
            complexityFactor = 1.5;
          }
          if (step.options.analyzeContent) {
            complexityFactor *= 1.2;
          }
        }
        totalMs += baseTime * complexityFactor;
      });
      totalMs *= imageCount;
      return {
        perImage: totalMs / imageCount,
        total: totalMs,
        formatted: this._formatTime(totalMs),
        stepCount: enabledSteps.length,
        imageCount,
        complexityFactor: Math.round(complexityFactor * 10) / 10
      };
    });
    /**
     * Format time in milliseconds
     * @private
     */
    __publicField(this, "_formatTime", (ms) => {
      if (ms < 1e3) return `${Math.round(ms)}ms`;
      if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
      const minutes = Math.floor(ms / 6e4);
      const seconds = Math.round(ms % 6e4 / 1e3);
      return `${minutes}m ${seconds}s`;
    });
    /**
     * Export task configuration
     */
    __publicField(this, "exportConfig", () => {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        version: "2.2.0",
        steps: this.steps.map((step) => ({
          id: step.id,
          processor: step.processor,
          options: { ...step.options },
          enabled: step.enabled,
          order: step.order,
          metadata: step.metadata
        })),
        metadata: { ...this.metadata },
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        validation: {
          warnings: this.validationWarnings,
          errors: this.validationErrors
        }
      };
    });
    /**
     * Update metadata
     * @private
     */
    __publicField(this, "_updateMetadata", () => {
      const enabledSteps = this.getEnabledSteps();
      this.metadata.estimatedDuration = this.getTimeEstimate().total;
      this.metadata.estimatedOutputs = this._estimateOutputCount();
      this.metadata.stepCount = enabledSteps.length;
      const processorCount = {};
      enabledSteps.forEach((step) => {
        processorCount[step.processor] = (processorCount[step.processor] || 0) + 1;
      });
      this.metadata.processorCount = processorCount;
      if (processorCount.favicon > 0) {
        this.metadata.category = "favicon";
      } else if (processorCount.template > 0) {
        this.metadata.category = "template";
      } else if (processorCount.optimize > 0 && processorCount.resize === 0 && processorCount.crop === 0) {
        this.metadata.category = "optimization-only";
      } else {
        this.metadata.category = "general";
      }
      this.metadata.hasSmartCrop = enabledSteps.some((s) => s.processor === "crop" && ["smart", "face", "object"].includes(s.options.mode));
      this.metadata.hasAutoOptimization = enabledSteps.some(
        (s) => s.processor === "optimize" && s.options.format === "auto"
      );
    });
    /**
     * Clone the task
     */
    __publicField(this, "clone", () => {
      return LemGendTask.importConfig(this.exportConfig());
    });
    /**
     * Create a simplified version of the task for UI display
     */
    __publicField(this, "toSimpleObject", () => {
      const summary = this.getValidationSummary();
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        stepCount: this.steps.length,
        enabledStepCount: this.getEnabledSteps().length,
        hasFavicon: summary.hasFavicon,
        hasSmartCrop: summary.hasSmartCrop,
        hasAutoOptimization: summary.hasAutoOptimization,
        taskType: summary.taskType,
        status: summary.status,
        canProceed: summary.canProceed,
        estimatedOutputs: summary.estimatedOutputs,
        optimizationLevel: summary.optimizationLevel,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    });
    /**
     * Check if task is compatible with image type
     */
    __publicField(this, "checkCompatibility", (mimeType) => {
      const enabledSteps = this.getEnabledSteps();
      const hasFavicon = enabledSteps.some((s) => s.processor === "favicon");
      const hasSmartCrop = enabledSteps.some((s) => s.processor === "crop" && ["smart", "face", "object"].includes(s.options.mode));
      const hasOptimization = enabledSteps.some((s) => s.processor === "optimize");
      let compatible = true;
      const warnings = [];
      const errors = [];
      if (mimeType === "image/svg+xml") {
        if (hasFavicon) {
          warnings.push("SVG to favicon conversion may not preserve all features");
        }
        if (hasSmartCrop) {
          warnings.push("SVG images will be rasterized before smart cropping");
        }
      }
      if (mimeType === "image/gif") {
        if (hasFavicon) {
          warnings.push("Animated GIFs will lose animation in favicon conversion");
        }
        if (hasSmartCrop) {
          warnings.push("Smart crop will use first frame of animated GIF");
        }
        if (hasOptimization) {
          warnings.push("GIF optimization may reduce animation quality");
        }
      }
      if (mimeType === "image/x-icon" || mimeType === "image/vnd.microsoft.icon") {
        warnings.push("ICO files contain multiple images; processing may use first frame only");
      }
      return {
        compatible,
        warnings,
        errors,
        recommended: warnings.length === 0 && errors.length === 0
      };
    });
    this.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.description = description;
    this.steps = [];
    this.validationWarnings = [];
    this.validationErrors = [];
    this.createdAt = (/* @__PURE__ */ new Date()).toISOString();
    this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.metadata = {
      version: "2.2.0",
      processorVersions: {
        resize: "1.2.1",
        crop: "2.0.0",
        optimize: "2.0.0",
        rename: "1.0.0",
        template: "1.3.0",
        favicon: "2.0.0"
      },
      estimatedDuration: null,
      estimatedOutputs: 0,
      supportsFavicon: true,
      supportsSVG: true,
      supportsAICropping: true,
      maxBatchSize: 50,
      defaultResizeMode: "longest",
      supportsOptimizationFirst: true,
      optimizationModes: ["adaptive", "aggressive", "balanced"]
    };
  }
  /**
   * Import task configuration
   */
  static importConfig(config) {
    const task = new LemGendTask(config.name, config.description);
    task.id = config.id || task.id;
    task.createdAt = config.createdAt || task.createdAt;
    task.updatedAt = config.updatedAt || task.updatedAt;
    task.metadata = config.metadata || task.metadata;
    task.validationWarnings = config.validation?.warnings || [];
    task.validationErrors = config.validation?.errors || [];
    config.steps?.forEach((stepConfig) => {
      task.addStep(stepConfig.processor, stepConfig.options);
      const lastStep = task.steps[task.steps.length - 1];
      lastStep.enabled = stepConfig.enabled !== false;
      lastStep.id = stepConfig.id || lastStep.id;
      lastStep.metadata = stepConfig.metadata || lastStep.metadata;
    });
    return task;
  }
  /**
   * Create task from template
   */
  static fromTemplate(templateName) {
    const templates = {
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
              multipleFaces: true
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
              preserveAspectRatio: true
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
              generateManifest: true,
              generateHTML: true
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
    };
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }
    return LemGendTask.importConfig(template);
  }
}
class LemGendaryResize {
  /**
   * Create a new LemGendaryResize processor
   * @param {Object} options - Resize options
   */
  constructor(options = {}) {
    this.options = {
      dimension: 1024,
      mode: "longest",
      maintainAspectRatio: true,
      upscale: false,
      algorithm: "lanczos3",
      ...options
    };
  }
  /**
   * Process an image with resize
   * @param {LemGendImage} image - Image to process
   * @returns {Promise<Object>} Resize result
   */
  async process(image) {
    if (!image || !image.width || !image.height) {
      throw new Error("Invalid image dimensions");
    }
    const originalDimensions = {
      width: image.width,
      height: image.height
    };
    const newDimensions = this.calculateNewDimensions(
      originalDimensions.width,
      originalDimensions.height
    );
    return {
      originalDimensions,
      newDimensions,
      options: this.options,
      mode: this.options.mode,
      algorithm: this.options.algorithm,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Calculate new dimensions based on mode
   * @private
   */
  calculateNewDimensions(originalWidth, originalHeight) {
    const { dimension, mode, maintainAspectRatio } = this.options;
    if (!maintainAspectRatio) {
      return {
        width: dimension,
        height: dimension
      };
    }
    let newWidth, newHeight;
    switch (mode) {
      case "width":
        newWidth = dimension;
        newHeight = Math.round(originalHeight / originalWidth * dimension);
        break;
      case "height":
        newHeight = dimension;
        newWidth = Math.round(originalWidth / originalHeight * dimension);
        break;
      case "longest":
      default:
        if (originalWidth >= originalHeight) {
          newWidth = dimension;
          newHeight = Math.round(originalHeight / originalWidth * dimension);
        } else {
          newHeight = dimension;
          newWidth = Math.round(originalWidth / originalHeight * dimension);
        }
        break;
    }
    if (!this.options.upscale) {
      newWidth = Math.min(newWidth, originalWidth);
      newHeight = Math.min(newHeight, originalHeight);
    }
    return {
      width: Math.max(1, newWidth),
      height: Math.max(1, newHeight)
    };
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  getInfo() {
    return {
      name: "LemGendaryResize",
      version: "1.2.1",
      description: "Intelligent image resizing with aspect ratio preservation",
      modes: ["width", "height", "longest"],
      algorithms: ["lanczos3", "bilinear", "nearest", "cubic", "mitchell"]
    };
  }
}
class LemGendaryCrop {
  /**
   * Create a new LemGendaryCrop processor
   * @param {Object} options - Crop options
   */
  constructor(options = {}) {
    this.options = {
      width: 500,
      height: 500,
      mode: "center",
      upscale: false,
      preserveAspectRatio: true,
      confidenceThreshold: 70,
      cropToFit: true,
      objectsToDetect: ["person", "face", "car", "dog", "cat"],
      ...options
    };
  }
  /**
   * Process an image with crop
   * @param {LemGendImage} image - Image to process
   * @param {Object} currentDimensions - Current image dimensions
   * @returns {Promise<Object>} Crop result
   */
  async process(image, currentDimensions = null) {
    if (!image || !image.width && !currentDimensions?.width) {
      throw new Error("Invalid image or dimensions");
    }
    const sourceWidth = currentDimensions?.width || image.width;
    const sourceHeight = currentDimensions?.height || image.height;
    const cropOffsets = this.calculateCropOffsets(
      sourceWidth,
      sourceHeight,
      this.options.width,
      this.options.height
    );
    const finalDimensions = {
      width: this.options.width,
      height: this.options.height
    };
    const smartCrop = ["smart", "face", "object", "saliency", "entropy"].includes(this.options.mode);
    return {
      originalDimensions: { width: sourceWidth, height: sourceHeight },
      finalDimensions,
      cropOffsets,
      smartCrop,
      mode: this.options.mode,
      confidenceThreshold: this.options.confidenceThreshold,
      steps: {
        detection: { confidence: smartCrop ? 85 : 0 },
        resize: !this.options.upscale && (sourceWidth < this.options.width || sourceHeight < this.options.height),
        crop: cropOffsets
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Calculate crop offsets based on mode
   * @private
   */
  calculateCropOffsets(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    let x = 0, y = 0;
    let cropWidth = Math.min(targetWidth, sourceWidth);
    let cropHeight = Math.min(targetHeight, sourceHeight);
    if (!this.options.upscale) {
      cropWidth = Math.min(targetWidth, sourceWidth);
      cropHeight = Math.min(targetHeight, sourceHeight);
    }
    switch (this.options.mode) {
      case "center":
        x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
        break;
      case "top":
        x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        y = 0;
        break;
      case "bottom":
        x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        y = Math.max(0, sourceHeight - cropHeight);
        break;
      case "left":
        x = 0;
        y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
        break;
      case "right":
        x = Math.max(0, sourceWidth - cropWidth);
        y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
        break;
      case "top-left":
        x = 0;
        y = 0;
        break;
      case "top-right":
        x = Math.max(0, sourceWidth - cropWidth);
        y = 0;
        break;
      case "bottom-left":
        x = 0;
        y = Math.max(0, sourceHeight - cropHeight);
        break;
      case "bottom-right":
        x = Math.max(0, sourceWidth - cropWidth);
        y = Math.max(0, sourceHeight - cropHeight);
        break;
      case "smart":
      case "face":
      case "object":
      case "saliency":
      case "entropy":
        x = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        y = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));
        break;
      default:
        x = 0;
        y = 0;
    }
    return {
      x,
      y,
      width: cropWidth,
      height: cropHeight
    };
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  getInfo() {
    return {
      name: "LemGendaryCrop",
      version: "2.0.0",
      description: "Intelligent image cropping with AI detection",
      modes: ["smart", "face", "object", "saliency", "entropy", "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"],
      aiCapabilities: ["face", "object", "saliency", "entropy"]
    };
  }
}
class LemGendaryRename {
  /**
   * Create a new LemGendaryRename processor
   * @param {Object} options - Rename options
   */
  constructor(options = {}) {
    this.options = {
      pattern: "{name}-{dimensions}",
      preserveExtension: true,
      addIndex: true,
      addTimestamp: false,
      customSeparator: "-",
      ...options
    };
  }
  /**
   * Process an image with rename
   * @param {LemGendImage} image - Image to process
   * @param {number} index - File index in batch
   * @param {number} total - Total files in batch
   * @returns {Promise<Object>} Rename result
   */
  async process(image, index2 = 0, total = 1) {
    if (!image || !image.originalName) {
      throw new Error("Invalid image or missing original name");
    }
    const variables = this.generateVariables(image, index2, total);
    const newName = this.applyPattern(this.options.pattern, variables);
    return {
      originalName: image.originalName,
      newName,
      variables,
      pattern: this.options.pattern,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Generate variables for pattern replacement
   * @private
   */
  generateVariables(image, index2, total) {
    const now = /* @__PURE__ */ new Date();
    const originalName = image.originalName.replace(/\.[^/.]+$/, "");
    const dimensions = image.width && image.height ? `${image.width}x${image.height}` : "unknown";
    return {
      name: this.sanitizeName(originalName),
      index: index2 + 1,
      index_padded: String(index2 + 1).padStart(String(total).length, "0"),
      total,
      width: image.width || "unknown",
      height: image.height || "unknown",
      dimensions,
      date: now.toISOString().split("T")[0],
      // YYYY-MM-DD
      time: now.toTimeString().split(" ")[0],
      // HH:MM:SS
      timestamp: now.getTime(),
      year: now.getFullYear(),
      month: String(now.getMonth() + 1).padStart(2, "0"),
      day: String(now.getDate()).padStart(2, "0"),
      hour: String(now.getHours()).padStart(2, "0"),
      minute: String(now.getMinutes()).padStart(2, "0"),
      second: String(now.getSeconds()).padStart(2, "0"),
      extension: image.extension || "unknown"
    };
  }
  /**
   * Apply pattern with variables
   * @private
   */
  applyPattern(pattern, variables) {
    let result = pattern;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      if (result.includes(placeholder)) {
        result = result.replace(new RegExp(this.escapeRegExp(placeholder), "g"), String(value));
      }
    }
    result = result.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    result = result.replace(/[-_]{2,}/g, "-");
    result = result.replace(/[ _]{2,}/g, " ");
    result = result.trim();
    result = result.replace(/^[-_.]+|[-_.]+$/g, "");
    return result;
  }
  /**
   * Sanitize filename
   * @private
   */
  sanitizeName(name) {
    return name.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").substring(0, 255).trim();
  }
  /**
   * Escape regex special characters
   * @private
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Get common rename patterns
   * @returns {Object} Pattern templates
   */
  getCommonPatterns() {
    return {
      "sequential": "{name}-{index_padded}",
      "dated": "{name}-{date}",
      "timestamped": "{name}-{timestamp}",
      "dimensioned": "{name}-{dimensions}",
      "simple": "{index_padded}",
      "descriptive": "{name}-{dimensions}-{date}",
      "batch": "batch-{date}-{index_padded}",
      "export": "export-{timestamp}",
      "web": "{name}-{width}w",
      "social": "{name}-{dimensions}-social"
    };
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  getInfo() {
    return {
      name: "LemGendaryRename",
      version: "1.0.0",
      description: "Intelligent file renaming with pattern support",
      patterns: this.getCommonPatterns(),
      variables: ["name", "index", "index_padded", "width", "height", "dimensions", "date", "time", "timestamp", "year", "month", "day", "hour", "minute", "second", "extension"]
    };
  }
}
function isLemGendImage(obj) {
  return obj && typeof obj === "object" && obj.constructor && obj.constructor.name === "LemGendImage";
}
async function actuallyResizeImage(file, targetWidth, targetHeight, algorithm = "lanczos3") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not supported"));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          const resizedFile = new File(
            [blob],
            file.name,
            { type: file.type }
          );
          URL.revokeObjectURL(img.src);
          resolve(resizedFile);
        }, file.type, 0.95);
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(new Error(`Resize failed: ${error.message}`));
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for resizing"));
    };
    img.src = URL.createObjectURL(file);
  });
}
async function actuallyCropImage(file, originalWidth, originalHeight, cropWidth, cropHeight, offsetX, offsetY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not supported"));
          return;
        }
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          const croppedFile = new File(
            [blob],
            file.name,
            { type: file.type }
          );
          URL.revokeObjectURL(img.src);
          resolve(croppedFile);
        }, file.type, 0.95);
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(new Error(`Crop failed: ${error.message}`));
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for cropping"));
    };
    img.src = URL.createObjectURL(file);
  });
}
async function applyOptimization(file, dimensions, options, hasTransparency2) {
  const { quality, format, lossless = false } = options;
  if (format === "original") {
    return file;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        let mimeType = "image/jpeg";
        let qualityValue = Math.max(0.1, Math.min(1, quality / 100));
        switch (format.toLowerCase()) {
          case "webp":
            mimeType = "image/webp";
            break;
          case "png":
            mimeType = "image/png";
            qualityValue = void 0;
            break;
          case "avif":
            mimeType = "image/avif";
            break;
          case "jpg":
          case "jpeg":
          default:
            mimeType = "image/jpeg";
        }
        if (hasTransparency2 && (format === "jpg" || format === "jpeg")) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = dimensions.width;
          tempCanvas.height = dimensions.height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.fillStyle = "white";
          tempCtx.fillRect(0, 0, dimensions.width, dimensions.height);
          tempCtx.drawImage(img, 0, 0);
          tempCanvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }
              const optimizedFile = new File(
                [blob],
                `${file.name.replace(/\.[^/.]+$/, "")}.${format.toLowerCase()}`,
                { type: mimeType }
              );
              URL.revokeObjectURL(img.src);
              resolve(optimizedFile);
            },
            mimeType,
            qualityValue
          );
        } else {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }
              const optimizedFile = new File(
                [blob],
                `${file.name.replace(/\.[^/.]+$/, "")}.${format.toLowerCase()}`,
                { type: mimeType }
              );
              URL.revokeObjectURL(img.src);
              resolve(optimizedFile);
            },
            mimeType,
            qualityValue
          );
        }
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(new Error(`Optimization failed: ${error.message}`));
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
async function processSingleFile(file, task, index2) {
  console.log("processSingleFile called with:", {
    fileType: file?.constructor?.name,
    isLemGendImage: isLemGendImage(file),
    hasFileProperty: !!file?.file,
    filePropertyType: file?.file?.constructor?.name
  });
  let lemGendImage;
  try {
    const { LemGendImage } = await import("./LemGendImage-DmXZDDQ3.js");
    if (isLemGendImage(file)) {
      lemGendImage = file;
      console.log("Using existing LemGendImage:", {
        hasFile: !!lemGendImage.file,
        fileType: lemGendImage.file?.constructor?.name,
        width: lemGendImage.width,
        height: lemGendImage.height,
        originalName: lemGendImage.originalName
      });
      if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
        console.warn("LemGendImage missing valid file property, attempting to reconstruct...");
        if (lemGendImage.originalName && lemGendImage.originalSize) {
          const placeholderBlob = new Blob([""], {
            type: lemGendImage.metadata?.type || "image/jpeg"
          });
          const reconstructedFile = new File(
            [placeholderBlob],
            lemGendImage.originalName,
            {
              type: lemGendImage.metadata?.type || "image/jpeg",
              lastModified: Date.now()
            }
          );
          lemGendImage.file = reconstructedFile;
        } else {
          throw new Error("LemGendImage has no valid file property and cannot be reconstructed");
        }
      }
      if (!lemGendImage.width || !lemGendImage.height) {
        try {
          console.log("LemGendImage missing dimensions, loading...");
          await lemGendImage.load();
        } catch (loadError) {
          console.warn("Failed to load existing LemGendImage:", loadError);
          lemGendImage.width = lemGendImage.width || 1e3;
          lemGendImage.height = lemGendImage.height || 1e3;
        }
      }
    } else if (file && file.file && file.file instanceof File) {
      console.log("Creating new LemGendImage from file object...");
      lemGendImage = new LemGendImage(file.file);
      try {
        await lemGendImage.load();
      } catch (loadError) {
        console.warn("Failed to load image, using defaults:", loadError);
        lemGendImage.width = lemGendImage.width || 1e3;
        lemGendImage.height = lemGendImage.height || 1e3;
      }
    } else if (file instanceof File || file instanceof Blob) {
      console.log("Creating new LemGendImage from File/Blob...");
      lemGendImage = new LemGendImage(file);
      try {
        await lemGendImage.load();
      } catch (loadError) {
        console.warn("Failed to load image, using defaults:", loadError);
        lemGendImage.width = lemGendImage.width || 1e3;
        lemGendImage.height = lemGendImage.height || 1e3;
      }
    } else {
      throw new Error(`Invalid file type provided for processing. Got: ${typeof file}, constructor: ${file?.constructor?.name}`);
    }
    if (!lemGendImage || !isLemGendImage(lemGendImage)) {
      throw new Error("Failed to create valid LemGendImage instance");
    }
    if (!lemGendImage.file || !(lemGendImage.file instanceof File)) {
      console.warn("LemGendImage missing file property, creating placeholder...");
      const placeholderBlob = new Blob([""], { type: "image/jpeg" });
      lemGendImage.file = new File([placeholderBlob], lemGendImage.originalName || "image.jpg", {
        type: "image/jpeg",
        lastModified: Date.now()
      });
    }
    if (!lemGendImage.width || !lemGendImage.height) {
      console.warn("LemGendImage missing dimensions, setting defaults...");
      lemGendImage.width = lemGendImage.width || 1e3;
      lemGendImage.height = lemGendImage.height || 1e3;
    }
    console.log("Validating task with LemGendImage...", {
      originalName: lemGendImage.originalName,
      width: lemGendImage.width,
      height: lemGendImage.height,
      hasFile: !!lemGendImage.file,
      fileType: lemGendImage.file?.constructor?.name
    });
    try {
      const validation = await validateTask(task, lemGendImage);
      if (!validation.isValid) {
        const errorMessage = validation.errors.map((e) => e.message).join(", ");
        console.warn("Task validation warnings:", errorMessage);
      }
    } catch (validationError) {
      console.warn("Task validation threw an error, continuing anyway:", validationError);
    }
    console.log("Task validation passed (or warnings ignored), proceeding with processing...");
    const enabledSteps = task.getEnabledSteps();
    let currentFile = lemGendImage.file;
    let currentDimensions = {
      width: lemGendImage.width,
      height: lemGendImage.height
    };
    const processingOrder = ["resize", "crop", "optimize", "rename"];
    const sortedSteps = enabledSteps.sort((a, b) => {
      const indexA = processingOrder.indexOf(a.processor);
      const indexB = processingOrder.indexOf(b.processor);
      return indexA - indexB;
    });
    console.log("Processing steps in order:", sortedSteps.map((s) => `${s.order}.${s.processor}`));
    console.log("Starting image dimensions:", currentDimensions);
    for (const step of sortedSteps) {
      try {
        console.log(`
=== Processing step ${step.order}: ${step.processor} ===`);
        switch (step.processor) {
          case "resize":
            const resizeProcessor = new LemGendaryResize(step.options);
            const resizeResult = await resizeProcessor.process(lemGendImage);
            console.log("Resize result:", {
              original: `${resizeResult.originalDimensions.width}x${resizeResult.originalDimensions.height}`,
              target: `${resizeResult.newDimensions.width}x${resizeResult.newDimensions.height}`,
              mode: step.options.mode,
              dimension: step.options.dimension
            });
            currentFile = await actuallyResizeImage(
              currentFile,
              resizeResult.newDimensions.width,
              resizeResult.newDimensions.height,
              step.options.algorithm || "lanczos3"
            );
            currentDimensions = resizeResult.newDimensions;
            lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
            lemGendImage.addOperation("resize", resizeResult);
            console.log(`✓ Resized to: ${currentDimensions.width}x${currentDimensions.height}`);
            console.log("File after resize:", {
              name: currentFile.name,
              size: currentFile.size,
              type: currentFile.type
            });
            break;
          case "crop":
            const cropProcessor = new LemGendaryCrop(step.options);
            const cropResult = await cropProcessor.process(lemGendImage, currentDimensions);
            console.log("Crop result:", {
              current: `${currentDimensions.width}x${currentDimensions.height}`,
              target: `${cropResult.finalDimensions.width}x${cropResult.finalDimensions.height}`,
              mode: step.options.mode,
              smartCrop: cropResult.smartCrop
            });
            if (cropResult.smartCrop) {
              console.log("Smart crop detected with steps:", {
                detection: cropResult.steps.detection.confidence,
                resize: cropResult.steps.resize,
                crop: cropResult.cropOffsets
              });
            }
            currentFile = await actuallyCropImage(
              currentFile,
              currentDimensions.width,
              currentDimensions.height,
              cropResult.cropOffsets.width,
              cropResult.cropOffsets.height,
              cropResult.cropOffsets.x,
              cropResult.cropOffsets.y
            );
            currentDimensions = cropResult.finalDimensions;
            lemGendImage.updateDimensions(currentDimensions.width, currentDimensions.height);
            lemGendImage.addOperation("crop", cropResult);
            console.log(`✓ Cropped to: ${currentDimensions.width}x${currentDimensions.height}`);
            console.log("File after crop:", {
              name: currentFile.name,
              size: currentFile.size,
              type: currentFile.type
            });
            break;
          case "optimize":
            const optimizeProcessor = new LemGendaryOptimize(step.options);
            const optimizeResult = await optimizeProcessor.process(lemGendImage);
            console.log("Optimize result:", {
              format: step.options.format,
              quality: step.options.quality,
              originalFormat: optimizeResult.originalInfo.format,
              transparency: optimizeResult.originalInfo.transparency,
              savings: optimizeResult.savings
            });
            const optimizeMethod = optimizeProcessor.applyOptimization || optimizeProcessor.optimize;
            if (!optimizeMethod) {
              throw new Error("Optimize processor missing applyOptimization or optimize method");
            }
            currentFile = await optimizeMethod.call(optimizeProcessor, lemGendImage);
            lemGendImage.addOperation("optimize", optimizeResult);
            console.log(`✓ Optimized to: ${optimizeResult.optimization.selectedFormat} at ${optimizeResult.optimization.compression.quality}%`);
            console.log("File after optimize:", {
              name: currentFile.name,
              size: currentFile.size,
              type: currentFile.type,
              savings: `${optimizeResult.savings.savingsPercent}%`
            });
            break;
          case "rename":
            const renameProcessor = new LemGendaryRename(step.options);
            const renameResult = await renameProcessor.process(lemGendImage, index2, task.steps.length);
            const extension = getFileExtension(currentFile);
            const renamedFile = new File(
              [currentFile],
              `${renameResult.newName}.${extension}`,
              { type: currentFile.type }
            );
            currentFile = renamedFile;
            lemGendImage.addOperation("rename", renameResult);
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
    lemGendImage.addOutput(
      outputFormat,
      currentFile,
      null
    );
    console.log("\n=== Processing Complete ===");
    console.log("Final result:", {
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
    console.error("Error in processSingleFile:", error);
    return {
      image: lemGendImage || file,
      file: lemGendImage?.file || file,
      error: error.message,
      success: false
    };
  }
}
class LemGendaryOptimize {
  /**
   * Create a new LemGendaryOptimize processor
   * @param {Object} options - Optimization options
   */
  constructor(options = {}) {
    this.options = {
      quality: 85,
      format: "auto",
      lossless: false,
      stripMetadata: true,
      preserveTransparency: true,
      maxDisplayWidth: null,
      browserSupport: ["modern", "legacy"],
      compressionMode: "adaptive",
      analyzeContent: true,
      icoSizes: [16, 32, 48, 64, 128, 256],
      ...options
    };
  }
  /**
   * Process an image with optimization
   * @param {LemGendImage} image - Image to process
   * @returns {Promise<Object>} Optimization result
   */
  async process(image) {
    if (!image || !image.file) {
      throw new Error("Invalid image or missing file");
    }
    const originalInfo = {
      format: image.extension,
      width: image.width,
      height: image.height,
      size: image.originalSize,
      transparency: image.transparency,
      mimeType: image.type
    };
    const selectedFormat = this.selectOptimalFormat(image);
    const compression = this.calculateCompressionSettings(image);
    const savings = this.estimateSavings(
      image.originalSize,
      selectedFormat,
      compression.quality
    );
    return {
      originalInfo,
      optimization: {
        selectedFormat,
        compression,
        browserSupport: this.options.browserSupport,
        mode: this.options.compressionMode
      },
      savings,
      recommendations: this.generateRecommendations(image, selectedFormat),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Apply optimization to image
   * @param {LemGendImage} image - Image to optimize
   * @returns {Promise<File>} Optimized file
   */
  async applyOptimization(image) {
    const { selectedFormat } = await this.process(image);
    const dimensions = {
      width: image.width,
      height: image.height
    };
    return applyOptimization(
      image.file,
      dimensions,
      {
        quality: this.options.quality,
        format: selectedFormat,
        lossless: this.options.lossless
      },
      image.transparency
    );
  }
  /**
   * Select optimal format based on image characteristics
   * @private
   */
  selectOptimalFormat(image) {
    if (this.options.format !== "auto") {
      return this.options.format;
    }
    if (image.extension === "svg") return "svg";
    if (image.type.includes("icon")) return "ico";
    if (image.transparency) {
      return "webp";
    }
    if (image.width * image.height > 1e6) {
      return this.options.browserSupport.includes("modern") ? "avif" : "webp";
    }
    return "webp";
  }
  /**
   * Calculate compression settings
   * @private
   */
  calculateCompressionSettings(image) {
    let quality = this.options.quality;
    switch (this.options.compressionMode) {
      case "aggressive":
        quality = Math.max(40, quality - 20);
        break;
      case "balanced":
        break;
      case "adaptive":
        if (image.width * image.height > 2e6) {
          quality = Math.max(60, quality - 10);
        }
        break;
    }
    const selectedFormat = this.selectOptimalFormat(image);
    if (selectedFormat === "avif") {
      quality = Math.min(63, quality);
    }
    return {
      quality,
      mode: this.options.compressionMode,
      lossless: this.options.lossless,
      stripMetadata: this.options.stripMetadata
    };
  }
  /**
   * Estimate savings from optimization
   * @private
   */
  estimateSavings(originalSize, format, quality) {
    let estimatedSize = originalSize;
    const formatFactors = {
      "webp": 0.7,
      "avif": 0.6,
      "jpg": 0.8,
      "png": 0.9,
      "svg": 0.3,
      "ico": 0.95
    };
    estimatedSize *= formatFactors[format] || 0.8;
    estimatedSize *= quality / 100;
    const savings = originalSize - estimatedSize;
    const savingsPercent = savings / originalSize * 100;
    return {
      originalSize,
      estimatedSize: Math.round(estimatedSize),
      savings: Math.round(savings),
      savingsPercent: Math.round(savingsPercent * 10) / 10
    };
  }
  /**
   * Generate optimization recommendations
   * @private
   */
  generateRecommendations(image, selectedFormat) {
    const recommendations = [];
    if (image.extension !== selectedFormat) {
      recommendations.push(`Convert from ${image.extension} to ${selectedFormat}`);
    }
    if (image.width > 1920 || image.height > 1080) {
      recommendations.push("Consider resizing for web display");
    }
    if (image.transparency && selectedFormat === "jpg") {
      recommendations.push("JPEG format does not support transparency - consider PNG or WebP");
    }
    return recommendations;
  }
  /**
   * Prepare images for ZIP export
   */
  async prepareForZip(images) {
    const results = [];
    for (const image of images) {
      try {
        const optimizationResult = await this.process(image);
        const optimizedFile = await this.applyOptimization(image);
        results.push({
          success: true,
          original: {
            name: image.originalName,
            size: image.originalSize,
            format: image.extension
          },
          optimized: optimizedFile,
          optimization: optimizationResult
        });
      } catch (error) {
        results.push({
          success: false,
          original: {
            name: image.originalName,
            size: image.originalSize
          },
          error: error.message
        });
      }
    }
    return results;
  }
  /**
   * Generate optimization report
   */
  generateOptimizationReport(results) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalOriginalSize = successful.reduce((sum, r) => sum + r.original.size, 0);
    const totalOptimizedSize = successful.reduce((sum, r) => sum + r.optimized.size, 0);
    const totalSavings = totalOriginalSize - totalOptimizedSize;
    const avgSavingsPercent = successful.length > 0 ? totalSavings / totalOriginalSize * 100 : 0;
    return {
      summary: {
        totalImages: results.length,
        successful: successful.length,
        failed: failed.length,
        totalOriginalSize,
        totalOptimizedSize,
        totalSavings,
        avgSavingsPercent: Math.round(avgSavingsPercent * 10) / 10
      },
      byFormat: this.groupByFormat(successful),
      failedImages: failed.map((f) => ({
        name: f.original.name,
        error: f.error
      })),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Group results by format
   * @private
   */
  groupByFormat(results) {
    const groups = {};
    results.forEach((result) => {
      const format = result.optimization.optimization.selectedFormat;
      if (!groups[format]) {
        groups[format] = {
          count: 0,
          totalOriginalSize: 0,
          totalOptimizedSize: 0
        };
      }
      groups[format].count++;
      groups[format].totalOriginalSize += result.original.size;
      groups[format].totalOptimizedSize += result.optimized.size;
    });
    return groups;
  }
  /**
   * Get processor information
   * @returns {Object} Processor info
   */
  getInfo() {
    return {
      name: "LemGendaryOptimize",
      version: "2.0.0",
      description: "Intelligent image optimization with format selection",
      formats: ["auto", "webp", "avif", "jpg", "png", "svg", "ico"],
      compressionModes: ["adaptive", "aggressive", "balanced"],
      browserSupport: ["modern", "legacy", "all"]
    };
  }
}
const socialTemplates = [
  // Instagram
  {
    "id": "instagram-profile",
    "name": "InstagramProfile",
    "displayName": "Profile Picture",
    "width": 320,
    "height": 320,
    "platform": "instagram",
    "category": "social",
    "icon": "fab fa-instagram",
    "description": "Instagram profile picture (displays as circular 110×110 in app)",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "webp"
    ],
    "maxFileSize": "100KB",
    "notes": "Upload at 320×320 for best quality, will be cropped to circle"
  },
  {
    "id": "instagram-square",
    "name": "InstagramSquare",
    "displayName": "Square Post",
    "width": 1080,
    "height": 1080,
    "platform": "instagram",
    "category": "social",
    "icon": "fas fa-square",
    "description": "Instagram square photo/video posts",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "webp"
    ],
    "maxFileSize": "8MB",
    "notes": "Optimal for grid view, displays at 600×600"
  },
  {
    "id": "instagram-portrait",
    "name": "InstagramPortrait",
    "displayName": "Portrait Post",
    "width": 1080,
    "height": 1350,
    "platform": "instagram",
    "category": "social",
    "icon": "fas fa-portrait",
    "description": "Instagram portrait (vertical) posts",
    "aspectRatio": "4:5",
    "recommendedFormats": [
      "jpg",
      "webp"
    ],
    "maxFileSize": "8MB",
    "notes": "Takes more space in feed, good for full-body shots"
  },
  {
    "id": "instagram-landscape",
    "name": "InstagramLandscape",
    "displayName": "Landscape Post",
    "width": 1080,
    "height": 566,
    "platform": "instagram",
    "category": "social",
    "icon": "fas fa-landscape",
    "description": "Instagram landscape (horizontal) posts",
    "aspectRatio": "1.91:1",
    "recommendedFormats": [
      "jpg",
      "webp"
    ],
    "maxFileSize": "8MB",
    "notes": "Good for group photos and scenery"
  },
  {
    "id": "instagram-stories",
    "name": "InstagramStoriesReels",
    "displayName": "Stories & Reels",
    "width": 1080,
    "height": 1920,
    "platform": "instagram",
    "category": "social",
    "icon": "fas fa-film",
    "description": "Instagram Stories, Reels, and IGTV covers",
    "aspectRatio": "9:16",
    "recommendedFormats": [
      "jpg",
      "webp"
    ],
    "maxFileSize": "4MB",
    "notes": "Full-screen vertical format, safe area: center 1080×1420"
  },
  // Facebook
  {
    "id": "facebook-profile",
    "name": "FacebookProfile",
    "displayName": "Profile Picture",
    "width": 180,
    "height": 180,
    "platform": "facebook",
    "category": "social",
    "icon": "fab fa-facebook",
    "description": "Facebook profile picture (displays as 170×170 on desktop)",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Minimum 180×180, displays as circular"
  },
  {
    "id": "facebook-cover",
    "name": "FacebookCoverBanner",
    "displayName": "Cover Photo",
    "width": 851,
    "height": 315,
    "platform": "facebook",
    "category": "social",
    "icon": "fas fa-panorama",
    "description": "Facebook page and profile cover photo",
    "aspectRatio": "~2.7:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "100KB",
    "notes": "Displays as 820×312 on desktop, mobile crops sides"
  },
  {
    "id": "facebook-shared",
    "name": "FacebookSharedImage",
    "displayName": "Shared Image",
    "width": 1200,
    "height": 630,
    "platform": "facebook",
    "category": "social",
    "icon": "fas fa-share-alt",
    "description": "Optimal size for shared links and images in feed",
    "aspectRatio": "1.91:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "8MB",
    "notes": "Ideal for link previews and engagement"
  },
  {
    "id": "facebook-square",
    "name": "FacebookSquarePost",
    "displayName": "Square Post",
    "width": 1200,
    "height": 1200,
    "platform": "facebook",
    "category": "social",
    "icon": "fas fa-square",
    "description": "Facebook square post images",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "8MB",
    "notes": "Good for product shots and albums"
  },
  {
    "id": "facebook-stories",
    "name": "FacebookStories",
    "displayName": "Facebook Stories",
    "width": 1080,
    "height": 1920,
    "platform": "facebook",
    "category": "social",
    "icon": "fas fa-scroll",
    "description": "Facebook Stories (full-screen vertical)",
    "aspectRatio": "9:16",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "4MB",
    "notes": "Same as Instagram Stories format"
  },
  // Twitter/X
  {
    "id": "twitter-profile",
    "name": "XProfile",
    "displayName": "Profile Picture",
    "width": 400,
    "height": 400,
    "platform": "twitter",
    "category": "social",
    "icon": "fab fa-twitter",
    "description": "Twitter/X profile picture (displays as 200×200)",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "2MB",
    "notes": "Upload at 400×400, displays as circular"
  },
  {
    "id": "twitter-header",
    "name": "XHeaderBanner",
    "displayName": "Header Banner",
    "width": 1500,
    "height": 500,
    "platform": "twitter",
    "category": "social",
    "icon": "fas fa-panorama",
    "description": "Twitter/X header banner",
    "aspectRatio": "3:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Minimum 1500×500, important content in center"
  },
  {
    "id": "twitter-landscape",
    "name": "XLandscapePost",
    "displayName": "Landscape Post",
    "width": 1600,
    "height": 900,
    "platform": "twitter",
    "category": "social",
    "icon": "fas fa-id-card",
    "description": "Twitter/X landscape image in tweet",
    "aspectRatio": "16:9",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Optimal for screenshots and wide images"
  },
  {
    "id": "twitter-square",
    "name": "XSquarePost",
    "displayName": "Square Post",
    "width": 1080,
    "height": 1080,
    "platform": "twitter",
    "category": "social",
    "icon": "fas fa-square",
    "description": "Twitter/X square image in tweet",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Good for product images and infographics"
  },
  {
    "id": "twitter-portrait",
    "name": "XPortraitPost",
    "displayName": "Portrait Post",
    "width": 1080,
    "height": 1350,
    "platform": "twitter",
    "category": "social",
    "icon": "fas fa-portrait",
    "description": "Twitter/X portrait (vertical) image",
    "aspectRatio": "4:5",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Similar to Instagram portrait format"
  },
  // LinkedIn
  {
    "id": "linkedin-profile",
    "name": "LinkedInProfile",
    "displayName": "Profile Picture",
    "width": 400,
    "height": 400,
    "platform": "linkedin",
    "category": "social",
    "icon": "fab fa-linkedin",
    "description": "LinkedIn profile picture (displays as circular)",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "8MB",
    "notes": "Upload at 400×400, minimum 300×300"
  },
  {
    "id": "linkedin-cover",
    "name": "LinkedInPersonalCover",
    "displayName": "Personal Cover Photo",
    "width": 1584,
    "height": 396,
    "platform": "linkedin",
    "category": "social",
    "icon": "fas fa-panorama",
    "description": "LinkedIn personal profile cover photo",
    "aspectRatio": "4:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "8MB",
    "notes": "Displays as 1400×425, keep important content centered"
  },
  {
    "id": "linkedin-landscape",
    "name": "LinkedInLandscapePost",
    "displayName": "Landscape Post",
    "width": 1200,
    "height": 627,
    "platform": "linkedin",
    "category": "social",
    "icon": "fas fa-id-card",
    "description": "LinkedIn landscape post images",
    "aspectRatio": "1.91:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Optimal for shared links and articles"
  },
  {
    "id": "linkedin-square",
    "name": "LinkedInSquarePost",
    "displayName": "Square Post",
    "width": 1200,
    "height": 1200,
    "platform": "linkedin",
    "category": "social",
    "icon": "fas fa-square",
    "description": "LinkedIn square post images",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Good for infographics and product images"
  },
  {
    "id": "linkedin-portrait",
    "name": "LinkedInPortraitPost",
    "displayName": "Portrait Post",
    "width": 720,
    "height": 900,
    "platform": "linkedin",
    "category": "social",
    "icon": "fas fa-portrait",
    "description": "LinkedIn portrait (vertical) post images",
    "aspectRatio": "4:5",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Less common but supported format"
  },
  // YouTube
  {
    "id": "youtube-channel",
    "name": "YouTubeChannelIcon",
    "displayName": "Channel Icon",
    "width": 800,
    "height": 800,
    "platform": "youtube",
    "category": "social",
    "icon": "fab fa-youtube",
    "description": "YouTube channel profile picture",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "2MB",
    "notes": "Displays as 98×98 in most places"
  },
  {
    "id": "youtube-banner",
    "name": "YouTubeBanner",
    "displayName": "Channel Banner",
    "width": 2048,
    "height": 1152,
    "platform": "youtube",
    "category": "social",
    "icon": "fas fa-panorama",
    "description": "YouTube channel banner/header",
    "aspectRatio": "16:9",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "6MB",
    "notes": "Safe area for mobile: 1546×423, important content centered"
  },
  {
    "id": "youtube-thumbnail",
    "name": "YouTubeThumbnail",
    "displayName": "Video Thumbnail",
    "width": 1280,
    "height": 720,
    "platform": "youtube",
    "category": "social",
    "icon": "fas fa-video",
    "description": "YouTube video thumbnail",
    "aspectRatio": "16:9",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "2MB",
    "notes": "Minimum 640×480, 16:9 recommended for all devices"
  },
  // Pinterest
  {
    "id": "pinterest-profile",
    "name": "PinterestProfile",
    "displayName": "Profile Picture",
    "width": 165,
    "height": 165,
    "platform": "pinterest",
    "category": "social",
    "icon": "fab fa-pinterest",
    "description": "Pinterest profile picture (displays as circular)",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "10MB",
    "notes": "Upload at 165×165, displays as circular"
  },
  {
    "id": "pinterest-standard",
    "name": "PinterestStandardPin",
    "displayName": "Standard Pin",
    "width": 1e3,
    "height": 1500,
    "platform": "pinterest",
    "category": "social",
    "icon": "fas fa-thumbtack",
    "description": "Pinterest standard vertical pin",
    "aspectRatio": "2:3",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "10MB",
    "notes": "Height should be 1.2–2.5 times the width for optimal display"
  },
  {
    "id": "pinterest-square",
    "name": "PinterestSquarePin",
    "displayName": "Square Pin",
    "width": 1e3,
    "height": 1e3,
    "platform": "pinterest",
    "category": "social",
    "icon": "fas fa-square",
    "description": "Pinterest square pin",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "10MB",
    "notes": "Good for infographics and step-by-step guides"
  },
  {
    "id": "pinterest-story",
    "name": "PinterestStoryPin",
    "displayName": "Story Pin",
    "width": 1080,
    "height": 1920,
    "platform": "pinterest",
    "category": "social",
    "icon": "fas fa-scroll",
    "description": "Pinterest Story pin (full-screen vertical)",
    "aspectRatio": "9:16",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "10MB",
    "notes": "Similar format to Instagram/Facebook Stories"
  },
  // TikTok
  {
    "id": "tiktok-profile",
    "name": "TikTokProfile",
    "displayName": "Profile Picture",
    "width": 200,
    "height": 200,
    "platform": "tiktok",
    "category": "social",
    "icon": "fab fa-tiktok",
    "description": "TikTok profile picture",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Upload at 200×200, minimum 20×20"
  },
  {
    "id": "tiktok-video",
    "name": "TikTokVideoCover",
    "displayName": "Video Cover",
    "width": 1080,
    "height": 1920,
    "platform": "tiktok",
    "category": "social",
    "icon": "fas fa-video",
    "description": "TikTok video cover/thumbnail",
    "aspectRatio": "9:16",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "5MB",
    "notes": "Full-screen vertical format, same as video dimensions"
  }
];
const webTemplates = [
  {
    "id": "web-hero",
    "name": "WebHero",
    "displayName": "Hero Banner",
    "width": 1920,
    "height": 1080,
    "platform": "web",
    "category": "web",
    "icon": "fas fa-desktop",
    "description": "Full-width hero banner for websites",
    "aspectRatio": "16:9",
    "recommendedFormats": [
      "webp",
      "jpg"
    ],
    "maxFileSize": "200KB",
    "notes": "Optimize for fast loading, consider responsive breakpoints"
  },
  {
    "id": "web-blog",
    "name": "WebBlog",
    "displayName": "Blog Featured Image",
    "width": 1200,
    "height": 630,
    "platform": "web",
    "category": "web",
    "icon": "fas fa-blog",
    "description": "Blog post featured image (Open Graph optimal)",
    "aspectRatio": "1.91:1",
    "recommendedFormats": [
      "webp",
      "jpg"
    ],
    "maxFileSize": "100KB",
    "notes": "Also works for social media sharing previews"
  },
  {
    "id": "web-content",
    "name": "WebContent",
    "displayName": "Content Image",
    "width": 1200,
    "height": "flex",
    "platform": "web",
    "category": "web",
    "icon": "fas fa-image",
    "description": "General content images within articles/pages",
    "aspectRatio": "flexible",
    "recommendedFormats": [
      "webp",
      "jpg",
      "png"
    ],
    "maxFileSize": "150KB",
    "notes": "Flexible height that maintains natural aspect ratio"
  },
  {
    "id": "web-thumb",
    "name": "WebThumb",
    "displayName": "Thumbnail",
    "width": 300,
    "height": 300,
    "platform": "web",
    "category": "web",
    "icon": "fas fa-square",
    "description": "Small thumbnails for galleries, products, listings",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "webp",
      "jpg"
    ],
    "maxFileSize": "30KB",
    "notes": "Keep file size small for grid views"
  },
  {
    "id": "web-card",
    "name": "WebCard",
    "displayName": "Card Image",
    "width": 400,
    "height": 300,
    "platform": "web",
    "category": "web",
    "icon": "fas fa-id-card",
    "description": "Images for feature cards, product cards, etc.",
    "aspectRatio": "4:3",
    "recommendedFormats": [
      "webp",
      "jpg"
    ],
    "maxFileSize": "50KB",
    "notes": "Common card aspect ratio"
  },
  {
    "id": "web-og",
    "name": "WebOpenGraph",
    "displayName": "Open Graph Image",
    "width": 1200,
    "height": 630,
    "platform": "web",
    "category": "web",
    "icon": "fas fa-share",
    "description": "Social sharing preview image",
    "aspectRatio": "1.91:1",
    "recommendedFormats": [
      "jpg",
      "png"
    ],
    "maxFileSize": "100KB",
    "notes": "Essential for social media link sharing"
  }
];
const faviconTemplates = [
  {
    "id": "favicon-basic",
    "name": "FaviconBasic",
    "displayName": "Basic Favicon",
    "width": 16,
    "height": 16,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fas fa-star",
    "description": "Standard 16×16 favicon for browser tabs",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "ico",
      "png"
    ],
    "maxFileSize": "1KB",
    "notes": "Required for most browsers, displays in browser tabs"
  },
  {
    "id": "favicon-standard",
    "name": "FaviconStandard",
    "displayName": "Standard Favicon Set",
    "width": 32,
    "height": 32,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fas fa-layer-group",
    "description": "Standard favicon set for desktop browsers",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "ico"
    ],
    "maxFileSize": "10KB",
    "notes": "Includes 16×16, 32×32, 48×48 sizes in single .ico file"
  },
  {
    "id": "favicon-modern",
    "name": "FaviconModern",
    "displayName": "Modern Favicon Set",
    "width": 180,
    "height": 180,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fas fa-mobile-alt",
    "description": "Complete favicon set for all modern devices",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png",
      "svg"
    ],
    "maxFileSize": "30KB",
    "notes": "Includes iOS home screen, Android, Safari pinned tab, Windows tile"
  },
  {
    "id": "favicon-apple",
    "name": "FaviconApple",
    "displayName": "Apple Touch Icon",
    "width": 180,
    "height": 180,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fab fa-apple",
    "description": "Apple devices home screen icon",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png"
    ],
    "maxFileSize": "20KB",
    "notes": "For iOS devices when saving to home screen"
  },
  {
    "id": "favicon-android",
    "name": "FaviconAndroid",
    "displayName": "Android Chrome Icon",
    "width": 192,
    "height": 192,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fab fa-android",
    "description": "Android Chrome home screen icon",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png"
    ],
    "maxFileSize": "20KB",
    "notes": "For Android devices when saving to home screen"
  },
  {
    "id": "favicon-safari",
    "name": "FaviconSafari",
    "displayName": "Safari Pinned Tab",
    "width": 16,
    "height": 16,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fab fa-safari",
    "description": "SVG icon for Safari pinned tabs",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "svg"
    ],
    "maxFileSize": "5KB",
    "notes": "Monochrome SVG for Safari pinned tabs feature"
  },
  {
    "id": "favicon-windows",
    "name": "FaviconWindows",
    "displayName": "Windows Tile",
    "width": 144,
    "height": 144,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fab fa-windows",
    "description": "Windows 8/10 start menu tile icon",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png"
    ],
    "maxFileSize": "15KB",
    "notes": "For Windows devices when pinning to start menu"
  },
  {
    "id": "favicon-retina",
    "name": "FaviconRetina",
    "displayName": "Retina Favicon",
    "width": 64,
    "height": 64,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fas fa-expand-alt",
    "description": "High-resolution favicon for retina displays",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png",
      "ico"
    ],
    "maxFileSize": "15KB",
    "notes": "For high-DPI screens, includes @2x and @3x versions"
  },
  {
    "id": "favicon-complete",
    "name": "FaviconComplete",
    "displayName": "Complete Favicon Package",
    "width": 512,
    "height": 512,
    "platform": "favicon",
    "category": "favicon",
    "icon": "fas fa-box",
    "description": "Complete favicon package with all necessary sizes",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "ico",
      "png",
      "svg"
    ],
    "maxFileSize": "50KB",
    "notes": "Includes all sizes: 16×16, 32×32, 48×48, 64×64, 128×128, 180×180, 192×192, 256×256, 512×512"
  }
];
const logoTemplates = [
  {
    "id": "logo-rectangular",
    "name": "LogoRectangular",
    "displayName": "Rectangular Logo",
    "width": 300,
    "height": 150,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-rectangle-landscape",
    "description": "Standard rectangular logo format",
    "aspectRatio": "2:1",
    "recommendedFormats": [
      "png",
      "svg"
    ],
    "maxFileSize": "50KB",
    "notes": "Good for website headers and email signatures"
  },
  {
    "id": "logo-square",
    "name": "LogoSquare",
    "displayName": "Square Logo",
    "width": 500,
    "height": 500,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-square",
    "description": "Square logo for social media and apps",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png",
      "svg"
    ],
    "maxFileSize": "50KB",
    "notes": "Required for many social media platforms"
  },
  {
    "id": "logo-social",
    "name": "LogoSocial",
    "displayName": "Social Media Logo",
    "width": 400,
    "height": 400,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-thumbs-up",
    "description": "Optimized for social media profile pictures",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png",
      "jpg"
    ],
    "maxFileSize": "100KB",
    "notes": "Works for Facebook, Twitter, LinkedIn, etc."
  },
  {
    "id": "logo-print",
    "name": "LogoPrint",
    "displayName": "Print-Ready Logo",
    "width": 3e3,
    "height": 3e3,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-print",
    "description": "High-resolution logo for print materials",
    "aspectRatio": "1:1",
    "recommendedFormats": [
      "png",
      "svg",
      "pdf",
      "eps"
    ],
    "maxFileSize": "2MB",
    "notes": "300 DPI minimum for quality printing"
  },
  {
    "id": "logo-watermark",
    "name": "LogoWatermark",
    "displayName": "Watermark",
    "width": 1e3,
    "height": 400,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-tint",
    "description": "Semi-transparent watermark for photos",
    "aspectRatio": "2.5:1",
    "recommendedFormats": [
      "png"
    ],
    "maxFileSize": "50KB",
    "notes": "Use PNG with transparency for overlay"
  },
  {
    "id": "logo-vertical",
    "name": "LogoVertical",
    "displayName": "Vertical Logo",
    "width": 500,
    "height": 800,
    "platform": "logo",
    "category": "logo",
    "icon": "fas fa-arrows-alt-v",
    "description": "Tall logo for vertical spaces",
    "aspectRatio": "5:8",
    "recommendedFormats": [
      "png",
      "svg"
    ],
    "maxFileSize": "50KB",
    "notes": "Good for mobile apps and documentation"
  }
];
const LemGendTemplates = {
  ALL: [...socialTemplates, ...webTemplates, ...logoTemplates, ...faviconTemplates]
};
function getTemplateById(id) {
  return LemGendTemplates.ALL.find((template) => template.id === id) || null;
}
function validateTemplateCompatibility(template, imageInfo) {
  const result = {
    compatible: true,
    errors: [],
    warnings: []
  };
  if (!template || !imageInfo) {
    result.compatible = false;
    result.errors.push({
      code: "MISSING_INFO",
      message: "Missing template or image information",
      severity: "error"
    });
    return result;
  }
  const { width, height } = imageInfo;
  const widthInfo = parseDimension(template.width);
  const heightInfo = parseDimension(template.height);
  if (!widthInfo.isVariable && widthInfo.value && width < widthInfo.value) {
    result.warnings.push({
      code: "SMALL_WIDTH",
      message: `Image width (${width}px) smaller than template width (${widthInfo.value}px)`,
      severity: "warning",
      suggestion: "Image will be upscaled or may lose quality"
    });
  }
  if (!heightInfo.isVariable && heightInfo.value && height < heightInfo.value) {
    result.warnings.push({
      code: "SMALL_HEIGHT",
      message: `Image height (${height}px) smaller than template height (${heightInfo.value}px)`,
      severity: "warning",
      suggestion: "Image will be upscaled or may lose quality"
    });
  }
  return result;
}
async function lemGendaryProcessBatch(files, task, options = {}) {
  const {
    onProgress = null,
    onWarning = null,
    onError = null,
    parallel = false,
    maxParallel = 4
  } = options;
  const results = [];
  const totalFiles = files.length;
  console.log("=== lemGendaryProcessBatch START ===");
  console.log("Batch processing:", {
    totalFiles,
    hasTask: !!task,
    steps: task?.getEnabledSteps()?.length || 0,
    options
  });
  console.log("Validating task...");
  let taskValidation;
  try {
    const { LemGendImage } = await import("./LemGendImage-DmXZDDQ3.js");
    if (files.length > 0) {
      let firstFile = files[0];
      if (!(firstFile instanceof LemGendImage) && !firstFile.constructor?.name === "LemGendImage") {
        const lemGendImage = new LemGendImage(firstFile);
        await lemGendImage.load().catch(() => {
        });
        taskValidation = await validateTask(task, lemGendImage);
      } else {
        taskValidation = await validateTask(task, firstFile);
      }
    } else {
      taskValidation = await validateTask(task);
    }
  } catch (validationError) {
    console.error("Task validation threw an error:", validationError);
    taskValidation = {
      isValid: true,
      hasWarnings: true,
      errors: [],
      warnings: [{
        type: "validation_error",
        message: `Validation error: ${validationError.message}`,
        severity: "warning"
      }],
      summary: {
        canProceed: true,
        status: "has_warnings"
      }
    };
  }
  if (taskValidation.errors && taskValidation.errors.length > 0) {
    const criticalErrors = taskValidation.errors.filter(
      (e) => e.severity === "error" && !e.message.includes("missing file property") && !e.message.includes("invalid file type")
    );
    if (criticalErrors.length > 0) {
      console.error("Critical validation errors:", criticalErrors);
      throw new Error(`Task validation failed: ${criticalErrors.map((e) => e.message).join(", ")}`);
    } else {
      console.warn("Non-critical validation errors, proceeding...");
      if (onWarning) {
        taskValidation.errors.forEach((error) => {
          onWarning({
            ...error,
            severity: "warning"
          });
        });
      }
    }
  }
  if (taskValidation.hasWarnings && onWarning) {
    taskValidation.warnings.forEach((warning) => onWarning(warning));
  }
  if (parallel) {
    const batches = [];
    for (let i = 0; i < files.length; i += maxParallel) {
      batches.push(files.slice(i, i + maxParallel));
    }
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchPromises = batch.map(
        (file, fileIndex) => processSingleFile(file, task, batchIndex * maxParallel + fileIndex)
      );
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, index2) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          const errorResult = {
            file: batch[index2],
            error: result.reason.message,
            success: false
          };
          results.push(errorResult);
          if (onError) onError(result.reason, batch[index2]);
        }
      });
      if (onProgress) {
        const progress = results.length / totalFiles;
        onProgress(progress, results.length, totalFiles);
      }
    }
  } else {
    for (let i = 0; i < files.length; i++) {
      try {
        console.log(`
=== Processing file ${i + 1}/${totalFiles} ===`);
        const file = files[i];
        console.log("File to process:", {
          type: file?.constructor?.name,
          name: file?.name || file?.originalName || file?.file?.name
        });
        const result = await processSingleFile(file, task, i);
        results.push(result);
        if (onProgress) {
          const progress = (i + 1) / totalFiles;
          onProgress(progress, i + 1, totalFiles);
        }
      } catch (error) {
        console.error(`Failed to process file ${i}:`, error);
        const errorResult = {
          file: files[i],
          error: error.message,
          success: false
        };
        results.push(errorResult);
        if (onError) onError(error, files[i]);
      }
    }
  }
  console.log("\n=== Processing complete ===");
  console.log("Summary:", {
    totalFiles,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length
  });
  results.forEach((result, index2) => {
    if (result.success) {
      console.log(`✓ File ${index2 + 1}: ${result.image?.originalName || "Unknown"}`, {
        success: true,
        size: result.file?.size,
        dimensions: result.image ? `${result.image.width}x${result.image.height}` : "N/A"
      });
    } else {
      console.log(`✗ File ${index2 + 1}: Failed`, {
        error: result.error,
        fileName: result.file?.name || "Unknown"
      });
    }
  });
  return results;
}
async function processWithTemplate(image, templateId, options = {}) {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    const compatibility = validateTemplateCompatibility(template, {
      width: image.width,
      height: image.height
    });
    if (!compatibility.compatible) {
      throw new Error(`Template incompatible: ${compatibility.errors.map((e) => e.message).join(", ")}`);
    }
    const { LemGendImage } = await import("./LemGendImage-DmXZDDQ3.js");
    let lemGendImage;
    if (image instanceof LemGendImage) {
      lemGendImage = image;
    } else {
      lemGendImage = new LemGendImage(image);
      await lemGendImage.load();
    }
    const task = new LemGendTask(`Template: ${template.displayName}`, template.description);
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    if (!widthInfo.isVariable && !heightInfo.isVariable) {
      const aspect = widthInfo.value / heightInfo.value;
      const imageAspect = lemGendImage.width / lemGendImage.height;
      if (Math.abs(aspect - imageAspect) > 0.1) {
        task.addCrop(widthInfo.value, heightInfo.value, "smart");
      } else {
        task.addResize(Math.max(widthInfo.value, heightInfo.value), "longest");
      }
    } else if (widthInfo.isVariable && !heightInfo.isVariable) {
      task.addResize(heightInfo.value, "height");
    } else if (!widthInfo.isVariable && heightInfo.isVariable) {
      task.addResize(widthInfo.value, "width");
    }
    task.addOptimize(85, "auto", {
      compressionMode: "adaptive",
      preserveTransparency: template.recommendedFormats?.includes("png") || template.recommendedFormats?.includes("svg")
    });
    const results = await lemGendaryProcessBatch([lemGendImage], task);
    if (results.length === 0 || !results[0].success) {
      throw new Error("Template processing failed");
    }
    return {
      success: true,
      template,
      image: results[0].image,
      file: results[0].file,
      compatibility,
      warnings: compatibility.warnings
    };
  } catch (error) {
    console.error("Template processing failed:", error);
    return {
      success: false,
      error: error.message,
      templateId
    };
  }
}
async function processFlexibleTemplate(image, template, options = {}) {
  const { LemGendImage } = await import("./LemGendImage-DmXZDDQ3.js");
  let lemGendImage;
  if (image instanceof LemGendImage) {
    lemGendImage = image;
  } else {
    lemGendImage = new LemGendImage(image);
    await lemGendImage.load();
  }
  const widthInfo = parseDimension(template.width);
  const heightInfo = parseDimension(template.height);
  const task = new LemGendTask(`Flexible: ${template.displayName}`, template.description);
  if (widthInfo.isVariable && !heightInfo.isVariable) {
    task.addResize(heightInfo.value, "height");
  } else if (!widthInfo.isVariable && heightInfo.isVariable) {
    task.addResize(widthInfo.value, "width");
  } else if (widthInfo.isVariable && heightInfo.isVariable) {
    task.addOptimize(85, "auto");
  }
  const results = await lemGendaryProcessBatch([lemGendImage], task);
  return results[0] || { success: false, error: "Processing failed" };
}
function getLibraryInfo() {
  return {
    name: "LemGendary Image Processor",
    version: "2.2.0",
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
const index = {
  // Note: LemGendImage is not included in default export to avoid circular dependency
  // Users should import it directly: import { LemGendImage } from './LemGendImage.js'
  // Tasks
  LemGendTask,
  // Processors
  LemGendaryResize,
  LemGendaryCrop,
  LemGendaryOptimize,
  LemGendaryRename,
  // Main functions
  lemGendaryProcessBatch,
  getLibraryInfo,
  processWithTemplate,
  processFlexibleTemplate
};
export {
  LemGendTask as L,
  analyzeForOptimization as a,
  LemGendaryResize as b,
  createThumbnail as c,
  LemGendaryCrop as d,
  LemGendaryOptimize as e,
  fileToDataURL as f,
  getFileExtension as g,
  hasTransparency as h,
  LemGendaryRename as i,
  processFlexibleTemplate as j,
  getLibraryInfo as k,
  lemGendaryProcessBatch as l,
  index as m,
  processWithTemplate as p
};
//# sourceMappingURL=index-BOe4KKSA.js.map
