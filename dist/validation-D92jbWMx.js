const m = {
  INVALID_FILE: "INVALID_FILE",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  DIMENSIONS_TOO_SMALL: "DIMENSIONS_TOO_SMALL",
  DIMENSIONS_TOO_LARGE: "DIMENSIONS_TOO_LARGE",
  INVALID_DIMENSIONS: "INVALID_DIMENSIONS",
  ASPECT_RATIO_MISMATCH: "ASPECT_RATIO_MISMATCH",
  QUALITY_OUT_OF_RANGE: "QUALITY_OUT_OF_RANGE",
  INVALID_FORMAT: "INVALID_FORMAT",
  TRANSPARENCY_LOSS: "TRANSPARENCY_LOSS",
  EXCESSIVE_COMPRESSION: "EXCESSIVE_COMPRESSION",
  AVIF_BROWSER_SUPPORT: "AVIF_BROWSER_SUPPORT",
  VARIABLE_DIMENSION_NOT_ALLOWED: "VARIABLE_DIMENSION_NOT_ALLOWED"
}, c = {
  LARGE_FILE: "LARGE_FILE",
  SMALL_DIMENSIONS: "SMALL_DIMENSIONS",
  LARGE_DIMENSIONS: "LARGE_DIMENSIONS",
  HIGH_QUALITY: "HIGH_QUALITY",
  LOW_QUALITY: "LOW_QUALITY",
  POTENTIAL_PIXELATION: "POTENTIAL_PIXELATION",
  CONTENT_LOSS: "CONTENT_LOSS",
  ASPECT_CHANGE: "ASPECT_CHANGE",
  MULTIPLE_OPTIMIZATIONS: "MULTIPLE_OPTIMIZATIONS",
  TRANSPARENCY_LOSS: "TRANSPARENCY_LOSS",
  AVIF_BROWSER_SUPPORT: "AVIF_BROWSER_SUPPORT",
  VARIABLE_DIMENSION_USED: "VARIABLE_DIMENSION_USED",
  FLEXIBLE_TEMPLATE: "FLEXIBLE_TEMPLATE"
};
function b(s) {
  if (typeof s == "string") {
    const n = s.toLowerCase();
    return n === "auto" || n === "flex" || n === "variable" || n === "natural";
  }
  return !1;
}
function f(s) {
  if (b(s))
    return {
      value: null,
      isVariable: !0,
      type: s.toLowerCase(),
      raw: s
    };
  const n = Number(s);
  return {
    value: isNaN(n) ? null : n,
    isVariable: !1,
    type: "fixed",
    raw: s
  };
}
function w(s, n = 2) {
  if (s === 0) return "0 Bytes";
  const i = 1024, r = n < 0 ? 0 : n, a = ["Bytes", "KB", "MB", "GB", "TB"], o = Math.floor(Math.log(s) / Math.log(i));
  return parseFloat((s / Math.pow(i, o)).toFixed(r)) + " " + a[o];
}
function T(s = {}) {
  const n = [], i = [], r = { valid: !0, errors: n, warnings: i }, a = s.quality !== void 0 ? s.quality : 85, o = s.format || "auto", l = s.compressionMode || "adaptive", t = s.maxDisplayWidth, e = s.browserSupport || ["modern", "legacy"], d = s.preserveTransparency !== !1;
  typeof a != "number" || a < 1 || a > 100 ? (n.push({
    code: m.QUALITY_OUT_OF_RANGE,
    message: `Quality must be between 1-100, got ${a}`,
    severity: "error",
    suggestion: "Use quality between 60-95 for best results"
  }), r.valid = !1) : a > 95 ? i.push({
    code: c.HIGH_QUALITY,
    message: `High quality (${a}%) provides minimal visual improvement over 90%`,
    severity: "info",
    suggestion: "Consider 80-90% for optimal balance"
  }) : a < 50 && i.push({
    code: c.LOW_QUALITY,
    message: `Low quality (${a}%) may cause noticeable artifacts`,
    severity: "warning",
    suggestion: "Consider at least 60% for acceptable quality"
  });
  const p = ["auto", "webp", "jpg", "jpeg", "png", "avif", "ico", "svg", "original"];
  if (p.includes(o.toLowerCase()) || (n.push({
    code: m.INVALID_FORMAT,
    message: `Invalid format: ${o}`,
    severity: "error",
    suggestion: `Use one of: ${p.join(", ")}`
  }), r.valid = !1), o.toLowerCase() === "avif") {
    const g = Math.min(63, Math.round(a * 0.63));
    g < a && i.push({
      code: "AVIF_QUALITY_ADJUSTED",
      message: `AVIF quality adjusted from ${a} to ${g} (different quality scale)`,
      severity: "info"
    });
  }
  t != null && (typeof t != "number" || t < 10 || t > 1e4) && i.push({
    code: "EXTREME_MAX_DISPLAY_WIDTH",
    message: `maxDisplayWidth (${t}) outside recommended range`,
    severity: "warning",
    suggestion: "Use between 100-4000px for web images"
  });
  const u = ["adaptive", "aggressive", "balanced"];
  return u.includes(l) || i.push({
    code: "INVALID_COMPRESSION_MODE",
    message: `Invalid compression mode: ${l}`,
    severity: "warning",
    suggestion: `Use one of: ${u.join(", ")}`
  }), e && !Array.isArray(e) && i.push({
    code: "INVALID_BROWSER_SUPPORT",
    message: "browserSupport should be an array",
    severity: "warning",
    suggestion: 'Use ["modern", "legacy"] or ["all"]'
  }), s.icoSizes && Array.isArray(s.icoSizes) && s.icoSizes.forEach((g) => {
    (g < 16 || g > 512) && i.push({
      code: "INVALID_ICO_SIZE",
      message: `ICO size ${g}px outside recommended range`,
      severity: "warning",
      suggestion: "Use sizes between 16-512px"
    });
  }), (o.toLowerCase() === "jpg" || o.toLowerCase() === "jpeg") && d && i.push({
    code: c.TRANSPARENCY_LOSS,
    message: "JPEG format does not support transparency",
    severity: "warning",
    suggestion: "Use PNG or WebP to preserve transparency"
  }), o.toLowerCase() === "avif" && (!e || !e.includes("modern")) && i.push({
    code: c.AVIF_BROWSER_SUPPORT,
    message: "AVIF format has limited browser support (Chrome 85+, Firefox 93+, Edge 85+)",
    severity: "info",
    suggestion: 'Consider providing WebP fallback or use ["modern", "legacy"] browser support'
  }), l === "aggressive" && a < 60 && i.push({
    code: c.EXCESSIVE_COMPRESSION,
    message: "Aggressive compression with low quality may degrade image significantly",
    severity: "warning",
    suggestion: "Increase quality or use balanced/adaptive mode"
  }), r;
}
function M(s, n = {}) {
  const {
    maxFileSize: i = 50 * 1024 * 1024,
    // 50MB
    minFileSize: r = 1,
    // 1 byte
    allowedTypes: a = [
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
      // Added favicon support
    ],
    checkDimensions: o = !1,
    minDimensions: l = { width: 1, height: 1 },
    maxDimensions: t = { width: 1e4, height: 1e4 }
  } = n, e = {
    valid: !0,
    errors: [],
    warnings: [],
    metadata: {}
  };
  return s instanceof File ? (s.size < r ? (e.valid = !1, e.errors.push({
    code: m.INVALID_FILE,
    message: "File is empty",
    severity: "error"
  })) : s.size > i ? (e.valid = !1, e.errors.push({
    code: m.FILE_TOO_LARGE,
    message: `File too large (${w(s.size)} > ${w(i)})`,
    severity: "error"
  })) : s.size > 10 * 1024 * 1024 && e.warnings.push({
    code: c.LARGE_FILE,
    message: `Large file (${w(s.size)}) may process slowly`,
    severity: "warning"
  }), a.includes(s.type) || (e.valid = !1, e.errors.push({
    code: m.UNSUPPORTED_TYPE,
    message: `Unsupported file type: ${s.type}`,
    severity: "error"
  })), e.metadata = {
    name: s.name,
    type: s.type,
    size: s.size,
    lastModified: s.lastModified
  }, e) : (e.valid = !1, e.errors.push({
    code: m.INVALID_FILE,
    message: "Not a valid File object",
    severity: "error"
  }), e);
}
function E(s, n = {}) {
  const {
    minWidth: i = 1,
    minHeight: r = 1,
    maxWidth: a = 1e4,
    maxHeight: o = 1e4,
    requireIntegers: l = !0,
    allowVariable: t = !0
    // New option
  } = n, e = {
    valid: !0,
    errors: [],
    warnings: [],
    dimensions: { ...s },
    hasVariableDimensions: !1
  }, { width: d, height: p } = s, u = f(d), g = f(p);
  return e.hasVariableDimensions = u.isVariable || g.isVariable, (u.isVariable || g.isVariable) && !t ? (e.valid = !1, e.errors.push({
    code: m.VARIABLE_DIMENSION_NOT_ALLOWED,
    message: "Variable dimensions are not allowed in this context",
    severity: "error",
    suggestion: "Provide fixed dimensions or enable allowVariable option"
  }), e) : (u.isVariable || (typeof u.value != "number" || isNaN(u.value) ? (e.valid = !1, e.errors.push({
    code: m.INVALID_DIMENSIONS,
    message: "Width must be a valid number",
    severity: "error"
  })) : l && !Number.isInteger(u.value) ? e.warnings.push({
    code: c.SMALL_DIMENSIONS,
    message: "Width should be an integer for best results",
    severity: "warning"
  }) : u.value < i ? (e.valid = !1, e.errors.push({
    code: m.DIMENSIONS_TOO_SMALL,
    message: `Width too small (${u.value} < ${i})`,
    severity: "error"
  })) : u.value > a ? (e.valid = !1, e.errors.push({
    code: m.DIMENSIONS_TOO_LARGE,
    message: `Width too large (${u.value} > ${a})`,
    severity: "error"
  })) : u.value < 50 && e.warnings.push({
    code: c.SMALL_DIMENSIONS,
    message: `Small width (${u.value}px) may produce pixelated results`,
    severity: "warning"
  })), g.isVariable || (typeof g.value != "number" || isNaN(g.value) ? (e.valid = !1, e.errors.push({
    code: m.INVALID_DIMENSIONS,
    message: "Height must be a valid number",
    severity: "error"
  })) : l && !Number.isInteger(g.value) ? e.warnings.push({
    code: c.SMALL_DIMENSIONS,
    message: "Height should be an integer for best results",
    severity: "warning"
  }) : g.value < r ? (e.valid = !1, e.errors.push({
    code: m.DIMENSIONS_TOO_SMALL,
    message: `Height too small (${g.value} < ${r})`,
    severity: "error"
  })) : g.value > o ? (e.valid = !1, e.errors.push({
    code: m.DIMENSIONS_TOO_LARGE,
    message: `Height too large (${g.value} > ${o})`,
    severity: "error"
  })) : g.value < 50 && e.warnings.push({
    code: c.SMALL_DIMENSIONS,
    message: `Small height (${g.value}px) may produce pixelated results`,
    severity: "warning"
  })), !u.isVariable && !g.isVariable && u.value > 0 && g.value > 0 ? (e.dimensions.aspectRatio = u.value / g.value, e.dimensions.orientation = u.value >= g.value ? "landscape" : "portrait", (u.value > 4e3 || g.value > 4e3) && e.warnings.push({
    code: c.LARGE_DIMENSIONS,
    message: `Large dimensions (${u.value}x${g.value}) may cause performance issues`,
    severity: "warning"
  })) : (u.isVariable || g.isVariable) && (e.dimensions.hasVariable = !0, e.dimensions.variableType = u.isVariable ? "width" : "height", e.warnings.push({
    code: c.VARIABLE_DIMENSION_USED,
    message: `Using ${u.isVariable ? "variable width" : "variable height"} dimension`,
    severity: "info",
    suggestion: "One dimension will be calculated automatically"
  })), e);
}
function D(s, n, i = "auto") {
  const r = {
    valid: !0,
    errors: [],
    warnings: [],
    newDimensions: null
  }, a = E(s);
  if (!a.valid)
    return a;
  const { width: o, height: l } = s, t = f(n);
  if (t.isVariable)
    return i === "width" && t.type === "flex" ? (r.newDimensions = { width: "flex", height: l }, r.warnings.push({
      code: c.FLEXIBLE_TEMPLATE,
      message: "Using flexible width - will maintain natural aspect ratio",
      severity: "info"
    }), r) : i === "height" && t.type === "flex" ? (r.newDimensions = { width: o, height: "flex" }, r.warnings.push({
      code: c.FLEXIBLE_TEMPLATE,
      message: "Using flexible height - will maintain natural aspect ratio",
      severity: "info"
    }), r) : (r.valid = !1, r.errors.push({
      code: m.INVALID_DIMENSIONS,
      message: `Invalid target dimension for mode ${i}: ${n}`,
      severity: "error"
    }), r);
  if (typeof t.value != "number" || t.value <= 0)
    return r.valid = !1, r.errors.push({
      code: m.INVALID_DIMENSIONS,
      message: `Invalid target dimension: ${n}`,
      severity: "error"
    }), r;
  let e, d;
  i === "width" ? (e = t.value, d = Math.round(l / o * t.value)) : i === "height" ? (d = t.value, e = Math.round(o / l * t.value)) : o >= l ? (e = t.value, d = Math.round(l / o * t.value)) : (d = t.value, e = Math.round(o / l * t.value)), r.newDimensions = { width: e, height: d };
  const p = E(r.newDimensions);
  if (!p.valid)
    return p;
  const u = e / o;
  u < 0.1 && r.warnings.push({
    code: c.POTENTIAL_PIXELATION,
    message: `Downscaling by ${((1 - u) * 100).toFixed(1)}% may cause pixelation`,
    severity: "warning",
    suggestion: "Consider using nearest-neighbor algorithm for pixel art"
  }), u > 4 && r.warnings.push({
    code: c.POTENTIAL_PIXELATION,
    message: `Upscaling by ${((u - 1) * 100).toFixed(1)}% may reduce quality`,
    severity: "warning",
    suggestion: "Consider using AI upscaling tools for better results"
  });
  const g = o / l, h = e / d;
  return Math.abs(g - h) / g > 0.01 && r.warnings.push({
    code: c.ASPECT_CHANGE,
    message: `Aspect ratio changed from ${g.toFixed(3)} to ${h.toFixed(3)}`,
    severity: "info",
    suggestion: "Check if this deviation is acceptable"
  }), r;
}
function V(s, n, i, r = "center") {
  const a = {
    valid: !0,
    errors: [],
    warnings: [],
    cropInfo: null
  }, o = E(s);
  if (!o.valid)
    return o;
  const { width: l, height: t } = s, e = f(n), d = f(i);
  if (e.isVariable || d.isVariable) {
    a.warnings.push({
      code: c.FLEXIBLE_TEMPLATE,
      message: "Using flexible dimensions for crop - will use maximum available space",
      severity: "info"
    });
    const O = e.isVariable ? l : e.value, y = d.isVariable ? t : d.value;
    return a.cropInfo = {
      cropDimensions: { width: O, height: y },
      offsets: { x: 0, y: 0 },
      position: "center",
      scale: 1,
      hasFlexibleDimensions: !0,
      flexibleWidth: e.isVariable,
      flexibleHeight: d.isVariable
    }, a;
  }
  const p = E({ width: e.value, height: d.value });
  if (!p.valid)
    return p;
  const u = Math.max(e.value / l, d.value / t), g = Math.round(l * u), h = Math.round(t * u);
  let v, I;
  switch (r) {
    case "top":
      v = (g - e.value) / 2, I = 0;
      break;
    case "bottom":
      v = (g - e.value) / 2, I = h - d.value;
      break;
    case "left":
      v = 0, I = (h - d.value) / 2;
      break;
    case "right":
      v = g - e.value, I = (h - d.value) / 2;
      break;
    case "center":
    default:
      v = (g - e.value) / 2, I = (h - d.value) / 2;
  }
  a.cropInfo = {
    scaledDimensions: { width: g, height: h },
    cropDimensions: { width: e.value, height: d.value },
    offsets: { x: Math.max(0, Math.round(v)), y: Math.max(0, Math.round(I)) },
    position: r,
    scale: u
  };
  const _ = Math.max(0, (e.value - l) / l), N = Math.max(0, (d.value - t) / t), L = Math.max(_, N);
  L > 0.3 && a.warnings.push({
    code: c.CONTENT_LOSS,
    message: `Crop will remove ${(L * 100).toFixed(1)}% of image content`,
    severity: "warning",
    suggestion: "Consider adjusting crop dimensions or position"
  });
  const S = l / t, A = e.value / d.value;
  return Math.abs(S - A) / S > 0.5 && a.warnings.push({
    code: c.ASPECT_CHANGE,
    message: `Source aspect ratio (${S.toFixed(2)}) differs significantly from target (${A.toFixed(2)})`,
    severity: "warning",
    suggestion: "This may result in stretched appearance"
  }), a;
}
function R(s, n, i, r = !1) {
  const a = {
    valid: !0,
    errors: [],
    warnings: [],
    recommendations: []
  };
  typeof i != "number" || i < 1 || i > 100 ? (a.valid = !1, a.errors.push({
    code: m.QUALITY_OUT_OF_RANGE,
    message: `Quality must be between 1-100, got ${i}`,
    severity: "error"
  })) : i > 95 ? a.warnings.push({
    code: c.HIGH_QUALITY,
    message: `High quality setting (${i}%) provides minimal visual improvement`,
    severity: "info",
    suggestion: "Consider 80-85% for optimal balance"
  }) : i < 50 && a.warnings.push({
    code: c.LOW_QUALITY,
    message: `Low quality setting (${i}%) may cause noticeable artifacts`,
    severity: "warning",
    suggestion: "Consider 60%+ for acceptable quality"
  });
  const o = {
    jpg: ["jpeg", "png", "webp", "gif", "bmp", "tiff", "ico"],
    jpeg: ["jpeg", "png", "webp", "gif", "bmp", "tiff", "ico"],
    png: ["jpeg", "png", "webp", "gif", "bmp", "tiff", "svg", "ico"],
    webp: ["jpeg", "png", "webp", "gif", "bmp", "tiff", "svg", "ico"],
    avif: ["jpeg", "png", "webp", "ico"],
    ico: ["jpeg", "png", "webp", "gif", "bmp", "ico"]
    // Added favicon support
  }, l = s.toLowerCase().replace("image/", ""), t = n.toLowerCase();
  return t !== "original" && !o[t]?.includes(l) && (a.valid = !1, a.errors.push({
    code: m.INVALID_FORMAT,
    message: `Cannot convert ${l} to ${t}`,
    severity: "error"
  })), (t === "jpg" || t === "jpeg") && r && a.warnings.push({
    code: c.TRANSPARENCY_LOSS,
    message: "JPEG format does not support transparency",
    severity: "warning",
    suggestion: "Use PNG or WebP to preserve transparency"
  }), t === "webp" ? i > 90 && a.recommendations.push({
    type: "quality_adjustment",
    message: "WebP quality above 90 has diminishing returns",
    suggestion: "Use 80-85% for optimal size/quality balance"
  }) : t === "jpg" || t === "jpeg" ? a.recommendations.push({
    type: "format_suggestion",
    message: "Consider WebP for better compression with similar quality",
    suggestion: "WebP typically provides 25-35% smaller files than JPEG"
  }) : t === "ico" && a.recommendations.push({
    type: "format_suggestion",
    message: "ICO format is best for favicons and Windows icons",
    suggestion: "Include multiple sizes (16×16, 32×32, 48×48, 64×64) in single .ico file"
  }), a;
}
function P(s) {
  const n = {
    valid: !0,
    errors: [],
    warnings: [],
    variables: []
  };
  if (typeof s != "string" || s.trim() === "")
    return n.valid = !1, n.errors.push({
      code: m.INVALID_FORMAT,
      message: "Pattern cannot be empty",
      severity: "error"
    }), n;
  /[<>:"/\\|?*]/.test(s) && (n.valid = !1, n.errors.push({
    code: m.INVALID_FORMAT,
    message: "Pattern contains invalid filename characters",
    severity: "error",
    details: 'Remove <>:"/\\|?* from pattern'
  }));
  const r = /\{(\w+)\}/g;
  let a;
  const o = /* @__PURE__ */ new Set();
  for (; (a = r.exec(s)) !== null; )
    o.add(a[1]);
  n.variables = Array.from(o);
  const l = [
    "name",
    "index",
    "date",
    "time",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "timestamp",
    "width",
    "height",
    "size",
    "format",
    "ext",
    "orientation",
    "aspect",
    "total",
    "padded"
  ], t = n.variables.filter((e) => !l.includes(e));
  return t.length > 0 && n.warnings.push({
    code: c.CONTENT_LOSS,
    message: `Unknown variables: ${t.join(", ")}`,
    severity: "warning",
    suggestion: "These variables will not be replaced"
  }), n;
}
function x(s, n) {
  const i = {
    compatible: !0,
    errors: [],
    warnings: [],
    matchScore: 0,
    recommendations: []
  }, r = f(s.width), a = f(s.height), o = f(n.width), l = f(n.height);
  if (r.isVariable || a.isVariable) {
    i.warnings.push({
      code: c.FLEXIBLE_TEMPLATE,
      message: "Using flexible template - one dimension will adapt automatically",
      severity: "info"
    });
    let t = 80;
    if (!o.isVariable && !l.isVariable) {
      if (r.isVariable && !a.isVariable) {
        const e = l.value / a.value;
        e >= 0.8 ? t += 20 : (t *= e, i.warnings.push({
          code: c.SMALL_DIMENSIONS,
          message: `Image height (${l.value}px) is smaller than template height (${a.value}px)`,
          severity: "warning"
        }));
      } else if (!r.isVariable && a.isVariable) {
        const e = o.value / r.value;
        e >= 0.8 ? t += 20 : (t *= e, i.warnings.push({
          code: c.SMALL_DIMENSIONS,
          message: `Image width (${o.value}px) is smaller than template width (${r.value}px)`,
          severity: "warning"
        }));
      }
    }
    return i.matchScore = t / 100, i.compatible = !0, i;
  }
  if (o.isVariable || l.isVariable)
    return i.compatible = !1, i.errors.push({
      code: m.INVALID_DIMENSIONS,
      message: "Cannot use variable image dimensions with fixed template",
      severity: "error"
    }), i;
  if (o.value < r.value || l.value < a.value) {
    i.warnings.push({
      code: c.SMALL_DIMENSIONS,
      message: `Image dimensions (${o.value}x${l.value}) are smaller than template (${r.value}x${a.value})`,
      severity: "warning"
    });
    const t = o.value / r.value, e = l.value / a.value, d = Math.min(t, e);
    i.matchScore = d * 0.8;
  } else {
    i.matchScore = 0.9;
    const t = o.value / l.value, e = r.value / a.value;
    Math.abs(t - e) / t > 0.1 && (i.warnings.push({
      code: c.ASPECT_CHANGE,
      message: `Aspect ratio differs (image: ${t.toFixed(2)}, template: ${e.toFixed(2)})`,
      severity: "warning",
      suggestion: "Consider cropping to match template aspect ratio"
    }), i.matchScore *= 0.8);
  }
  return i;
}
function C(s) {
  const n = {
    total: s.length,
    valid: 0,
    errors: 0,
    warnings: 0,
    errorDetails: [],
    warningDetails: []
  };
  return s.forEach((i) => {
    i.valid && n.valid++, n.errors += i.errors.length, n.warnings += i.warnings.length, i.errors.forEach((r) => {
      n.errorDetails.push({
        ...r,
        source: i.metadata?.name || "Unknown"
      });
    }), i.warnings.forEach((r) => {
      n.warningDetails.push({
        ...r,
        source: i.metadata?.name || "Unknown"
      });
    });
  }), n;
}
function F(s) {
  return s.filter((n) => {
    const i = f(n.width), r = f(n.height);
    return i.isVariable || r.isVariable;
  });
}
const $ = {
  ValidationErrors: m,
  ValidationWarnings: c,
  isVariableDimension: b,
  parseDimension: f,
  validateOptimizationOptions: T,
  validateImage: M,
  validateDimensions: E,
  validateResize: D,
  validateCrop: V,
  validateOptimization: R,
  validateRenamePattern: P,
  validateTemplateCompatibility: x,
  getValidationSummary: C,
  getFlexibleTemplates: F
};
export {
  c as V,
  x as a,
  P as b,
  R as c,
  V as d,
  D as e,
  E as f,
  C as g,
  M as h,
  m as i,
  b as j,
  $ as k,
  F as l,
  f as p,
  T as v
};
//# sourceMappingURL=validation-D92jbWMx.js.map
