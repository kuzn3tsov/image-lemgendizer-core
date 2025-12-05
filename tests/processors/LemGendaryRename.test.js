import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LemGendaryRename } from '../../src/processors/LemGendaryRename.js'
import { createMockLemGendImage } from '../helpers.js'

_validateOptions = () => {
  if (!this.pattern || this.pattern.trim() === '') {
    throw new Error('Rename pattern cannot be empty')
  }
}

describe('LemGendaryRename', () => {
  let processor
  let mockImage

  beforeEach(() => {
    processor = new LemGendaryRename({
      pattern: '{name}-{index}',
      startIndex: 1
    })
    mockImage = createMockLemGendImage({
      originalName: 'test-image.jpg',
      width: 1920,
      height: 1080
    })
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultProcessor = new LemGendaryRename()
      expect(defaultProcessor.pattern).toBe('{name}-{index}')
      expect(defaultProcessor.startIndex).toBe(1)
      expect(defaultProcessor.preserveExtension).toBe(true)
    })

    it('should create instance with custom options', () => {
      const customProcessor = new LemGendaryRename({
        pattern: '{date}-{time}-{name}',
        startIndex: 100,
        preserveExtension: false
      })
      expect(customProcessor.pattern).toBe('{date}-{time}-{name}')
      expect(customProcessor.startIndex).toBe(100)
      expect(customProcessor.preserveExtension).toBe(false)
    })
  })

  describe('_validateOptions', () => {
    it('should validate valid options', () => {
      expect(() => processor._validateOptions()).not.toThrow()
    })

    it('should throw error for empty pattern', () => {
      const invalidProcessor = new LemGendaryRename({ pattern: '' })
      expect(() => invalidProcessor._validateOptions()).toThrow('Rename pattern cannot be empty')
    })

    it('should throw error for pattern with invalid characters', () => {
      const invalidProcessor = new LemGendaryRename({ pattern: 'file<name>' })
      expect(() => invalidProcessor._validateOptions()).toThrow('Pattern contains invalid filename characters')
    })
  })

  describe('_generateVariables', () => {
    it('should generate variables from image', () => {
      const variables = processor._generateVariables(mockImage, 0)

      expect(variables.name).toBe('test-image')
      expect(variables.originalName).toBe('test-image.jpg')
      expect(variables.index).toBe(1)
      expect(variables.width).toBe(1920)
      expect(variables.height).toBe(1080)
      expect(variables.dimensions).toBe('1920x1080')
      expect(variables.extension).toBe('jpg')
      expect(variables.index_padded).toBeDefined()
    })

    it('should generate padded index', () => {
      const variables = processor._generateVariables(mockImage, 0)
      expect(variables.index_padded).toBe('001')
    })
  })

  describe('_formatDate', () => {
    it('should format date with YYYY-MM-DD pattern', () => {
      const date = new Date('2024-01-15T12:30:45')
      const formatted = processor._formatDate(date, 'YYYY-MM-DD')

      expect(formatted).toBe('2024-01-15')
    })

    it('should format date with YY-M-D pattern', () => {
      const date = new Date('2024-01-15')
      const formatted = processor._formatDate(date, 'YY-M-D')

      expect(formatted).toBe('24-1-15')
    })

    it('should format time with HH-mm-ss pattern', () => {
      const date = new Date('2024-01-15T12:30:45')
      const formatted = processor._formatDate(date, 'HH-mm-ss')

      expect(formatted).toBe('12-30-45')
    })
  })

  describe('_applyPattern', () => {
    it('should apply pattern with variables', () => {
      const variables = {
        name: 'test',
        index: 1,
        width: 1920,
        height: 1080
      }

      const result = processor._applyPattern('{name}-{index}-{width}x{height}', variables)
      expect(result).toBe('test-1-1920x1080')
    })

    it('should clean invalid characters', () => {
      const variables = { name: 'test/image' }
      const result = processor._applyPattern('{name}', variables)
      expect(result).not.toContain('/')
    })

    it('should handle missing variables', () => {
      const variables = { name: 'test' }
      const result = processor._applyPattern('{name}-{missing}', variables)
      expect(result).toBe('test-')
    })

    it('should trim and clean result', () => {
      const variables = { name: '  test  ' }
      const result = processor._applyPattern('  {name}  ', variables)
      expect(result).toBe('test')
    })
  })

  describe('process', () => {
    it('should rename image successfully', async () => {
      const result = await processor.process(mockImage, 0, 5)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('LemGendaryRename')
      expect(result.originalName).toBe('test-image.jpg')
      expect(result.newName).toContain('test-image')
      expect(result.newName).toContain('1')
      expect(result.variables).toBeDefined()
    })

    it('should apply custom pattern', async () => {
      const customProcessor = new LemGendaryRename({
        pattern: 'image-{index_padded}-{dimensions}',
        startIndex: 5
      })

      const result = await customProcessor.process(mockImage, 0, 1)
      expect(result.newName).toContain('image-005-1920x1080')
    })

    it('should include date variables', async () => {
      const dateProcessor = new LemGendaryRename({
        pattern: '{date}-{name}',
        dateFormat: 'YYYY-MM-DD'
      })

      const result = await dateProcessor.process(mockImage)
      const currentDate = new Date()
      const expectedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

      expect(result.newName).toContain(expectedDate)
    })
  })

  describe('_addWarningsAndRecommendations', () => {
    it('should warn about missing unique identifier', async () => {
      const simpleProcessor = new LemGendaryRename({ pattern: 'image' })
      const result = await simpleProcessor.process(mockImage)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'no_unique_identifier'
        })
      )
    })

    it('should warn about very long filename', async () => {
      const longPatternProcessor = new LemGendaryRename({
        pattern: 'a'.repeat(300)
      })
      const result = await longPatternProcessor.process(mockImage)

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'very_long_name'
        })
      )
    })

    it('should recommend including name for significant changes', async () => {
      const differentProcessor = new LemGendaryRename({
        pattern: 'completely-different-name'
      })
      const result = await differentProcessor.process(mockImage)

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'significant_name_change'
        })
      )
    })
  })

  describe('static methods', () => {
    it('should provide common patterns', () => {
      const patterns = LemGendaryRename.getCommonPatterns()

      expect(patterns.sequential).toBe('{name}-{index_padded}')
      expect(patterns.dated).toBe('{name}-{date}')
      expect(patterns.timestamped).toBe('{name}-{timestamp}')
      expect(patterns.dimensioned).toBe('{name}-{dimensions}')
    })

    it('should provide description', () => {
      expect(LemGendaryRename.getDescription()).toBeTruthy()
      expect(LemGendaryRename.getDescription()).toContain('LemGendaryRename')
    })

    it('should provide info', () => {
      const info = LemGendaryRename.getInfo()
      expect(info.name).toBe('LemGendaryRename')
      expect(info.version).toBe('1.0.0')
      expect(info.variables).toContain('{name}')
      expect(info.variables).toContain('{index}')
      expect(info.variables).toContain('{dimensions}')
    })

    it('should create from config', () => {
      const config = { pattern: '{timestamp}-{name}', startIndex: 10 }
      const processorFromConfig = LemGendaryRename.fromConfig(config)

      expect(processorFromConfig.pattern).toBe('{timestamp}-{name}')
      expect(processorFromConfig.startIndex).toBe(10)
    })
  })
})
