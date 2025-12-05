export const createMockFile = (options = {}) => {
  const {
    name = 'test.jpg',
    type = 'image/jpeg',
    size = 1024 * 1024,
    lastModified = Date.now()
  } = options

  const blob = new Blob([''], { type })
  return new File([blob], name, {
    type,
    lastModified
  })
}

export const createMockImageBlob = (width, height, type = 'image/png') => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, width, height)
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type)
  })
}
