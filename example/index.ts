import {BinaryImage} from "../src/BinaryImage"
import {floodFill} from "../src/FloodFill"

const canvas = document.querySelector("#canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!

const floodfillCanvas = document.querySelector("#floodfill-canvas") as HTMLCanvasElement
const floodfillContext = floodfillCanvas.getContext("2d")!

context.strokeStyle = "black"
context.lineWidth = 4
context.lineCap = "round"

let dragging = false
let lastX = 0
let lastY = 0

canvas.addEventListener("pointerdown", e => {
  if (e.shiftKey) {
    const data = context.getImageData(0, 0, canvas.width, canvas.height)
    const src = BinaryImage.fromImageData(data, ([r, g, b, a]) => a === 0 ? 1 : 0)
    const dst = new BinaryImage(canvas.width, canvas.height)
    const x = Math.round(e.offsetX + 0.5)
    const y = Math.round(e.offsetY + 0.5)
    console.time("floodFill")
    floodFill(x, y, src, dst)
    console.timeEnd("floodFill")
    dst.toImageData(new Uint8ClampedArray([0,0,0,0]), new Uint8ClampedArray([0,0,255,255]), data)
    floodfillContext.putImageData(data, 0, 0)
  } else {
    floodfillContext.clearRect(0, 0, floodfillCanvas.width, floodfillCanvas.height)
    dragging = true
    lastX = e.offsetX
    lastY = e.offsetY
    canvas.setPointerCapture(e.pointerId)
  }
})
canvas.addEventListener("pointermove", e => {
  if (dragging) {
    context.beginPath()
    context.moveTo(lastX, lastY)
    context.lineTo(e.offsetX, e.offsetY)
    lastX = e.offsetX
    lastY = e.offsetY
    context.stroke()
  }
})
canvas.addEventListener("pointerup", e => {
  dragging = false
})

