# LemGendary Image Processor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/image-lemgendizer.svg)](https://www.npmjs.com/package/@lemgenda/image-lemgendizer)
[![Downloads](https://img.shields.io/npm/dm/image-lemgendizer.svg)](https://www.npmjs.com/package/@lemgenda/image-lemgendizer)

A powerful, client-side batch image processing library with intelligent resizing, cropping, optimization, and template support. Built for modern web applications with zero external dependencies for core operations.

## Features

### Intelligent Processing
- **LemGendaryResize™** - Smart dimension selection based on orientation
- **LemGendaryCrop™** - Precise cropping with multiple position options
- **LemGendaryOptimize™** - Format conversion with quality optimization
- **LemGendaryRename™** - Pattern-based batch renaming

### Template System
- 40+ pre-configured templates for social media, web, and logos
- Platform-specific dimensions (Instagram, Facebook, Twitter, etc.)
- Custom template support
- Automatic aspect ratio matching

### Core Capabilities
- **Client-side processing** - No server required, complete privacy
- **Batch operations** - Process multiple images simultaneously
- **ZIP export** - Organized folder structure with metadata
- **Validation & warnings** - Real-time feedback and suggestions
- **Progress tracking** - Built-in progress reporting

### New Features
- **Complete Favicon Generation**: 9 favicon templates for all devices
- **Favicon-Aware Processors**: Intelligent resizing/cropping for icons
- **Batch Favicon Sets**: Generate multiple sizes at once
- **ICO Format Support**: Native .ico file optimization
- **Organized ZIP Export**: Dedicated favicon folder structure

### Format Support
- **Input**: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF
- **Output**: WebP, JPEG, PNG, AVIF (browser-dependent)
- **Vector support**: SVG processing with raster conversion

## Installation

```
npm install @lemgenda/image-lemgendizer-core
# or
yarn add @lemgenda/image-lemgendizer-core
# or
pnpm add @lemgenda/image-lemgendizer-core
```
## Quick Start
### Basic Usage
#### Simple Web Image Optimization
```
import { LemGendTask, lemGendaryProcessBatch } from '@lemgenda/image-lemgendizer-core'

// Create a task for web optimization
const task = new LemGendTask('Web Images')
  .addResize(1920, 'longest')  // Resize to max 1920px (preserve aspect ratio)
  .addOptimize(85, 'webp')     // Convert to WebP at 85% quality
  .addRename('{name}-optimized')

// Process files
const files = [...] // Array of File objects from file input
const results = await lemGendaryProcessBatch(files, task, {
  onProgress: (progress, current, total) => {
    console.log(`Processing: ${current}/${total} (${Math.round(progress * 100)}%)`)
  }
})

// Download each processed image
results.forEach(result => {
  if (result.success) {
    const url = URL.createObjectURL(result.file)
    const a = document.createElement('a')
    a.href = url
    a.download = result.file.name
    a.click()
    URL.revokeObjectURL(url)
  }
})
```
#### Batch Processing with ZIP Download
```
import { lemGendaryProcessBatch, lemGendBuildZip } from '@lemgenda/image-lemgendizer-core'

// Create a comprehensive processing pipeline
const task = new LemGendTask('Social Media Package')
  .addResize(1200, 'longest')         // Resize for social media
  .addSmartCrop(1080, 1080, {         // AI-powered smart cropping
    confidenceThreshold: 70,
    multipleFaces: true
  })
  .addWebOptimization({              // Web-optimized compression
    quality: 90,
    format: 'auto'
  })
  .addRename('social-post-{timestamp}')

// Process images
const results = await lemGendaryProcessBatch(files, task)

// Create ZIP archive
const zipBlob = await lemGendBuildZip(results, {
  zipName: 'social-media-posts.zip',
  createFolders: true,
  includeInfoFile: true
})

// Download ZIP
downloadBlob(zipBlob, 'social-media-posts.zip')

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```
### Using Templates
#### Template-Based Processing
```
import {
  getTemplatesByPlatform,
  getRecommendedTemplates,
  processWithTemplate
} from '@lemgenda/image-lemgendizer-core'

// Get all Instagram templates
const instagramTemplates = getTemplatesByPlatform('instagram')
console.log('Instagram templates:', instagramTemplates)

// Get recommended templates for an image
const imageFile = event.target.files[0]
const image = new LemGendImage(imageFile)
await image.load()

const recommended = getRecommendedTemplates(image, {
  category: 'social',
  minMatchScore: 0.7
})

// Process using a specific template
const result = await processWithTemplate(image, 'instagram-square', {
  quality: 90,
  compressionMode: 'balanced'
})

if (result.success) {
  // Download the processed image
  downloadFile(result.file, result.file.name)
}
```
#### Social Media Profile Pictures
```
import { LemGendTemplates, getTemplateById } from '@lemgenda/image-lemgendizer-core'

// Create task for social media profile pictures
const task = new LemGendTask('Profile Pictures')
  .addResize(400, 'longest')          // Resize to platform requirements
  .addCrop(400, 400, 'smart', {       // Smart crop for faces
    confidenceThreshold: 75,
    preserveAspectRatio: true
  })
  .addOptimize(90, 'png', {          // PNG for transparency support
    preserveTransparency: true
  })
  .addRename('profile-{name}-{dimensions}')

// Or use template shortcuts
const profileTask = LemGendTask.fromTemplate('social-media')
```
### Advanced Features
#### AI-Powered Smart Cropping
```
// Face detection cropping
const faceCropTask = new LemGendTask('Portrait Cropping')
  .addResize(1080, 'longest')
  .addSmartCrop(1080, 1350, {
    mode: 'face',                    // AI face detection
    confidenceThreshold: 80,         // Require high confidence
    multipleFaces: false,           // Focus on single face
    cropToFit: true
  })
  .addOptimize(95, 'auto')          // Auto-format selection
```
#### Favicon Generation
```
import { processFaviconSet } from '@lemgenda/image-lemgendizer-core'

// Generate complete favicon package
const faviconResults = await processFaviconSet(logoFile, {
  sizes: [16, 32, 48, 64, 128, 180, 192, 256, 512],
  formats: ['png', 'ico'],
  includeManifest: true,
  includeHTML: true,
  roundCorners: true
})

// Create ZIP with all favicon files
const faviconBlob = await createOptimizedZip(faviconResults, {
  zipName: 'favicon-package.zip'
})
```
#### Flexible Dimension Templates
```
import { getFlexibleTemplates, processFlexibleTemplate } from '@lemgenda/image-lemgendizer-core'

// Get templates with flexible dimensions
const flexibleTemplates = getFlexibleTemplates()

// Process with flexible template
const flexibleResult = await processFlexibleTemplate(image, flexibleTemplates[0], {
  quality: 85,
  format: 'webp'
})
```
### UI Integration Examples
#### Drag & Drop File Upload
```
import { validateImage, batchProcess } from '@lemgenda/image-lemgendizer-core'

// Setup drag & drop area
const dropArea = document.getElementById('drop-area')

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropArea.classList.add('drag-over')
})

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('drag-over')
})

dropArea.addEventListener('drop', async (e) => {
  e.preventDefault()
  dropArea.classList.remove('drag-over')

  const files = Array.from(e.dataTransfer.files)

  // Validate files
  const validFiles = files.filter(file => {
    const validation = validateImage(file, {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
    return validation.valid
  })

  // Process valid files
  if (validFiles.length > 0) {
    await processFiles(validFiles)
  }
})
```
#### Progress Bar Implementation
```
import { lemGendaryProcessBatch } from '@lemgenda/image-lemgendizer-core'

// Create progress UI
const progressBar = document.getElementById('progress-bar')
const progressText = document.getElementById('progress-text')
const statusText = document.getElementById('status-text')

async function processWithProgress(files, task) {
  let processedCount = 0

  const results = await lemGendaryProcessBatch(files, task, {
    onProgress: (progress, current, total) => {
      processedCount = current
      progressBar.style.width = `${progress * 100}%`
      progressText.textContent = `${current}/${total}`
      statusText.textContent = `Processing ${current} of ${total}...`
    },
    onWarning: (warning) => {
      console.warn('Processing warning:', warning)
      // Show warning to user
      showNotification(warning.message, 'warning')
    }
  })

  // Update UI with results
  const successful = results.filter(r => r.success).length
  statusText.textContent = `Complete! ${successful}/${files.length} processed successfully`

  return results
}
```
#### Preview Before Processing
```
import { LemGendImage, getImageDimensions, createThumbnail } from '@lemgenda/image-lemgendizer-core'

// Preview uploaded images
async function previewFiles(files) {
  const previewContainer = document.getElementById('preview-container')
  previewContainer.innerHTML = ''

  for (const file of files) {
    // Create thumbnail
    const thumbnail = await createThumbnail(file, 200, 200)

    // Get dimensions
    const dimensions = await getImageDimensions(file)

    // Create preview element
    const preview = document.createElement('div')
    preview.className = 'image-preview'
    preview.innerHTML = `
      <img src="${URL.createObjectURL(thumbnail)}" alt="${file.name}">
      <div class="image-info">
        <div>${file.name}</div>
        <div>${dimensions.width} × ${dimensions.height}</div>
        <div>${formatFileSize(file.size)}</div>
      </div>
    `

    previewContainer.appendChild(preview)
  }
}
```
### Template Examples
#### Instagram Content Creator
```
// Create Instagram content in multiple formats
const instagramTask = new LemGendTask('Instagram Content')
  // Square post
  .addResize(1080, 'longest')
  .addCrop(1080, 1080, 'smart', {
    objectsToDetect: ['person', 'face', 'product']
  })
  .addOptimize(92, 'jpg')
  .addRename('instagram-square-{timestamp}')

  // Story post (separate output)
  .addResize(1080, 'height')
  .addCrop(1080, 1920, 'smart')
  .addOptimize(90, 'jpg')
  .addRename('instagram-story-{timestamp}')
```
#### E-commerce Product Images
```
const productTask = new LemGendTask('Product Images')
  // Main product image
  .addResize(1200, 'longest')
  .addCrop(1200, 1200, 'object', {
    objectsToDetect: ['product', 'item'],
    confidenceThreshold: 75
  })
  .addOptimize(88, 'webp')
  .addRename('product-main-{index}')

  // Thumbnail
  .addResize(300, 'longest')
  .addCrop(300, 300, 'center')
  .addOptimize(80, 'webp')
  .addRename('product-thumb-{index}')
```
#### Blog Post Images
```
const blogTask = new LemGendTask('Blog Images')
  .addResize(1200, 'width')           // Fixed width, flexible height
  .addOptimize(85, 'webp', {
    preserveTransparency: true,
    compressionMode: 'adaptive'
  })
  .addRename('blog-{name}-{width}w')
```
### Error Handling
#### Robust Error Handling
```
try {
  const task = new LemGendTask('Optimization')
    .addResize(1920, 'longest')
    .addOptimize(85, 'webp')

  // Validate task first
  const validation = await task.validate()

  if (!validation.isValid) {
    console.error('Task validation errors:', validation.errors)
    // Show errors to user
    validation.errors.forEach(error => {
      showError(`Task error: ${error.message}`)
    })
    return
  }

  if (validation.hasWarnings) {
    validation.warnings.forEach(warning => {
      console.warn('Task warning:', warning)
      // Show warnings to user
      showWarning(`Warning: ${warning.message}`)
    })
  }

  // Process with error handling
  const results = await lemGendaryProcessBatch(files, task, {
    onError: (error, file) => {
      console.error(`Failed to process ${file.name}:`, error)
      showError(`Failed to process ${file.name}: ${error.message}`)
    }
  })

  // Check results
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.warn(`${failed.length} files failed to process`)
    // Offer to retry failed files
  }

} catch (error) {
  console.error('Processing failed:', error)
  showError(`Processing failed: ${error.message}`)
}
```
### Utility Functions
#### Image Utilities
```
import {
  hasTransparency,
  calculateAspectRatioFit,
  formatFileSize,
  fileToDataURL
} from '@lemgenda/image-lemgendizer-core'

// Check image properties
const hasAlpha = await hasTransparency(imageFile)
console.log('Has transparency:', hasAlpha)

// Calculate resize dimensions
const targetSize = { width: 800, height: 600 }
const fitted = calculateAspectRatioFit(
  originalWidth,
  originalHeight,
  targetSize.width,
  targetSize.height
)

// Format file size for display
const sizeStr = formatFileSize(file.size) // "2.5 MB"

// Convert file to data URL for preview
const dataURL = await fileToDataURL(file)
```
#### ZIP Utilities
```
import {
  createSimpleZip,
  extractZip,
  getZipInfo
} from '@lemgenda/image-lemgendizer-core'

// Create simple ZIP
const simpleZip = await createSimpleZip(files, 'images.zip')

// Extract ZIP contents
const extracted = await extractZip(zipFile)

// Get ZIP information
const zipInfo = await getZipInfo(zipFile)
console.log('ZIP contains:', zipInfo.files.length, 'files')
```
### Best Practices

1. Always validate tasks before processing
2. Use templates for common use cases
3. Implement progress indicators for batch operations
4. Handle errors gracefully with user feedback
5. Use appropriate compression based on image type
6. Consider browser support when choosing formats
7. Preview images before processing
8. Offer ZIP download for batch outputs
9. Use AI cropping for portraits and products
10. Test with various image types and sizes

## Template Reference

### Social Media Templates (35 Templates)

#### Instagram (5 Templates)
| Template             | Display Name     | Dimensions | Aspect Ratio | Recommended Formats |
|----------------------|------------------|------------|--------------|---------------------|
| instagram-profile    | Profile Picture  | 320×320    | 1:1          | JPG, WebP           |
| instagram-square     | Square Post      | 1080×1080  | 1:1          | JPG, WebP           |
| instagram-portrait   | Portrait Post    | 1080×1350  | 4:5          | JPG, WebP           |
| instagram-landscape  | Landscape Post   | 1080×566   | 1.91:1       | JPG, WebP           |
| instagram-stories    | Stories & Reels  | 1080×1920  | 9:16         | JPG, WebP           |

#### Facebook (5 Templates)
| Template           | Display Name   | Dimensions | Aspect Ratio | Recommended Formats |
|--------------------|----------------|------------|--------------|---------------------|
| facebook-profile   | Profile Picture| 180×180    | 1:1          | JPG, PNG            |
| facebook-cover     | Cover Photo    | 851×315    | ~2.7:1       | JPG, PNG            |
| facebook-shared    | Shared Image   | 1200×630   | 1.91:1       | JPG, PNG            |
| facebook-square    | Square Post    | 1200×1200  | 1:1          | JPG, PNG            |
| facebook-stories   | Stories        | 1080×1920  | 9:16         | JPG, PNG            |

#### Twitter / X (5 Templates)
| Template           | Display Name     | Dimensions | Aspect Ratio | Recommended Formats |
|--------------------|------------------|------------|--------------|---------------------|
| twitter-profile    | Profile Picture  | 400×400    | 1:1          | JPG, PNG            |
| twitter-header     | Header Banner    | 1500×500   | 3:1          | JPG, PNG            |
| twitter-landscape  | Landscape Post   | 1600×900   | 16:9         | JPG, PNG            |
| twitter-square     | Square Post      | 1080×1080  | 1:1          | JPG, PNG            |
| twitter-portrait   | Portrait Post    | 1080×1350  | 4:5          | JPG, PNG            |

#### LinkedIn (5 Templates)
| Template           | Display Name        | Dimensions | Aspect Ratio | Recommended Formats |
|--------------------|---------------------|------------|--------------|---------------------|
| linkedin-profile   | Profile Picture     | 400×400    | 1:1          | JPG, PNG            |
| linkedin-cover     | Personal Cover Photo| 1584×396   | 4:1          | JPG, PNG            |
| linkedin-landscape | Landscape Post      | 1200×627   | 1.91:1       | JPG, PNG            |
| linkedin-square    | Square Post         | 1200×1200  | 1:1          | JPG, PNG            |
| linkedin-portrait  | Portrait Post       | 720×900    | 4:5          | JPG, PNG            |

#### YouTube (3 Templates)
| Template           | Display Name    | Dimensions | Aspect Ratio | Recommended Formats |
|--------------------|-----------------|------------|--------------|---------------------|
| youtube-channel    | Channel Icon    | 800×800    | 1:1          | JPG, PNG            |
| youtube-banner     | Channel Banner  | 2048×1152  | 16:9         | JPG, PNG            |
| youtube-thumbnail  | Video Thumbnail | 1280×720   | 16:9         | JPG, PNG            |

#### Pinterest (4 Templates)
| Template            | Display Name   | Dimensions | Aspect Ratio | Recommended Formats |
|---------------------|----------------|------------|--------------|---------------------|
| pinterest-profile   | Profile Picture| 165×165    | 1:1          | JPG, PNG            |
| pinterest-standard  | Standard Pin   | 1000×1500  | 2:3          | JPG, PNG            |
| pinterest-square    | Square Pin     | 1000×1000  | 1:1          | JPG, PNG            |
| pinterest-story     | Story Pin      | 1080×1920  | 9:16         | JPG, PNG            |

#### TikTok (2 Templates)
| Template         | Display Name   | Dimensions | Aspect Ratio | Recommended Formats |
|------------------|----------------|------------|--------------|---------------------|
| tiktok-profile   | Profile Picture| 200×200    | 1:1          | JPG, PNG            |
| tiktok-video     | Video Cover    | 1080×1920  | 9:16         | JPG, PNG            |

---

### Web Templates (6 Templates)
| Template     | Display Name       | Dimensions   | Aspect Ratio | Recommended Formats | Use Case                   |
|--------------|--------------------|--------------|--------------|---------------------|----------------------------|
| web-hero     | Hero Banner        | 1920×1080    | 16:9         | WebP, JPG           | Full-width website hero    |
| web-blog     | Blog Featured Image| 1200×630     | 1.91:1       | WebP, JPG           | Blog post featured images  |
| web-content  | Content Image      | 1200×auto    | Variable     | WebP, JPG, PNG      | Article content images     |
| web-thumb    | Thumbnail          | 300×300      | 1:1          | WebP, JPG           | Gallery/product thumbnails |
| web-card     | Card Image         | 400×300      | 4:3          | WebP, JPG           | Feature/product cards      |
| web-og       | Open Graph Image   | 1200×630     | 1.91:1       | JPG, PNG            | Social sharing previews    |

---

### Logo Templates (5 Templates)
| Template          | Display Name     | Dimensions | Aspect Ratio | Recommended Formats | Use Case                        |
|-------------------|------------------|------------|--------------|---------------------|---------------------------------|
| logo-rectangular  | Rectangular Logo | 300×150    | 2:1          | PNG, SVG            | Website headers, email signatures|
| logo-square       | Square Logo      | 500×500    | 1:1          | PNG, SVG            | Social media, app icons         |
| logo-print        | Print-Ready Logo | 3000×3000  | 1:1          | PNG, SVG, PDF, EPS  | Business cards, merchandise     |
| logo-watermark    | Watermark        | 1000×400   | 2.5:1        | PNG                 | Photo overlays                  |
| logo-vertical     | Vertical Logo    | 500×800    | 5:8          | PNG, SVG            | Mobile apps, documentation      |

---

### Favicon Templates (9 Templates) - NEW!
| Template          | Display Name        | Dimensions | Aspect Ratio | Recommended Formats | Use Case                  |
|-------------------|---------------------|------------|--------------|---------------------|---------------------------|
| favicon-basic     | Basic Favicon       | 16×16      | 1:1          | ICO, PNG            | Standard browser tab icon |
| favicon-standard  | Standard Favicon Set| 32×32      | 1:1          | ICO                 | Desktop browsers          |
| favicon-modern    | Modern Favicon Set  | 180×180    | 1:1          | PNG, SVG            | All modern devices        |
| favicon-apple     | Apple Touch Icon    | 180×180    | 1:1          | PNG                 | iOS home screen           |
| favicon-android   | Android Chrome Icon | 192×192    | 1:1          | PNG                 | Android home screen       |
| favicon-safari    | Safari Pinned Tab   | 16×16      | 1:1          | SVG                 | Safari pinned tabs        |
| favicon-windows   | Windows Tile        | 144×144    | 1:1          | PNG                 | Windows start menu        |
| favicon-retina    | Retina Favicon      | 64×64      | 1:1          | PNG, ICO            | High-DPI/Retina displays  |
| favicon-complete  | Complete Package    | all        | 1:1          | ICO, PNG, SVG       | All devices and sizes     |

### Template Categories Summary
| Category     | Number of Templates | Platforms Covered                                                                |
|--------------|---------------------|----------------------------------------------------------------------------------|
| Social Media | 35                  | Instagram (5), Facebook (5), Twitter/X (5), LinkedIn (5), YouTube (3), Pinterest (4), TikTok (2) |
| Web          | 7                   | Hero, Blog, Content, Thumbnail, Card, Logo, Open Graph                           |
| Logo         | 5                  | Rectangular, Square, App Icon, Social, Print, Watermark, Vertical, Favicon Set, Icon Only |
| Favicon      | 9                   | Basic, Standard, Modern, Apple, Android, Safari, Windows, Complete, Retina       |
| **TOTAL**    | **60 Templates**    | All major platforms and use cases                                                |

### Common Aspect Ratios
| Aspect Ratio | Common Use                  | Templates |
|--------------|-----------------------------|-----------|
| 1:1 (Square) | Profile pictures, icons, logos | 28        |
| 4:5 (Portrait)| Social media portrait posts | 3         |
| 16:9 (Landscape)| YouTube, hero banners     | 4         |
| 9:16 (Vertical)| Stories, Reels, TikTok     | 5         |
| 1.91:1       | Open Graph, shared links    | 5         |
| 2:1          | Rectangular logos           | 1         |
| 3:1          | Twitter headers             | 1         |
| 4:3          | Card images                 | 1         |

### File Format Recommendations
| Format | Best For                     | Transparency | Compression |
|--------|------------------------------|--------------|-------------|
| PNG    | Logos, graphics with transparency | ✅ Yes      | Lossless    |
| JPG    | Photos, complex images       | ❌ No        | Lossy       |
| WebP   | Web images, modern browsers  | ✅ Yes       | Excellent   |
| SVG    | Logos, icons, vectors        | ✅ Yes       | Vector      |
| ICO    | Favicons, Windows icons      | ✅ Yes       | Multi-size  |
| PDF    | Print-ready logos            | ✅ Yes       | Vector      |
| EPS    | Professional printing        | ✅ Yes       | Vector      |

---

### Quick Reference by Size
| Size Category | Dimensions Range     | Common Use                          |
|---------------|----------------------|-------------------------------------|
| Tiny          | 16×16 to 48×48       | Favicons, small icons               |
| Small         | 50×50 to 200×200     | Thumbnails, UI elements             |
| Medium        | 300×300 to 800×800   | Profile pictures, logos             |
| Large         | 1000×1000 to 2000×2000 | Social media posts, web images    |
| Extra Large   | 2000×2000+           | Print, high-resolution assets       |

## Build & Development
### Building from Source
```
# Clone repository
git clone https://github.com/lemgenda/image-lemgendizer-core.git
cd image-lemgendizer-core

# Install dependencies
npm install

# Build library
npm run build

# Run tests
npm test

# Development mode
npm run dev
```
## Project Structure
```
core/
├── src/
│   ├── processors/              # Processing modules
│   │   ├── index.js
│   │   ├── LemGendaryResize.js
│   │   ├── LemGendaryCrop.js
│   │   ├── LemGendaryOptimize.js
│   │   └── LemGendaryRename.js
│   ├── templates/              # Template system
│   │   ├── index.js
│   │   ├── favicon.js
│   │   ├── social.js
│   │   ├── web.js
│   │   └── logo.js
│   ├── tasks/                  # Task pipeline
│   │   └── LemGendTask.js
│   ├── utils/                  # Utilities
│   │   ├── index.js
│   │   ├── zipUtils.js
│   │   ├── imageUtils.js
│   │   └── validation.js
│   ├── LemGendImage.js          # Core image class
│   └── index.js
├── tests/                   # Test folder inside core
│   ├── processors/
│   │   ├── LemGendaryResize.test.js
│   │   ├── LemGendaryCrop.test.js
│   │   ├── LemGendaryOptimize.test.js
│   │   └── LemGendaryRename.test.js
│   ├── utils/
│   │   ├── zipUtils.test.js
│   │   ├── imageUtils.test.js
│   │   └── validation.test.js
│   ├── mocks/
│   │   ├── fileMock.js
│   │   ├── imageMock.js
│   │   └── canvasMock.js
│   ├── setup.js
│   └── helpers.js               # Main entry point
├── package.json
├── vite.config.js
├── vite.core.config.js
├── vite.templates.config.js
├── vite.utils.config.js
├── vite.processors.config.js
└── README.md
```

## License

MIT © LemGenda

## Acknowledgments

- Built with modern web standards
- Inspired by real-world image processing needs
- Thanks to all contributors and users

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch
    (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## Support

-   Documentation
-   Issue Tracker
-   Discussions

# Features in Development

[]  AI-powered image enhancement
[]  Advanced color correction
[]  Watermark addition
[]  Background removal
[]  Batch editing presets
[]  Plugin system for custom processors
