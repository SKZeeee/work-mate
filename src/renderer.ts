type PixelRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

const WINDOW_SIZE = 160;
const SPRITE_SIZE = 32;
const SPRITE_SCALE = 4;
const FRAME_DURATION_MS = 420;
const FLOAT_SPEED = 0.0022;
const FLOAT_AMPLITUDE = 6;
const BASE_OFFSET_X = Math.floor(
  (WINDOW_SIZE - SPRITE_SIZE * SPRITE_SCALE) / 2,
);
const BASE_OFFSET_Y = 18;

const palette = {
  outline: "#15263e",
  bodyLight: "rgba(163, 244, 255, 0.82)",
  bodyMid: "rgba(118, 220, 239, 0.76)",
  bodyDark: "rgba(86, 175, 202, 0.72)",
  brain: "#f7a4d0",
  brainDark: "#db6fab",
  eye: "#122847",
  shine: "rgba(255, 255, 255, 0.95)",
};

const commonFrame: PixelRect[] = [
  { x: 11, y: 3, w: 10, h: 1, color: palette.outline },
  { x: 9, y: 4, w: 14, h: 1, color: palette.outline },
  { x: 8, y: 5, w: 16, h: 1, color: palette.outline },
  { x: 7, y: 6, w: 18, h: 1, color: palette.outline },
  { x: 6, y: 7, w: 20, h: 1, color: palette.outline },
  { x: 6, y: 8, w: 20, h: 1, color: palette.outline },
  { x: 6, y: 9, w: 20, h: 1, color: palette.outline },
  { x: 7, y: 10, w: 18, h: 1, color: palette.outline },
  { x: 8, y: 11, w: 16, h: 1, color: palette.outline },
  { x: 9, y: 12, w: 14, h: 1, color: palette.outline },
  { x: 10, y: 13, w: 12, h: 1, color: palette.outline },
  { x: 10, y: 14, w: 12, h: 1, color: palette.outline },
  { x: 10, y: 15, w: 12, h: 1, color: palette.outline },
  { x: 11, y: 16, w: 10, h: 1, color: palette.outline },
  { x: 12, y: 17, w: 8, h: 1, color: palette.outline },
  { x: 10, y: 4, w: 12, h: 1, color: palette.bodyLight },
  { x: 9, y: 5, w: 14, h: 1, color: palette.bodyLight },
  { x: 8, y: 6, w: 16, h: 1, color: palette.bodyLight },
  { x: 8, y: 7, w: 16, h: 1, color: palette.bodyLight },
  { x: 8, y: 8, w: 16, h: 1, color: palette.bodyLight },
  { x: 8, y: 9, w: 16, h: 1, color: palette.bodyMid },
  { x: 9, y: 10, w: 14, h: 1, color: palette.bodyMid },
  { x: 10, y: 11, w: 12, h: 1, color: palette.bodyMid },
  { x: 10, y: 12, w: 12, h: 1, color: palette.bodyDark },
  { x: 11, y: 13, w: 10, h: 1, color: palette.bodyDark },
  { x: 11, y: 14, w: 10, h: 1, color: palette.bodyDark },
  { x: 12, y: 15, w: 8, h: 1, color: palette.bodyDark },
  { x: 12, y: 16, w: 8, h: 1, color: palette.bodyDark },
  { x: 11, y: 7, w: 3, h: 2, color: palette.brain },
  { x: 14, y: 6, w: 4, h: 3, color: palette.brainDark },
  { x: 18, y: 7, w: 3, h: 2, color: palette.brain },
  { x: 12, y: 10, w: 1, h: 2, color: palette.eye },
  { x: 19, y: 10, w: 1, h: 2, color: palette.eye },
  { x: 10, y: 5, w: 2, h: 1, color: palette.shine },
  { x: 12, y: 6, w: 1, h: 1, color: palette.shine },
];

const animationFrames: PixelRect[][] = [
  [
    ...commonFrame,
    { x: 12, y: 18, w: 2, h: 5, color: palette.outline },
    { x: 13, y: 18, w: 1, h: 5, color: palette.bodyDark },
    { x: 15, y: 18, w: 2, h: 6, color: palette.outline },
    { x: 16, y: 18, w: 1, h: 6, color: palette.bodyMid },
    { x: 19, y: 18, w: 2, h: 5, color: palette.outline },
    { x: 19, y: 18, w: 1, h: 5, color: palette.bodyDark },
    { x: 11, y: 23, w: 2, h: 1, color: palette.outline },
    { x: 20, y: 23, w: 2, h: 1, color: palette.outline },
  ],
  [
    ...commonFrame,
    { x: 11, y: 18, w: 2, h: 4, color: palette.outline },
    { x: 12, y: 18, w: 1, h: 4, color: palette.bodyDark },
    { x: 15, y: 18, w: 2, h: 5, color: palette.outline },
    { x: 16, y: 18, w: 1, h: 5, color: palette.bodyMid },
    { x: 20, y: 18, w: 2, h: 4, color: palette.outline },
    { x: 20, y: 18, w: 1, h: 4, color: palette.bodyDark },
    { x: 10, y: 22, w: 2, h: 1, color: palette.outline },
    { x: 21, y: 22, w: 2, h: 1, color: palette.outline },
    { x: 14, y: 7, w: 4, h: 2, color: palette.brain },
    { x: 18, y: 8, w: 2, h: 1, color: palette.brainDark },
  ],
];

function drawFrame(
  context: CanvasRenderingContext2D,
  frame: PixelRect[],
  offsetX: number,
  offsetY: number,
) {
  for (const rect of frame) {
    context.fillStyle = rect.color;
    context.fillRect(
      offsetX + rect.x * SPRITE_SCALE,
      offsetY + rect.y * SPRITE_SCALE,
      rect.w * SPRITE_SCALE,
      rect.h * SPRITE_SCALE,
    );
  }
}

function setupCanvas(canvas: HTMLCanvasElement) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = WINDOW_SIZE * devicePixelRatio;
  canvas.height = WINDOW_SIZE * devicePixelRatio;
  canvas.style.width = `${WINDOW_SIZE}px`;
  canvas.style.height = `${WINDOW_SIZE}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D context could not be created.");
  }

  context.scale(devicePixelRatio, devicePixelRatio);
  context.imageSmoothingEnabled = false;
  return context;
}

function startAnimation(context: CanvasRenderingContext2D) {
  const render = (time: number) => {
    context.clearRect(0, 0, WINDOW_SIZE, WINDOW_SIZE);

    const frameIndex =
      Math.floor(time / FRAME_DURATION_MS) % animationFrames.length;
    const bobOffset = Math.round(
      Math.sin(time * FLOAT_SPEED) * FLOAT_AMPLITUDE,
    );
    const shadowWidth = 34 + Math.round(Math.cos(time * FLOAT_SPEED) * 2);

    context.fillStyle = "rgba(15, 31, 52, 0.18)";
    context.fillRect(80 - shadowWidth, 136, shadowWidth * 2, 6);

    drawFrame(
      context,
      animationFrames[frameIndex],
      BASE_OFFSET_X,
      BASE_OFFSET_Y + bobOffset,
    );
    window.requestAnimationFrame(render);
  };

  window.requestAnimationFrame(render);
}

function main() {
  const canvas = document.getElementById("petCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element was not found.");
  }

  const context = setupCanvas(canvas);
  startAnimation(context);
}

window.addEventListener("DOMContentLoaded", main);
