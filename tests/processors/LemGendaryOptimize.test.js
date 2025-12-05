import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LemGendaryOptimize } from '../../src/processors/LemGendaryOptimize.js'
import { createMockLemGendImage } from '../helpers.js'

_analyzeImage = async (lemGendImage) => {
  return {
    metadata: {
      width: lemGendImage.width || 0,
      height: lemGendImage.height || 0,
      hasTransparency: lemGendImage.transparency || false,
      isFavicon: lemGendImage.type?.includes('icon') || false
    },
    content: {
      isGraphic: false,
      complexity: 'medium'
    }
  }
}

_selectBestFormat = (analysis) => {
  if (this.format !== 'auto') return this.format
  if (analysis.metadata.isFavicon) return 'ico'
  return 'webp'
}

_calculateCompression = (analysis, selectedFormat) => {
  return {
    quality: this.quality,
    compressionLevel: 'medium',
    lossless: selectedFormat === 'png'
  }
}

_checkCompatibility = (image, selectedFormat) => {
  return {
    compatible: true,
    reason: 'Format supported',
    requiresRasterization: false
  }
}

describe('LemGendaryOptimize', () => {
  let processor
  let mockImage

  beforeEach(() => {
    processor = new LemGendaryOptimize({
      quality: 85,
      format: 'webp'
    })
    mockImage = createMockLemGendImage({
      width: 1920,
      height: 1080,
      extension: 'jpg',
      transparency: false
    })
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultProcessor = new LemGendaryOptimize()
      expect(defaultProcessor.quality).toBe(85)
      expect(defaultProcessor.format).toBe('auto')
      expect(defaultProcessor.stripMetadata).toBe(true)
      expect(defaultProcessor.compressionMode).toBe('adaptive')
    })

    it('should create instance with custom options', () => {
      const customProcessor = new LemGendaryOptimize({
        quality: 90,
        format: 'avif',
        stripMetadata: false,
        compressionMode: 'aggressive'
      })
      expect(customProcessor.quality).toBe(90)
      expect(customProcessor.format).toBe('avif')
      expect(customProcessor.stripMetadata).toBe(false)
      expect(customProcessor.compressionMode).toBe('aggressive')
    })

    it('should clamp quality to valid range', () => {
      const lowQualityProcessor = new LemGendaryOptimize({ quality: -10 })
      expect(lowQualityProcessor.quality).toBe(1)

      const highQualityProcessor = new LemGendaryOptimize({ quality: 200 })
      expect(highQualityProcessor.quality).toBe(100)
    })
  })

  describe('_validateOptions', () => {
    it('should validate valid options', () => {
      expect(() => processor._validateOptions()).not.toThrow()
    })

    it('should throw error for invalid quality', () => {
      const invalidProcessor = new LemGendaryOptimize({ quality: 0 })
      expect(() => invalidProcessor._validateOptions()).toThrow('Invalid optimization options')
    })

    it('should throw error for invalid format', () => {
      const invalidProcessor = new LemGendaryOptimize({ format: 'invalid' })
      expect(() => invalidProcessor._validateOptions()).toThrow('Invalid optimization options')
    })

    it('should adjust AVIF quality scale', () => {
      const avifProcessor = new LemGendaryOptimize({ format: 'avif', quality: 85 })
      avifProcessor._validateOptions()
      expect(avifProcessor.quality).toBeLessThanOrEqual(63)
    })
  })

  describe('_analyzeImage', () => {
    it('should analyze image metadata', async () => {
      const analysis = await processor._analyzeImage(mockImage)

      expect(analysis.metadata.width).toBe(1920)
      expect(analysis.metadata.height).toBe(1080)
      expect(analysis.metadata.aspectRatio).toBe(1920/1080)
      expect(analysis.metadata.fileSize).toBe(mockImage.originalSize)
      expect(analysis.metadata.format).toBe('jpg')
      expect(analysis.metadata.hasTransparency).toBe(false)
    })

    it('should detect SVG format', async () => {
      const svgImage = createMockLemGendImage({
        type: 'image/svg+xml',
        extension: 'svg'
      })
      const analysis = await processor._analyzeImage(svgImage)

      expect(analysis.content.isGraphic).toBe(true)
      expect(analysis.content.complexity).toBe('low')
      expect(analysis.recommendations).toContain('SVG format detected')
    })

    it('should detect transparency', async () => {
      const transparentImage = createMockLemGendImage({
        transparency: true,
        extension: 'png'
      })
      const analysis = await processor._analyzeImage(transparentImage)

      expect(analysis.metadata.hasTransparency).toBe(true)
      expect(analysis.content.isGraphic).toBe(true)
      expect(analysis.recommendations).toContain('Transparency detected')
    })
  })

  describe('_selectBestFormat', () => {
    it('should return specified format when not auto', () => {
      const analysis = {
        metadata: { hasTransparency: false, isFavicon: false },
        content: { isGraphic: false }
      }

      const format = processor._selectBestFormat(analysis)
      expect(format).toBe('webp')
    })

    it('should select format automatically', async () => {
      const autoProcessor = new LemGendaryOptimize({ format: 'auto' })
      const analysis = await autoProcessor._analyzeImage(mockImage)
      const format = autoProcessor._selectBestFormat(analysis)

      expect(['webp', 'avif', 'jpg', 'png']).toContain(format)
    })

    it('should select ICO for favicon images', async () => {
      const faviconImage = createMockLemGendImage({
        type: 'image/x-icon',
        extension: 'ico'
      })
      const analysis = await processor._analyzeImage(faviconImage)
      const format = processor._selectBestFormat(analysis)

      expect(format).toBe('ico')
    })
  })

  describe('_calculateCompression', () => {
    it('should calculate compression for photographic image', async () => {
      const analysis = await processor._analyzeImage(mockImage)
      const compression = processor._calculateCompression(analysis, 'jpg')

      expect(compression.quality).toBeGreaterThanOrEqual(75)
      expect(compression.compressionLevel).toBe('medium')
    })

    it('should use lossless for PNG graphics', async () => {
      const pngImage = createMockLemGendImage({
        extension: 'png',
        transparency: true
      })
      const analysis = await processor._analyzeImage(pngImage)
      const compression = processor._calculateCompression(analysis, 'png')

      expect(compression.lossless).toBe(true)
      expect(compression.quality).toBe(100)
    })
  })

  describe('_checkCompatibility', () => {
    it('should check format compatibility', () => {
      const compatibility = processor._checkCompatibility(mockImage, 'webp')
      expect(compatibility.compatible).toBe(true)
      expect(compatibility.reason).toBe('Format supported')
    })

    it('should detect incompatible formats', () => {
      const svgImage = createMockLemGendImage({ type: 'image/svg+xml' })
      const compatibility = processor._checkCompatibility(svgImage, 'jpg')

      expect(compatibility.compatible).toBe(true)
      expect(compatibility.requiresRasterization).toBe(true)
    })
  })

  describe('_estimateSavings', () => {
    it('should estimate file size savings', async () => {
      const analysis = await processor._analyzeImage(mockImage)
      const compression = processor._calculateCompression(analysis, 'webp')
      const savings = processor._estimateSavings(analysis, 'webp', compression, null)

      expect(savings.originalSize).toBe(mockImage.originalSize)
      expect(savings.estimatedSize).toBeLessThan(savings.originalSize)
      expect(savings.savings).toBeGreaterThan(0)
      expect(savings.savingsPercent).toBeGreaterThan(0)
    })
  })

  describe('static methods', () => {
    it('should provide description', () => {
      expect(LemGendaryOptimize.getDescription()).toBeTruthy()
      expect(LemGendaryOptimize.getDescription()).toContain('LemGendaryOptimize')
    })

    it('should provide info', () => {
      const info = LemGendaryOptimize.getInfo()
      expect(info.name).toBe('LemGendaryOptimize')
      expect(info.version).toBe('2.0.0')
      expect(info.supportedFormats).toContain('webp')
      expect(info.supportedFormats).toContain('avif')
    })

    it('should create from config', () => {
      const config = { quality: 90, format: 'png' }
      const processorFromConfig = LemGendaryOptimize.fromConfig(config)

      expect(processorFromConfig.quality).toBe(90)
      expect(processorFromConfig.format).toBe('png')
    })
  })
})
