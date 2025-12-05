export const createMockImageFile = (options = {}) => {
  const {
    name = 'test-image.jpg',
    type = 'image/jpeg',
    size = 1024 * 1024, // 1MB
    width = 1920,
    height = 1080
  } = options

  const blob = new Blob([''], { type })
  const file = new File([blob], name, {
    type,
    lastModified: Date.now()
  })
  
  file.width = width
  file.height = height
  file.size = size
  
  return file
}

export const createMockLemGendImage = (options = {}) => {
  const {
    originalName = 'test-image.jpg',
    type = 'image/jpeg',
    width = 1920,
    height = 1080,
    originalSize = 1024 * 1024,
    extension = 'jpg',
    transparency = false,
    orientation = 'landscape'
  } = options

  const file = createMockImageFile({ name: originalName, type, size: originalSize })

  return {
    file,
    originalName,
    type,
    width,
    height,
    originalSize,
    extension,
    transparency,
    orientation,
    aspectRatio: width / height,
    getAllOutputs: () => [],
    outputs: new Map()
  }
}

export const mockCanvasToBlob = (blob) => {
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(blob)
  })
}

export const mockCanvasToDataURL = (dataURL) => {
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => dataURL)
}

export const mockImageOnLoad = (width, height) => {
  return new Promise((resolve) => {
    global.Image = class MockImage {
      constructor() {
        this.width = width
        this.height = height
        this.naturalWidth = width
        this.naturalHeight = height
        this.src = ''
        this.onload = null
        this.onerror = null
        
        setTimeout(() => {
          if (this.onload) this.onload()
          resolve()
        }, 0)
      }
    }
  })
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
