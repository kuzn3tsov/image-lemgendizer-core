# LemGendary Image Processor

A powerful, client-side batch image processing library with intelligent operations, AI-powered smart cropping, advanced optimization, and template support. Process images directly in the browser with no server upload required.

[https://img.shields.io/npm/v/@lemgenda/image-lemgendizer](https://img.shields.io/npm/v/@lemgenda/image-lemgendizer)
[https://img.shields.io/npm/l/@lemgenda/image-lemgendizer](https://img.shields.io/npm/l/@lemgenda/image-lemgendizer)
[https://img.shields.io/bundlephobia/minzip/@lemgenda/image-lemgendizer](https://img.shields.io/bundlephobia/minzip/@lemgenda/image-lemgendizer)

## ✨ Features

### 🎯 Intelligent Processing

-   Smart AI Cropping: Face, object, and saliency detection

-   Content-Aware Resizing: Maintain aspect ratio with intelligent dimension selection

-   Advanced Optimization: WebP, AVIF, JPEG, PNG with adaptive compression

-   Batch Processing: Process multiple images with progress tracking


### 🏗️ Core Architecture

-   Unified Processing Pipeline: Chain resize, crop, optimize, rename operations

-   Template System: Pre-configured templates for social media, web, favicons, etc.

-   Flexible Dimensions: Support for variable width/height templates

-   Optimization-First ZIP: Create organized ZIP exports with metadata


### 🔧 Technical Features

-   100% Client-Side: No server upload, all processing in browser

-   Modern Format Support: WebP, AVIF, SVG, ICO, plus traditional formats

-   Favicon Generation: Complete favicon sets with manifest generation

-   Validation System: Comprehensive validation with warnings and errors

-   Source Maps: Full debugging support in development


## 📦 Installation

```
\# npm
npm install @lemgenda/image-lemgendizer

\# yarn
yarn add @lemgenda/image-lemgendizer

\# pnpm
pnpm add @lemgenda/image-lemgendizer
```

## 🚀 Quick Start

### Basic Usage

```
import {
  getLemGendTask,
  getLemGendImage,
  lemGendaryProcessBatch
} from '@lemgenda/image-lemgendizer';

async function processImage(file) {
  // Create a task with processing steps
  const LemGendTask \= await getLemGendTask();
  const task \= new LemGendTask('Web Optimization', 'Optimize images for web');

  task
    .addResize(1920, 'longest')      // Resize to max 1920px (maintain aspect)
    .addOptimize(85, 'auto')          // Auto-format selection at 85% quality
    .addRename('{name}-{width}w');    // Rename with pattern

  // Create image instance
  const LemGendImage \= await getLemGendImage();
  const image \= new LemGendImage(file);
  await image.load();

  // Process the image
  const results \= await lemGendaryProcessBatch(\[image\], task, {
    onProgress: (progress, current, total) \=> {
      console.log(\`Processing: ${Math.round(progress \* 100)}%\`);
    }
  });

  return results\[0\].file; // Get processed File object
}
```

## 📚 Core Concepts

### Core Classes

```
// Import core classes directly
import { LemGendImage, LemGendTask } from '@lemgenda/image-lemgendizer';

// Create image instance
const image = new LemGendImage(file);
await image.load();

// Create task
const task = new LemGendTask('My Processing Task');
task.addResize(1920, 'longest').addOptimize(85, 'webp');

// Process
const results = await lemGendaryProcessBatch([image], task);
```

### LemGendImage - The Image Container

```
import { getLemGendImage } from '@lemgenda/image-lemgendizer';

const LemGendImage \= await getLemGendImage();

// Create from File
const image \= new LemGendImage(file);
await image.load();

// Access image info
console.log(image.getInfo());
// {
//   id: 'lemgend\_1234567890\_abc123',
//   name: 'photo.jpg',
//   width: 4000,
//   height: 3000,
//   originalSize: 5242880,
//   aspectRatio: 1.333,
//   transparency: false,
//   optimizationScore: 45
// }

// Get optimization recommendations
const recommendations \= image.getOptimizationRecommendations();
// {
//   format: 'webp',
//   quality: 85,
//   resize: { width: 1920, height: 1440 },
//   priority: 'medium'
// }

// Create thumbnail
const thumbnail \= await image.createThumbnail(200);
```

### LemGendTask - Processing Pipeline

```
import { getLemGendTask } from '@lemgenda/image-lemgendizer';

const LemGendTask \= await getLemGendTask();

// Create task with chaining
const task \= new LemGendTask('Social Media Package', 'Prepare images for Instagram and Facebook');

task
  // Resize to Instagram max width
  .addResize(1080, 'longest')

  // Smart crop for Instagram square
  .addSmartCrop(1080, 1080, {
    mode: 'face',
    confidenceThreshold: 80,
    multipleFaces: true
  })

  // High-quality optimization
  .addOptimize(90, 'webp', {
    compressionMode: 'balanced',
    preserveTransparency: true
  })

  // Rename with social media pattern
  .addRename('instagram-{name}-{index}');

// Validate task
const validation \= await task.validate(image);
console.log(validation.isValid); // true/false
console.log(validation.warnings); // Array of warnings

// Get task summary
const summary \= task.getValidationSummary();
console.log(summary);
// {
//   totalSteps: 4,
//   errorCount: 0,
//   warningCount: 1,
//   taskType: 'general',
//   canProceed: true
// }
```

## 🎨 Processing Examples

### Example 1: Web Optimization Pipeline

```
const task \= new LemGendTask('Web Optimization');

task
  .addResize(1920, 'longest', {
    algorithm: 'lanczos3',
    maintainAspectRatio: true
  })
  .addOptimize(85, 'auto', {
    maxDisplayWidth: 1920,
    browserSupport: \['modern', 'legacy'\],
    compressionMode: 'adaptive',
    stripMetadata: true
  })
  .addRename('{name}-{width}w-{date}');
```

### Example 2: Smart Portrait Cropping

```
const task \= new LemGendTask('Portrait Smart Crop');

task
  .addResize(1350, 'height')  // Portrait height
  .addSmartCrop(1080, 1350, {
    mode: 'face',
    confidenceThreshold: 85,
    preserveAspectRatio: true,
    objectsToDetect: \['person', 'face'\]
  })
  .addOptimize(95, 'webp', {
    preserveTransparency: false,
    compressionMode: 'balanced'
  });
```

### Example 3: Complete Favicon Generation

```
const task \= new LemGendTask('Favicon Package');

task
  // Prepare base image
  .addResize(512, 'longest')
  .addCrop(512, 512, 'smart', {
    confidenceThreshold: 70,
    cropToFit: true
  })
  // Generate favicon set
  .addFavicon(
    \[16, 32, 48, 64, 128, 180, 192, 256, 512\],
    \['png', 'ico'\],
    {
      generateManifest: true,
      generateHTML: true,
      includeAppleTouch: true,
      includeAndroid: true,
      roundCorners: true,
      backgroundColor: '#ffffff'
    }
  )
  .addRename('favicon-{size}');
```

### Example 4: Template-Based Processing

```
import { processWithTemplate } from '@lemgenda/image-lemgendizer';

const result \= await processWithTemplate(image, 'instagram-square', {
  // Additional options
  preserveOriginal: true
});

console.log(result);
// {
//   success: true,
//   template: { id: 'instagram-square', ... },
//   image: LemGendImage instance,
//   file: Processed File object
// }
```

## 📋 Available Templates

The library includes 50+ pre-configured templates:

### Social Media Templates

-   `instagram-square` (1080×1080)

-   `instagram-portrait` (1080×1350)

-   `facebook-post` (1200×630)

-   `twitter-header` (1500×500)

-   `linkedin-post` (1200×627)

-   `youtube-thumbnail` (1280×720)

-   `pinterest-pin` (1000×1500)

-   `tiktok-cover` (1080×1920)


### Web Templates

-   `web-hero` (1920×1080)

-   `blog-featured` (1200×630)

-   `web-thumbnail` (300×300)

-   `web-card` (400×300)

-   `open-graph` (1200×630)


### Logo & Branding

-   `logo-square` (500×500)

-   `logo-rectangular` (300×150)

-   `logo-print` (3000×3000)

-   `social-profile` (400×400)


### Favicon Templates

-   `favicon-basic` (16×16)

-   `favicon-modern` (180×180)

-   `favicon-apple` (180×180)

-   `favicon-android` (192×192)

-   `favicon-complete` (Complete set)


## 🛠️ Advanced Usage

### Batch Processing with Progress

```
const results \= await lemGendaryProcessBatch(images, task, {
  onProgress: (progress, current, total) \=> {
    console.log(\`Processed ${current}/${total} images\`);
    updateProgressBar(progress);
  },
  onWarning: (warning) \=> {
    console.warn(\`Warning: ${warning.message}\`);
  },
  onError: (error, file) \=> {
    console.error(\`Error processing ${file.name}:\`, error);
  },
  parallel: true,           // Enable parallel processing
  maxParallel: 4            // Max 4 images at once
});

// results is array of: { image, file, success, error?, metadata }
```

### Custom Processor Usage

```
import {
  getLemGendaryResize,
  getLemGendaryCrop,
  getLemGendaryOptimize
} from '@lemgenda/image-lemgendizer';

// Get processor classes
const LemGendaryResize \= await getLemGendaryResize();
const LemGendaryCrop \= await getLemGendaryCrop();
const LemGendaryOptimize \= await getLemGendaryOptimize();

// Use processors directly
const resizeProcessor \= new LemGendaryResize({
  dimension: 1024,
  mode: 'longest',
  algorithm: 'lanczos3'
});

const cropProcessor \= new LemGendaryCrop({
  width: 500,
  height: 500,
  mode: 'smart',
  confidenceThreshold: 70
});

const optimizeProcessor \= new LemGendaryOptimize({
  quality: 85,
  format: 'webp',
  compressionMode: 'adaptive'
});

// Process image
const resizeResult \= await resizeProcessor.process(image);
const cropResult \= await cropProcessor.process(image, resizeResult.newDimensions);
const optimizeResult \= await optimizeProcessor.process(image);
```

### ZIP Export

```
import { createLemGendaryZip } from '@lemgenda/image-lemgendizer';

// Create organized ZIP from processed results
const zipBlob \= await createLemGendaryZip(processedImages, {
  mode: 'custom',
  includeOriginal: true,
  includeOptimized: true,
  createFolders: true,
  includeInfoFile: true,
  zipName: 'my-processed-images'
});

// Download the ZIP
const url \= URL.createObjectURL(zipBlob);
const a \= document.createElement('a');
a.href \= url;
a.download \= 'processed-images.zip';
a.click();
URL.revokeObjectURL(url);
```

### Validation System

```
import {
  validateImage,
  validateTask,
  ValidationErrors,
  ValidationWarnings
} from '@lemgenda/image-lemgendizer';

// Validate image file
const imageValidation \= validateImage(file, {
  maxFileSize: 50 \* 1024 \* 1024, // 50MB
  allowedTypes: \['image/jpeg', 'image/png', 'image/webp'\],
  checkDimensions: true,
  minDimensions: { width: 100, height: 100 }
});

if (!imageValidation.valid) {
  console.error('Image validation failed:', imageValidation.errors);
}

// Validate task
const taskValidation \= await validateTask(task, image);

if (taskValidation.hasWarnings) {
  taskValidation.warnings.forEach(warning \=> {
    console.warn(\`${warning.severity}: ${warning.message}\`);
  });
}
```

## 📁 Project Structure

```
core/
├── src/
│   ├── processors/              # Processing modules
│   │   ├── LemGendaryResize.js   # Intelligent resizing
│   │   ├── LemGendaryCrop.js     # AI-powered cropping
│   │   ├── LemGendaryOptimize.js # Advanced optimization
│   │   └── LemGendaryRename.js   # Batch renaming
│   ├── templates/               # Template system
│   │   └── templateConfig.js    # 50+ pre-configured templates
│   ├── tasks/                   # Task pipeline
│   │   └── LemGendTask.js       # Unified processing pipeline
│   ├── utils/                   # Utilities
│   │   ├── zipUtils.js          # ZIP creation/extraction
│   │   ├── imageUtils.js        # Image manipulation helpers
│   │   ├── stringUtils.js       # String/pattern utilities
│   │   ├── sharedUtils.js       # Shared helper functions
│   │   ├── templateUtils.js     # Template utilities
│   │   ├── processingUtils.js   # Processing pipeline utilities
│   │   └── validationUtils.js   # Comprehensive validation
│   ├── LemGendImage.js          # Core image representation class
│   └── index.js                 # Main entry point
```

## 🔌 API Reference

### Core Functions

| Function | Description |
| --- | --- |
| `lemGendaryProcessBatch()` | Main batch processing function |
| `processWithTemplate()` | Process image using template |
| `processFlexibleTemplate()` | Process with flexible dimension template |
| `processFaviconSet()` | Generate favicon set |
| `getLibraryInfo()` | Get library version and info |
| `getAllProcessors()` | Get all processor classes at once |

### Class Getters (Dynamically Imported)

| Function | Returns | Description |
| --- | --- | --- |
| `getLemGendTask()` | `LemGendTask` | Unified processing pipeline |
| `getLemGendImage()` | `LemGendImage` | Core image representation |
| `getLemGendaryResize()` | `LemGendaryResize` | Intelligent resizing processor |
| `getLemGendaryCrop()` | `LemGendaryCrop` | AI-powered cropping processor |
| `getLemGendaryOptimize()` | `LemGendaryOptimize` | Advanced optimization processor |
| `getLemGendaryRename()` | `LemGendaryRename` | Batch renaming processor |

### Utility Functions

#### Image Utilities

```
import {
  getImageDimensions,
  formatFileSize,
  createThumbnail,
  analyzeForOptimization,
  resizeImage,
  cropImage,
  validateImageFile
} from '@lemgenda/image-lemgendizer';
```

#### ZIP Utilities

```
import {
  createLemGendaryZip,
  createSimpleZip,
  extractZip,
  getZipInfo,
  createOptimizedZip
} from '@lemgenda/image-lemgendizer';
```

#### Template Utilities

```
import {
  getTemplateById,
  validateTemplateCompatibility,
  getTemplateStats,
  getFlexibleTemplates
} from '@lemgenda/image-lemgendizer';
```

#### Validation Utilities

```
import {
  validateTask,
  validateImage,
  validateResizeOptions,
  validateCropOptions,
  validateOptimizationOptions,
  ValidationErrors,
  ValidationWarnings
} from '@lemgenda/image-lemgendizer';
```

## ⚙️ Configuration

### Vite Configuration (for building)

```
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(\_\_dirname, 'src/index.js'),
      formats: \['es', 'cjs'\],
      fileName: (format) \=> format \=== 'es' ? 'index.es.js' : 'index.cjs.js'
    },
    rollupOptions: {
      external: \['jszip'\]
    },
    sourcemap: true
  }
});
```

### Package Configuration

```
{
  "name": "@lemgenda/image-lemgendizer",
  "version": "3.0.0",
  "type": "module",
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.es.js",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js"
    },
    "./utils": "./dist/utils/index.js",
    "./processors": "./dist/processors/index.js",
    "./templates": "./dist/templates/index.js",
    "./LemGendImage": "./dist/LemGendImage.js",
    "./LemGendTask": "./dist/tasks/LemGendTask.js"
  }
}
```

## 📊 Performance Tips

1.  Enable Parallel Processing: Use `parallel: true` for batch processing

2.  Use Appropriate Quality: 85% quality often provides best size/quality balance

3.  Resize Before Optimizing: Reduce dimensions before compression

4.  Use WebP/AVIF: Modern formats offer better compression

5.  Validate Early: Validate images and tasks before processing

6.  Clean Up Resources: Call `image.destroy()` when done with images

7.  Use Thumbnails: Use `createThumbnail()` for previews instead of full images


## 🧪 Testing

```
// Example test for image processing
import { getLemGendTask, getLemGendImage } from '@lemgenda/image-lemgendizer';

describe('Image Processing', () \=> {
  test('should resize and optimize image', async () \=> {
    const LemGendTask \= await getLemGendTask();
    const LemGendImage \= await getLemGendImage();

    const task \= new LemGendTask('Test Task');
    task.addResize(800, 'longest').addOptimize(85, 'webp');

    const image \= new LemGendImage(testFile);
    await image.load();

    const validation \= await task.validate(image);
    expect(validation.isValid).toBe(true);
  });
});
```

## 🤝 Contributing

1.  Fork the repository

2.  Create a feature branch: `git checkout -b feature/new-feature`

3.  Make your changes

4.  Run tests: `npm test`

5.  Commit changes: `git commit -am 'Add new feature'`

6.  Push to branch: `git push origin feature/new-feature`

7.  Submit a Pull Request


## 📄 License

MIT © LemGenda

## 📞 Support

-   GitHub Issues: [Report bugs or request features](https://github.com/lemgenda/image-lemgendizer-core/issues)

-   Documentation: [Full API documentation](https://github.com/lemgenda/image-lemgendizer-core)

-   Examples: [Example projects](https://github.com/lemgenda/image-lemgendizer-examples)


## 🌟 Features in Detail

### Intelligent Cropping Modes

-   `smart`: AI-powered content-aware cropping

-   `face`: Face detection and centering

-   `object`: Object detection (person, car, animal, etc.)

-   `saliency`: Visual attention/saliency detection

-   `entropy`: Information-rich area detection

-   `center`: Simple center crop

-   Positional: `top`, `bottom`, `left`, `right`, corner crops


### Optimization Features

-   Format Selection: Auto-selects best format (WebP, AVIF, JPEG, PNG)

-   Adaptive Compression: Adjusts compression based on content

-   Browser Support: Modern and legacy browser targeting

-   Transparency Preservation: Maintains alpha channels when needed

-   Metadata Stripping: Removes EXIF and other metadata

-   Content Analysis: Analyzes image for optimal settings


### Template System

-   50+ Pre-configured Templates: Social media, web, print, logos, favicons

-   Flexible Dimensions: Variable width/height support

-   Category Organization: Web, Social, Logo, Favicon, Ecommerce, Print

-   Validation: Template compatibility checking

-   Statistics: Template usage and dimension analysis


### Validation System

-   Image Validation: File type, size, dimensions, transparency

-   Task Validation: Step order, compatibility, logic errors

-   Template Validation: Dimension matching, aspect ratios

-   Warning System: Non-blocking warnings with suggestions

-   Error System: Blocking errors with detailed messages


* * *

Built with ❤️ by LemGenda