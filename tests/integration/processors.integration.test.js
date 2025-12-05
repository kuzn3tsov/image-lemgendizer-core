import { describe, it, expect, beforeEach } from 'vitest'
import { LemGendaryResize } from '../../src/processors/LemGendaryResize.js'
import { LemGendaryCrop } from '../../src/processors/LemGendaryCrop.js'
import { LemGendaryOptimize } from '../../src/processors/LemGendaryOptimize.js'
import { createMockLemGendImage } from '../helpers.js'

describe('Processors Integration', () => {
  let mockImage

  beforeEach(() => {
    mockImage = createMockLemGendImage({
      width: 1920,
      height: 1080,
      originalSize: 2 * 1024 * 1024 // 2MB
    })
  })

  describe('Resize + Optimize Workflow', () => {
    it('should resize then optimize an image', async () => {
      // First resize
      const resizeProcessor = new LemGendaryResize({
        dimension: 800,
        upscale: false
      })
      
      const resizeResult = await resizeProcessor.process(mockImage)
      expect(resizeResult.success).toBe(true)
      expect(resizeResult.newDimensions.width).toBe(800)
      expect(resizeResult.newDimensions.height).toBe(450)

      // Then optimize
      const optimizeProcessor = new LemGendaryOptimize({
        quality: 85,
        format: 'webp',
        maxDisplayWidth: 800
      })
      
      const optimizeResult = await optimizeProcessor.process(mockImage)
      expect(optimizeResult.success).toBe(true)
      expect(optimizeResult.optimization.selectedFormat).toBe('webp')
      expect(optimizeResult.savings.savingsPercent).toBeGreaterThan(0)
    })

    it('should handle portrait image resize + crop', async () => {
      const portraitImage = createMockLemGendImage({
        width: 720,
        height: 1280,
        orientation: 'portrait'
      })

      // Resize to square
      const resizeProcessor = new LemGendaryResize({
        dimension: 800,
        forceSquare: true
      })
      
      const resizeResult = await resizeProcessor.process(portraitImage)
      expect(resizeResult.success).toBe(true)
      expect(resizeResult.newDimensions.width).toBe(800)
      expect(resizeResult.newDimensions.height).toBe(800)

      // Crop center
      const cropProcessor = new LemGendaryCrop({
        width: 500,
        height: 500,
        mode: 'center'
      })
      
      const cropResult = await cropProcessor.process(portraitImage)
      expect(cropResult.success).toBe(true)
    })
  })

  describe('Error Handling Chain', () => {
    it('should handle failures gracefully in sequence', async () => {
      const invalidImage = { ...mockImage, width: null, height: null }
      
      // This should fail
      const resizeProcessor = new LemGendaryResize({ dimension: 800 })
      await expect(resizeProcessor.process(invalidImage)).rejects.toThrow()
      
      // But valid operations should still work
      const validImage = createMockLemGendImage({ width: 100, height: 100 })
      const validResult = await resizeProcessor.process(validImage)
      expect(validResult.success).toBe(true)
    })
  })

  describe('Multiple Processor Types', () => {
    it('should demonstrate complete workflow', async () => {
      const testImage = createMockLemGendImage({
        width: 4000,
        height: 3000,
        originalSize: 5 * 1024 * 1024 // 5MB
      })

      // Step 1: Resize for web
      const resizeProcessor = new LemGendaryResize({
        dimension: 1920,
        mode: 'longest'
      })
      
      const resizeResult = await resizeProcessor.process(testImage)
      expect(resizeResult.newDimensions.width).toBe(1920)
      expect(resizeResult.newDimensions.height).toBe(1440)

      // Step 2: Smart crop for thumbnail
      const cropProcessor = new LemGendaryCrop({
        width: 500,
        height: 500,
        mode: 'smart',
        fallbackToSimple: true
      })
      
      const cropResult = await cropProcessor.process(testImage)
      expect(cropResult.success).toBe(true)

      // Step 3: Optimize for web delivery
      const optimizeProcessor = new LemGendaryOptimize({
        quality: 80,
        format: 'webp',
        compressionMode: 'balanced'
      })
      
      const optimizeResult = await optimizeProcessor.process(testImage)
      expect(optimizeResult.success).toBe(true)
      expect(optimizeResult.savings.savingsPercent).toBeGreaterThan(50)
    })
  })
})
