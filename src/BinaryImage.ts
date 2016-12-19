
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

  clone() {
    const ret = new BinaryImage(this.width, this.height)
    ret.data.set(this.data)
    return ret
  }

  // dilate / erode image
  offset(offset: number) {
    const ret = this.clone()
    const w = this.width
    const h = this.height
    const r = Math.abs(offset)
    const rr = r * r
    const dilate = offset > 0
    for (let y = 1; y < h - 1; ++y) {
      for (let x = 1; x < w - 1; ++x) {
        const isEdge = dilate
          ? this.get(x, y) && !(this.get(x - 1, y) && this.get(x + 1, y) && this.get(x, y - 1) && this.get(x, y + 1))
          : !this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))
        if (isEdge) {
          const minX = Math.max(0, x - r)
          const maxX = Math.min(w - 1, x + r)
          const minY = Math.max(0, y - r)
          const maxY = Math.min(h - 1, y + r)
          const xOffset = minX >> 5
          const initMask = 1 << minX - (xOffset << 5)
          for (let y1 = minY; y1 <= maxY; ++y1) {
            let i = y1 * this.stride + xOffset
            let mask = initMask
            for (let x1 = minX; x1 <= maxX; ++x1) {
              const dx = x1 - x
              const dy = y1 - y
              if (dx * dx + dy * dy <= rr) {
                if (dilate) {
                  ret.data[i] |= mask
                } else {
                  ret.data[i] &= ~mask
                }
              }
              mask = mask << 1
              if (mask == 0) {
                mask = 1
                ++i
              }
            }
          }
        }
      }
    }
    return ret
  }

  static fromImageData(image: ImageData, trueColor: number[]) {
    const ret = new BinaryImage(image.width, image.height)
    const {data, stride} = ret
    let imageOffset = 0
    const imageData = new Int32Array(image.data.buffer)
    const trueColorValue = (new Int32Array(new Uint8Array(trueColor).buffer))[0]
    for (let y = 0; y < image.height; ++y) {
      let offset = y * stride
      let bitmask = 1
      for (let x = 0; x < image.width; ++x) {
        const rgba = imageData[imageOffset++]
        if (rgba == trueColorValue) {
          data[offset] |= bitmask
        }
        bitmask = bitmask << 1
        if (bitmask == 0) {
          bitmask = 1
          ++offset
        }
      }
    }
    return ret
  }

  toImageData(color0: number[], color1: number[], out?: ImageData) {
    const image = out || new ImageData(this.width, this.height)
    const imageData = new Int32Array(image.data.buffer)
    const color0Value = (new Int32Array(new Uint8Array(color0).buffer))[0]
    const color1Value = (new Int32Array(new Uint8Array(color1).buffer))[0]
    let imageOffset = 0
    const {data, stride} = this
    for (let y = 0; y < image.height; ++y) {
      let offset = y * stride
      let bitmask = 1
      for (let x = 0; x < image.width; ++x) {
        const rgba = data[offset] & bitmask ? color1Value : color0Value
        imageData[imageOffset++] = rgba
        bitmask = bitmask << 1
        if (bitmask == 0) {
          bitmask = 1
          ++offset
        }
      }
    }
    return image
  }
}
