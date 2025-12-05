import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateOptimizationOptions,
  validateImage,
  validateDimensions,
  parseDimension,
  isVariableDimension,
  ValidationErrors,
  ValidationWarnings
} from '../../src/utils/validation.js'

describe('Validation Utilities', () => {
  describe('parseDimension', () => {
    it('should parse numeric dimensions', () => {
      const result = parseDimension('1920')
      expect(result.value).toBe(1920)
      expect(result.isVariable).toBe(false)
      expect(result.type).toBe('fixed')
    })

    it('should parse variable dimensions', () => {
      const result = parseDimension('auto')
      expect(result.value).toBe(null)
      expect(result.isVariable).toBe(true)
      expect(result.type).toBe('auto')
    })

    it('should parse flex dimensions', () => {
      const result = parseDimension('flex')
      expect(result.isVariable).toBe(true)
      expect(result.type).toBe('flex')
    })

    it('should handle numeric input', () => {
      const result = parseDimension(1920)
      expect(result.value).toBe(1920)
      expect(result.isVariable).toBe(false)
    })
  })

  describe('isVariableDimension', () => {
    it('should identify variable dimensions', () => {
      expect(isVariableDimension('auto')).toBe(true)
      expect(isVariableDimension('flex')).toBe(true)
      expect(isVariableDimension('variable')).toBe(true)
      expect(isVariableDimension('natural')).toBe(true)
      expect(isVariableDimension('AUTO')).toBe(true) // case insensitive
    })

    it('should reject non-variable dimensions', () => {
      expect(isVariableDimension('1920')).toBe(false)
      expect(isVariableDimension(1920)).toBe(false)
      expect(isVariableDimension('width')).toBe(false)
      expect(isVariableDimension(null)).toBe(false)
      expect(isVariableDimension(undefined)).toBe(false)
    })
  })

  describe('validateOptimizationOptions', () => {
    it('should validate valid options', () => {
      const result = validateOptimizationOptions({
        quality: 85,
        format: 'webp',
        compressionMode: 'balanced'
      })
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid quality', () => {
      const result = validateOptimizationOptions({ quality: 0 })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(ValidationErrors.QUALITY_OUT_OF_RANGE)
    })

    it('should reject invalid format', () => {
      const result = validateOptimizationOptions({ format: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(ValidationErrors.INVALID_FORMAT)
    })

    it('should warn about low quality', () => {
      const result = validateOptimizationOptions({ quality: 30 })
      expect(result.valid).toBe(true)
      expect(result.warnings[0].code).toBe(ValidationWarnings.LOW_QUALITY)
    })

    it('should warn about high quality', () => {
      const result = validateOptimizationOptions({ quality: 99 })
      expect(result.valid).toBe(true)
      expect(result.warnings[0].code).toBe(ValidationWarnings.HIGH_QUALITY)
    })

    it('should adjust AVIF quality', () => {
      const result = validateOptimizationOptions({ 
        format: 'avif',
        quality: 85 
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === 'AVIF_QUALITY_ADJUSTED')).toBe(true)
    })

    it('should warn about JPEG transparency loss', () => {
      const result = validateOptimizationOptions({ 
        format: 'jpg',
        preserveTransparency: true
      })
      expect(result.warnings.some(w => w.code === ValidationWarnings.TRANSPARENCY_LOSS)).toBe(true)
    })
  })

  describe('validateImage', () => {
    it('should validate valid image file', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = validateImage(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.metadata.name).toBe('test.jpg')
    })

    it('should reject non-File objects', () => {
      const result = validateImage({ name: 'test.jpg' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(ValidationErrors.INVALID_FILE)
    })

    it('should reject unsupported file types', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' })
      const result = validateImage(mockFile)
      
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(ValidationErrors.UNSUPPORTED_TYPE)
    })

    it('should warn about large files', () => {
      const mockData = new Array(11 * 1024 * 1024).fill('a')
      const mockFile = new File(mockData, 'large.jpg', { type: 'image/jpeg' })
      const result = validateImage(mockFile)
      
      expect(result.valid).toBe(true)
      expect(result.warnings[0].code).toBe(ValidationWarnings.LARGE_FILE)
    })
  })

  describe('validateDimensions', () => {
    it('should validate fixed dimensions', () => {
      const result = validateDimensions({ width: 1920, height: 1080 })
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.dimensions.width).toBe(1920)
      expect(result.dimensions.height).toBe(1080)
      expect(result.dimensions.aspectRatio).toBe(1920 / 1080)
      expect(result.dimensions.orientation).toBe('landscape')
    })

    it('should validate variable dimensions', () => {
      const result = validateDimensions({ width: 'auto', height: 1080 }, { allowVariable: true })
      
      expect(result.valid).toBe(true)
      expect(result.hasVariableDimensions).toBe(true)
      expect(result.warnings[0].code).toBe(ValidationWarnings.VARIABLE_DIMENSION_USED)
    })

    it('should reject variable dimensions when not allowed', () => {
      const result = validateDimensions({ width: 'auto', height: 1080 }, { allowVariable: false })
      
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe(ValidationErrors.VARIABLE_DIMENSION_NOT_ALLOWED)
    })

    it('should reject invalid dimensions', () => {
      const result = validateDimensions({ width: 'invalid', height: 1080 })
      expect(result.valid).toBe(false)
    })

    it('should warn about small dimensions', () => {
      const result = validateDimensions({ width: 10, height: 10 })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === ValidationWarnings.SMALL_DIMENSIONS)).toBe(true)
    })

    it('should warn about large dimensions', () => {
      const result = validateDimensions({ width: 5000, height: 5000 })
      expect(result.valid).toBe(true)
      expect(result.warnings.some(w => w.code === ValidationWarnings.LARGE_DIMENSIONS)).toBe(true)
    })
  })
})
