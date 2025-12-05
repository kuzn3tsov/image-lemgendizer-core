export class MockImage {
  constructor() {
    this.src = ''
    this.width = 0
    this.height = 0
    this.naturalWidth = 0
    this.naturalHeight = 0
    this.onload = null
    this.onerror = null
    this.complete = false
  }

  simulateLoad(width = 800, height = 600) {
    this.width = width
    this.height = height
    this.naturalWidth = width
    this.naturalHeight = height
    this.complete = true
    if (this.onload) this.onload()
  }

  simulateError(error = 'Failed to load') {
    this.complete = true
    if (this.onerror) this.onerror(new Error(error))
  }
}

export const mockImageFactory = () => {
  return new MockImage()
}
