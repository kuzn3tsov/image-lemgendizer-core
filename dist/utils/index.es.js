import { i as re, V as ce, l as le, g as me, j as pe, p as ge, d as de, f as ue, h as fe, c as we, v as he, b as ye, e as be, a as ve, k as ze } from "../validation-D92jbWMx.js";
async function z(t = [], o = {}) {
  const e = { ...{
    includeOriginal: !0,
    includeOptimized: !0,
    includeWebImages: !0,
    includeLogoImages: !0,
    includeFaviconImages: !0,
    includeSocialMedia: !0,
    createFolders: !0,
    includeInfoFile: !0,
    zipName: "lemgendary-export",
    skipEmptyFolders: !0
  }, ...o };
  let i;
  try {
    i = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
  } catch {
    throw new Error("JSZip library required. Include it via CDN or npm package.");
  }
  const n = new i(), s = /* @__PURE__ */ new Date(), r = s.toISOString().replace(/[:.]/g, "-").split("T")[0], c = `${e.zipName}-${r}`, l = e.createFolders ? n.folder(c) : n, m = [
    {
      name: "00_Originals",
      condition: e.includeOriginal,
      files: await x(t)
    },
    {
      name: "01_Optimized",
      condition: e.includeOptimized,
      files: await M(t, "optimized")
    },
    {
      name: "02_Web_Images",
      condition: e.includeWebImages,
      files: await f(t, "web")
    },
    {
      name: "03_Logo_Images",
      condition: e.includeLogoImages,
      files: await f(t, "logo")
    },
    {
      name: "04_Favicon_Images",
      condition: e.includeFaviconImages,
      files: await f(t, "favicon")
    },
    {
      name: "05_Social_Media",
      condition: e.includeSocialMedia,
      files: await f(t, "social")
    }
  ];
  for (const g of m)
    if (g.condition && g.files.length > 0) {
      const d = e.createFolders ? l.folder(g.name) : l;
      for (const w of g.files) {
        const h = b(w.name);
        d.file(h, w.content);
      }
    } else g.condition && g.files.length === 0 && e.skipEmptyFolders && console.log(`Skipping empty folder: ${g.name}`);
  if (e.includeInfoFile) {
    const g = E(t, e);
    l.file("INFO.txt", g);
  }
  return await n.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6
    },
    comment: `Created by LemGendary Image Processor - ${s.toISOString()}`,
    platform: "UNIX"
  });
}
async function x(t) {
  const o = [];
  for (const a of t)
    a.file && a.file instanceof File && o.push({
      name: a.originalName || a.file.name,
      content: a.file
    });
  return o;
}
async function M(t, o) {
  const a = [];
  for (const e of t) {
    let i = [];
    typeof e.getAllOutputs == "function" ? i = e.getAllOutputs() : e.outputs && typeof e.outputs.get == "function" ? i = Array.from(e.outputs.values()) : Array.isArray(e.outputs) && (i = e.outputs);
    const n = i.filter((s) => !s.template || s.template === "custom" || s.category === o);
    for (const s of n)
      s.file && s.file instanceof File && a.push({
        name: s.file.name || `optimized-${Date.now()}.${I(s.file)}`,
        content: s.file
      });
  }
  return a;
}
async function f(t, o) {
  const a = [];
  for (const e of t) {
    let i = [];
    typeof e.getAllOutputs == "function" ? i = e.getAllOutputs() : e.outputs && typeof e.outputs.get == "function" ? i = Array.from(e.outputs.values()) : Array.isArray(e.outputs) && (i = e.outputs);
    const n = i.filter((s) => (s.template?.category || s.category || "").toLowerCase() === o.toLowerCase());
    for (const s of n)
      s.file && s.file instanceof File && a.push({
        name: s.file.name || `${o}-${Date.now()}.${I(s.file)}`,
        content: s.file
      });
  }
  return a;
}
function E(t, o) {
  const a = /* @__PURE__ */ new Date(), e = {
    totalImages: t.length,
    originals: 0,
    optimized: 0,
    web: 0,
    logo: 0,
    favicon: 0,
    social: 0,
    formats: {},
    totalSize: 0
  };
  for (const n of t) {
    n.file && (e.originals++, e.totalSize += n.file.size || 0);
    let s = [];
    typeof n.getAllOutputs == "function" ? s = n.getAllOutputs() : n.outputs && Array.isArray(n.outputs) && (s = n.outputs);
    for (const r of s)
      if (r.file) {
        switch (e.totalSize += r.file.size || 0, (r.template?.category || r.category || "optimized").toLowerCase()) {
          case "web":
            e.web++;
            break;
          case "logo":
            e.logo++;
            break;
          case "favicon":
            e.favicon++;
            break;
          case "social":
            e.social++;
            break;
          default:
            e.optimized++;
        }
        const l = I(r.file);
        e.formats[l] = (e.formats[l] || 0) + 1;
      }
  }
  return `LEMGENDARY IMAGE EXPORT
===========================

Export Information
------------------
Date: ${a.toLocaleDateString()} ${a.toLocaleTimeString()}
Tool: LemGendary Image Processor
Version: 2.0.0
Export ID: ${Date.now().toString(36).toUpperCase()}

Options Used
------------
${Object.entries(o).filter(([n]) => !["zipName"].includes(n)).map(([n, s]) => `${n.padEnd(20)}: ${s}`).join(`
`)}

Statistics
----------
Total Images Processed: ${e.totalImages}
Total Files in Export: ${e.originals + e.optimized + e.web + e.logo + e.favicon + e.social}

File Breakdown:
  Original Images: ${e.originals}
  Optimized Images: ${e.optimized}
  Web Images: ${e.web}
  Logo Images: ${e.logo}
  Favicon Images: ${e.favicon}
  Social Media Images: ${e.social}

Format Distribution:
${Object.entries(e.formats).map(([n, s]) => `  ${n.toUpperCase().padEnd(6)}: ${s} files`).join(`
`)}

Total Size: ${F(e.totalSize)}

Image Details
-------------
${t.map((n, s) => {
    const r = typeof n.getAllOutputs == "function" ? n.getAllOutputs() : [];
    return `[${s + 1}] ${n.originalName || "Unnamed"}
  Original: ${F(n.originalSize || 0)} | ${n.width || "?"}×${n.height || "?"}
  Outputs: ${r.length} file(s)
  ${r.map((c) => `  - ${c.file?.name || "Unnamed"} (${c.template?.category || "custom"})`).join(`
  `)}`;
  }).join(`

`)}

Folder Structure
----------------
${o.createFolders ? `
00_Originals/       - Original uploaded images (${e.originals > 0 ? e.originals + " files" : "Skipped - empty"})
01_Optimized/       - Custom processed images (${e.optimized > 0 ? e.optimized + " files" : "Skipped - empty"})
02_Web_Images/      - Web template outputs (${e.web > 0 ? e.web + " files" : "Skipped - empty"})
03_Logo_Images/     - Logo template outputs (${e.logo > 0 ? e.logo + " files" : "Skipped - empty"})
04_Favicon_Images/  - Favicon template outputs (${e.favicon > 0 ? e.favicon + " files" : "Skipped - empty"})
05_Social_Media/    - Social media platform outputs (${e.social > 0 ? e.social + " files" : "Skipped - empty"})` : "All files in root folder"}

Notes
-----
• All processing done client-side in browser
• No images uploaded to external servers
• Created with LemGendary Image Processor
• https://github.com/lemgenda/image-lemgendizer`;
}
function F(t, o = 2) {
  if (t === 0) return "0 Bytes";
  const a = 1024, e = o < 0 ? 0 : o, i = ["Bytes", "KB", "MB", "GB", "TB"], n = Math.floor(Math.log(t) / Math.log(a));
  return parseFloat((t / Math.pow(a, n)).toFixed(e)) + " " + i[n];
}
function I(t) {
  if (!t || !t.name) return "unknown";
  const o = t.name.split(".");
  return o.length > 1 ? o.pop().toLowerCase() : {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/x-icon": "ico",
    "image/avif": "avif"
  }[t.type] || "unknown";
}
function b(t) {
  return t ? t.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").substring(0, 255).trim() : "unnamed-file";
}
async function D(t = [], o = "files") {
  let a;
  try {
    a = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
  } catch {
    throw new Error("JSZip library required. Include it via CDN or npm package.");
  }
  const e = new a();
  for (const i of t)
    i && i instanceof File && e.file(b(i.name), i);
  return e.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}
async function A(t) {
  if (!(t instanceof Blob))
    throw new Error("Input must be a Blob object");
  let o;
  try {
    o = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
  } catch {
    throw new Error("JSZip library required. Include it via CDN or npm package.");
  }
  const a = await o.loadAsync(t), e = [], i = Object.keys(a.files).map(async (n) => {
    const s = a.files[n];
    if (!s.dir)
      try {
        const r = await s.async("blob"), c = C(n), l = new File([r], n, {
          type: c,
          lastModified: s.date ? s.date.getTime() : Date.now()
        });
        e.push({
          name: n,
          file: l,
          size: r.size,
          type: l.type,
          path: n.includes("/") ? n.split("/").slice(0, -1).join("/") : "",
          lastModified: s.date
        });
      } catch (r) {
        console.warn(`Failed to extract file ${n}:`, r);
      }
  });
  return await Promise.all(i), e;
}
function C(t) {
  const o = t.toLowerCase().split(".").pop();
  return {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tiff: "image/tiff",
    tif: "image/tiff",
    avif: "image/avif",
    // Documents
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    // Archives
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    // Default
    "": "application/octet-stream"
  }[o] || "application/octet-stream";
}
async function k(t) {
  if (!(t instanceof Blob))
    throw new Error("Input must be a Blob object");
  let o;
  try {
    o = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
  } catch {
    throw new Error("JSZip library required. Include it via CDN or npm package.");
  }
  const a = await o.loadAsync(t), e = [];
  let i = 0, n = 0, s = 0;
  return Object.keys(a.files).forEach((r) => {
    const c = a.files[r];
    if (c.dir)
      s++;
    else {
      n++;
      const l = c._data.uncompressedSize || 0;
      i += l, e.push({
        name: r,
        size: l,
        compressedSize: c._data.compressedSize || 0,
        compressed: c._data.compression !== null,
        directory: !1,
        lastModified: c.date,
        ratio: l > 0 ? ((l - c._data.compressedSize) / l * 100).toFixed(1) : 0
      });
    }
  }), {
    fileCount: n,
    folderCount: s,
    totalSize: i,
    compressedSize: t.size,
    compressionRatio: i > 0 ? t.size / i : 0,
    files: e,
    comment: a.comment || "",
    format: "ZIP",
    isEncrypted: a.password !== null,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function P(t, o = {}, a = null) {
  let e;
  try {
    e = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js")).default;
  } catch {
    throw new Error("JSZip library required. Include it via CDN or npm package.");
  }
  const i = new e(), n = o.zipName || `export-${Date.now()}`, s = o.createFolders ? i.folder(n) : i, r = N(t, o);
  let c = 0;
  if (o.includeOriginal) {
    const m = await x(t);
    for (const p of m)
      s.file(b(p.name), p.content), c++, a && a(c / r, `Adding ${p.name}`);
  }
  const l = [
    { name: "optimized", getter: M },
    { name: "web", getter: (m) => f(m, "web") },
    { name: "logo", getter: (m) => f(m, "logo") },
    { name: "favicon", getter: (m) => f(m, "favicon") },
    { name: "social", getter: (m) => f(m, "social") }
  ];
  for (const m of l)
    if (o[`include${m.name.charAt(0).toUpperCase() + m.name.slice(1)}`]) {
      const p = await m.getter(t), g = o.createFolders ? s.folder(T(m.name)) : s;
      for (const d of p)
        g.file(b(d.name), d.content), c++, a && a(c / r, `Adding ${m.name}: ${d.name}`);
    }
  return i.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  }, (m) => {
    if (a) {
      const p = c / r, g = m.percent / 100, d = p * 0.5 + g * 0.5;
      a(d, `Compressing (${m.percent.toFixed(1)}%)`);
    }
  });
}
function N(t, o) {
  let a = 0;
  o.includeOriginal && (a += t.filter((e) => e.file).length);
  for (const e of t) {
    let i = [];
    typeof e.getAllOutputs == "function" ? i = e.getAllOutputs() : Array.isArray(e.outputs) && (i = e.outputs);
    for (const n of i) {
      const s = n.template?.category || n.category || "optimized", r = `include${s.charAt(0).toUpperCase() + s.slice(1)}`;
      o[r] !== !1 && a++;
    }
  }
  return Math.max(a, 1);
}
function T(t) {
  return {
    optimized: "01_Optimized",
    web: "02_Web_Images",
    logo: "03_Logo_Images",
    favicon: "04_Favicon_Images",
    social: "05_Social_Media"
  }[t] || t;
}
async function _(t, o = {}) {
  const a = t.filter((i) => i.success && i.image).map((i) => i.image), e = {
    ...o,
    includeWebImages: !1,
    includeLogoImages: !1,
    includeFaviconImages: !1,
    includeSocialMedia: !1,
    zipName: o.zipName || "custom-processed"
  };
  return z(a, e);
}
async function W(t, o = {}) {
  const a = t.filter((i) => i.success && i.image).map((i) => i.image), e = {
    ...o,
    zipName: o.zipName || "template-export"
  };
  return z(a, e);
}
const ae = {
  createLemGendaryZip: z,
  createSimpleZip: D,
  extractZip: A,
  getZipInfo: k,
  createZipWithProgress: P,
  createCustomZip: _,
  createTemplateZip: W
};
async function L(t) {
  return new Promise((o, a) => {
    if (!t || !(t instanceof File)) {
      a(new Error("Invalid file provided"));
      return;
    }
    if (t.type === "image/x-icon" || t.type === "image/vnd.microsoft.icon") {
      Z().then(o).catch(() => o({ width: 32, height: 32, orientation: "square", aspectRatio: 1 }));
      return;
    }
    const e = new Image(), i = URL.createObjectURL(t);
    e.onload = () => {
      const n = {
        width: e.naturalWidth || e.width,
        height: e.naturalHeight || e.height,
        orientation: e.naturalWidth >= e.naturalHeight ? "landscape" : "portrait",
        aspectRatio: e.naturalWidth / e.naturalHeight
      };
      URL.revokeObjectURL(i), o(n);
    }, e.onerror = () => {
      URL.revokeObjectURL(i), t.type === "image/svg+xml" ? B(t).then(o).catch(() => a(new Error("Failed to load image dimensions"))) : a(new Error("Failed to load image"));
    }, e.src = i;
  });
}
async function B(t) {
  return new Promise((o, a) => {
    const e = new FileReader();
    e.onload = (i) => {
      try {
        const n = i.target.result, r = new DOMParser().parseFromString(n, "image/svg+xml"), c = r.documentElement;
        if (r.querySelector("parsererror")) {
          a(new Error("Invalid SVG format"));
          return;
        }
        const l = parseFloat(c.getAttribute("width")) || c.viewBox?.baseVal?.width || 100, m = parseFloat(c.getAttribute("height")) || c.viewBox?.baseVal?.height || 100;
        o({
          width: l,
          height: m,
          orientation: l >= m ? "landscape" : "portrait",
          aspectRatio: l / m
        });
      } catch (n) {
        a(n);
      }
    }, e.onerror = a, e.readAsText(t);
  });
}
async function Z(t) {
  return new Promise((o) => {
    o({
      width: 32,
      height: 32,
      orientation: "square",
      aspectRatio: 1
    });
  });
}
async function $(t) {
  return !t || t.type !== "image/png" && t.type !== "image/webp" ? !1 : new Promise((o) => {
    const a = new Image(), e = URL.createObjectURL(t);
    a.onload = () => {
      const i = document.createElement("canvas");
      i.width = a.width, i.height = a.height;
      const n = i.getContext("2d");
      n.drawImage(a, 0, 0);
      const r = n.getImageData(0, 0, i.width, i.height).data;
      for (let c = 3; c < r.length; c += 4)
        if (r[c] < 255) {
          URL.revokeObjectURL(e), o(!0);
          return;
        }
      URL.revokeObjectURL(e), o(!1);
    }, a.onerror = () => {
      URL.revokeObjectURL(e), o(!1);
    }, a.src = e;
  });
}
function G(t) {
  return new Promise((o, a) => {
    const e = new FileReader();
    e.onload = () => o(e.result), e.onerror = a, e.readAsDataURL(t);
  });
}
function q(t, o) {
  return new Promise((a, e) => {
    try {
      const i = t.split(","), n = i[0].match(/:(.*?);/)[1], s = atob(i[1]);
      let r = s.length;
      const c = new Uint8Array(r);
      for (; r--; )
        c[r] = s.charCodeAt(r);
      a(new File([c], o, { type: n }));
    } catch (i) {
      e(i);
    }
  });
}
async function O(t, o, a, e = "webp", i = 0.8) {
  return new Promise((n, s) => {
    if (e.toLowerCase() === "ico") {
      O(t, o, a, "png", i).then((l) => {
        console.warn("ICO format creation limited in browser. Using PNG instead."), n(l);
      }).catch(s);
      return;
    }
    const r = new Image(), c = URL.createObjectURL(t);
    r.onload = () => {
      const l = document.createElement("canvas");
      l.width = o, l.height = a;
      const m = l.getContext("2d");
      (e === "jpg" || e === "jpeg") && (m.fillStyle = "#ffffff", m.fillRect(0, 0, o, a)), m.drawImage(r, 0, 0, o, a);
      let p;
      switch (e.toLowerCase()) {
        case "jpg":
        case "jpeg":
          p = "image/jpeg";
          break;
        case "png":
          p = "image/png";
          break;
        case "webp":
          p = "image/webp";
          break;
        case "avif":
          p = "image/avif";
          break;
        case "svg":
          p = "image/svg+xml";
          break;
        default:
          p = "image/webp";
      }
      l.toBlob(
        (g) => {
          if (URL.revokeObjectURL(c), !g) {
            s(new Error("Failed to create blob"));
            return;
          }
          const d = e.toLowerCase(), h = `${t.name.replace(/\.[^/.]+$/, "")}-${o}x${a}.${d}`;
          n(new File([g], h, { type: p }));
        },
        p,
        i
      );
    }, r.onerror = () => {
      URL.revokeObjectURL(c), s(new Error("Failed to load image"));
    }, r.src = c;
  });
}
async function J(t, o, a, e, i, n = "webp", s = 0.8) {
  return new Promise((r, c) => {
    const l = new Image(), m = URL.createObjectURL(t);
    l.onload = () => {
      const p = document.createElement("canvas");
      p.width = e, p.height = i;
      const g = p.getContext("2d");
      (n === "jpg" || n === "jpeg") && (g.fillStyle = "#ffffff", g.fillRect(0, 0, e, i)), g.drawImage(l, o, a, e, i, 0, 0, e, i);
      let d;
      switch (n.toLowerCase()) {
        case "jpg":
        case "jpeg":
          d = "image/jpeg";
          break;
        case "png":
          d = "image/png";
          break;
        case "webp":
          d = "image/webp";
          break;
        default:
          d = "image/webp";
      }
      p.toBlob(
        (w) => {
          if (URL.revokeObjectURL(m), !w) {
            c(new Error("Failed to create blob"));
            return;
          }
          const h = n.toLowerCase(), R = `${t.name.replace(/\.[^/.]+$/, "")}-crop-${e}x${i}.${h}`;
          r(new File([w], R, { type: d }));
        },
        d,
        s
      );
    }, l.onerror = () => {
      URL.revokeObjectURL(m), c(new Error("Failed to load image"));
    }, l.src = m;
  });
}
function V(t, o, a, e = "auto") {
  if (e === "width") {
    const i = a, n = Math.round(o / t * a);
    return { width: i, height: n };
  } else if (e === "height") {
    const i = a;
    return { width: Math.round(t / o * a), height: i };
  } else if (t >= o) {
    const i = a, n = Math.round(o / t * a);
    return { width: i, height: n };
  } else {
    const i = a;
    return { width: Math.round(t / o * a), height: i };
  }
}
function u(t, o = 2) {
  if (t === 0) return "0 Bytes";
  const a = 1024, e = o < 0 ? 0 : o, i = ["Bytes", "KB", "MB", "GB", "TB"], n = Math.floor(Math.log(t) / Math.log(a));
  return parseFloat((t / Math.pow(a, n)).toFixed(e)) + " " + i[n];
}
function y(t) {
  if (t instanceof File) {
    const e = t.name.split(".").pop().toLowerCase();
    return e && e.length <= 4 ? e : {
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
    }[t.type] || "unknown";
  }
  const a = (typeof t == "string" ? t : "").split(".").pop().toLowerCase();
  return a && a.length <= 4 ? a : "unknown";
}
function H(t) {
  const o = [], a = [];
  if (!(t instanceof File))
    return o.push("Not a valid File object"), { valid: !1, errors: o, warnings: a };
  [
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
  ].includes(t.type) || o.push(`Unsupported file type: ${t.type}`);
  const i = 50 * 1024 * 1024;
  return t.size > i ? o.push(`File too large: ${u(t.size)} (max: ${u(i)})`) : t.size > 10 * 1024 * 1024 && a.push(`Large file: ${u(t.size)} - processing may be slow`), /[<>:"/\\|?*]/.test(t.name) && a.push("Filename contains invalid characters"), {
    valid: o.length === 0,
    errors: o,
    warnings: a
  };
}
async function v(t, o = 200) {
  return new Promise((a, e) => {
    if (t.type === "image/x-icon" || t.type === "image/vnd.microsoft.icon") {
      a("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM4ODJlZiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMzg4MmVmIi8+PC9zdmc+");
      return;
    }
    const i = new Image(), n = URL.createObjectURL(t);
    i.onload = () => {
      let s, r;
      i.width > i.height ? (s = o, r = Math.round(i.height / i.width * o)) : (r = o, s = Math.round(i.width / i.height * o));
      const c = document.createElement("canvas");
      c.width = s, c.height = r, c.getContext("2d").drawImage(i, 0, 0, s, r);
      const m = c.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(n), a(m);
    }, i.onerror = () => {
      URL.revokeObjectURL(n), e(new Error("Failed to create thumbnail"));
    }, i.src = n;
  });
}
async function Y(t, o, a) {
  const e = [], i = t.length;
  for (let n = 0; n < t.length; n++)
    try {
      const s = await o(t[n], n);
      e.push(s), a && a((n + 1) / i, n + 1, i);
    } catch (s) {
      console.error(`Error processing file ${n + 1}:`, s), e.push({ error: s.message, file: t[n] });
    }
  return e;
}
async function j(t) {
  const o = await L(t), a = await $(t), e = {
    dimensions: o,
    transparency: a,
    fileSize: t.size,
    mimeType: t.type,
    extension: y(t),
    optimizationScore: 0,
    recommendations: []
  };
  let i = 0;
  t.size > 5 * 1024 * 1024 ? (i += 40, e.recommendations.push("File is very large - high optimization potential")) : t.size > 1 * 1024 * 1024 ? i += 20 : t.size > 100 * 1024 && (i += 10);
  const n = o.width * o.height / 1e6;
  n > 16 ? (i += 30, e.recommendations.push("Very high resolution - consider resizing")) : n > 4 && (i += 15);
  const s = ["webp", "avif", "svg"], r = y(t);
  return s.includes(r) || (i += 20, e.recommendations.push(`Consider converting from ${r} to modern format`)), a && r === "jpg" && (i += 10, e.recommendations.push("JPEG with transparency - convert to PNG or WebP")), e.optimizationScore = Math.min(100, i), e.optimizationLevel = i > 50 ? "high" : i > 25 ? "medium" : "low", e;
}
function Q(t) {
  const o = {
    "web-high": {
      quality: 85,
      format: "auto",
      maxDisplayWidth: 1920,
      compressionMode: "balanced",
      stripMetadata: !0,
      description: "High quality web images"
    },
    "web-balanced": {
      quality: 80,
      format: "auto",
      maxDisplayWidth: 1200,
      compressionMode: "adaptive",
      stripMetadata: !0,
      description: "Balanced web images"
    },
    "web-aggressive": {
      quality: 70,
      format: "webp",
      maxDisplayWidth: 800,
      compressionMode: "aggressive",
      stripMetadata: !0,
      description: "Aggressive web optimization"
    },
    "social-media": {
      quality: 90,
      format: "jpg",
      maxDisplayWidth: 1080,
      compressionMode: "balanced",
      stripMetadata: !1,
      // Keep metadata for social
      description: "Social media images"
    },
    ecommerce: {
      quality: 92,
      format: "webp",
      maxDisplayWidth: 1200,
      compressionMode: "balanced",
      stripMetadata: !0,
      preserveTransparency: !0,
      description: "E-commerce product images"
    },
    favicon: {
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
      lossless: !0,
      stripMetadata: !1,
      description: "Print-ready images"
    },
    "mobile-optimized": {
      quality: 75,
      format: "webp",
      maxDisplayWidth: 800,
      compressionMode: "aggressive",
      stripMetadata: !0,
      description: "Mobile-optimized images"
    }
  };
  return o[t] || o["web-balanced"];
}
function S(t, o) {
  const { format: a, quality: e, maxDisplayWidth: i } = o;
  let n = t, s = [];
  switch (a) {
    case "webp":
      n *= 0.7, s.push("WebP format: 30% reduction");
      break;
    case "avif":
      n *= 0.6, s.push("AVIF format: 40% reduction");
      break;
    case "jpg":
      n *= 0.8, s.push("JPEG format: 20% reduction");
      break;
    case "png":
      n *= 0.9, s.push("PNG format: 10% reduction");
      break;
    case "svg":
      n *= 0.3, s.push("SVG format: 70% reduction");
      break;
    default:
      n *= 0.75, s.push("Auto format selection: ~25% reduction");
  }
  const r = e / 100;
  n *= r, s.push(`Quality ${e}%: ${Math.round((1 - r) * 100)}% reduction`), i && (n *= 0.85, s.push(`Max width ${i}px: ~15% reduction`));
  const c = t - n, l = c / t * 100;
  return {
    originalSize: t,
    estimatedSize: Math.round(n),
    savings: Math.round(c),
    savingsPercent: Math.round(l * 10) / 10,
    reductionFactors: s,
    readable: {
      original: u(t),
      estimated: u(Math.round(n)),
      savings: u(Math.round(c)),
      savingsPercent: `${Math.round(l * 10) / 10}%`
    }
  };
}
async function X(t, o) {
  return new Promise((a, e) => {
    const i = new Image();
    i.onload = () => {
      try {
        const n = document.createElement("canvas"), s = n.getContext("2d"), r = 400;
        let c = i.width, l = i.height;
        (c > r || l > r) && (c >= l ? (c = r, l = Math.round(i.height / i.width * r)) : (l = r, c = Math.round(i.width / i.height * r))), n.width = c, n.height = l, s.drawImage(i, 0, 0, c, l);
        const m = Math.min(0.7, o.quality / 100 * 0.8), p = n.toDataURL("image/jpeg", m);
        a(p);
      } catch (n) {
        e(n);
      }
    }, i.onerror = e, i.src = URL.createObjectURL(t);
  });
}
async function K(t, o) {
  const a = t.size, e = o.size, i = a - e, n = i / a * 100, s = await v(t, 300), r = await v(o, 300);
  return {
    original: {
      size: a,
      sizeFormatted: u(a),
      thumbnail: s
    },
    optimized: {
      size: e,
      sizeFormatted: u(e),
      thumbnail: r
    },
    savings: {
      bytes: i,
      percent: Math.round(n * 10) / 10,
      formatted: u(i),
      compressionRatio: (a / e).toFixed(2)
    },
    comparison: n > 0 ? `Saved ${u(i)} (${Math.round(n)}%)` : "No savings achieved"
  };
}
function ee(t) {
  const o = y(t);
  return !["webp", "avif", "svg"].includes(o);
}
function U(t) {
  const o = y(t);
  return o === "svg" ? "svg" : o === "ico" ? "ico" : t.type === "image/png" || t.type === "image/webp" ? "webp" : t.size > 2 * 1024 * 1024 ? "avif" : "webp";
}
async function te(t) {
  const o = await j(t), a = U(t), e = S(t.size, {
    format: a,
    quality: 85,
    maxDisplayWidth: 1920
  });
  return {
    analysis: o,
    recommendedFormat: a,
    estimatedSavings: e,
    needsOptimization: o.optimizationScore > 30,
    priority: o.optimizationLevel
  };
}
const oe = {
  getImageDimensions: L,
  hasTransparency: $,
  fileToDataURL: G,
  dataURLtoFile: q,
  resizeImage: O,
  cropImage: J,
  calculateAspectRatioFit: V,
  formatFileSize: u,
  getFileExtension: y,
  validateImageFile: H,
  createThumbnail: v,
  batchProcess: Y,
  analyzeForOptimization: j,
  getOptimizationPreset: Q,
  calculateOptimizationSavings: S,
  createOptimizationPreview: X,
  generateOptimizationComparison: K,
  needsFormatConversion: ee,
  getRecommendedFormat: U,
  getOptimizationStats: te
};
export {
  re as ValidationErrors,
  ce as ValidationWarnings,
  j as analyzeForOptimization,
  Y as batchProcess,
  V as calculateAspectRatioFit,
  S as calculateOptimizationSavings,
  _ as createCustomZip,
  z as createLemGendaryZip,
  X as createOptimizationPreview,
  D as createSimpleZip,
  W as createTemplateZip,
  v as createThumbnail,
  P as createZipWithProgress,
  J as cropImage,
  q as dataURLtoFile,
  A as extractZip,
  G as fileToDataURL,
  u as formatFileSize,
  K as generateOptimizationComparison,
  y as getFileExtension,
  le as getFlexibleTemplates,
  L as getImageDimensions,
  Q as getOptimizationPreset,
  te as getOptimizationStats,
  U as getRecommendedFormat,
  me as getValidationSummary,
  k as getZipInfo,
  $ as hasTransparency,
  oe as imageUtils,
  pe as isVariableDimension,
  ee as needsFormatConversion,
  ge as parseDimension,
  O as resizeImage,
  de as validateCrop,
  ue as validateDimensions,
  fe as validateImage,
  H as validateImageFile,
  we as validateOptimization,
  he as validateOptimizationOptions,
  ye as validateRenamePattern,
  be as validateResize,
  ve as validateTemplateCompatibility,
  ze as validation,
  ae as zipUtils
};
//# sourceMappingURL=index.es.js.map
