import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createLemGendaryZip,
  createSimpleZip,
  extractZip,
  getZipInfo
} from '../../src/utils/zipUtils.js'
import { createMockLemGendImage } from '../helpers.js'

// Mock JSZip
vi.mock('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', () => ({
  default: class JSZip {
    constructor() {
      this.files = {}
    }
    
    folder(name) {
      return this
    }
    
    file(name, content) {
      this.files[name] = content
      return this
    }
    
    generateAsync(options, onUpdate) {
      return Promise.resolve(new Blob([''], { type: 'application/zip' }))
    }
    
    async loadAsync(data) {
      return this
    }
  }
}))

describe('ZIP Utilities', () => {
  let mockImages

  beforeEach(() => {
    mockImages = [
      createMockLemGendImage({ originalName: 'image1.jpg' }),
      createMockLemGendImage({ originalName: 'image2.png' })
    ]
  })

  describe('createLemGendaryZip', () => {
    it('should create ZIP with default options', async () => {
      const zipBlob = await createLemGendaryZip(mockImages)
      
      expect(zipBlob).toBeInstanceOf(Blob)
      expect(zipBlob.type).toBe('application/zip')
    })

    it('should create ZIP with custom options', async () => {
      const zipBlob = await createLemGendaryZip(mockImages, {
        zipName: 'custom-export',
        includeOriginal: false,
        includeOptimized: true,
        createFolders: false
      })
      
      expect(zipBlob).toBeInstanceOf(Blob)
    })

    it('should handle empty images array', async () => {
      const zipBlob = await createLemGendaryZip([])
      expect(zipBlob).toBeInstanceOf(Blob)
    })

    it('should throw error when JSZip not available', async () => {
      // Temporarily remove the mock
      const originalImport = vi.mocked(import)
      vi.unmock('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')
      
      await expect(createLemGendaryZip(mockImages)).rejects.toThrow('JSZip library required')
      
      // Restore mock
      vi.doMock('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', () => ({
        default: class JSZip {}
      }))
    })
  })

  describe('createSimpleZip', () => {
    it('should create simple ZIP from files', async () => {
      const files = [
        new File(['content1'], 'file1.txt'),
        new File(['content2'], 'file2.txt')
      ]
      
      const zipBlob = await createSimpleZip(files, 'simple-archive')
      expect(zipBlob).toBeInstanceOf(Blob)
    })

    it('should handle empty files array', async () => {
      const zipBlob = await createSimpleZip([])
      expect(zipBlob).toBeInstanceOf(Blob)
    })
  })

  describe('extractZip', () => {
    it('should extract ZIP file', async () => {
      const mockZipBlob = new Blob([''], { type: 'application/zip' })
      const extractedFiles = await extractZip(mockZipBlob)
      
      expect(Array.isArray(extractedFiles)).toBe(true)
    })

    it('should reject non-Blob input', async () => {
      await expect(extractZip('not-a-blob')).rejects.toThrow('Input must be a Blob object')
    })
  })

  describe('getZipInfo', () => {
    it('should get ZIP file info', async () => {
      const mockZipBlob = new Blob([''], { type: 'application/zip' })
      const info = await getZipInfo(mockZipBlob)
      
      expect(info).toHaveProperty('fileCount')
      expect(info).toHaveProperty('totalSize')
      expect(info).toHaveProperty('compressionRatio')
      expect(info).toHaveProperty('files')
      expect(info.format).toBe('ZIP')
    })

    it('should reject non-Blob input', async () => {
      await expect(getZipInfo('not-a-blob')).rejects.toThrow('Input must be a Blob object')
    })
  })
})
