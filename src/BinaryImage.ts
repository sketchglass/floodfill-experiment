
export type BinaryValue = 0|1

export
class BinaryImage {
  data: Int32Array
  readonly stride = Math.ceil(this.width / 32)

  constructor(public readonly width: number, public readonly height: number, data?: Int32Array) {
    this.data = data || new Int32Array(this.stride * height)
  }

  get(x: number, y: number): BinaryValue {
    const xcell = x >> 5
    const xbit = x - (xcell << 5)
    const cell = this.data[y * this.stride + xcell]
    return <BinaryValue>((cell >> xbit) & 1)
  }

  set(x: number, y: number, value: BinaryValue) {
    const xcell = x >> 5
    const xbit = x - (xcell << 5)
    if (value) {
      this.data[y * this.stride + xcell] |= (1 << xbit)
    } else {
      this.data[y * this.stride + xcell] &= ~(1 << xbit)
    }
  }

  sub(other: BinaryImage) {
    for (let i = 0; i < this.data.length; ++i) {
      this.data[i] &= ~other.data[i]
    }
  }

  add(other: BinaryImage) {
    for (let i = 0; i < other.data.length; ++i) {
      this.data[i] |= other.data[i]
    }
  }

  // possible optimization: On GPUs grow / shrink would run much faster
  grow(src: BinaryImage, radius: number) {
    const w = src.width
    const h = src.height
    const rr = radius * radius
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let value = 0
        for (let dy = -radius; dy <= radius; ++dy) {
          for (let dx = -radius; dx <= radius; ++dx) {
            if (dx * dx + dy * dy < rr) {
              const x1 = x + dx
              const y1 = y + dy
              if (0 <= x1 && x1 < w && 0 <= y1 && y1 < h) {
                if (src.get(x1, y1)) {
                  value = 1
                }
              }
            }
          }
        }
        this.set(x, y, <BinaryValue>(value))
      }
    }
  }

  shrink(src: BinaryImage, radius: number) {
    const w = src.width
    const h = src.height
    const rr = radius * radius
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let value = 1
        for (let dy = -radius; dy <= radius; ++dy) {
          for (let dx = -radius; dx <= radius; ++dx) {
            if (dx * dx + dy * dy < rr) {
              const x1 = x + dx
              const y1 = y + dy
              if (0 <= x1 && x1 < w && 0 <= y1 && y1 < h) {
                if (!src.get(x1, y1)) {
                  value = 0
                }
              }
            }
          }
        }
        this.set(x, y, <BinaryValue>(value))
      }
    }
  }

  static fromImageData(image: ImageData, test: (rgba: Uint8ClampedArray) => BinaryValue) {
    const ret = new BinaryImage(image.width, image.height)
    for (let y = 0; y < image.height; ++y) {
      for (let x = 0; x < image.width; ++x) {
        const offset = (y * image.width + x) * 4
        const rgba = image.data.slice(offset, offset + 4)
        ret.set(x, y, test(rgba))
      }
    }
    return ret
  }

  toImageData(color0: Uint8ClampedArray, color1: Uint8ClampedArray, out?: ImageData) {
    const image = out || new ImageData(this.width, this.height)
    for (let y = 0; y < image.height; ++y) {
      for (let x = 0; x < image.width; ++x) {
        const offset = (y * image.width + x) * 4
        const rgba = this.get(x, y) ? color1 : color0
        image.data.set(rgba, offset)
      }
    }
    return image
  }
}
