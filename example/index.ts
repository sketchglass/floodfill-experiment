const canvas = document.querySelector("#canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!

context.strokeStyle = "black"
context.lineWidth = 4
context.lineCap = "round"

let dragging = false
let lastX = 0
let lastY = 0

canvas.addEventListener("pointerdown", e => {
  dragging = true
  lastX = e.offsetX
  lastY = e.offsetY
  canvas.setPointerCapture(e.pointerId)
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

