"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
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
function getMimeTypeFromExtension(filename) {
  const extension = filename.toLowerCase().split(".").pop();
  const mimeTypes = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
    "svg": "image/svg+xml",
    "bmp": "image/bmp",
    "ico": "image/x-icon",
    "tiff": "image/tiff",
    "tif": "image/tiff",
    "avif": "image/avif",
    "pdf": "application/pdf",
    "txt": "text/plain",
    "csv": "text/csv",
    "json": "application/json",
    "xml": "application/xml",
    "zip": "application/zip",
    "rar": "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    "": "application/octet-stream"
  };
  return mimeTypes[extension] || "application/octet-stream";
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
function dataURLtoFile(dataURL, filename) {
  return new Promise((resolve, reject) => {
    try {
      const arr = dataURL.split(",");
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
async function resizeImage(file, width, height, format = "webp", quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (format.toLowerCase() === "ico") {
      resizeImage(file, width, height, "png", quality).then((pngFile) => {
        console.warn("ICO format creation limited in browser. Using PNG instead.");
        resolve(pngFile);
      }).catch(reject);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (format === "jpg" || format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      let mimeType;
      switch (format.toLowerCase()) {
        case "jpg":
        case "jpeg":
          mimeType = "image/jpeg";
          break;
        case "png":
          mimeType = "image/png";
          break;
        case "webp":
          mimeType = "image/webp";
          break;
        case "avif":
          mimeType = "image/avif";
          break;
        case "svg":
          mimeType = "image/svg+xml";
          break;
        default:
          mimeType = "image/webp";
      }
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const extension = format.toLowerCase();
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const newName = `${originalName}-${width}x${height}.${extension}`;
          resolve(new File([blob], newName, { type: mimeType }));
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}
async function cropImage(file, x, y, width, height, format = "webp", quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (format === "jpg" || format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      let mimeType;
      switch (format.toLowerCase()) {
        case "jpg":
        case "jpeg":
          mimeType = "image/jpeg";
          break;
        case "png":
          mimeType = "image/png";
          break;
        case "webp":
          mimeType = "image/webp";
          break;
        default:
          mimeType = "image/webp";
      }
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const extension = format.toLowerCase();
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const newName = `${originalName}-crop-${width}x${height}.${extension}`;
          resolve(new File([blob], newName, { type: mimeType }));
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}
function calculateAspectRatioFit(originalWidth, originalHeight, targetSize, mode = "auto") {
  if (mode === "width") {
    const newWidth = targetSize;
    const newHeight = Math.round(originalHeight / originalWidth * targetSize);
    return { width: newWidth, height: newHeight };
  } else if (mode === "height") {
    const newHeight = targetSize;
    const newWidth = Math.round(originalWidth / originalHeight * targetSize);
    return { width: newWidth, height: newHeight };
  } else {
    if (originalWidth >= originalHeight) {
      const newWidth = targetSize;
      const newHeight = Math.round(originalHeight / originalWidth * targetSize);
      return { width: newWidth, height: newHeight };
    } else {
      const newHeight = targetSize;
      const newWidth = Math.round(originalWidth / originalHeight * targetSize);
      return { width: newWidth, height: newHeight };
    }
  }
}
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
function validateImageFile(file) {
  const errors = [];
  const warnings = [];
  if (!(file instanceof File)) {
    errors.push("Not a valid File object");
    return { valid: false, errors, warnings };
  }
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/avif",
    "image/x-icon",
    "image/vnd.microsoft.icon"
  ];
  if (!validTypes.includes(file.type)) {
    errors.push(`Unsupported file type: ${file.type}`);
  }
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(maxSize)})`);
  } else if (file.size > 10 * 1024 * 1024) {
    warnings.push(`Large file: ${formatFileSize(file.size)} - processing may be slow`);
  }
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    warnings.push("Filename contains invalid characters");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
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
async function batchProcess(files, processor, onProgress) {
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
function getOptimizationPreset(useCase) {
  const presets = {
    "web-high": {
      quality: 85,
      format: "auto",
      maxDisplayWidth: 1920,
      compressionMode: "balanced",
      stripMetadata: true,
      description: "High quality web images"
    },
    "web-balanced": {
      quality: 80,
      format: "auto",
      maxDisplayWidth: 1200,
      compressionMode: "adaptive",
      stripMetadata: true,
      description: "Balanced web images"
    },
    "web-aggressive": {
      quality: 70,
      format: "webp",
      maxDisplayWidth: 800,
      compressionMode: "aggressive",
      stripMetadata: true,
      description: "Aggressive web optimization"
    },
    "social-media": {
      quality: 90,
      format: "jpg",
      maxDisplayWidth: 1080,
      compressionMode: "balanced",
      stripMetadata: false,
      // Keep metadata for social
      description: "Social media images"
    },
    "ecommerce": {
      quality: 92,
      format: "webp",
      maxDisplayWidth: 1200,
      compressionMode: "balanced",
      stripMetadata: true,
      preserveTransparency: true,
      description: "E-commerce product images"
    },
    "favicon": {
      quality: 100,
      format: "ico",
      compressionMode: "balanced",
      icoSizes: [16, 32, 48, 64],
      description: "Favicon generation"
    },
    "print-ready": {
      quality: 100,
      format: "png",
      compressionMode: "balanced",
      lossless: true,
      stripMetadata: false,
      description: "Print-ready images"
    },
    "mobile-optimized": {
      quality: 75,
      format: "webp",
      maxDisplayWidth: 800,
      compressionMode: "aggressive",
      stripMetadata: true,
      description: "Mobile-optimized images"
    }
  };
  return presets[useCase] || presets["web-balanced"];
}
function calculateOptimizationSavings(originalSize, optimizationSettings) {
  const { format, quality, maxDisplayWidth } = optimizationSettings;
  let estimatedSize = originalSize;
  let reductionFactors = [];
  switch (format) {
    case "webp":
      estimatedSize *= 0.7;
      reductionFactors.push("WebP format: 30% reduction");
      break;
    case "avif":
      estimatedSize *= 0.6;
      reductionFactors.push("AVIF format: 40% reduction");
      break;
    case "jpg":
      estimatedSize *= 0.8;
      reductionFactors.push("JPEG format: 20% reduction");
      break;
    case "png":
      estimatedSize *= 0.9;
      reductionFactors.push("PNG format: 10% reduction");
      break;
    case "svg":
      estimatedSize *= 0.3;
      reductionFactors.push("SVG format: 70% reduction");
      break;
    default:
      estimatedSize *= 0.75;
      reductionFactors.push("Auto format selection: ~25% reduction");
  }
  const qualityFactor = quality / 100;
  estimatedSize *= qualityFactor;
  reductionFactors.push(`Quality ${quality}%: ${Math.round((1 - qualityFactor) * 100)}% reduction`);
  if (maxDisplayWidth) {
    estimatedSize *= 0.85;
    reductionFactors.push(`Max width ${maxDisplayWidth}px: ~15% reduction`);
  }
  const savings = originalSize - estimatedSize;
  const savingsPercent = savings / originalSize * 100;
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
async function createOptimizationPreview(file, optimizationSettings) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxPreviewSize = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxPreviewSize || height > maxPreviewSize) {
          if (width >= height) {
            width = maxPreviewSize;
            height = Math.round(img.height / img.width * maxPreviewSize);
          } else {
            height = maxPreviewSize;
            width = Math.round(img.width / img.height * maxPreviewSize);
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const previewQuality = Math.min(0.7, optimizationSettings.quality / 100 * 0.8);
        const previewDataURL = canvas.toDataURL("image/jpeg", previewQuality);
        resolve(previewDataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
async function generateOptimizationComparison(originalFile, optimizedFile) {
  const originalSize = originalFile.size;
  const optimizedSize = optimizedFile.size;
  const savings = originalSize - optimizedSize;
  const savingsPercent = savings / originalSize * 100;
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
    comparison: savingsPercent > 0 ? `Saved ${formatFileSize(savings)} (${Math.round(savingsPercent)}%)` : "No savings achieved"
  };
}
function needsFormatConversion(file) {
  const extension = getFileExtension(file);
  const modernFormats = ["webp", "avif", "svg"];
  return !modernFormats.includes(extension);
}
function getRecommendedFormat(file) {
  const extension = getFileExtension(file);
  if (extension === "svg") return "svg";
  if (extension === "ico") return "ico";
  if (file.type === "image/png" || file.type === "image/webp") {
    return "webp";
  }
  if (file.size > 2 * 1024 * 1024) {
    return "avif";
  }
  return "webp";
}
async function getOptimizationStats(file) {
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
function getFormatPriorities(browserSupport = ["modern", "legacy"]) {
  const formats = {
    "avif": {
      quality: 0.9,
      browserSupport: browserSupport.includes("modern") ? 0.9 : 0.7,
      compression: 0.8,
      supportsTransparency: true,
      maxQuality: 63
      // AVIF has different quality scale
    },
    "webp": {
      quality: 0.8,
      browserSupport: browserSupport.includes("legacy") ? 0.9 : 0.98,
      compression: 0.7,
      supportsTransparency: true,
      maxQuality: 100
    },
    "jpg": {
      quality: 0.7,
      browserSupport: 1,
      compression: 0.6,
      supportsTransparency: false,
      maxQuality: 100
    },
    "png": {
      quality: 0.9,
      browserSupport: 1,
      compression: 0.5,
      supportsTransparency: true,
      maxQuality: 100
    },
    "ico": {
      quality: 1,
      browserSupport: 1,
      compression: 0.5,
      supportsTransparency: true,
      maxQuality: 100
    }
  };
  return formats;
}
async function checkAICapabilities() {
  const capabilities = {
    faceDetection: false,
    objectDetection: false,
    saliencyDetection: false,
    entropyDetection: false,
    canvasAvailable: false,
    workerAvailable: typeof Worker !== "undefined",
    tensorFlowAvailable: typeof tf !== "undefined",
    faceDetectorAvailable: typeof FaceDetector !== "undefined"
  };
  try {
    const canvas = document.createElement("canvas");
    capabilities.canvasAvailable = !!(canvas.getContext && canvas.getContext("2d"));
    if (typeof FaceDetector === "function") {
      try {
        const faceDetector = new FaceDetector();
        capabilities.faceDetection = true;
      } catch (e) {
        console.warn("FaceDetector API available but failed to initialize:", e.message);
      }
    }
    if (typeof tf !== "undefined") {
      capabilities.tensorFlowAvailable = true;
      capabilities.objectDetection = true;
      capabilities.saliencyDetection = true;
      capabilities.entropyDetection = true;
    }
    if (typeof OffscreenCanvas !== "undefined") {
      capabilities.offscreenCanvas = true;
    }
  } catch (error) {
    console.warn("Error checking AI capabilities:", error.message);
  }
  capabilities.summary = generateAISummary(capabilities);
  capabilities.hasAnyAI = capabilities.faceDetection || capabilities.objectDetection || capabilities.saliencyDetection || capabilities.entropyDetection;
  return capabilities;
}
function generateAISummary(capabilities) {
  const availableFeatures = [];
  const unavailableFeatures = [];
  if (capabilities.faceDetection) availableFeatures.push("Face Detection");
  else unavailableFeatures.push("Face Detection (requires FaceDetector API)");
  if (capabilities.objectDetection) availableFeatures.push("Object Detection");
  else unavailableFeatures.push("Object Detection (requires TensorFlow.js)");
  if (capabilities.saliencyDetection) availableFeatures.push("Saliency Detection");
  else unavailableFeatures.push("Saliency Detection (requires TensorFlow.js)");
  if (capabilities.entropyDetection) availableFeatures.push("Entropy Analysis");
  else unavailableFeatures.push("Entropy Analysis (requires TensorFlow.js)");
  return {
    available: availableFeatures,
    unavailable: unavailableFeatures,
    hasAdvancedAI: capabilities.tensorFlowAvailable,
    canUseWorkers: capabilities.workerAvailable && capabilities.offscreenCanvas,
    recommendedMode: capabilities.faceDetection ? "face" : capabilities.objectDetection ? "object" : capabilities.saliencyDetection ? "saliency" : "center"
  };
}
function isLemGendImage(obj) {
  return obj && typeof obj === "object" && obj.constructor && obj.constructor.name === "LemGendImage";
}
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
const LemGendImage$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LemGendImage
}, Symbol.toStringTag, { value: "Module" }));
const ValidationErrors = {
  INVALID_FILE: "INVALID_FILE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  INVALID_DIMENSIONS: "INVALID_DIMENSIONS",
  INVALID_QUALITY: "INVALID_QUALITY",
  INVALID_FORMAT: "INVALID_FORMAT",
  EMPTY_PATTERN: "EMPTY_PATTERN",
  INVALID_CHARS: "INVALID_CHARS",
  MISSING_INFO: "MISSING_INFO",
  INVALID_CROP_DIMENSIONS: "INVALID_CROP_DIMENSIONS",
  INVALID_CROP_MODE: "INVALID_CROP_MODE",
  INVALID_DIMENSION: "INVALID_DIMENSION",
  INVALID_MODE: "INVALID_MODE",
  INVALID_ALGORITHM: "INVALID_ALGORITHM",
  INVALID_WIDTH: "INVALID_WIDTH",
  INVALID_HEIGHT: "INVALID_HEIGHT",
  DIMENSION_EXCEEDS_MAX: "DIMENSION_EXCEEDS_MAX",
  VERY_SMALL_DIMENSION: "VERY_SMALL_DIMENSION",
  VERY_LARGE_DIMENSION: "VERY_LARGE_DIMENSION"
};
const ValidationWarnings = {
  LARGE_FILE: "LARGE_FILE",
  CONTENT_LOSS: "CONTENT_LOSS",
  TRANSPARENCY_LOSS: "TRANSPARENCY_LOSS",
  AVIF_BROWSER_SUPPORT: "AVIF_BROWSER_SUPPORT",
  SMALL_WIDTH: "SMALL_WIDTH",
  SMALL_HEIGHT: "SMALL_HEIGHT",
  LARGE_DIMENSIONS: "LARGE_DIMENSIONS",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  NO_PLACEHOLDERS: "NO_PLACEHOLDERS",
  NON_INTEGER_DIMENSION: "NON_INTEGER_DIMENSION",
  FORCE_SQUARE_NO_ASPECT: "FORCE_SQUARE_NO_ASPECT",
  SVG_SKIPPED: "SVG_SKIPPED",
  FAVICON_RESIZE: "FAVICON_RESIZE",
  EXTREME_ASPECT_RATIO: "EXTREME_ASPECT_RATIO",
  VERY_SMALL_SOURCE: "VERY_SMALL_SOURCE",
  VERY_LARGE_SOURCE: "VERY_LARGE_SOURCE"
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
function validateDimensions(width, height, options = {}) {
  const { minWidth = 1, minHeight = 1, maxWidth = 1e4, maxHeight = 1e4 } = options;
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  if (width < minWidth || height < minHeight) {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_DIMENSIONS,
      message: `Dimensions too small: ${width}x${height} (minimum: ${minWidth}x${minHeight})`,
      severity: "error"
    });
  }
  if (width > maxWidth || height > maxHeight) {
    result.warnings.push({
      code: "LARGE_DIMENSIONS",
      message: `Large dimensions: ${width}x${height} (maximum: ${maxWidth}x${maxHeight})`,
      severity: "warning"
    });
  }
  return result;
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
function validateImage(file, options = {}) {
  const {
    maxFileSize = 50 * 1024 * 1024,
    minFileSize = 1,
    allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/avif",
      "image/x-icon",
      "image/vnd.microsoft.icon"
    ],
    checkDimensions = false,
    minDimensions = { width: 1, height: 1 },
    maxDimensions = { width: 1e4, height: 1e4 }
  } = options;
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {}
  };
  if (!file || typeof file !== "object") {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_FILE,
      message: "Not a valid file object",
      severity: "error"
    });
    return result;
  }
  const hasRequiredProperties = file.name !== void 0 && file.size !== void 0 && file.type !== void 0;
  if (!hasRequiredProperties) {
    if (file.metadata && file.metadata.name && file.metadata.type && file.metadata.size) {
      result.metadata = { ...file.metadata };
    } else {
      result.valid = false;
      result.errors.push({
        code: ValidationErrors.INVALID_FILE,
        message: "File object missing required properties (name, size, type)",
        severity: "error"
      });
      return result;
    }
  } else {
    result.metadata = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified || Date.now()
    };
  }
  const fileName = file.name || result.metadata.name;
  const fileType = file.type || result.metadata.type;
  const fileSize = file.size || result.metadata.size;
  if (fileSize < minFileSize) {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_FILE,
      message: "File is empty",
      severity: "error"
    });
  } else if (fileSize > maxFileSize) {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.FILE_TOO_LARGE,
      message: `File too large (${formatFileSize(fileSize)} > ${formatFileSize(maxFileSize)})`,
      severity: "error"
    });
  } else if (fileSize > 10 * 1024 * 1024) {
    result.warnings.push({
      code: ValidationWarnings.LARGE_FILE,
      message: `Large file (${formatFileSize(fileSize)}) may process slowly`,
      severity: "warning"
    });
  }
  const normalizedType = fileType ? fileType.toLowerCase() : "";
  const isAllowed = allowedTypes.some((allowedType) => {
    if (normalizedType === allowedType) return true;
    if (normalizedType.includes("jpeg") && allowedType.includes("jpeg")) return true;
    if (normalizedType.includes("jpg") && allowedType.includes("jpg")) return true;
    if (!normalizedType || normalizedType === "application/octet-stream") {
      const extension = fileName ? fileName.split(".").pop().toLowerCase() : "";
      const extensionMap = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "tif": "image/tiff",
        "avif": "image/avif",
        "ico": "image/x-icon"
      };
      return extensionMap[extension] === allowedType;
    }
    return false;
  });
  if (!isAllowed) {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.UNSUPPORTED_TYPE,
      message: `Unsupported file type: ${fileType || "unknown"}`,
      severity: "error",
      details: fileName ? `File: ${fileName}` : ""
    });
  }
  if (checkDimensions && file.width && file.height) {
    const dimensionValidation = validateDimensions(file.width, file.height, {
      minWidth: minDimensions.width,
      minHeight: minDimensions.height,
      maxWidth: maxDimensions.width,
      maxHeight: maxDimensions.height
    });
    result.errors.push(...dimensionValidation.errors);
    result.warnings.push(...dimensionValidation.warnings);
    result.valid = result.valid && dimensionValidation.valid;
  }
  return result;
}
function validateSessionImage(imageData, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {}
  };
  if (!imageData || typeof imageData !== "object") {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_FILE,
      message: "Invalid image data",
      severity: "error"
    });
    return result;
  }
  let fileName, fileType, fileSize, fileObject;
  if (imageData.file instanceof File || imageData.file instanceof Blob) {
    fileObject = imageData.file;
    fileName = imageData.file.name;
    fileType = imageData.file.type;
    fileSize = imageData.file.size;
  } else if (imageData.name && imageData.type && imageData.size) {
    fileName = imageData.name;
    fileType = imageData.type;
    fileSize = imageData.size;
  } else if (imageData.lemGendImage) {
    if (imageData.lemGendImage.file) {
      fileObject = imageData.lemGendImage.file;
    }
    fileName = imageData.lemGendImage.metadata?.originalName || imageData.originalName;
    fileType = imageData.lemGendImage.metadata?.mimeType || imageData.type;
    fileSize = imageData.lemGendImage.metadata?.originalSize || imageData.size;
  } else {
    result.valid = false;
    result.errors.push({
      code: ValidationErrors.INVALID_FILE,
      message: "Cannot extract file information",
      severity: "error"
    });
    return result;
  }
  if (!fileObject && imageData.blob) {
    result.warnings.push({
      code: ValidationWarnings.CONTENT_LOSS,
      message: "File data available as blob, but not as File object",
      severity: "warning",
      suggestion: "File may need to be reconstructed for processing"
    });
  }
  result.metadata = {
    name: fileName,
    type: fileType,
    size: fileSize,
    id: imageData.id,
    hasFileObject: !!fileObject,
    hasBlobData: !!imageData.blob
  };
  if (fileObject) {
    const fileValidation = validateImage(fileObject, options);
    result.valid = fileValidation.valid;
    result.errors.push(...fileValidation.errors);
    result.warnings.push(...fileValidation.warnings);
    result.metadata = { ...result.metadata, ...fileValidation.metadata };
  } else {
    const minimalFile = {
      name: fileName,
      type: fileType,
      size: fileSize,
      lastModified: Date.now()
    };
    const fileValidation = validateImage(minimalFile, options);
    result.valid = fileValidation.valid;
    result.errors.push(...fileValidation.errors);
    result.warnings.push(...fileValidation.warnings);
    result.metadata = { ...result.metadata, ...fileValidation.metadata };
  }
  if (imageData.url && !imageData.url.startsWith("blob:")) {
    result.warnings.push({
      code: ValidationWarnings.CONTENT_LOSS,
      message: "Image URL may not be a valid blob URL",
      severity: "warning"
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
const LemGendaryResize$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LemGendaryResize
}, Symbol.toStringTag, { value: "Module" }));
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
const LemGendaryCrop$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LemGendaryCrop
}, Symbol.toStringTag, { value: "Module" }));
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
    const { applyOptimization: applyOptimization2 } = await Promise.resolve().then(() => processingUtils);
    const dimensions = {
      width: image.width,
      height: image.height
    };
    return applyOptimization2(
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
const LemGendaryOptimize$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LemGendaryOptimize
}, Symbol.toStringTag, { value: "Module" }));
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
const LemGendaryRename$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  LemGendaryRename
}, Symbol.toStringTag, { value: "Module" }));
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
  SOCIAL_MEDIA: socialTemplates,
  WEB: webTemplates,
  LOGO: logoTemplates,
  FAVICON: faviconTemplates,
  ALL: [...socialTemplates, ...webTemplates, ...logoTemplates, ...faviconTemplates]
};
const TEMPLATE_CATEGORIES = [
  { id: "all", name: "All Templates", icon: "fas fa-th", color: "#3B82F6" },
  { id: "social", name: "Social Media", icon: "fas fa-share-alt", color: "#8B5CF6" },
  { id: "web", name: "Web", icon: "fas fa-globe", color: "#10B981" },
  { id: "logo", name: "Logo", icon: "fas fa-copyright", color: "#F59E0B" },
  { id: "favicon", name: "Favicon", icon: "fas fa-star", color: "#EC4899" }
];
const PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: "fab fa-instagram",
    color: "#E4405F",
    categories: ["social"]
  },
  facebook: {
    name: "Facebook",
    icon: "fab fa-facebook",
    color: "#1877F2",
    categories: ["social"]
  },
  twitter: {
    name: "Twitter / X",
    icon: "fab fa-twitter",
    color: "#1DA1F2",
    categories: ["social"]
  },
  linkedin: {
    name: "LinkedIn",
    icon: "fab fa-linkedin",
    color: "#0A66C2",
    categories: ["social"]
  },
  youtube: {
    name: "YouTube",
    icon: "fab fa-youtube",
    color: "#FF0000",
    categories: ["social"]
  },
  pinterest: {
    name: "Pinterest",
    icon: "fab fa-pinterest",
    color: "#E60023",
    categories: ["social"]
  },
  tiktok: {
    name: "TikTok",
    icon: "fab fa-tiktok",
    color: "#000000",
    categories: ["social"]
  },
  web: {
    name: "Web",
    icon: "fas fa-globe",
    color: "#3B82F6",
    categories: ["web"]
  },
  logo: {
    name: "Logo",
    icon: "fas fa-copyright",
    color: "#8B5CF6",
    categories: ["logo"]
  },
  favicon: {
    name: "Favicon",
    icon: "fas fa-star",
    color: "#EC4899",
    categories: ["favicon"]
  }
};
function getTemplatesByPlatform(platform) {
  if (!PLATFORMS[platform]) {
    console.warn(`Unknown platform: ${platform}`);
    return [];
  }
  return LemGendTemplates.ALL.filter(
    (template) => template.platform && template.platform.toLowerCase() === platform.toLowerCase()
  );
}
function getTemplatesByCategory(category) {
  const validCategories = TEMPLATE_CATEGORIES.map((c) => c.id);
  if (!validCategories.includes(category) && category !== "all") {
    console.warn(`Invalid category: ${category}`);
    return [];
  }
  if (category === "all") {
    return LemGendTemplates.ALL;
  }
  return LemGendTemplates.ALL.filter(
    (template) => template.category && template.category.toLowerCase() === category.toLowerCase()
  );
}
function getTemplateById(id) {
  return LemGendTemplates.ALL.find((template) => template.id === id) || null;
}
function getTemplatesByDimensions(width, height, operator = "min") {
  return LemGendTemplates.ALL.filter((template) => {
    if (!template.width || !template.height) return false;
    const templateWidth = parseDimension(template.width);
    const templateHeight = parseDimension(template.height);
    const targetWidth = parseDimension(width);
    const targetHeight = parseDimension(height);
    if (operator === "flexible") {
      return templateWidth.isVariable || templateHeight.isVariable;
    }
    if (operator === "exact" && (templateWidth.isVariable || templateHeight.isVariable)) {
      if (templateWidth.isVariable && templateHeight.isVariable) {
        return targetWidth.isVariable && targetHeight.isVariable;
      } else if (templateWidth.isVariable) {
        return targetWidth.isVariable && templateHeight.value === targetHeight.value;
      } else if (templateHeight.isVariable) {
        return templateWidth.value === targetWidth.value && targetHeight.isVariable;
      }
    }
    if (templateWidth.isVariable || templateHeight.isVariable || targetWidth.isVariable || targetHeight.isVariable) {
      return false;
    }
    switch (operator) {
      case "exact":
        return templateWidth.value === targetWidth.value && templateHeight.value === targetHeight.value;
      case "min":
        return templateWidth.value >= targetWidth.value && templateHeight.value >= targetHeight.value;
      case "max":
        return templateWidth.value <= targetWidth.value && templateHeight.value <= targetHeight.value;
      case "aspect":
        const templateAspect = templateWidth.value / templateHeight.value;
        const targetAspect = targetWidth.value / targetHeight.value;
        return Math.abs(templateAspect - targetAspect) < 0.1;
      default:
        return false;
    }
  });
}
function calculateTemplateMatchScore(image, template) {
  let score = 0;
  const maxScore = 100;
  if (!image || !image.width || !image.height) {
    return 0.5;
  }
  const templateWidth = parseDimension(template.width);
  const templateHeight = parseDimension(template.height);
  if (templateWidth.isVariable || templateHeight.isVariable) {
    score += 50;
    if (templateWidth.isVariable && !templateHeight.isVariable) {
      const heightRatio = image.height / templateHeight.value;
      if (heightRatio >= 1) {
        score += 30;
      } else if (heightRatio >= 0.8) {
        score += 20 * heightRatio;
      } else {
        score += 10 * heightRatio;
      }
      const aspect = image.width / image.height;
      if (aspect >= 0.5 && aspect <= 2) {
        score += 20;
      } else {
        score += 10;
      }
    } else if (!templateWidth.isVariable && templateHeight.isVariable) {
      const widthRatio = image.width / templateWidth.value;
      if (widthRatio >= 1) {
        score += 30;
      } else if (widthRatio >= 0.8) {
        score += 20 * widthRatio;
      } else {
        score += 10 * widthRatio;
      }
      const aspect = image.width / image.height;
      if (aspect >= 0.5 && aspect <= 2) {
        score += 20;
      } else {
        score += 10;
      }
    } else {
      score += 50;
    }
  } else {
    const imageAspect = image.width / image.height;
    const templateAspect = templateWidth.value / templateHeight.value;
    const aspectDiff = Math.abs(imageAspect - templateAspect) / imageAspect;
    score += Math.max(0, 50 * (1 - aspectDiff));
    const widthRatio = image.width / templateWidth.value;
    const heightRatio = image.height / templateHeight.value;
    const minRatio = Math.min(widthRatio, heightRatio);
    if (minRatio >= 1) {
      score += 30;
    } else {
      score += 30 * minRatio;
    }
    score += 20;
  }
  return Math.min(maxScore, score) / maxScore;
}
function getRecommendedTemplates(image, options = {}) {
  const {
    category = "all",
    platform = null,
    minMatchScore = 0.7,
    includeFlexible = true
  } = options;
  let templates = category === "all" ? LemGendTemplates.ALL : getTemplatesByCategory(category);
  if (platform) {
    templates = templates.filter((t) => t.platform === platform);
  }
  if (!includeFlexible) {
    templates = templates.filter((template) => {
      const widthInfo = parseDimension(template.width);
      const heightInfo = parseDimension(template.height);
      return !widthInfo.isVariable && !heightInfo.isVariable;
    });
  }
  const scoredTemplates = templates.map((template) => {
    const score = calculateTemplateMatchScore(image, template);
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    return {
      ...template,
      matchScore: score,
      hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable,
      flexibleType: widthInfo.isVariable ? "width" : heightInfo.isVariable ? "height" : "none"
    };
  });
  return scoredTemplates.filter((t) => t.matchScore >= minMatchScore).sort((a, b) => b.matchScore - a.matchScore);
}
function getTemplateStats() {
  const stats = {
    total: LemGendTemplates.ALL.length,
    byCategory: {},
    byPlatform: {},
    flexibleTemplates: 0,
    fixedTemplates: 0,
    dimensions: {
      minWidth: Infinity,
      maxWidth: 0,
      minHeight: Infinity,
      maxHeight: 0,
      commonAspectRatios: {}
    }
  };
  TEMPLATE_CATEGORIES.forEach((category) => {
    if (category.id !== "all") {
      const count = getTemplatesByCategory(category.id).length;
      stats.byCategory[category.id] = count;
    }
  });
  Object.keys(PLATFORMS).forEach((platform) => {
    const count = getTemplatesByPlatform(platform).length;
    stats.byPlatform[platform] = count;
  });
  LemGendTemplates.ALL.forEach((template) => {
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    if (widthInfo.isVariable || heightInfo.isVariable) {
      stats.flexibleTemplates++;
    } else {
      stats.fixedTemplates++;
      stats.dimensions.minWidth = Math.min(stats.dimensions.minWidth, widthInfo.value);
      stats.dimensions.maxWidth = Math.max(stats.dimensions.maxWidth, widthInfo.value);
      stats.dimensions.minHeight = Math.min(stats.dimensions.minHeight, heightInfo.value);
      stats.dimensions.maxHeight = Math.max(stats.dimensions.maxHeight, heightInfo.value);
      const aspect = (widthInfo.value / heightInfo.value).toFixed(2);
      stats.dimensions.commonAspectRatios[aspect] = (stats.dimensions.commonAspectRatios[aspect] || 0) + 1;
    }
  });
  return stats;
}
function exportTemplates(format = "json") {
  switch (format.toLowerCase()) {
    case "json":
      return JSON.stringify(LemGendTemplates, null, 2);
    case "csv":
      const headers = ["id", "name", "platform", "category", "width", "height", "description", "flexible"];
      const rows = LemGendTemplates.ALL.map((t) => {
        const widthInfo = parseDimension(t.width);
        const heightInfo = parseDimension(t.height);
        const flexible = widthInfo.isVariable || heightInfo.isVariable ? "yes" : "no";
        return [
          t.id,
          t.name,
          t.platform,
          t.category,
          t.width,
          t.height,
          t.description || "",
          flexible
        ];
      });
      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    case "markdown":
      let markdown = "# LemGendary Templates\n\n";
      markdown += `**Total Templates:** ${LemGendTemplates.ALL.length}

`;
      const stats = getTemplateStats();
      markdown += `**Flexible Templates:** ${stats.flexibleTemplates}
`;
      markdown += `**Fixed Templates:** ${stats.fixedTemplates}

`;
      TEMPLATE_CATEGORIES.forEach((category) => {
        if (category.id !== "all") {
          const templates = getTemplatesByCategory(category.id);
          markdown += `## ${category.name} (${templates.length})

`;
          const templatesByPlatform = {};
          templates.forEach((template) => {
            if (!templatesByPlatform[template.platform]) {
              templatesByPlatform[template.platform] = [];
            }
            templatesByPlatform[template.platform].push(template);
          });
          Object.keys(templatesByPlatform).forEach((platform) => {
            const platformTemplates = templatesByPlatform[platform];
            const platformInfo = PLATFORMS[platform] || { name: platform };
            markdown += `### ${platformInfo.name}
`;
            platformTemplates.forEach((template) => {
              const widthInfo = parseDimension(template.width);
              const heightInfo = parseDimension(template.height);
              const flexible = widthInfo.isVariable || heightInfo.isVariable;
              markdown += `- **${template.displayName || template.name}**: `;
              if (flexible) {
                if (widthInfo.isVariable && heightInfo.isVariable) {
                  markdown += `Flexible dimensions`;
                } else if (widthInfo.isVariable) {
                  markdown += `Flexible width × ${heightInfo.value}`;
                } else {
                  markdown += `${widthInfo.value} × Flexible height`;
                }
              } else {
                markdown += `${widthInfo.value} × ${heightInfo.value}`;
              }
              if (template.description) {
                markdown += ` - ${template.description}`;
              }
              if (flexible) {
                markdown += ` ⚡`;
              }
              markdown += ` (\`${template.id}\`)
`;
            });
            markdown += "\n";
          });
        }
      });
      return markdown;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
function validateTemplate(template) {
  const errors = [];
  const warnings = [];
  const requiredFields = ["id", "name", "width", "height", "platform", "category"];
  requiredFields.forEach((field) => {
    if (!template[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  if (template.id && typeof template.id !== "string") {
    errors.push("id must be a string");
  }
  const widthInfo = parseDimension(template.width);
  const heightInfo = parseDimension(template.height);
  if (!widthInfo.isVariable && (typeof widthInfo.value !== "number" || widthInfo.value <= 0 || isNaN(widthInfo.value))) {
    errors.push('width must be a positive number or "flex"');
  }
  if (!heightInfo.isVariable && (typeof heightInfo.value !== "number" || heightInfo.value <= 0 || isNaN(heightInfo.value))) {
    errors.push('height must be a positive number or "flex"');
  }
  if (template.platform && !PLATFORMS[template.platform]) {
    warnings.push(`Unknown platform: ${template.platform}`);
  }
  if (template.category && !TEMPLATE_CATEGORIES.find((c) => c.id === template.category)) {
    warnings.push(`Unknown category: ${template.category}`);
  }
  if (template.id && getTemplateById(template.id)) {
    warnings.push(`Duplicate template ID: ${template.id}`);
  }
  if (template.aspectRatio) {
    if (template.aspectRatio === "flexible" || template.aspectRatio === "variable") {
      if (!widthInfo.isVariable && !heightInfo.isVariable) {
        warnings.push('aspectRatio is "flexible" but both dimensions are fixed');
      }
    } else if (!template.aspectRatio.match(/^\d+:\d+$/)) {
      warnings.push(`Invalid aspect ratio format: ${template.aspectRatio}. Use "w:h" or "flexible"`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable
  };
}
function addCustomTemplate(template) {
  const validation = validateTemplate(template);
  if (!validation.valid) {
    throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
  }
  switch (template.category) {
    case "social":
      LemGendTemplates.SOCIAL_MEDIA.push(template);
      break;
    case "web":
      LemGendTemplates.WEB.push(template);
      break;
    case "logo":
      LemGendTemplates.LOGO.push(template);
      break;
    case "favicon":
      LemGendTemplates.FAVICON.push(template);
      break;
    default:
      throw new Error(`Invalid category for custom template: ${template.category}`);
  }
  LemGendTemplates.ALL.push(template);
  return {
    template,
    validation,
    message: "Custom template added successfully"
  };
}
function getAllPlatforms() {
  return Object.keys(PLATFORMS).map((key) => ({
    id: key,
    ...PLATFORMS[key]
  }));
}
function getTemplatesGroupedByPlatform() {
  const grouped = {};
  Object.keys(PLATFORMS).forEach((platform) => {
    grouped[platform] = getTemplatesByPlatform(platform);
  });
  return grouped;
}
function searchTemplates(query) {
  if (!query || query.trim() === "") {
    return LemGendTemplates.ALL;
  }
  const searchTerm = query.toLowerCase().trim();
  return LemGendTemplates.ALL.filter((template) => {
    return template.name && template.name.toLowerCase().includes(searchTerm) || template.displayName && template.displayName.toLowerCase().includes(searchTerm) || template.description && template.description.toLowerCase().includes(searchTerm) || template.platform && template.platform.toLowerCase().includes(searchTerm) || template.category && template.category.toLowerCase().includes(searchTerm) || template.id && template.id.toLowerCase().includes(searchTerm);
  });
}
function getTemplateAspectRatio(template) {
  const widthInfo = parseDimension(template.width);
  const heightInfo = parseDimension(template.height);
  if (widthInfo.isVariable || heightInfo.isVariable) {
    return "flexible";
  }
  if (!widthInfo.value || !heightInfo.value) return "unknown";
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(widthInfo.value, heightInfo.value);
  return `${widthInfo.value / divisor}:${heightInfo.value / divisor}`;
}
function getFlexibleTemplates() {
  return LemGendTemplates.ALL.filter((template) => {
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    return widthInfo.isVariable || heightInfo.isVariable;
  });
}
function getTemplatesForImage(width, height, options = {}) {
  const {
    category = "all",
    platform = null,
    allowFlexible = true,
    minCoverage = 0.8
    // How much of the template should the image cover
  } = options;
  let templates = category === "all" ? LemGendTemplates.ALL : getTemplatesByCategory(category);
  if (platform) {
    templates = templates.filter((t) => t.platform === platform);
  }
  if (!allowFlexible) {
    templates = templates.filter((t) => {
      const widthInfo = parseDimension(t.width);
      const heightInfo = parseDimension(t.height);
      return !widthInfo.isVariable && !heightInfo.isVariable;
    });
  }
  const scoredTemplates = templates.map((template) => {
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    let score = 0;
    let coverage = 1;
    let reason = "";
    if (widthInfo.isVariable || heightInfo.isVariable) {
      score = 0.8;
      if (widthInfo.isVariable && heightInfo.isVariable) {
        reason = "Both dimensions flexible - perfect fit";
        score = 0.95;
      } else if (widthInfo.isVariable) {
        coverage = height / heightInfo.value;
        if (coverage >= 1) {
          score = 0.9;
          reason = "Image height exceeds template height";
        } else if (coverage >= minCoverage) {
          score = 0.8;
          reason = "Image height adequate for template";
        } else {
          score = 0.5;
          reason = "Image height insufficient for template";
        }
      } else {
        coverage = width / widthInfo.value;
        if (coverage >= 1) {
          score = 0.9;
          reason = "Image width exceeds template width";
        } else if (coverage >= minCoverage) {
          score = 0.8;
          reason = "Image width adequate for template";
        } else {
          score = 0.5;
          reason = "Image width insufficient for template";
        }
      }
    } else {
      const widthCoverage = width / widthInfo.value;
      const heightCoverage = height / heightInfo.value;
      coverage = Math.min(widthCoverage, heightCoverage);
      if (coverage >= 1) {
        score = 1;
        reason = "Image exceeds template dimensions";
      } else if (coverage >= minCoverage) {
        score = 0.7 + coverage * 0.3;
        reason = "Image adequate for template";
      } else {
        score = coverage;
        reason = "Image too small for template";
      }
      const imageAspect = width / height;
      const templateAspect = widthInfo.value / heightInfo.value;
      const aspectDiff = Math.abs(imageAspect - templateAspect);
      if (aspectDiff > 0.1) {
        score *= 0.8;
        reason += " (aspect ratio mismatch)";
      }
    }
    return {
      ...template,
      matchScore: score,
      coverage,
      reason,
      hasFlexibleDimensions: widthInfo.isVariable || heightInfo.isVariable
    };
  });
  return scoredTemplates.sort((a, b) => b.matchScore - a.matchScore);
}
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) {
    return 1;
  }
  const commonChars = shorter.split("").filter((char) => longer.includes(char)).length;
  return commonChars / longer.length;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function formatDatePattern(date, format) {
  const replacements = {
    "YYYY": date.getFullYear(),
    "YY": String(date.getFullYear()).slice(-2),
    "MM": String(date.getMonth() + 1).padStart(2, "0"),
    "M": date.getMonth() + 1,
    "DD": String(date.getDate()).padStart(2, "0"),
    "D": date.getDate(),
    "HH": String(date.getHours()).padStart(2, "0"),
    "H": date.getHours(),
    "mm": String(date.getMinutes()).padStart(2, "0"),
    "m": date.getMinutes(),
    "ss": String(date.getSeconds()).padStart(2, "0"),
    "s": date.getSeconds()
  };
  let result = format;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(escapeRegExp(key), "g"), String(value));
  }
  return result;
}
function sanitizeFilename(filename) {
  if (!filename) return "unnamed-file";
  return filename.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").substring(0, 255).trim();
}
function getCommonRenamePatterns() {
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
function extractPatternVariables(pattern) {
  const matches = pattern.match(/{[^}]+}/g) || [];
  return matches.map((v) => v.slice(1, -1));
}
function applyPattern(pattern, variables) {
  let result = pattern;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    if (result.includes(placeholder)) {
      result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), String(value));
    }
  }
  result = result.replace(/{[^}]+}/g, "");
  result = result.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  result = result.replace(/[-_]{2,}/g, "-");
  result = result.replace(/[ _]{2,}/g, " ");
  result = result.trim();
  result = result.replace(/^[-_.]+|[-_.]+$/g, "");
  return result;
}
async function createLemGendaryZip(processedImages = [], options = {}) {
  const defaultOptions = {
    mode: "custom",
    includeOriginal: true,
    includeOptimized: true,
    includeWebImages: true,
    includeLogoImages: true,
    includeFaviconImages: true,
    includeSocialMedia: true,
    createFolders: true,
    includeInfoFile: true,
    zipName: "lemgendary-export",
    skipEmptyFolders: true
  };
  const mergedOptions = { ...defaultOptions, ...options };
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch (error) {
    try {
      JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
    } catch (cdnError) {
      throw new Error("JSZip library required. Include it via CDN or npm package.");
    }
  }
  const zip = new JSZip();
  const now = /* @__PURE__ */ new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0];
  const folderName = `${mergedOptions.zipName}-${timestamp}`;
  const mainFolder = mergedOptions.createFolders ? zip.folder(folderName) : zip;
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
  };
  const addFilesToFolder = async (folder, files, category = "") => {
    for (const fileData of files) {
      if (fileData.content) {
        const fileName = sanitizeFilename(fileData.name);
        folder.file(fileName, fileData.content);
        if (category) {
          stats[category] = (stats[category] || 0) + 1;
        }
        const ext = getFileExtension(fileData.content);
        stats.formats[ext] = (stats.formats[ext] || 0) + 1;
        if (fileData.content.size) {
          stats.totalSize += fileData.content.size;
        }
      }
    }
  };
  const filesByCategory = await categorizeFiles(processedImages, mergedOptions);
  const folderStructure = getFolderStructure(mergedOptions.mode);
  for (const [category, files] of Object.entries(filesByCategory)) {
    if (files.length === 0 && mergedOptions.skipEmptyFolders) {
      console.log(`Skipping empty folder: ${category}`);
      continue;
    }
    if (folderStructure[category]) {
      const folderName2 = folderStructure[category];
      const folder = mergedOptions.createFolders ? mainFolder.folder(folderName2) : mainFolder;
      await addFilesToFolder(folder, files, getStatsCategory(category));
    }
  }
  if (mergedOptions.includeInfoFile) {
    const infoContent = generateInfoFileContent(processedImages, stats, mergedOptions);
    mainFolder.file("INFO.txt", infoContent);
  }
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6
    },
    comment: `Created by LemGendary Image Processor - ${now.toISOString()}`,
    platform: "UNIX"
  });
  return zipBlob;
}
async function createSimpleZip(files = [], zipName = "files") {
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch (error) {
    try {
      JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
    } catch (cdnError) {
      throw new Error("JSZip library required. Include it via CDN or npm package.");
    }
  }
  const zip = new JSZip();
  for (const file of files) {
    if (file && file instanceof File) {
      const sanitizedName = sanitizeFilename(file.name);
      zip.file(sanitizedName, file);
    }
  }
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}
async function extractZip(zipBlob) {
  if (!(zipBlob instanceof Blob)) {
    throw new Error("Input must be a Blob object");
  }
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch (error) {
    try {
      JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
    } catch (cdnError) {
      throw new Error("JSZip library required. Include it via CDN or npm package.");
    }
  }
  const zip = await JSZip.loadAsync(zipBlob);
  const files = [];
  const filePromises = Object.keys(zip.files).map(async (filename) => {
    const zipEntry = zip.files[filename];
    if (!zipEntry.dir) {
      try {
        const content = await zipEntry.async("blob");
        const mimeType = getMimeTypeFromExtension(filename);
        const file = new File([content], filename, {
          type: mimeType,
          lastModified: zipEntry.date ? zipEntry.date.getTime() : Date.now()
        });
        files.push({
          name: filename,
          file,
          size: content.size,
          type: file.type,
          path: filename.includes("/") ? filename.split("/").slice(0, -1).join("/") : "",
          lastModified: zipEntry.date
        });
      } catch (error) {
        console.warn(`Failed to extract file ${filename}:`, error);
      }
    }
  });
  await Promise.all(filePromises);
  return files;
}
async function getZipInfo(zipBlob) {
  if (!(zipBlob instanceof Blob)) {
    throw new Error("Input must be a Blob object");
  }
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch (error) {
    try {
      JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
    } catch (cdnError) {
      throw new Error("JSZip library required. Include it via CDN or npm package.");
    }
  }
  const zip = await JSZip.loadAsync(zipBlob);
  const files = [];
  let totalSize = 0;
  let fileCount = 0;
  let folderCount = 0;
  Object.keys(zip.files).forEach((filename) => {
    const zipEntry = zip.files[filename];
    if (zipEntry.dir) {
      folderCount++;
    } else {
      fileCount++;
      const uncompressedSize = zipEntry._data.uncompressedSize || 0;
      totalSize += uncompressedSize;
      files.push({
        name: filename,
        size: uncompressedSize,
        compressedSize: zipEntry._data.compressedSize || 0,
        compressed: zipEntry._data.compression !== null,
        directory: false,
        lastModified: zipEntry.date,
        ratio: uncompressedSize > 0 ? ((uncompressedSize - zipEntry._data.compressedSize) / uncompressedSize * 100).toFixed(1) : 0
      });
    }
  });
  return {
    fileCount,
    folderCount,
    totalSize,
    compressedSize: zipBlob.size,
    compressionRatio: totalSize > 0 ? zipBlob.size / totalSize : 0,
    files,
    comment: zip.comment || "",
    format: "ZIP",
    isEncrypted: zip.password !== null,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function createZipWithProgress(processedImages, options = {}, onProgress = null) {
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch (error) {
    try {
      JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
    } catch (cdnError) {
      throw new Error("JSZip library required. Include it via CDN or npm package.");
    }
  }
  const zip = new JSZip();
  const folderName = options.zipName || `export-${Date.now()}`;
  const mainFolder = options.createFolders ? zip.folder(folderName) : zip;
  const totalFiles = calculateTotalFiles(processedImages, options);
  let filesAdded = 0;
  if (options.includeOriginal) {
    const originals = getOriginals(processedImages);
    for (const fileData of originals) {
      const sanitizedName = sanitizeFilename(fileData.name);
      mainFolder.file(sanitizedName, fileData.content);
      filesAdded++;
      if (onProgress) {
        onProgress(filesAdded / totalFiles, `Adding ${fileData.name}`);
      }
    }
  }
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  }, (metadata) => {
    if (onProgress) {
      const fileProgress = filesAdded / totalFiles;
      const zipProgress = metadata.percent / 100;
      const overallProgress = fileProgress * 0.5 + zipProgress * 0.5;
      onProgress(overallProgress, `Compressing (${metadata.percent.toFixed(1)}%)`);
    }
  });
}
async function createOptimizedZip(images, options = {}) {
  const {
    optimization = {},
    zipOptions = {},
    includeReport = true
  } = options;
  const { LemGendaryOptimize: LemGendaryOptimize2 } = await Promise.resolve().then(() => LemGendaryOptimize$1);
  const optimizer = new LemGendaryOptimize2(optimization);
  const { LemGendImage: LemGendImage2 } = await Promise.resolve().then(() => LemGendImage$1);
  const lemGendImages = await Promise.all(
    images.map(async (img) => {
      if (img instanceof LemGendImage2) {
        return img;
      } else {
        const lemGendImg = new LemGendImage2(img);
        await lemGendImg.load();
        return lemGendImg;
      }
    })
  );
  console.log(`Optimizing ${lemGendImages.length} images...`);
  const optimizationResults = await optimizer.prepareForZip(lemGendImages);
  const successful = optimizationResults.filter((r) => r.success);
  const failed = optimizationResults.filter((r) => !r.success);
  console.log(`Optimization complete: ${successful.length} successful, ${failed.length} failed`);
  if (successful.length === 0) {
    throw new Error("No images could be optimized");
  }
  const optimizedImages = successful.map((result) => {
    const optimizedImage = new LemGendImage2(result.optimized);
    optimizedImage.originalName = result.original.originalName;
    return optimizedImage;
  });
  if (includeReport) {
    const report = optimizer.generateOptimizationReport(optimizationResults);
    const reportFile = new File(
      [JSON.stringify(report, null, 2)],
      "optimization-report.json",
      { type: "application/json" }
    );
    const reportImage = new LemGendImage2(reportFile);
    reportImage.originalName = "optimization-report.json";
    optimizedImages.push(reportImage);
  }
  console.log("Creating ZIP from optimized images...");
  const zipBlob = await createLemGendaryZip(optimizedImages, {
    zipName: "optimized-images.zip",
    ...zipOptions
  });
  return zipBlob;
}
async function lemGendBuildZip(processedResults, options = {}) {
  console.warn("lemGendBuildZip is deprecated. Use createBatchZip or createTemplateZip instead.");
  const images = processedResults.filter((result) => result.success && result.image).map((result) => result.image);
  const hasTemplates = images.some((img) => {
    const outputs = getImageOutputs(img);
    return outputs.some((out) => out.template);
  });
  if (hasTemplates) {
    return createTemplateZip(processedResults, options);
  } else {
    return createBatchZip(processedResults, options);
  }
}
async function createCustomZip(processedResults, options = {}) {
  const images = processedResults.filter((result) => result.success && result.image).map((result) => result.image);
  const customOptions = {
    ...options,
    includeWebImages: false,
    includeLogoImages: false,
    includeFaviconImages: false,
    includeSocialMedia: false,
    zipName: options.zipName || "custom-processed"
  };
  return createLemGendaryZip(images, customOptions);
}
async function createTemplateZip(templateResults, options = {}) {
  const images = templateResults.filter((result) => result.success && result.image).map((result) => result.image);
  const templateOptions = {
    ...options,
    zipName: options.zipName || "template-export"
  };
  return createLemGendaryZip(images, templateOptions);
}
async function createBatchZip(processedResults, options = {}) {
  const images = processedResults.filter((result) => result.success && result.image).map((result) => result.image);
  const zipOptions = {
    mode: "custom",
    zipName: options.zipName || "custom-processed",
    ...options
  };
  return createLemGendaryZip(images, zipOptions);
}
async function categorizeFiles(images, options) {
  const categories = {
    originals: [],
    optimized: [],
    web: [],
    logo: [],
    favicon: [],
    social: []
  };
  for (const image of images) {
    if (options.includeOriginal && image.file && image.file instanceof File) {
      categories.originals.push({
        name: image.originalName || image.file.name,
        content: image.file
      });
    }
    const outputs = getImageOutputs(image);
    for (const output of outputs) {
      if (!output.file || !(output.file instanceof File)) continue;
      const category = determineCategory(output, options.mode);
      if (categories[category] && shouldIncludeCategory(category, options)) {
        categories[category].push({
          name: output.file.name || `output-${Date.now()}.${getFileExtension(output.file)}`,
          content: output.file,
          metadata: output.metadata || {}
        });
      }
    }
  }
  return categories;
}
function getImageOutputs(image) {
  if (typeof image.getAllOutputs === "function") {
    return image.getAllOutputs();
  } else if (image.outputs && typeof image.outputs.get === "function") {
    return Array.from(image.outputs.values());
  } else if (Array.isArray(image.outputs)) {
    return image.outputs;
  }
  return [];
}
function determineCategory(output, mode) {
  if (mode === "custom") {
    return "optimized";
  }
  const templateCategory = output.template?.category?.toLowerCase() || output.category?.toLowerCase() || "";
  switch (templateCategory) {
    case "web":
    case "favicon":
      return templateCategory;
    case "logo":
      return "logo";
    case "social":
    case "social media":
      return "social";
    default:
      return "optimized";
  }
}
function shouldIncludeCategory(category, options) {
  const categoryMap = {
    originals: options.includeOriginal,
    optimized: options.includeOptimized,
    web: options.includeWebImages,
    logo: options.includeLogoImages,
    favicon: options.includeFaviconImages,
    social: options.includeSocialMedia
  };
  return categoryMap[category] !== false;
}
function getFolderStructure(mode) {
  if (mode === "custom") {
    return {
      originals: "01_OriginalImages",
      optimized: "02_OptimizedImages"
    };
  } else {
    return {
      originals: "01_OriginalImages",
      web: "02_WebImages",
      logo: "03_LogoImages",
      favicon: "04_FaviconImages",
      social: "05_SocialImages",
      optimized: "06_OptimizedImages"
    };
  }
}
function getStatsCategory(folderCategory) {
  const map = {
    "originals": "originals",
    "optimized": "optimized",
    "web": "web",
    "logo": "logo",
    "favicon": "favicon",
    "social": "social"
  };
  return map[folderCategory] || "optimized";
}
function generateInfoFileContent(images, stats, options) {
  const now = /* @__PURE__ */ new Date();
  let infoText = `LEMGENDARY IMAGE EXPORT
===========================

Export Information
------------------
Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
Mode: ${options.mode === "custom" ? "Custom Processing" : "Template Processing"}
Tool: LemGendary Image Processor
Version: 2.2.0
Export ID: ${Date.now().toString(36).toUpperCase()}

Options Used
------------
${Object.entries(options).filter(([key]) => !["zipName"].includes(key)).map(([key, value]) => `${key.padEnd(25)}: ${value}`).join("\n")}

Statistics
----------
Total Images Processed: ${stats.totalImages}
Total Files in Export: ${Object.values(stats).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0) - stats.totalImages}

File Breakdown:`;
  const categories = ["originals", "optimized", "web", "logo", "favicon", "social"];
  categories.forEach((category) => {
    if (stats[category] > 0) {
      const folderName = getFolderStructure(options.mode)[category] || category;
      infoText += `
  ${folderName.padEnd(25)}: ${stats[category]} files`;
    }
  });
  infoText += `

Format Distribution:
${Object.entries(stats.formats).map(([format, count]) => `  ${format.toUpperCase().padEnd(6)}: ${count} files`).join("\n")}

Total Size: ${formatFileSize(stats.totalSize)}

Image Details
-------------
${images.map((img, index2) => {
    const outputs = getImageOutputs(img);
    return `[${index2 + 1}] ${img.originalName || "Unnamed"}
  Original: ${formatFileSize(img.originalSize || 0)} | ${img.width || "?"}×${img.height || "?"}
  Outputs: ${outputs.length} file(s)
  ${outputs.map((out) => `  - ${out.file?.name || "Unnamed"} (${out.template?.category || "custom"})`).join("\n  ")}`;
  }).join("\n\n")}

Folder Structure
----------------
${options.createFolders ? Object.entries(getFolderStructure(options.mode)).map(([category, folderName]) => {
    const count = stats[category] || 0;
    return `${folderName}/ - ${count > 0 ? `${count} files` : "Empty (skipped)"}`;
  }).join("\n") : "All files in root folder"}

Notes
-----
• All processing done client-side in browser
• No images uploaded to external servers
• Empty folders are automatically skipped
• Created with LemGendary Image Processor
• https://github.com/lemgenda/image-lemgendizer`;
  return infoText;
}
function calculateTotalFiles(images, options) {
  let count = 0;
  if (options.includeOriginal) {
    count += images.filter((img) => img.file).length;
  }
  for (const image of images) {
    let outputs = [];
    if (typeof image.getAllOutputs === "function") {
      outputs = image.getAllOutputs();
    } else if (Array.isArray(image.outputs)) {
      outputs = image.outputs;
    }
    for (const output of outputs) {
      const category = output.template?.category || output.category || "optimized";
      const optionName = `include${category.charAt(0).toUpperCase() + category.slice(1)}`;
      if (options[optionName] !== false) {
        count++;
      }
    }
  }
  return Math.max(count, 1);
}
function getOriginals(images) {
  const files = [];
  for (const image of images) {
    if (image.file && image.file instanceof File) {
      const sanitizedName = sanitizeFilename(image.originalName || image.file.name);
      files.push({
        name: sanitizedName,
        content: image.file
      });
    }
  }
  return files;
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
    img.onerror = () => {
      reject(new Error("Failed to load image for optimization"));
    };
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
  const { LemGendImage: LemGendImage2 } = await Promise.resolve().then(() => LemGendImage$1);
  const { LemGendaryResize: LemGendaryResize2 } = await Promise.resolve().then(() => LemGendaryResize$1);
  const { LemGendaryCrop: LemGendaryCrop2 } = await Promise.resolve().then(() => LemGendaryCrop$1);
  const { LemGendaryOptimize: LemGendaryOptimize2 } = await Promise.resolve().then(() => LemGendaryOptimize$1);
  const { LemGendaryRename: LemGendaryRename2 } = await Promise.resolve().then(() => LemGendaryRename$1);
  let lemGendImage;
  try {
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
      lemGendImage = new LemGendImage2(file.file);
      try {
        await lemGendImage.load();
      } catch (loadError) {
        console.warn("Failed to load image, using defaults:", loadError);
        lemGendImage.width = lemGendImage.width || 1e3;
        lemGendImage.height = lemGendImage.height || 1e3;
      }
    } else if (file instanceof File || file instanceof Blob) {
      console.log("Creating new LemGendImage from File/Blob...");
      lemGendImage = new LemGendImage2(file);
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
            const resizeProcessor = new LemGendaryResize2(step.options);
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
            const cropProcessor = new LemGendaryCrop2(step.options);
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
            const optimizeProcessor = new LemGendaryOptimize2(step.options);
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
            const renameProcessor = new LemGendaryRename2(step.options);
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
const processingUtils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  actuallyCropImage,
  actuallyResizeImage,
  applyOptimization,
  processSingleFile
}, Symbol.toStringTag, { value: "Module" }));
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
    if (files.length > 0) {
      taskValidation = await validateTask(task, files[0]);
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
          isLemGendImage: file instanceof LemGendImage,
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
async function optimizeForZip(images, optimizationOptions = {}) {
  const optimizer = new LemGendaryOptimize(optimizationOptions);
  const results = [];
  for (const image of images) {
    try {
      let lemGendImage;
      if (image instanceof LemGendImage) {
        lemGendImage = image;
      } else {
        lemGendImage = new LemGendImage(image);
        await lemGendImage.load();
      }
      const optimizationResult = await optimizer.process(lemGendImage);
      const optimizedFile = await optimizer.applyOptimization(lemGendImage);
      const optimizedLemGendImage = new LemGendImage(optimizedFile);
      await optimizedLemGendImage.load();
      results.push({
        original: lemGendImage,
        optimized: optimizedLemGendImage,
        result: optimizationResult,
        success: true
      });
    } catch (error) {
      console.error("Optimization failed:", error);
      results.push({
        original: image,
        error: error.message,
        success: false
      });
    }
  }
  return results;
}
async function processFaviconSet(file, options = {}) {
  const {
    sizes = [16, 32, 48, 64, 128, 256],
    formats = ["png", "ico"],
    includeManifest = true,
    includeHTML = true
  } = options;
  const results = [];
  const lemGendImage = new LemGendImage(file);
  await lemGendImage.load();
  for (const size of sizes) {
    for (const format of formats) {
      const processed = await generateFaviconVariant(lemGendImage, size, format);
      results.push(processed);
    }
  }
  if (includeManifest) {
    results.push(generateManifest(lemGendImage, sizes));
  }
  if (includeHTML) {
    results.push(generateFaviconHTML(lemGendImage, sizes, formats));
  }
  return results;
}
async function generateFaviconVariant(image, size, format) {
  return {
    size,
    format,
    width: size,
    height: size,
    name: `favicon-${size}x${size}.${format}`
  };
}
function generateManifest(image, sizes) {
  return {
    type: "json",
    name: "manifest.json",
    content: JSON.stringify({
      name: "App Icon",
      icons: sizes.map((size) => ({
        src: `/favicon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png"
      }))
    }, null, 2)
  };
}
function generateFaviconHTML(image, sizes, formats) {
  const htmlLines = [
    "<!-- Favicon tags for HTML -->",
    '<link rel="icon" href="/favicon.ico" sizes="any">'
  ];
  for (const size of sizes) {
    for (const format of formats) {
      if (format === "png") {
        htmlLines.push(`<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">`);
      }
    }
  }
  htmlLines.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  htmlLines.push('<link rel="manifest" href="/manifest.json">');
  return {
    type: "html",
    name: "favicon-tags.html",
    content: htmlLines.join("\n")
  };
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
    const task = new LemGendTask(`Template: ${template.displayName}`, template.description);
    const widthInfo = parseDimension(template.width);
    const heightInfo = parseDimension(template.height);
    if (!widthInfo.isVariable && !heightInfo.isVariable) {
      const aspect = widthInfo.value / heightInfo.value;
      const imageAspect = image.width / image.height;
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
      preserveTransparency: template.recommendedFormats.includes("png") || template.recommendedFormats.includes("svg")
    });
    const results = await lemGendaryProcessBatch([image], task);
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
  const widthInfo = parseDimension(template.width);
  const heightInfo = parseDimension(template.height);
  const task = new LemGendTask(`Flexible: ${template.displayName}`, template.description);
  if (widthInfo.isVariable && !heightInfo.isVariable) {
    const scale = heightInfo.value / image.height;
    Math.round(image.width * scale);
    task.addResize(heightInfo.value, "height");
  } else if (!widthInfo.isVariable && heightInfo.isVariable) {
    const scale = widthInfo.value / image.width;
    Math.round(image.height * scale);
    task.addResize(widthInfo.value, "width");
  } else if (widthInfo.isVariable && heightInfo.isVariable) {
    task.addOptimize(85, "auto");
  }
  const results = await lemGendaryProcessBatch([image], task);
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
    templates: {
      total: LemGendTemplates?.ALL?.length || 0,
      categories: TEMPLATE_CATEGORIES?.length || 0,
      platforms: PLATFORMS ? Object.keys(PLATFORMS).length : 0
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
  // Core classes
  LemGendImage,
  LemGendTask,
  // Processors
  LemGendaryResize,
  LemGendaryCrop,
  LemGendaryOptimize,
  LemGendaryRename,
  // Main functions
  lemGendaryProcessBatch,
  lemGendBuildZip,
  getLibraryInfo,
  processFaviconSet,
  optimizeForZip,
  createOptimizedZip,
  processWithTemplate,
  processFlexibleTemplate,
  // Templates
  LemGendTemplates,
  TEMPLATE_CATEGORIES,
  PLATFORMS,
  getTemplatesByPlatform,
  getTemplatesByCategory,
  getTemplateById,
  getTemplatesByDimensions,
  getRecommendedTemplates,
  getTemplateStats,
  exportTemplates,
  validateTemplate,
  addCustomTemplate,
  getAllPlatforms,
  getTemplatesGroupedByPlatform,
  searchTemplates,
  getTemplateAspectRatio,
  getFlexibleTemplates,
  getTemplatesForImage,
  isVariableDimension,
  parseDimension,
  // ZIP utilities
  createLemGendaryZip,
  createSimpleZip,
  extractZip,
  getZipInfo,
  createZipWithProgress,
  createCustomZip,
  createTemplateZip,
  createBatchZip,
  // Image utilities
  getImageDimensions,
  getMimeTypeFromExtension,
  hasTransparency,
  fileToDataURL,
  dataURLtoFile,
  resizeImage,
  cropImage,
  calculateAspectRatioFit,
  formatFileSize,
  getFileExtension,
  validateImageFile,
  createThumbnail,
  batchProcess,
  // Validation utilities
  ValidationErrors,
  ValidationWarnings,
  validateImage,
  validateDimensions,
  validateResize,
  validateCrop,
  validateOptimization,
  validateRenamePattern,
  getValidationSummary,
  validateOptimizationOptions,
  validateTemplateCompatibility
};
exports.LemGendImage = LemGendImage;
exports.LemGendTask = LemGendTask;
exports.LemGendTemplates = LemGendTemplates;
exports.LemGendaryCrop = LemGendaryCrop;
exports.LemGendaryOptimize = LemGendaryOptimize;
exports.LemGendaryRename = LemGendaryRename;
exports.LemGendaryResize = LemGendaryResize;
exports.PLATFORMS = PLATFORMS;
exports.TEMPLATE_CATEGORIES = TEMPLATE_CATEGORIES;
exports.ValidationErrors = ValidationErrors;
exports.ValidationWarnings = ValidationWarnings;
exports.actuallyCropImage = actuallyCropImage;
exports.actuallyResizeImage = actuallyResizeImage;
exports.addCustomTemplate = addCustomTemplate;
exports.analyzeForOptimization = analyzeForOptimization;
exports.applyOptimization = applyOptimization;
exports.applyPattern = applyPattern;
exports.batchProcess = batchProcess;
exports.calculateAspectRatioFit = calculateAspectRatioFit;
exports.calculateOptimizationSavings = calculateOptimizationSavings;
exports.calculateStringSimilarity = calculateStringSimilarity;
exports.checkAICapabilities = checkAICapabilities;
exports.createBatchZip = createBatchZip;
exports.createCustomZip = createCustomZip;
exports.createLemGendaryZip = createLemGendaryZip;
exports.createOptimizationPreview = createOptimizationPreview;
exports.createOptimizedZip = createOptimizedZip;
exports.createSimpleZip = createSimpleZip;
exports.createTemplateZip = createTemplateZip;
exports.createThumbnail = createThumbnail;
exports.createZipWithProgress = createZipWithProgress;
exports.cropImage = cropImage;
exports.dataURLtoFile = dataURLtoFile;
exports.default = index;
exports.escapeRegExp = escapeRegExp;
exports.exportTemplates = exportTemplates;
exports.extractPatternVariables = extractPatternVariables;
exports.extractZip = extractZip;
exports.fileToDataURL = fileToDataURL;
exports.formatDatePattern = formatDatePattern;
exports.formatFileSize = formatFileSize;
exports.generateOptimizationComparison = generateOptimizationComparison;
exports.getAllPlatforms = getAllPlatforms;
exports.getCommonRenamePatterns = getCommonRenamePatterns;
exports.getFileExtension = getFileExtension;
exports.getFlexibleTemplates = getFlexibleTemplates;
exports.getFormatPriorities = getFormatPriorities;
exports.getImageDimensions = getImageDimensions;
exports.getLibraryInfo = getLibraryInfo;
exports.getMimeTypeFromExtension = getMimeTypeFromExtension;
exports.getOptimizationPreset = getOptimizationPreset;
exports.getOptimizationStats = getOptimizationStats;
exports.getRecommendedFormat = getRecommendedFormat;
exports.getRecommendedTemplates = getRecommendedTemplates;
exports.getTemplateAspectRatio = getTemplateAspectRatio;
exports.getTemplateById = getTemplateById;
exports.getTemplateStats = getTemplateStats;
exports.getTemplatesByCategory = getTemplatesByCategory;
exports.getTemplatesByDimensions = getTemplatesByDimensions;
exports.getTemplatesByPlatform = getTemplatesByPlatform;
exports.getTemplatesForImage = getTemplatesForImage;
exports.getTemplatesGroupedByPlatform = getTemplatesGroupedByPlatform;
exports.getValidationSummary = getValidationSummary;
exports.getZipInfo = getZipInfo;
exports.hasTransparency = hasTransparency;
exports.isLemGendImage = isLemGendImage;
exports.isVariableDimension = isVariableDimension;
exports.lemGendBuildZip = lemGendBuildZip;
exports.lemGendaryProcessBatch = lemGendaryProcessBatch;
exports.needsFormatConversion = needsFormatConversion;
exports.optimizeForZip = optimizeForZip;
exports.parseDimension = parseDimension;
exports.processFaviconSet = processFaviconSet;
exports.processFlexibleTemplate = processFlexibleTemplate;
exports.processSingleFile = processSingleFile;
exports.processWithTemplate = processWithTemplate;
exports.resizeImage = resizeImage;
exports.sanitizeFilename = sanitizeFilename;
exports.searchTemplates = searchTemplates;
exports.validateCrop = validateCrop;
exports.validateDimensions = validateDimensions;
exports.validateImage = validateImage;
exports.validateImageFile = validateImageFile;
exports.validateOptimization = validateOptimization;
exports.validateOptimizationOptions = validateOptimizationOptions;
exports.validateRenamePattern = validateRenamePattern;
exports.validateResize = validateResize;
exports.validateSessionImage = validateSessionImage;
exports.validateTask = validateTask;
exports.validateTemplate = validateTemplate;
exports.validateTemplateCompatibility = validateTemplateCompatibility;
//# sourceMappingURL=index.cjs.js.map
