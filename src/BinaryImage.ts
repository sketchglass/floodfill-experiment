
export type BinaryValue = 0|1

export
class BinaryImage {
  data: Uint8Array

  constructor(public readonly width: number, public readonly height: number, data?: Uint8Array) {
    this.data = data || new Uint8Array(width * height)
  }

  get(x: number, y: number) {
    return this.data[y * this.width + x]
  }

  set(x: number, y: number, value: number) {
    return this.data[y * this.width + x] = value
  }

  sub(other: BinaryImage) {
    for (let i = 0; i < this.data.length; ++i) {
      if (other.data[i]) {
        this.data[i] = 0
      }
    }
  }

  add(other: BinaryImage) {
    for (let i = 0; i < other.data.length; ++i) {
      if (other.data[i]) {
        this.data[i] = 1
      }
    }
  }

  // dilate / erode image
  offset(src: BinaryImage, offset: number) {
    this.data.set(src.data)
    const w = src.width
    const h = src.height
    const r = Math.abs(offset)
    const rr = r * r
    const dilate = offset > 0
    for (let y = 1; y < h - 1; ++y) {
      for (let x = 1; x < w - 1; ++x) {
        const isEdge = dilate
          ? src.get(x, y) && !(src.get(x - 1, y) && src.get(x + 1, y) && src.get(x, y - 1) && src.get(x, y + 1))
          : !src.get(x, y) && (src.get(x - 1, y) || src.get(x + 1, y) || src.get(x, y - 1) || src.get(x, y + 1))
        if (isEdge) {
          const minX = Math.max(0, x - r)
          const maxX = Math.min(w - 1, x + r)
          const minY = Math.max(0, y - r)
          const maxY = Math.min(h - 1, y + r)
          for (let y1 = minY; y1 <= maxY; ++y1) {
            let i = y1 * w + minX
            for (let x1 = minX; x1 <= maxX; ++x1) {
              const dx = x1 - x
              const dy = y1 - y
              if (dx * dx + dy * dy < rr) {
                if (dilate) {
                  this.data[i] = 1
                } else {
                  this.data[i] = 0
                }
              }
              ++i
            }
          }
        }
      }
    }
  }

  static fromImageData(image: ImageData, trueColor: number[]) {
    const ret = new BinaryImage(image.width, image.height)
    const {data} = ret
    let i = 0
    const imageData = new Int32Array(image.data.buffer)
    const trueColorValue = (new Int32Array(new Uint8Array(trueColor).buffer))[0]
    for (let y = 0; y < image.height; ++y) {
      for (let x = 0; x < image.width; ++x) {
        const rgba = imageData[i]
        if (rgba == trueColorValue) {
          data[i] = 1
        }
        ++i
      }
    }
    return ret
  }

  toImageData(color0: number[], color1: number[], out?: ImageData) {
    const image = out || new ImageData(this.width, this.height)
    const imageData = new Int32Array(image.data.buffer)
    const color0Value = (new Int32Array(new Uint8Array(color0).buffer))[0]
    const color1Value = (new Int32Array(new Uint8Array(color1).buffer))[0]
    let i = 0
    const {data} = this
    for (let y = 0; y < image.height; ++y) {
      for (let x = 0; x < image.width; ++x) {
        const rgba = data[i] ? color1Value : color0Value
        imageData[i] = rgba
        ++i
      }
    }
    return image
  }
}
