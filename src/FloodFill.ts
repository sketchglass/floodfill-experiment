import {BinaryImage} from "./BinaryImage"

let stack: [number, number][] = []

// Stack-based scanline flood fill from http://lodev.org/cgtutor/floodfill.html
export function floodFill(x: number, y: number, src: BinaryImage, dst: BinaryImage) {
  if (dst.get(x, y)) {
    return
  }
  const w = src.width
  const h = src.height
  if (!(0 <= x && x < w && 0 <= y && y < h)) {
    return
  }
  stack = []

  let x1 = 0
  let spanAbove = false
  let spanBelow = false

  stack.push([x, y])

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    x1 = x;
    while (x1 >= 0 && src.get(x1, y)) {
      x1--;
    }
    x1++;
    spanAbove = spanBelow = false;
    while (x1 < w && src.get(x1, y)) {
      dst.set(x1, y, 1)
      if (!spanAbove && y > 0 && src.get(x1, y - 1) && !dst.get(x1, y - 1)) {
        stack.push([x1, y - 1])
        spanAbove = true;
      } else if (spanAbove && y > 0 && !src.get(x1, y - 1)) {
        spanAbove = false;
      }
      if (!spanBelow && y < h - 1 && src.get(x1, y + 1) && !dst.get(x1, y + 1)) {
        stack.push([x1, y + 1])
        spanBelow = true;
      } else if (spanBelow && y < h - 1 && !src.get(x1, y + 1)) {
        spanBelow = false;
      }
      x1++;
    }
  }
}

export function floodFillWithGap(x: number, y: number, gap: number, src: BinaryImage, dst: BinaryImage) {
  if (gap == 0) {
    floodFill(x, y, src, dst)
    return
  }
  // do floodfill normally
  const radius = Math.round(gap / 2)
  const normalFilled = new BinaryImage(src.width, src.height)
  floodFill(x, y, src, normalFilled)

  // erode it
  const eroded = new BinaryImage(src.width, src.height)
  eroded.erode(normalFilled, radius)

  // find inside area
  const insideEroded = new BinaryImage(src.width, src.height)
  for (let y1 = y - radius; y1 <= y + radius; ++y1) {
    for (let x1 = x - radius; x1 <= x + radius; ++x1) {
      floodFill(x1, y1, eroded, insideEroded)
    }
  }

  // get outside area
  eroded.sub(insideEroded)
  const outside = new BinaryImage(src.width, src.height)
  outside.dilate(eroded, radius)

  normalFilled.sub(outside)

  // exclude areas that cannot be reached from (x,y)
  floodFill(x, y, normalFilled, dst)
}
