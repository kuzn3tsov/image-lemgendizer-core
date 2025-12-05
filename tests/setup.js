import { vi } from 'vitest'

// Mock File API
global.File = class MockFile {
  constructor(data = [], name = '', options = {}) {
    this.name = name
    this.type = options.type || ''
    this.size = data.length || 0
    this.lastModified = Date.now()
  }
}

// Mock Blob
global.Blob = class MockBlob {
  constructor(data = [], options = {}) {
    this.size = data.length || 0
    this.type = options.type || ''
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }

  text() {
    return Promise.resolve('mock text')
  }
}

// Mock URL API
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock Image
global.Image = class MockImage {
  constructor() {
    this.width = 100
    this.height = 100
    this.naturalWidth = 100
    this.naturalHeight = 100
    this.src = ''
    this.onload = null
    this.onerror = null
  }
}

// Mock createImageBitmap
global.createImageBitmap = vi.fn(async () => ({
  width: 100,
  height: 100,
  close: vi.fn()
}))

// Mock canvas
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  fillRect: vi.fn(),
  fillStyle: '',
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn()
}))

global.HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback, type) {
  const blob = new Blob([''], { type: type || 'image/png' })
  callback(blob)
})

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')

// Mock FaceDetector
global.FaceDetector = vi.fn(() => ({
  detect: vi.fn(() => Promise.resolve([]))
}))

// Mock tf for TensorFlow.js
global.tf = {
  loadGraphModel: vi.fn(() => Promise.resolve({})),
  ready: vi.fn(() => Promise.resolve())
}

// Cleanup
afterEach(() => {
  vi.clearAllMocks()
})