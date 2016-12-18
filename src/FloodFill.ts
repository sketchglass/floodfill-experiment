import {BinaryImage} from "./BinaryImage"

let stack: [number, number][] = []

export function floodFill(x: number, y: number, src: BinaryImage, dst: BinaryImage) {
  if (dst.get(x, y)) {
    return
  }
  const w = src.width
  const h = src.height
  stack = []

  let x1: number;
  let spanAbove: boolean
  let spanBelow: boolean

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