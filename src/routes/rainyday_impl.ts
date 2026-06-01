interface CustomWindow extends Window {
  requestAnimFrame?: (callback: FrameRequestCallback) => number;
  webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
}

export interface RainyDayOptions {
  image: HTMLImageElement;
  opacity?: number;
  blur?: number;
  crop?: [number, number, number, number];
  enableSizeChange?: boolean;
  parentElement?: HTMLElement;
  fps?: number;
  fillStyle?: string;
  enableCollisions?: boolean;
  gravityThreshold?: number;
  gravityAngle?: number;
  gravityAngleVariance?: number;
  reflectionScaledownFactor?: number;
  reflectionDropMappingWidth?: number;
  reflectionDropMappingHeight?: number;
  width?: number;
  height?: number;
  position?: string;
  top?: number | string;
  left?: number | string;
}

export class RainyDay {
  img: HTMLImageElement;
  options: Required<RainyDayOptions>;
  drops: Drop[] = [];
  canvas: HTMLCanvasElement;
  reflected!: HTMLCanvasElement;
  glass!: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;
  background!: HTMLCanvasElement;
  clearbackground!: HTMLCanvasElement;
  reflection: (drop: Drop) => void;
  trail: (drop: Drop) => void;
  gravity: (drop: Drop) => boolean;
  collision: (drop: Drop, collisions: DropItem) => void;
  matrix!: CollisionMatrix;
  presets!: [number, number, number, number?][];
  PRIVATE_GRAVITY_FORCE_FACTOR_Y!: number;
  PRIVATE_GRAVITY_FORCE_FACTOR_X!: number;
  addDropCallback?: () => void;
  requestID?: number;

  constructor(options: RainyDayOptions, canvas?: HTMLCanvasElement) {
    this.img = options.image;
    const defaults: Required<Omit<RainyDayOptions, "top" | "left">> & {
      top: number | string;
      left: number | string;
    } = {
      image: this.img,
      opacity: 1,
      blur: 10,
      crop: [0, 0, this.img.naturalWidth || 640, this.img.naturalHeight || 320],
      enableSizeChange: true,
      parentElement: document.getElementsByTagName("body")[0],
      fps: 30,
      fillStyle: "#8ED6FF",
      enableCollisions: true,
      gravityThreshold: 3,
      gravityAngle: Math.PI / 2,
      gravityAngleVariance: 0,
      reflectionScaledownFactor: 5,
      reflectionDropMappingWidth: 200,
      reflectionDropMappingHeight: 200,
      width: this.img.clientWidth || 640,
      height: this.img.clientHeight || 320,
      position: "absolute",
      top: 0,
      left: 0,
    };

    const mergedOptions = { ...defaults } as Record<string, unknown>;
    for (const key in options) {
      if (options[key as keyof RainyDayOptions] !== undefined) {
        mergedOptions[key] = options[key as keyof RainyDayOptions];
      }
    }
    this.options = mergedOptions as unknown as Required<RainyDayOptions>;

    this.canvas = canvas || this.prepareCanvas();
    this.prepareBackground();
    this.prepareGlass();

    this.reflection = this.REFLECTION_MINIATURE;
    this.trail = this.TRAIL_DROPS;
    this.gravity = this.GRAVITY_NON_LINEAR;
    this.collision = this.COLLISION_SIMPLE;

    this.setRequestAnimFrame();
  }

  prepareCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.position = this.options.position;
    canvas.style.top =
      typeof this.options.top === "number" ? `${this.options.top}px` : this.options.top;
    canvas.style.left =
      typeof this.options.left === "number" ? `${this.options.left}px` : this.options.left;
    canvas.width = this.options.width;
    canvas.height = this.options.height;
    this.options.parentElement?.appendChild(canvas);
    if (this.options.enableSizeChange) {
      this.setResizeHandler();
    }
    return canvas;
  }

  setResizeHandler() {
    if (window.onresize !== null) {
      window.setInterval(this.checkSize.bind(this), 100);
    } else {
      window.onresize = this.checkSize.bind(this);
      window.onorientationchange = this.checkSize.bind(this);
    }
  }

  checkSize() {
    const clientWidth = this.img.clientWidth;
    const clientHeight = this.img.clientHeight;
    const clientOffsetLeft = this.img.offsetLeft;
    const clientOffsetTop = this.img.offsetTop;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const canvasOffsetLeft = this.canvas.offsetLeft;
    const canvasOffsetTop = this.canvas.offsetTop;

    if (canvasWidth !== clientWidth || canvasHeight !== clientHeight) {
      this.canvas.width = clientWidth;
      this.canvas.height = clientHeight;
      this.prepareBackground();
      if (this.glass) {
        this.glass.width = this.canvas.width;
        this.glass.height = this.canvas.height;
      }
      this.prepareReflections();
    }

    if (canvasOffsetLeft !== clientOffsetLeft || canvasOffsetTop !== clientOffsetTop) {
      const dCanvas = this.canvas as unknown as { offsetLeft: number; offsetTop: number };
      dCanvas.offsetLeft = clientOffsetLeft;
      dCanvas.offsetTop = clientOffsetTop;
    }
  }

  animateDrops() {
    if (this.addDropCallback) {
      this.addDropCallback();
    }
    const dropsClone = this.drops.slice();
    const newDrops: Drop[] = [];
    for (let i = 0; i < dropsClone.length; ++i) {
      if (dropsClone[i].animate()) {
        newDrops.push(dropsClone[i]);
      }
    }
    this.drops = newDrops;
    this.requestID = (window as unknown as CustomWindow).requestAnimFrame!(
      this.animateDrops.bind(this),
    );
  }

  pause() {
    if (this.requestID) {
      window.cancelAnimationFrame(this.requestID);
    }
  }

  resume() {
    this.requestID = (window as unknown as CustomWindow).requestAnimFrame!(
      this.animateDrops.bind(this),
    );
  }

  setRequestAnimFrame() {
    const fps = this.options.fps;
    const customWindow = window as unknown as CustomWindow;
    customWindow.requestAnimFrame = (() => {
      return (
        customWindow.requestAnimationFrame ||
        customWindow.webkitRequestAnimationFrame ||
        customWindow.mozRequestAnimationFrame ||
        ((callback: FrameRequestCallback) => {
          window.setTimeout(callback, 1000 / fps);
        })
      );
    })();
  }

  prepareReflections() {
    this.reflected = document.createElement("canvas");
    this.reflected.width = this.canvas.width / this.options.reflectionScaledownFactor;
    this.reflected.height = this.canvas.height / this.options.reflectionScaledownFactor;
    const ctx = this.reflected.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        this.img,
        this.options.crop[0],
        this.options.crop[1],
        this.options.crop[2],
        this.options.crop[3],
        0,
        0,
        this.reflected.width,
        this.reflected.height,
      );
    }
  }

  prepareGlass() {
    this.glass = document.createElement("canvas");
    this.glass.width = this.canvas.width;
    this.glass.height = this.canvas.height;
    this.context = this.glass.getContext("2d")!;
  }

  rain(presets: [number, number, number, number?][], speed: number) {
    if (this.reflection !== this.REFLECTION_NONE) {
      this.prepareReflections();
    }
    this.animateDrops();
    this.presets = presets;
    this.PRIVATE_GRAVITY_FORCE_FACTOR_Y = (this.options.fps * 0.001) / 25;
    this.PRIVATE_GRAVITY_FORCE_FACTOR_X =
      ((Math.PI / 2 - this.options.gravityAngle) * (this.options.fps * 0.001)) / 50;

    if (this.options.enableCollisions) {
      let maxDropRadius = 0;
      for (let i = 0; i < presets.length; i++) {
        if (presets[i][0] + presets[i][1] > maxDropRadius) {
          maxDropRadius = Math.floor(presets[i][0] + presets[i][1]);
        }
      }
      if (maxDropRadius > 0) {
        const mwi = Math.ceil(this.canvas.width / maxDropRadius);
        const mhi = Math.ceil(this.canvas.height / maxDropRadius);
        this.matrix = new CollisionMatrix(mwi, mhi, maxDropRadius);
      } else {
        this.options.enableCollisions = false;
      }
    }

    for (let i = 0; i < presets.length; i++) {
      if (!presets[i][3]) {
        presets[i][3] = -1;
      }
    }

    let lastExecutionTime = 0;
    this.addDropCallback = (() => {
      const timestamp = new Date().getTime();
      if (timestamp - lastExecutionTime < speed) {
        return;
      }
      lastExecutionTime = timestamp;
      const context = this.canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
      }

      let preset: [number, number, number, number?] | undefined;
      for (let i = 0; i < presets.length; i++) {
        const p = presets[i];
        if (p[2] > 1 || p[3] === -1) {
          if (p[3] !== 0) {
            if (p[3]! > 0) p[3]!--;
            for (let y = 0; y < p[2]; ++y) {
              this.putDrop(
                new Drop(
                  this,
                  Math.random() * this.canvas.width,
                  Math.random() * this.canvas.height,
                  p[0],
                  p[1],
                ),
              );
            }
          }
        } else if (Math.random() < p[2]) {
          preset = p;
          break;
        }
      }

      if (preset) {
        this.putDrop(
          new Drop(
            this,
            Math.random() * this.canvas.width,
            Math.random() * this.canvas.height,
            preset[0],
            preset[1],
          ),
        );
      }

      if (context) {
        context.save();
        context.globalAlpha = this.options.opacity;
        context.drawImage(this.glass, 0, 0, this.canvas.width, this.canvas.height);
        context.restore();
      }
    }).bind(this);
  }

  putDrop(drop: Drop) {
    drop.draw();
    if (this.gravity && drop.r > this.options.gravityThreshold) {
      if (this.options.enableCollisions) {
        this.matrix.update(drop);
      }
      this.drops.push(drop);
    }
  }

  clearDrop(drop: Drop, force?: boolean): boolean {
    const result = drop.clear(force);
    if (result) {
      const index = this.drops.indexOf(drop);
      if (index >= 0) {
        this.drops.splice(index, 1);
      }
    }
    return result;
  }

  TRAIL_NONE() {}

  TRAIL_DROPS(drop: Drop) {
    if (!drop.trailY || drop.y - drop.trailY >= Math.random() * 100 * drop.r) {
      drop.trailY = drop.y;
      this.putDrop(
        new Drop(
          this,
          drop.x + (Math.random() * 2 - 1) * Math.random(),
          drop.y - drop.r - 5,
          Math.ceil(drop.r / 5),
          0,
        ),
      );
    }
  }

  TRAIL_SMUDGE(drop: Drop) {
    const y = drop.y - drop.r - 3;
    const x = drop.x - drop.r / 2 + Math.random() * 2;
    if (y < 0 || x < 0) {
      return;
    }
    this.context.drawImage(this.clearbackground, x, y, drop.r, 2, x, y, drop.r, 2);
  }

  GRAVITY_NONE() {
    return true;
  }

  GRAVITY_LINEAR(drop: Drop) {
    if (this.clearDrop(drop)) {
      return true;
    }
    if (drop.yspeed) {
      drop.yspeed += this.PRIVATE_GRAVITY_FORCE_FACTOR_Y * Math.floor(drop.r);
      drop.xspeed += this.PRIVATE_GRAVITY_FORCE_FACTOR_X * Math.floor(drop.r);
    } else {
      drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
      drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
    }
    drop.y += drop.yspeed;
    drop.draw();
    return false;
  }

  GRAVITY_NON_LINEAR(drop: Drop) {
    if (this.clearDrop(drop)) {
      return true;
    }
    if (drop.collided) {
      drop.collided = false;
      drop.seed = Math.floor(drop.r * Math.random() * this.options.fps);
      drop.skipping = false;
      drop.slowing = false;
    } else if (!drop.seed || drop.seed < 0) {
      drop.seed = Math.floor(drop.r * Math.random() * this.options.fps);
      drop.skipping = drop.skipping === false;
      drop.slowing = true;
    }
    drop.seed--;
    if (drop.yspeed) {
      if (drop.slowing) {
        drop.yspeed /= 1.1;
        drop.xspeed /= 1.1;
        if (drop.yspeed < this.PRIVATE_GRAVITY_FORCE_FACTOR_Y) {
          drop.slowing = false;
        }
      } else if (drop.skipping) {
        drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
        drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
      } else {
        drop.yspeed += 1 * this.PRIVATE_GRAVITY_FORCE_FACTOR_Y * Math.floor(drop.r);
        drop.xspeed += 1 * this.PRIVATE_GRAVITY_FORCE_FACTOR_X * Math.floor(drop.r);
      }
    } else {
      drop.yspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_Y;
      drop.xspeed = this.PRIVATE_GRAVITY_FORCE_FACTOR_X;
    }
    if (this.options.gravityAngleVariance !== 0) {
      drop.xspeed += (Math.random() * 2 - 1) * drop.yspeed * this.options.gravityAngleVariance;
    }
    drop.y += drop.yspeed;
    drop.x += drop.xspeed;
    drop.draw();
    return false;
  }

  positiveMin(val1: number, val2: number) {
    let result = 0;
    if (val1 < val2) {
      if (val1 <= 0) {
        result = val2;
      } else {
        result = val1;
      }
    } else {
      if (val2 <= 0) {
        result = val1;
      } else {
        result = val2;
      }
    }
    return result <= 0 ? 1 : result;
  }

  REFLECTION_NONE() {
    this.context.fillStyle = this.options.fillStyle;
    this.context.fill();
  }

  REFLECTION_MINIATURE(drop: Drop) {
    const sx = Math.max(
      (drop.x - this.options.reflectionDropMappingWidth) / this.options.reflectionScaledownFactor,
      0,
    );
    const sy = Math.max(
      (drop.y - this.options.reflectionDropMappingHeight) / this.options.reflectionScaledownFactor,
      0,
    );
    const sw = this.positiveMin(
      (this.options.reflectionDropMappingWidth * 2) / this.options.reflectionScaledownFactor,
      this.reflected.width - sx,
    );
    const sh = this.positiveMin(
      (this.options.reflectionDropMappingHeight * 2) / this.options.reflectionScaledownFactor,
      this.reflected.height - sy,
    );
    const dx = Math.max(drop.x - 1.1 * drop.r, 0);
    const dy = Math.max(drop.y - 1.1 * drop.r, 0);
    this.context.drawImage(this.reflected, sx, sy, sw, sh, dx, dy, drop.r * 2, drop.r * 2);
  }

  COLLISION_SIMPLE(drop: Drop, collisions: DropItem) {
    let item: DropItem | null = collisions;
    let drop2: Drop | null = null;
    while (item != null) {
      const p = item.drop;
      if (p) {
        const radiusSum = drop.r + p.r;
        const dx = drop.x - p.x;
        const dy = drop.y - p.y;
        if (Math.abs(dx) < radiusSum) {
          if (Math.abs(dy) < radiusSum) {
            if (Math.sqrt(Math.pow(drop.x - p.x, 2) + Math.pow(drop.y - p.y, 2)) < drop.r + p.r) {
              drop2 = p;
              break;
            }
          }
        }
      }
      item = item.next;
    }
    if (!drop2) {
      return;
    }

    let higher: Drop;
    let lower: Drop;
    if (drop.y > drop2.y) {
      higher = drop;
      lower = drop2;
    } else {
      higher = drop2;
      lower = drop;
    }
    this.clearDrop(lower);
    this.clearDrop(higher, true);
    this.matrix.remove(higher);
    lower.draw();
    lower.colliding = higher;
    lower.collided = true;
  }

  prepareBackground() {
    this.background = document.createElement("canvas");
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    this.clearbackground = document.createElement("canvas");
    this.clearbackground.width = this.canvas.width;
    this.clearbackground.height = this.canvas.height;

    // Recalculate options.crop to achieve perfect "object-cover" crop of the image
    const imgWidth = this.img.naturalWidth || this.img.width || 640;
    const imgHeight = this.img.naturalHeight || this.img.height || 320;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let sx = 0;
    let sy = 0;
    let sWidth = imgWidth;
    let sHeight = imgHeight;

    if (imgRatio > canvasRatio) {
      // Image is wider than canvas: crop sides
      sWidth = imgHeight * canvasRatio;
      sx = (imgWidth - sWidth) / 2;
    } else {
      // Image is taller than canvas: crop top/bottom
      sHeight = imgWidth / canvasRatio;
      sy = (imgHeight - sHeight) / 2;
    }

    this.options.crop = [sx, sy, sWidth, sHeight];

    const context = this.background.getContext("2d")!;
    if (context) {
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.filter = "brightness(0.55) saturate(0.7) contrast(1.1)";
      context.drawImage(
        this.img,
        this.options.crop[0],
        this.options.crop[1],
        this.options.crop[2],
        this.options.crop[3],
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      // Premium dark overlay to prevent overexposure and maintain elegant contrast
      context.fillStyle = "rgba(0, 0, 0, 0.45)";
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.filter = "none";
    }
    const contextClear = this.clearbackground.getContext("2d")!;
    if (contextClear) {
      contextClear.clearRect(0, 0, this.canvas.width, this.canvas.height);
      contextClear.filter = "brightness(0.65) saturate(0.75) contrast(1.1)";
      contextClear.drawImage(
        this.img,
        this.options.crop[0],
        this.options.crop[1],
        this.options.crop[2],
        this.options.crop[3],
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      // Premium dark overlay to match the exact clear state
      contextClear.fillStyle = "rgba(0, 0, 0, 0.45)";
      contextClear.fillRect(0, 0, this.canvas.width, this.canvas.height);
      contextClear.filter = "none";
    }
    if (!isNaN(this.options.blur) && this.options.blur >= 1) {
      this.stackBlurCanvasRGB(this.canvas.width, this.canvas.height, this.options.blur);
    }
  }

  stackBlurCanvasRGB(width: number, height: number, radius: number) {
    const shgTable = [
      [0, 9],
      [1, 11],
      [2, 12],
      [3, 13],
      [5, 14],
      [7, 15],
      [11, 16],
      [15, 17],
      [22, 18],
      [31, 19],
      [45, 20],
      [63, 21],
      [90, 22],
      [127, 23],
      [181, 24],
    ];
    const mulTable = [
      512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364,
      328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364,
      345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323,
      312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364,
      354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465,
      456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323,
      318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475,
      468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364,
      359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287,
      284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465,
      460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385,
      381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323,
      320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275,
      273, 271, 269, 267, 265, 263, 261, 259,
    ];
    radius |= 0;
    const context = this.background.getContext("2d")!;
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let x = 0,
      y = 0,
      i = 0,
      p = 0,
      yp = 0,
      yi = 0,
      yw = 0,
      rSum = 0,
      gSum = 0,
      bSum = 0,
      rOutSum = 0,
      gOutSum = 0,
      bOutSum = 0,
      rInSum = 0,
      gInSum = 0,
      bInSum = 0,
      pr = 0,
      pg = 0,
      pb = 0,
      rbs = 0;
    const radiusPlus1 = radius + 1;
    const sumFactor = (radiusPlus1 * (radiusPlus1 + 1)) / 2;
    const stackStart = new BlurStack();
    let stackEnd = new BlurStack();
    let stack = stackStart;
    for (i = 1; i < 2 * radius + 1; i++) {
      stack = stack.next = new BlurStack();
      if (i === radiusPlus1) {
        stackEnd = stack;
      }
    }
    stack.next = stackStart;
    let stackIn: BlurStack | null = null;
    let stackOut: BlurStack | null = null;
    yw = yi = 0;
    const mulSum = mulTable[radius];
    let shgSum = 0;
    for (let ssi = 0; ssi < shgTable.length; ++ssi) {
      if (radius <= shgTable[ssi][0]) {
        shgSum = shgTable[ssi - 1][1];
        break;
      }
    }
    for (y = 0; y < height; y++) {
      rInSum = gInSum = bInSum = rSum = gSum = bSum = 0;
      rOutSum = radiusPlus1 * (pr = pixels[yi]);
      gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
      bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
      rSum += sumFactor * pr;
      gSum += sumFactor * pg;
      bSum += sumFactor * pb;
      stack = stackStart;
      for (i = 0; i < radiusPlus1; i++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack = stack.next!;
      }
      for (i = 1; i < radiusPlus1; i++) {
        p = yi + ((width - 1 < i ? width - 1 : i) << 2);
        rSum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
        gSum += (stack.g = pg = pixels[p + 1]) * rbs;
        bSum += (stack.b = pb = pixels[p + 2]) * rbs;
        rInSum += pr;
        gInSum += pg;
        bInSum += pb;
        stack = stack.next!;
      }
      stackIn = stackStart;
      stackOut = stackEnd;
      for (x = 0; x < width; x++) {
        pixels[yi] = (rSum * mulSum) >> shgSum;
        pixels[yi + 1] = (gSum * mulSum) >> shgSum;
        pixels[yi + 2] = (bSum * mulSum) >> shgSum;
        rSum -= rOutSum;
        gSum -= gOutSum;
        bSum -= bOutSum;
        rOutSum -= stackIn!.r;
        gOutSum -= stackIn!.g;
        bOutSum -= stackIn!.b;
        p = (yw + ((p = x + radius + 1) < width - 1 ? p : width - 1)) << 2;
        rInSum += stackIn!.r = pixels[p];
        gInSum += stackIn!.g = pixels[p + 1];
        bInSum += stackIn!.b = pixels[p + 2];
        rSum += rInSum;
        gSum += gInSum;
        bSum += bInSum;
        stackIn = stackIn!.next;
        rOutSum += pr = stackOut!.r;
        gOutSum += pg = stackOut!.g;
        bOutSum += pb = stackOut!.b;
        rInSum -= pr;
        gInSum -= pg;
        bInSum -= pb;
        stackOut = stackOut!.next;
        yi += 4;
      }
      yw += width;
    }
    for (x = 0; x < width; x++) {
      gInSum = bInSum = rInSum = gSum = bSum = rSum = 0;
      yi = x << 2;
      rOutSum = radiusPlus1 * (pr = pixels[yi]);
      gOutSum = radiusPlus1 * (pg = pixels[yi + 1]);
      bOutSum = radiusPlus1 * (pb = pixels[yi + 2]);
      rSum += sumFactor * pr;
      gSum += sumFactor * pg;
      bSum += sumFactor * pb;
      stack = stackStart;
      for (i = 0; i < radiusPlus1; i++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack = stack.next!;
      }
      yp = width;
      for (i = 1; i < radiusPlus1; i++) {
        yi = (yp + x) << 2;
        rSum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
        gSum += (stack.g = pg = pixels[yi + 1]) * rbs;
        bSum += (stack.b = pb = pixels[yi + 2]) * rbs;
        rInSum += pr;
        gInSum += pg;
        bInSum += pb;
        stack = stack.next!;
        if (i < height - 1) {
          yp += width;
        }
      }
      yi = x;
      stackIn = stackStart;
      stackOut = stackEnd;
      for (y = 0; y < height; y++) {
        p = yi << 2;
        pixels[p] = (rSum * mulSum) >> shgSum;
        pixels[p + 1] = (gSum * mulSum) >> shgSum;
        pixels[p + 2] = (bSum * mulSum) >> shgSum;
        rSum -= rOutSum;
        gSum -= gOutSum;
        bSum -= bOutSum;
        rOutSum -= stackIn!.r;
        gOutSum -= stackIn!.g;
        bOutSum -= stackIn!.b;
        p = (x + ((p = y + radiusPlus1) < height - 1 ? p : height - 1) * width) << 2;
        rSum += rInSum += stackIn!.r = pixels[p];
        gSum += gInSum += stackIn!.g = pixels[p + 1];
        bSum += bInSum += stackIn!.b = pixels[p + 2];
        stackIn = stackIn!.next;
        rOutSum += pr = stackOut!.r;
        gOutSum += pg = stackOut!.g;
        bOutSum += pb = stackOut!.b;
        rInSum -= pr;
        gInSum -= pg;
        bInSum -= pb;
        stackOut = stackOut!.next;
        yi += width;
      }
    }
    context.putImageData(imageData, 0, 0);
  }
}

class Drop {
  x: number;
  y: number;
  r: number;
  rainyday: RainyDay;
  context: CanvasRenderingContext2D;
  reflection: HTMLCanvasElement;
  yspeed!: number;
  xspeed!: number;
  colliding: Drop | null = null;
  collided = false;
  seed = 0;
  skipping = false;
  slowing = false;
  trailY?: number;
  terminate = false;
  gid?: string;
  gmx = 0;
  gmy = 0;

  constructor(rainyday: RainyDay, centerX: number, centerY: number, min: number, base: number) {
    this.x = Math.floor(centerX);
    this.y = Math.floor(centerY);
    this.r = Math.random() * base + min;
    this.rainyday = rainyday;
    this.context = rainyday.context;
    this.reflection = rainyday.reflected;
  }

  draw() {
    this.context.save();
    this.context.beginPath();
    const orgR = this.r;
    this.r = 0.95 * this.r;
    if (this.r < 3) {
      this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
      this.context.closePath();
    } else if (this.colliding || this.yspeed > 2) {
      if (this.colliding) {
        const collider = this.colliding;
        this.r = 1.001 * (this.r > collider.r ? this.r : collider.r);
        this.x += collider.x - this.x;
        this.colliding = null;
      }
      const yr = 1 + 0.1 * this.yspeed;
      this.context.moveTo(this.x - this.r / yr, this.y);
      this.context.bezierCurveTo(
        this.x - this.r,
        this.y - this.r * 2,
        this.x + this.r,
        this.y - this.r * 2,
        this.x + this.r / yr,
        this.y,
      );
      this.context.bezierCurveTo(
        this.x + this.r,
        this.y + yr * this.r,
        this.x - this.r,
        this.y + yr * this.r,
        this.x - this.r / yr,
        this.y,
      );
    } else {
      this.context.arc(this.x, this.y, this.r * 0.9, 0, Math.PI * 2, true);
      this.context.closePath();
    }
    this.context.clip();
    this.r = orgR;
    if (this.rainyday.reflection) {
      this.rainyday.reflection(this);
    }
    this.context.restore();
  }

  clear(force?: boolean): boolean {
    this.context.clearRect(
      this.x - this.r - 1,
      this.y - this.r - 2,
      2 * this.r + 2,
      2 * this.r + 2,
    );
    if (force) {
      this.terminate = true;
      return true;
    }
    if (
      this.y - this.r > this.rainyday.canvas.height ||
      this.x - this.r > this.rainyday.canvas.width ||
      this.x + this.r < 0
    ) {
      return true;
    }
    return false;
  }

  animate(): boolean {
    if (this.terminate) {
      return false;
    }
    const stopped = this.rainyday.gravity(this);
    if (!stopped && this.rainyday.trail) {
      this.rainyday.trail(this);
    }
    if (this.rainyday.options.enableCollisions) {
      const collisions = this.rainyday.matrix.update(this, stopped);
      if (collisions) {
        this.rainyday.collision(this, collisions);
      }
    }
    return !stopped || this.terminate;
  }
}

class BlurStack {
  r = 0;
  g = 0;
  b = 0;
  next: BlurStack | null = null;
}

class CollisionMatrix {
  resolution: number;
  xc: number;
  yc: number;
  matrix: DropItem[][];

  constructor(x: number, y: number, r: number) {
    this.resolution = r;
    this.xc = x;
    this.yc = y;
    this.matrix = new Array(x + 6);
    for (let i = 0; i <= x + 5; i++) {
      this.matrix[i] = new Array(y + 6);
      for (let j = 0; j <= y + 5; j++) {
        this.matrix[i][j] = new DropItem(null);
      }
    }
  }

  update(drop: Drop, forceDelete?: boolean): DropItem | null {
    if (drop.gid) {
      if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
        return null;
      }
      this.matrix[drop.gmx][drop.gmy].remove(drop);
      if (forceDelete) {
        return null;
      }
      drop.gmx = Math.floor(drop.x / this.resolution);
      drop.gmy = Math.floor(drop.y / this.resolution);
      if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
        return null;
      }
      this.matrix[drop.gmx][drop.gmy].add(drop);
      const collisions = this.collisions(drop);
      if (collisions && collisions.next != null) {
        return collisions.next;
      }
    } else {
      drop.gid = Math.random().toString(36).substr(2, 9);
      drop.gmx = Math.floor(drop.x / this.resolution);
      drop.gmy = Math.floor(drop.y / this.resolution);
      if (!this.matrix[drop.gmx] || !this.matrix[drop.gmx][drop.gmy]) {
        return null;
      }
      this.matrix[drop.gmx][drop.gmy].add(drop);
    }
    return null;
  }

  collisions(drop: Drop): DropItem {
    let item = new DropItem(null);
    const first = item;
    item = this.addAll(item, drop.gmx - 1, drop.gmy + 1);
    item = this.addAll(item, drop.gmx, drop.gmy + 1);
    item = this.addAll(item, drop.gmx + 1, drop.gmy + 1);
    return first;
  }

  addAll(to: DropItem, x: number, y: number): DropItem {
    if (x > 0 && y > 0 && x < this.xc && y < this.yc) {
      let items = this.matrix[x][y];
      while (items.next != null) {
        items = items.next;
        to.next = new DropItem(items.drop);
        to = to.next;
      }
    }
    return to;
  }

  remove(drop: Drop) {
    if (this.matrix[drop.gmx] && this.matrix[drop.gmx][drop.gmy]) {
      this.matrix[drop.gmx][drop.gmy].remove(drop);
    }
  }
}

class DropItem {
  drop: Drop | null;
  next: DropItem | null = null;

  constructor(drop: Drop | null) {
    this.drop = drop;
  }

  add(drop: Drop) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let item: DropItem = this;
    while (item.next != null) {
      item = item.next;
    }
    item.next = new DropItem(drop);
  }

  remove(drop: Drop) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let item: DropItem = this;
    let prevItem: DropItem | null = null;
    while (item.next != null) {
      prevItem = item;
      item = item.next;
      if (item.drop && item.drop.gid === drop.gid) {
        prevItem.next = item.next;
      }
    }
  }
}
