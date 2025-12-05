import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getImageDimensions,
  hasTransparency,
  fileToDataURL,
  resizeImage,
  cropImage,
  calculateAspectRatioFit,
  formatFileSize,
  getFileExtension,
  validateImageFile,
  createThumbnail
} from '../../src/utils/imageUtils.js'
import { createMockImageFile, mockImageOnLoad, mockCanvasToBlob } from '../helpers.js'

export async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getFileExtension(fileOrName) {
  if (fileOrName instanceof File) {
    const name = fileOrName.name || ''
    const ext = name.split('.').pop().toLowerCase()
    return ext || 'unknown'
  }
  return 'unknown'
}

describe('Image Utilities', () => {
  let mockFile

  beforeEach(() => {
    mockFile = createMockImageFile({
      name: 'test.jpg',
      type: 'image/jpeg',
      size: 1024 * 1024 // 1MB
    })
  })

  describe('getImageDimensions', () => {
    it('should get dimensions from valid image file', async () => {
      const mockImageLoad = mockImageOnLoad(1920, 1080)
      const dimensions = await getImageDimensions(mockFile)

      expect(dimensions.width).toBe(1920)
      expect(dimensions.height).toBe(1080)
      expect(dimensions.orientation).toBe('landscape')
      expect(dimensions.aspectRatio).toBe(1920 / 1080)
    })

    it('should reject invalid file', async () => {
      await expect(getImageDimensions(null)).rejects.toThrow('Invalid file provided')
    })

    it('should handle favicon files', async () => {
      const faviconFile = createMockImageFile({
        name: 'favicon.ico',
        type: 'image/x-icon'
      })

      const dimensions = await getImageDimensions(faviconFile)
      expect(dimensions.width).toBe(32)
      expect(dimensions.height).toBe(32)
      expect(dimensions.aspectRatio).toBe(1)
    })
  })

  describe('hasTransparency', () => {
    it('should return false for non-transparent formats', async () => {
      const result = await hasTransparency(mockFile)
      expect(result).toBe(false)
    })

    it('should check PNG transparency', async () => {
      const pngFile = createMockImageFile({
        name: 'test.png',
        type: 'image/png'
      })

      const result = await hasTransparency(pngFile)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('fileToDataURL', () => {
    it('should convert file to data URL', async () => {
      const dataURL = await fileToDataURL(mockFile)
      expect(dataURL).toBeDefined()
      expect(dataURL).toContain('data:')
    })

    it('should reject on error', async () => {
      const invalidFile = new File([], 'test.jpg')
      // Mock FileReader error
      vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function() {
        this.onerror(new Error('Read error'))
      })

      await expect(fileToDataURL(invalidFile)).rejects.toThrow()
    })
  })

  describe('resizeImage', () => {
    it('should resize image to specified dimensions', async () => {
      const mockBlob = new Blob([''], { type: 'image/jpeg' })
      mockCanvasToBlob(mockBlob)

      const resizedFile = await resizeImage(mockFile, 500, 300, 'webp', 0.8)

      expect(resizedFile).toBeInstanceOf(File)
      expect(resizedFile.name).toContain('500x300')
      expect(resizedFile.type).toBe('image/webp')
    })

    it('should handle favicon format', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const resizedFile = await resizeImage(mockFile, 32, 32, 'ico', 1)

      expect(resizedFile).toBeInstanceOf(File)
      expect(consoleSpy).toHaveBeenCalledWith('ICO format creation limited in browser')
    })
  })

  describe('cropImage', () => {
    it('should crop image', async () => {
      const mockBlob = new Blob([''], { type: 'image/jpeg' })
      mockCanvasToBlob(mockBlob)

      const croppedFile = await cropImage(mockFile, 100, 100, 300, 200, 'png', 0.9)

      expect(croppedFile).toBeInstanceOf(File)
      expect(croppedFile.name).toContain('crop-300x200')
      expect(croppedFile.type).toBe('image/png')
    })
  })

  describe('calculateAspectRatioFit', () => {
    it('should calculate dimensions for width mode', () => {
      const result = calculateAspectRatioFit(1920, 1080, 500, 'width')
      expect(result.width).toBe(500)
      expect(result.height).toBe(281) // 500 * (1080/1920)
    })

    it('should calculate dimensions for height mode', () => {
      const result = calculateAspectRatioFit(1920, 1080, 500, 'height')
      expect(result.width).toBe(889) // 500 * (1920/1080)
      expect(result.height).toBe(500)
    })

    it('should calculate dimensions for auto mode (landscape)', () => {
      const result = calculateAspectRatioFit(1920, 1080, 500, 'auto')
      expect(result.width).toBe(500)
      expect(result.height).toBe(281)
    })

    it('should calculate dimensions for auto mode (portrait)', () => {
      const result = calculateAspectRatioFit(1080, 1920, 500, 'auto')
      expect(result.width).toBe(281)
      expect(result.height).toBe(500)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should format with custom decimals', () => {
      expect(formatFileSize(1500, 0)).toBe('1 KB')
      expect(formatFileSize(1500, 3)).toBe('1.465 KB')
    })
  })

  describe('getFileExtension', () => {
    it('should get extension from filename', () => {
      expect(getFileExtension(mockFile)).toBe('jpg')
    })

    it('should get extension from MIME type when filename has no extension', () => {
      const noExtFile = createMockImageFile({ name: 'test' })
      expect(getFileExtension(noExtFile)).toBe('jpg')
    })

    it('should get extension from string', () => {
      expect(getFileExtension('test.png')).toBe('png')
      expect(getFileExtension('test.image.jpg')).toBe('jpg')
      expect(getFileExtension('test')).toBe('unknown')
    })
  })

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      const result = validateImageFile(mockFile)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject non-File objects', () => {
      const result = validateImageFile({ name: 'test.jpg' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Not a valid File object')
    })

    it('should reject unsupported file types', () => {
      const invalidFile = createMockImageFile({ type: 'application/pdf' })
      const result = validateImageFile(invalidFile)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Unsupported file type')
    })

    it('should warn about large files', () => {
      const largeFile = createMockImageFile({ size: 15 * 1024 * 1024 })
      const result = validateImageFile(largeFile)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Large file')
    })
  })

  describe('createThumbnail', () => {
    it('should create thumbnail for regular image', async () => {
      const mockImageLoad = mockImageOnLoad(800, 600)
      const thumbnail = await createThumbnail(mockFile, 200)

      expect(thumbnail).toBeDefined()
      expect(thumbnail).toContain('data:image/jpeg')
    })

    it('should create thumbnail for favicon', async () => {
      const faviconFile = createMockImageFile({
        name: 'favicon.ico',
        type: 'image/x-icon'
      })

      const thumbnail = await createThumbnail(faviconFile)
      expect(thumbnail).toBeDefined()
      expect(thumbnail).toContain('data:image/svg+xml')
    })

    it('should reject on image load error', async () => {
      // Mock image error
      global.Image = class MockImage {
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Load error'))
          }, 0)
        }
      }

      await expect(createThumbnail(mockFile)).rejects.toThrow('Failed to create thumbnail')
    })
  })
})
