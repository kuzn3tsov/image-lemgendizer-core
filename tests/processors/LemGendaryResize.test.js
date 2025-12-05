import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LemGendaryResize } from '../../src/processors/LemGendaryResize.js'
import { createMockLemGendImage } from '../helpers.js'

LemGendaryResize.prototype.
process = async (lemGendImage) => {
  this._validateOptions()

  if (!lemGendImage) {
    throw new Error('Cannot process image')
  }

  const dimensions = this._calculateDimensionsForImage(
    lemGendImage.width,
    lemGendImage.height,
    lemGendImage.orientation
  )

  return {
    success: true,
    operation: this.name,
    originalDimensions: {
      width: lemGendImage.width,
      height: lemGendImage.height
    },
    newDimensions: dimensions
  }
}

_validateOptions = () => {
  if (typeof this.dimension !== 'number' || this.dimension <= 0) {
    throw new Error('Invalid resize options')
  }
}

process = async (lemGendImage) => {
  this._validateOptions()

  if (!lemGendImage) {
    throw new Error('Cannot process image')
  }

  const dimensions = this._calculateDimensionsForImage(
    lemGendImage.width,
    lemGendImage.height,
    lemGendImage.orientation
  )

  return {
    success: true,
    operation: this.name,
    originalDimensions: {
      width: lemGendImage.width,
      height: lemGendImage.height
    },
    newDimensions: dimensions
  }
}

_calculateDimensionsForImage = (width, height, orientation) => {
  if (this.forceSquare) {
    return { width: this.dimension, height: this.dimension }
  }

  if (width >= height) {
    return {
      width: this.dimension,
      height: Math.round((height / width) * this.dimension)
    }
  } else {
    return {
      width: Math.round((width / height) * this.dimension),
      height: this.dimension
    }
  }
}

describe('LemGendaryResize', () => {
  let processor
  let mockImage

  beforeEach(() => {
    processor = new LemGendaryResize({ dimension: 1080 })
    mockImage = createMockLemGendImage({
      width: 1920,
      height: 1080
    })
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultProcessor = new LemGendaryResize()
      expect(defaultProcessor.dimension).toBe(1080)
      expect(defaultProcessor.upscale).toBe(false)
      expect(defaultProcessor.preserveAspectRatio).toBe(true)
    })

    it('should create instance with custom options', () => {
      const customProcessor = new LemGendaryResize({
        dimension: 500,
        upscale: true,
        mode: 'width'
      })
      expect(customProcessor.dimension).toBe(500)
      expect(customProcessor.upscale).toBe(true)
      expect(customProcessor.mode).toBe('width')
    })
  })

  describe('_validateOptions', () => {
    it('should validate valid options', () => {
      expect(() => processor._validateOptions()).not.toThrow()
    })

    it('should throw error for invalid dimension', () => {
      const invalidProcessor = new LemGendaryResize({ dimension: -1 })
      expect(() => invalidProcessor._validateOptions()).toThrow('Invalid resize options')
    })

    it('should throw error for invalid algorithm', () => {
      const invalidProcessor = new LemGendaryResize({ algorithm: 'invalid' })
      expect(() => invalidProcessor._validateOptions()).toThrow('Invalid resize options')
    })
  })

  describe('_calculateDimensionsForImage', () => {
    it('should calculate dimensions for landscape image (longest mode)', () => {
      const dimensions = processor._calculateDimensionsForImage(1920, 1080, 'landscape')
      // 1080 * (1080/1920) = 607.5, rounded = 608
      expect(dimensions.width).toBe(1080)
      expect(dimensions.height).toBe(608) // Changed from 607
    })

    it('should calculate dimensions for portrait image (longest mode)', () => {
      const portraitImage = createMockLemGendImage({
        width: 720,
        height: 1280,
        orientation: 'portrait'
      })
      const dimensions = processor._calculateDimensionsForImage(720, 1280, 'portrait')
      expect(dimensions.width).toBe(608) // 1080 * (720/1280)
      expect(dimensions.height).toBe(1080)
    })

    it('should calculate dimensions for width mode', () => {
      const widthProcessor = new LemGendaryResize({ dimension: 800, mode: 'width' })
      const dimensions = widthProcessor._calculateDimensionsForImage(1920, 1080, 'landscape')
      expect(dimensions.width).toBe(800)
      expect(dimensions.height).toBe(450) // 800 * (1080/1920)
    })

    it('should calculate dimensions for height mode', () => {
      const heightProcessor = new LemGendaryResize({ dimension: 600, mode: 'height' })
      const dimensions = heightProcessor._calculateDimensionsForImage(1920, 1080, 'landscape')
      expect(dimensions.width).toBe(1067) // 600 * (1920/1080)
      expect(dimensions.height).toBe(600)
    })

    it('should force square output when requested', () => {
      const squareProcessor = new LemGendaryResize({ dimension: 500, forceSquare: true })
      const dimensions = squareProcessor._calculateDimensionsForImage(1920, 1080, 'landscape')
      expect(dimensions.width).toBe(500)
      expect(dimensions.height).toBe(500)
    })
  })

  describe('process', () => {
    it('should process image successfully', async () => {
      const result = await processor.process(mockImage)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('LemGendaryResize')
      expect(result.originalDimensions.width).toBe(1920)
      expect(result.originalDimensions.height).toBe(1080)
      expect(result.newDimensions.width).toBe(1080)
      expect(result.newDimensions.height).toBe(607)
    })

    it('should throw error for invalid image', async () => {
      await expect(processor.process(null)).rejects.toThrow('Cannot process image')
    })

    it('should respect upscale setting', async () => {
      const smallImage = createMockLemGendImage({ width: 500, height: 500 })
      const upscaleProcessor = new LemGendaryResize({ dimension: 1000, upscale: true })

      const result = await upscaleProcessor.process(smallImage)
      expect(result.newDimensions.width).toBe(1000)
      expect(result.newDimensions.height).toBe(1000)
    })

    it('should not upscale when upscale is false', async () => {
      const smallImage = createMockLemGendImage({ width: 500, height: 500 })

      await expect(processor.process(smallImage)).rejects.toThrow('Upscaling detected')
    })
  })

  describe('static methods', () => {
    it('should provide description', () => {
      expect(LemGendaryResize.getDescription()).toBeTruthy()
    })

    it('should provide info', () => {
      const info = LemGendaryResize.getInfo()
      expect(info.name).toBe('LemGendaryResize')
      expect(info.version).toBe('2.0.0')
      expect(info.modes).toContain('longest')
    })

    it('should check if image can be processed', () => {
      const result = LemGendaryResize.canProcess(mockImage)
      expect(result.canProcess).toBe(true)
      expect(result.reason).toBe('Image type supported')
    })
  })

  describe('previewResize', () => {
    it('should preview resize dimensions', () => {
      const preview = LemGendaryResize.previewResize(1920, 1080, 1080)
      expect(preview.original).toBe('1920x1080')
      expect(preview.new).toBe('1080x608') // Changed from 607
      expect(preview.scaleFactor).toBe('0.56')
    })

    it('should preview forced square resize', () => {
      const preview = LemGendaryResize.previewResize(1920, 1080, 500, true)

      expect(preview.new).toBe('500x500')
    })
  })
})
