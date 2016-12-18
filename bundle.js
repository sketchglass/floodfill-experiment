/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const BinaryImage_1 = __webpack_require__(1);
	const FloodFill_1 = __webpack_require__(2);
	const canvas = document.querySelector("#canvas");
	const context = canvas.getContext("2d");
	const floodfillCanvas = document.querySelector("#floodfill-canvas");
	const floodfillContext = floodfillCanvas.getContext("2d");
	context.strokeStyle = "black";
	context.lineWidth = 4;
	context.lineCap = "round";
	let dragging = false;
	let lastX = 0;
	let lastY = 0;
	let allowedGap = 0;
	function clearDrawing() {
	    context.clearRect(0, 0, canvas.width, canvas.height);
	}
	function clearFloodFill() {
	    floodfillContext.clearRect(0, 0, floodfillCanvas.width, floodfillCanvas.height);
	}
	canvas.addEventListener("pointerdown", e => {
	    if (e.shiftKey) {
	        const data = context.getImageData(0, 0, canvas.width, canvas.height);
	        const src = BinaryImage_1.BinaryImage.fromImageData(data, ([r, g, b, a]) => a === 0 ? 1 : 0);
	        const dst = new BinaryImage_1.BinaryImage(canvas.width, canvas.height);
	        const x = Math.round(e.offsetX + 0.5);
	        const y = Math.round(e.offsetY + 0.5);
	        console.time("floodFill");
	        //floodFill(x, y, src, dst)
	        FloodFill_1.floodFillWithGap(x, y, allowedGap, src, dst);
	        console.timeEnd("floodFill");
	        dst.toImageData(new Uint8ClampedArray([0, 0, 0, 0]), new Uint8ClampedArray([0, 0, 255, 255]), data);
	        floodfillContext.putImageData(data, 0, 0);
	    }
	    else {
	        clearFloodFill();
	        dragging = true;
	        lastX = e.offsetX;
	        lastY = e.offsetY;
	        canvas.setPointerCapture(e.pointerId);
	    }
	});
	canvas.addEventListener("pointermove", e => {
	    if (dragging) {
	        context.beginPath();
	        context.moveTo(lastX, lastY);
	        context.lineTo(e.offsetX, e.offsetY);
	        lastX = e.offsetX;
	        lastY = e.offsetY;
	        context.stroke();
	    }
	});
	canvas.addEventListener("pointerup", e => {
	    dragging = false;
	});
	const allowedGapSpan = document.querySelector("#allowed-gap");
	const allowedGapInput = document.querySelector("#allowed-gap-input");
	const clearDrawingButton = document.querySelector("#clear-drawing");
	const clearFloodFillButton = document.querySelector("#clear-flood-fill");
	allowedGapInput.addEventListener("change", () => {
	    allowedGap = parseInt(allowedGapInput.value);
	    allowedGapSpan.innerText = String(allowedGap);
	});
	clearDrawingButton.addEventListener("click", clearDrawing);
	clearFloodFillButton.addEventListener("click", clearFloodFill);


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	class BinaryImage {
	    constructor(width, height, data) {
	        this.width = width;
	        this.height = height;
	        this.stride = Math.ceil(this.width / 32);
	        this.data = data || new Int32Array(this.stride * height);
	    }
	    get(x, y) {
	        const xcell = x >> 5;
	        const xbit = x - (xcell << 5);
	        const cell = this.data[y * this.stride + xcell];
	        return ((cell >> xbit) & 1);
	    }
	    set(x, y, value) {
	        const xcell = x >> 5;
	        const xbit = x - (xcell << 5);
	        if (value) {
	            this.data[y * this.stride + xcell] |= (1 << xbit);
	        }
	        else {
	            this.data[y * this.stride + xcell] &= ~(1 << xbit);
	        }
	    }
	    sub(other) {
	        for (let i = 0; i < this.data.length; ++i) {
	            this.data[i] &= ~other.data[i];
	        }
	    }
	    add(other) {
	        for (let i = 0; i < other.data.length; ++i) {
	            this.data[i] |= other.data[i];
	        }
	    }
	    dilate(src, radius) {
	        this.data.set(src.data);
	        const w = src.width;
	        const h = src.height;
	        const rr = radius * radius;
	        for (let y = 1; y < h - 1; ++y) {
	            for (let x = 1; x < w - 1; ++x) {
	                const isEdge = src.get(x, y) && !(src.get(x - 1, y) && src.get(x + 1, y) && src.get(x, y - 1) && src.get(x, y + 1));
	                if (isEdge) {
	                    for (let dy = -radius; dy <= radius; ++dy) {
	                        for (let dx = -radius; dx <= radius; ++dx) {
	                            if (dx * dx + dy * dy < rr) {
	                                const x1 = x + dx;
	                                const y1 = y + dy;
	                                if (0 <= x1 && x1 < w && 0 <= y1 && y1 < h) {
	                                    this.set(x1, y1, 1);
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        }
	    }
	    erode(src, radius) {
	        this.data.set(src.data);
	        const w = src.width;
	        const h = src.height;
	        const rr = radius * radius;
	        for (let y = 1; y < h - 1; ++y) {
	            for (let x = 1; x < w - 1; ++x) {
	                const isEdge = !src.get(x, y) && (src.get(x - 1, y) || src.get(x + 1, y) || src.get(x, y - 1) || src.get(x, y + 1));
	                if (isEdge) {
	                    for (let dy = -radius; dy <= radius; ++dy) {
	                        for (let dx = -radius; dx <= radius; ++dx) {
	                            if (dx * dx + dy * dy < rr) {
	                                const x1 = x + dx;
	                                const y1 = y + dy;
	                                if (0 <= x1 && x1 < w && 0 <= y1 && y1 < h) {
	                                    this.set(x1, y1, 0);
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        }
	    }
	    static fromImageData(image, test) {
	        const ret = new BinaryImage(image.width, image.height);
	        for (let y = 0; y < image.height; ++y) {
	            for (let x = 0; x < image.width; ++x) {
	                const offset = (y * image.width + x) * 4;
	                const rgba = image.data.slice(offset, offset + 4);
	                ret.set(x, y, test(rgba));
	            }
	        }
	        return ret;
	    }
	    toImageData(color0, color1, out) {
	        const image = out || new ImageData(this.width, this.height);
	        for (let y = 0; y < image.height; ++y) {
	            for (let x = 0; x < image.width; ++x) {
	                const offset = (y * image.width + x) * 4;
	                const rgba = this.get(x, y) ? color1 : color0;
	                image.data.set(rgba, offset);
	            }
	        }
	        return image;
	    }
	}
	exports.BinaryImage = BinaryImage;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const BinaryImage_1 = __webpack_require__(1);
	let stack = [];
	// Stack-based scanline flood fill from http://lodev.org/cgtutor/floodfill.html
	function floodFill(x, y, src, dst) {
	    if (dst.get(x, y)) {
	        return;
	    }
	    const w = src.width;
	    const h = src.height;
	    if (!(0 <= x && x < w && 0 <= y && y < h)) {
	        return;
	    }
	    stack = [];
	    let x1 = 0;
	    let spanAbove = false;
	    let spanBelow = false;
	    stack.push([x, y]);
	    while (stack.length > 0) {
	        const [x, y] = stack.pop();
	        x1 = x;
	        while (x1 >= 0 && src.get(x1, y)) {
	            x1--;
	        }
	        x1++;
	        spanAbove = spanBelow = false;
	        while (x1 < w && src.get(x1, y)) {
	            dst.set(x1, y, 1);
	            if (!spanAbove && y > 0 && src.get(x1, y - 1) && !dst.get(x1, y - 1)) {
	                stack.push([x1, y - 1]);
	                spanAbove = true;
	            }
	            else if (spanAbove && y > 0 && !src.get(x1, y - 1)) {
	                spanAbove = false;
	            }
	            if (!spanBelow && y < h - 1 && src.get(x1, y + 1) && !dst.get(x1, y + 1)) {
	                stack.push([x1, y + 1]);
	                spanBelow = true;
	            }
	            else if (spanBelow && y < h - 1 && !src.get(x1, y + 1)) {
	                spanBelow = false;
	            }
	            x1++;
	        }
	    }
	}
	exports.floodFill = floodFill;
	function floodFillWithGap(x, y, gap, src, dst) {
	    if (gap == 0) {
	        floodFill(x, y, src, dst);
	        return;
	    }
	    // do floodfill normally
	    const radius = Math.round(gap / 2);
	    const normalFilled = new BinaryImage_1.BinaryImage(src.width, src.height);
	    floodFill(x, y, src, normalFilled);
	    // erode it
	    const eroded = new BinaryImage_1.BinaryImage(src.width, src.height);
	    eroded.erode(normalFilled, radius);
	    // find inside area
	    const insideEroded = new BinaryImage_1.BinaryImage(src.width, src.height);
	    for (let y1 = y - radius; y1 <= y + radius; ++y1) {
	        for (let x1 = x - radius; x1 <= x + radius; ++x1) {
	            floodFill(x1, y1, eroded, insideEroded);
	        }
	    }
	    // get outside area
	    eroded.sub(insideEroded);
	    const outside = new BinaryImage_1.BinaryImage(src.width, src.height);
	    outside.dilate(eroded, radius);
	    normalFilled.sub(outside);
	    // exclude areas that cannot be reached from (x,y)
	    floodFill(x, y, normalFilled, dst);
	}
	exports.floodFillWithGap = floodFillWithGap;


/***/ }
/******/ ]);