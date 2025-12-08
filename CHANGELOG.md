# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[3.0.0\] - 2024-01-15

### ⚠️ BREAKING CHANGES

This is a major release with significant architectural changes to resolve circular dependencies and improve tree-shaking.

#### API Changes:

-   Static exports replaced with dynamic getters: All core classes and processors are now accessed via async getter functions

-   New export structure: Added subpath exports for better modular imports

-   Improved barrel exports: All utilities now properly exported through centralized barrel files


#### Migration Guide:

```
// OLD (v2.x):
import { LemGendTask, LemGendaryResize } from '@lemgenda/image-lemgendizer';

// NEW (v3.x):
import { getLemGendTask, getLemGendaryResize } from '@lemgenda/image-lemgendizer';
const LemGendTask \= await getLemGendTask();
const LemGendaryResize \= await getLemGendaryResize();

// OR use getAllProcessors() for convenience:
import { getAllProcessors } from '@lemgenda/image-lemgendizer';
const { LemGendTask, LemGendaryResize, LemGendaryCrop, LemGendaryOptimize, LemGendaryRename } \= await getAllProcessors();
```
### ✨ New Features

#### Enhanced Export System:

-   Dynamic imports: Core components loaded on-demand to prevent circular dependencies

-   Subpath exports: Import specific parts of the library via:

    -   `@lemgenda/image-lemgendizer/utils` - All utility functions

    -   `@lemgenda/image-lemgendizer/utils/shared` - Shared utilities only

    -   `@lemgenda/image-lemgendizer/processors` - Image processors

    -   `@lemgenda/image-lemgendizer/templates` - Template system

    -   `@lemgenda/image-lemgendizer/LemGendImage` - LemGendImage class directly

    -   `@lemgenda/image-lemgendizer/LemGendTask` - LemGendTask class directly


#### Utility Improvements:

-   Complete barrel exports: All utility functions now properly exported through `utils/index.js`

-   Shared utilities: `parseDimension` and `isVariableDimension` now available via main export

-   Better tree-shaking: Library marked as `sideEffects: false` for optimal bundle sizes


#### Build System:

-   TypeScript definitions: Added `.d.ts` files for better IDE support

-   Browser-specific build: Separate build for browser environments

-   Improved minification: Better compression and tree-shaking support


### 🔧 Technical Improvements

#### Architecture:

-   Circular dependency resolution: All circular imports eliminated through dynamic loading

-   Modular structure: Clean separation between core, processors, and utilities

-   Lazy loading: Heavy components only loaded when needed


#### Code Quality:

-   Type safety: Added JSDoc comments throughout

-   Better error handling: Improved validation and error messages

-   Consistent exports: All modules now follow same export patterns


#### Performance:

-   Smaller bundles: Tree-shaking friendly architecture

-   Faster loading: Dynamic imports reduce initial load time

-   Memory efficiency: Components loaded only when needed


### 📦 Package Improvements

#### New Scripts:

-   `npm run build:types` - Generate TypeScript definitions

-   `npm run test` - Run test suite with Jest

-   `npm run lint` - ESLint code quality check

-   `npm run format` - Prettier code formatting


#### Dependencies:

-   Development: Added TypeScript, Jest, ESLint, Prettier for better development experience

-   Peer dependencies: `jszip` marked as peer dependency for flexibility

-   Browser support: Modern browsers (ES2020+)


### 🐛 Bug Fixes

#### Import/Export Issues:

-   Fixed circular dependencies between main index and processors

-   Fixed missing exports in utility barrel files

-   Fixed incorrect import paths in processing utilities


#### Build Issues:

-   Fixed Vite configuration for proper library bundling

-   Fixed TypeScript declaration generation

-   Fixed browser compatibility issues


#### Functionality:

-   Fixed `isLemGendImage` import in processingUtils.js

-   Fixed `getMimeTypeFromExtension` import in zipUtils.js

-   Fixed shared utility exports in templateUtils.js and validationUtils.js


### 📚 Documentation

#### Updated:

-   README with new API examples

-   Migration guide for v2.x to v3.x

-   Subpath export documentation

-   TypeScript usage examples


#### Added:

-   Complete API reference in README

-   Import examples for all subpaths

-   Performance optimization tips

-   Browser vs Node.js usage guidelines


### 🔄 Backward Compatibility Notes

While this is a breaking change, the library maintains:

1.  Same core functionality: All image processing features remain

2.  Same configuration options: Task and processor options unchanged

3.  Same utility functions: All helper functions maintain same signatures

4.  Same template system: Template database and utilities unchanged


The primary change is in how components are imported, not what they do.

* * *

## \[2.2.1\] - 2023-12-10

### 🐛 Bug Fixes

-   Fixed issue with SVG dimension parsing

-   Improved error handling for corrupt image files

-   Fixed memory leak in canvas operations


### 📦 Build Improvements

-   Updated build dependencies

-   Improved source maps

-   Better minification settings


* * *

## \[2.2.0\] - 2023-11-15

### ✨ New Features

-   Added AVIF format support

-   Enhanced smart cropping with AI capabilities detection

-   Added favicon generation with multiple sizes

-   Improved template system with flexible dimensions


### 🔧 Improvements

-   Better browser compatibility detection

-   Enhanced error messages and validation

-   Improved ZIP creation with progress tracking

-   Optimized memory usage for large batches


### 🐛 Bug Fixes

-   Fixed transparency detection for WebP images

-   Resolved race conditions in batch processing

-   Fixed filename sanitization issues

-   Improved ICO file handling


* * *

## \[2.1.0\] - 2023-10-05

### ✨ New Features

-   Added template system for common image sizes

-   Enhanced validation utilities

-   Added string utilities for filename patterns

-   Improved ZIP utilities with custom folder structures


### 🔧 Technical

-   Refactored utility structure

-   Added shared utilities module

-   Improved export organization

-   Enhanced build configuration


* * *

## \[2.0.0\] - 2023-09-01

### ⚠️ BREAKING CHANGES

-   Complete rewrite of core architecture

-   New class-based design with LemGendImage and LemGendTask

-   Separated processors into individual modules

-   Changed API for batch processing


### ✨ New Features

-   Intelligent resize with aspect ratio preservation

-   AI-powered smart cropping

-   Advanced optimization with format selection

-   Batch renaming with pattern support

-   Comprehensive validation system


### 📦 Initial Release Features

-   Image dimension extraction

-   Format conversion (WebP, PNG, JPEG, etc.)

-   Transparency detection

-   Canvas-based image manipulation

-   ZIP file creation and extraction

-   Progress tracking for batch operations


* * *

## \[1.x\] - 2023-06-15 to 2023-08-30

### Early Development

-   Initial prototype development

-   Basic image processing utilities

-   Experimental features and APIs

-   Community feedback and testing


* * *

## Types of Changes

-   Added for new features.

-   Changed for changes in existing functionality.

-   Deprecated for soon-to-be removed features.

-   Removed for now removed features.

-   Fixed for any bug fixes.

-   Security in case of vulnerabilities.


## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

-   MAJOR version for incompatible API changes

-   MINOR version for added functionality in a backward-compatible manner

-   PATCH version for backward-compatible bug fixes


## Release Schedule

-   Major releases (X.0.0): Every 6-12 months with significant changes

-   Minor releases (X.Y.0): Every 1-2 months with new features

-   Patch releases (X.Y.Z): As needed for bug fixes


## Support Policy

-   Current major version (3.x): Full support

-   Previous major version (2.x): Security fixes only until 2024-06-30

-   Older versions: No support


* * *

_This changelog is automatically updated with each release. For detailed commit history, see the [GitHub repository](https://github.com/lemgenda/image-lemgendizer-core)._