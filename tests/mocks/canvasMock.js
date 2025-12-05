export const mockCanvasContext = () => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10
  })),
  putImageData: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10
  })),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createPattern: vi.fn(() => ({})),
})

export const mockCanvasElement = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  canvas.getContext = vi.fn(() => mockCanvasContext())
  canvas.toBlob = vi.fn((callback, type, quality) => {
    const blob = new Blob([''], { type: type || 'image/png' })
    callback(blob)
  })
  canvas.toDataURL = vi.fn(() => 'data:image/png;base64,mock')
  return canvas
}
