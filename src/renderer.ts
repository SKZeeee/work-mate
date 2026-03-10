type MeterState = {
  label: string;
  value: number;
  target: number;
  cooldownMs: number;
  phase: number;
};

type BarState = {
  value: number;
  target: number;
  cooldownMs: number;
  phase: number;
};

type GaugeState = {
  label: string;
  unit: string;
  value: number;
  target: number;
  cooldownMs: number;
  phase: number;
};

type AlienPixelRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

type BedrockState = {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
  detail: string;
  updatedAt: string | null;
};

type OverlayConfig = {
  mode: "cockpit-hud";
  alienBedrockEnabled: boolean;
};

type WorkFriendsOverlayApi = {
  mode: "cockpit-hud";
  getConfig(): Promise<OverlayConfig>;
  getAlienBedrockState(): Promise<BedrockState | null>;
  onAlienBedrockStateChange(callback: (state: BedrockState) => void): () => void;
  requestAlienBedrockRefresh(): void;
};

type AlienBedrockModel = {
  enabled: boolean;
  state: BedrockState | null;
};

type HudCanvasState = {
  context: CanvasRenderingContext2D;
  resize: () => void;
  getWidth: () => number;
  getHeight: () => number;
};

type BottomGraphLayout = {
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  innerX: number;
  innerY: number;
  innerWidth: number;
  innerHeight: number;
};

const BAR_COUNT = 28;
const METER_SEGMENTS = 18;
const GRAPH_SEGMENTS = 11;
const ALIEN_FRAME_DURATION_MS = 420;
const ALIEN_FLOAT_SPEED = 0.0022;
const ALIEN_FLOAT_AMPLITUDE = 4;
const HUD_FONT =
  '"Eurostile", "DIN Condensed", "Avenir Next Condensed", "Arial Narrow", "Hiragino Sans", sans-serif';
const HUD_NUMERIC_FONT =
  '"SF Mono", "Roboto Mono", "IBM Plex Mono", "Menlo", "Consolas", monospace';
const alienPalette = {
  outline: "#15263e",
  bodyLight: "rgba(163, 244, 255, 0.82)",
  bodyMid: "rgba(118, 220, 239, 0.76)",
  bodyDark: "rgba(86, 175, 202, 0.72)",
  brain: "#f7a4d0",
  brainDark: "#db6fab",
  eye: "#122847",
  shine: "rgba(255, 255, 255, 0.95)",
};
const alienCommonFrame: AlienPixelRect[] = [
  { x: 11, y: 3, w: 10, h: 1, color: alienPalette.outline },
  { x: 9, y: 4, w: 14, h: 1, color: alienPalette.outline },
  { x: 8, y: 5, w: 16, h: 1, color: alienPalette.outline },
  { x: 7, y: 6, w: 18, h: 1, color: alienPalette.outline },
  { x: 6, y: 7, w: 20, h: 1, color: alienPalette.outline },
  { x: 6, y: 8, w: 20, h: 1, color: alienPalette.outline },
  { x: 6, y: 9, w: 20, h: 1, color: alienPalette.outline },
  { x: 7, y: 10, w: 18, h: 1, color: alienPalette.outline },
  { x: 8, y: 11, w: 16, h: 1, color: alienPalette.outline },
  { x: 9, y: 12, w: 14, h: 1, color: alienPalette.outline },
  { x: 10, y: 13, w: 12, h: 1, color: alienPalette.outline },
  { x: 10, y: 14, w: 12, h: 1, color: alienPalette.outline },
  { x: 10, y: 15, w: 12, h: 1, color: alienPalette.outline },
  { x: 11, y: 16, w: 10, h: 1, color: alienPalette.outline },
  { x: 12, y: 17, w: 8, h: 1, color: alienPalette.outline },
  { x: 10, y: 4, w: 12, h: 1, color: alienPalette.bodyLight },
  { x: 9, y: 5, w: 14, h: 1, color: alienPalette.bodyLight },
  { x: 8, y: 6, w: 16, h: 1, color: alienPalette.bodyLight },
  { x: 8, y: 7, w: 16, h: 1, color: alienPalette.bodyLight },
  { x: 8, y: 8, w: 16, h: 1, color: alienPalette.bodyLight },
  { x: 8, y: 9, w: 16, h: 1, color: alienPalette.bodyMid },
  { x: 9, y: 10, w: 14, h: 1, color: alienPalette.bodyMid },
  { x: 10, y: 11, w: 12, h: 1, color: alienPalette.bodyMid },
  { x: 10, y: 12, w: 12, h: 1, color: alienPalette.bodyDark },
  { x: 11, y: 13, w: 10, h: 1, color: alienPalette.bodyDark },
  { x: 11, y: 14, w: 10, h: 1, color: alienPalette.bodyDark },
  { x: 12, y: 15, w: 8, h: 1, color: alienPalette.bodyDark },
  { x: 12, y: 16, w: 8, h: 1, color: alienPalette.bodyDark },
  { x: 11, y: 7, w: 3, h: 2, color: alienPalette.brain },
  { x: 14, y: 6, w: 4, h: 3, color: alienPalette.brainDark },
  { x: 18, y: 7, w: 3, h: 2, color: alienPalette.brain },
  { x: 12, y: 10, w: 1, h: 2, color: alienPalette.eye },
  { x: 19, y: 10, w: 1, h: 2, color: alienPalette.eye },
  { x: 10, y: 5, w: 2, h: 1, color: alienPalette.shine },
  { x: 12, y: 6, w: 1, h: 1, color: alienPalette.shine },
];
const alienFrames: AlienPixelRect[][] = [
  [
    ...alienCommonFrame,
    { x: 12, y: 18, w: 2, h: 5, color: alienPalette.outline },
    { x: 13, y: 18, w: 1, h: 5, color: alienPalette.bodyDark },
    { x: 15, y: 18, w: 2, h: 6, color: alienPalette.outline },
    { x: 16, y: 18, w: 1, h: 6, color: alienPalette.bodyMid },
    { x: 19, y: 18, w: 2, h: 5, color: alienPalette.outline },
    { x: 19, y: 18, w: 1, h: 5, color: alienPalette.bodyDark },
    { x: 11, y: 23, w: 2, h: 1, color: alienPalette.outline },
    { x: 20, y: 23, w: 2, h: 1, color: alienPalette.outline },
  ],
  [
    ...alienCommonFrame,
    { x: 11, y: 18, w: 2, h: 4, color: alienPalette.outline },
    { x: 12, y: 18, w: 1, h: 4, color: alienPalette.bodyDark },
    { x: 15, y: 18, w: 2, h: 5, color: alienPalette.outline },
    { x: 16, y: 18, w: 1, h: 5, color: alienPalette.bodyMid },
    { x: 20, y: 18, w: 2, h: 4, color: alienPalette.outline },
    { x: 20, y: 18, w: 1, h: 4, color: alienPalette.bodyDark },
    { x: 10, y: 22, w: 2, h: 1, color: alienPalette.outline },
    { x: 21, y: 22, w: 2, h: 1, color: alienPalette.outline },
    { x: 14, y: 7, w: 4, h: 2, color: alienPalette.brain },
    { x: 18, y: 8, w: 2, h: 1, color: alienPalette.brainDark },
  ],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getTrackedTextWidth(
  context: CanvasRenderingContext2D,
  text: string,
  tracking: number,
) {
  if (text.length <= 1) {
    return context.measureText(text).width;
  }

  return (
    Array.from(text).reduce((sum, character) => {
      return sum + context.measureText(character).width;
    }, 0) +
    tracking * (text.length - 1)
  );
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  mode: "fill" | "stroke",
) {
  if (tracking === 0) {
    if (mode === "fill") {
      context.fillText(text, x, y);
    } else {
      context.strokeText(text, x, y);
    }
    return;
  }

  const totalWidth = getTrackedTextWidth(context, text, tracking);
  let cursorX = x;

  if (context.textAlign === "center") {
    cursorX -= totalWidth / 2;
  } else if (context.textAlign === "right" || context.textAlign === "end") {
    cursorX -= totalWidth;
  }

  for (const character of Array.from(text)) {
    if (mode === "fill") {
      context.fillText(character, cursorX, y);
    } else {
      context.strokeText(character, cursorX, y);
    }

    cursorX += context.measureText(character).width + tracking;
  }
}

type HudTextStyle = {
  font: string;
  fillStyle: string;
  strokeStyle?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  tracking?: number;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
};

function drawHudText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: HudTextStyle,
) {
  context.save();
  context.font = style.font;
  context.fillStyle = style.fillStyle;
  context.textAlign = style.textAlign ?? "left";
  context.textBaseline = style.textBaseline ?? "alphabetic";
  context.lineJoin = "round";
  context.shadowColor = style.shadowColor ?? "transparent";
  context.shadowBlur = style.shadowBlur ?? 0;

  if (style.strokeStyle) {
    context.strokeStyle = style.strokeStyle;
    context.lineWidth = style.strokeWidth ?? 2;
    drawTrackedText(context, text, x, y, style.tracking ?? 0, "stroke");
  }

  drawTrackedText(context, text, x, y, style.tracking ?? 0, "fill");
  context.restore();
}

function getOverlayApi() {
  return (window as Window & { workFriendsOverlay?: WorkFriendsOverlayApi }).workFriendsOverlay;
}

function createAlienBedrockModel(): AlienBedrockModel {
  return {
    enabled: false,
    state: null,
  };
}

function createAlienBedrockErrorState(detail: string): BedrockState {
  return {
    status: "error",
    message: "Bedrock の状態を取得できません。",
    detail,
    updatedAt: null,
  };
}

async function setupAlienBedrock(model: AlienBedrockModel) {
  const overlayApi = getOverlayApi();

  if (!overlayApi) {
    return;
  }

  try {
    const config = await overlayApi.getConfig();
    model.enabled = config.alienBedrockEnabled;

    if (!model.enabled) {
      return;
    }

    model.state = await overlayApi.getAlienBedrockState();
    overlayApi.onAlienBedrockStateChange((state) => {
      model.state = state;
    });
  } catch (error) {
    model.enabled = true;
    model.state = createAlienBedrockErrorState(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function getAlienFooterText(model: AlienBedrockModel) {
  if (!model.enabled) {
    return "PASSIVE ORGANIC SIGNAL";
  }

  if (!model.state) {
    return "BEDROCK LINK BOOT";
  }

  if (model.state.status === "ready") {
    return "BEDROCK LINK ACTIVE";
  }

  if (model.state.status === "loading") {
    return "BEDROCK THINKING";
  }

  if (model.state.status === "error") {
    return "BEDROCK ERROR";
  }

  return "BEDROCK STANDBY";
}

function getAlienMessageText(model: AlienBedrockModel) {
  if (!model.enabled) {
    return null;
  }

  if (!model.state) {
    return "Bedrock との接続を準備しています。";
  }

  if (model.state.status === "ready") {
    return model.state.message;
  }

  if (model.state.status === "loading") {
    return "いま返事を生成しています。";
  }

  if (model.state.status === "error") {
    return model.state.message;
  }

  return "Bedrock からのひとことを待っています。";
}

function wrapTextLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";
  let truncated = false;

  for (const character of Array.from(normalized)) {
    const candidate = currentLine + character;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = character;

      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
    } else {
      currentLine = candidate;
    }
  }

  if (!truncated && currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (truncated && lines.length > 0) {
    const lastLineIndex = lines.length - 1;
    lines[lastLineIndex] = `${lines[lastLineIndex].trimEnd()}…`;
  }

  return lines.slice(0, maxLines);
}

function createMeter(label: string, phase: number): MeterState {
  return {
    label,
    value: randomRange(0.28, 0.58),
    target: randomRange(0.32, 0.7),
    cooldownMs: randomRange(80, 460),
    phase,
  };
}

function createBars() {
  return Array.from({ length: BAR_COUNT }, (_, index) => ({
    value: randomRange(0.18, 0.82),
    target: randomRange(0.18, 0.82),
    cooldownMs: randomRange(40, 260),
    phase: index * 0.41,
  })) satisfies BarState[];
}

function createGauge(label: string, unit: string, phase: number): GaugeState {
  return {
    label,
    unit,
    value: randomRange(0.34, 0.62),
    target: randomRange(0.4, 0.74),
    cooldownMs: randomRange(160, 560),
    phase,
  };
}

function pickMeterTarget() {
  const roll = Math.random();

  if (roll > 0.92) {
    return randomRange(0.94, 1);
  }

  if (roll > 0.72) {
    return randomRange(0.68, 0.9);
  }

  return randomRange(0.18, 0.66);
}

function pickBarTarget(index: number, time: number) {
  const rhythmicBase = 0.24 + 0.26 * (Math.sin(time * 0.0011 + index * 0.44) + 1);
  return clamp(rhythmicBase + randomRange(-0.12, 0.34), 0.08, 1);
}

function pickGaugeTarget() {
  const roll = Math.random();

  if (roll > 0.9) {
    return randomRange(0.9, 1);
  }

  if (roll > 0.62) {
    return randomRange(0.66, 0.88);
  }

  return randomRange(0.22, 0.7);
}

function setupCanvas(canvas: HTMLCanvasElement): HudCanvasState {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D context could not be created.");
  }

  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    width = Math.max(window.innerWidth, 960);
    height = Math.max(window.innerHeight, 540);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = true;
  };

  resize();

  return {
    context,
    resize,
    getWidth() {
      return width;
    },
    getHeight() {
      return height;
    },
  };
}

function drawPanelShape(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  side: "left" | "right" | "bottom",
) {
  const notch = Math.min(28, width * 0.22);
  const bottomNotch = Math.min(44, height * 0.34);

  context.beginPath();

  if (side === "left") {
    context.moveTo(x + notch, y);
    context.lineTo(x + width, y);
    context.lineTo(x + width, y + height);
    context.lineTo(x + notch, y + height);
    context.lineTo(x, y + height * 0.74);
    context.lineTo(x, y + height * 0.26);
  } else if (side === "right") {
    context.moveTo(x, y);
    context.lineTo(x + width - notch, y);
    context.lineTo(x + width, y + height * 0.26);
    context.lineTo(x + width, y + height * 0.74);
    context.lineTo(x + width - notch, y + height);
    context.lineTo(x, y + height);
  } else {
    context.moveTo(x + bottomNotch, y);
    context.lineTo(x + width - bottomNotch, y);
    context.lineTo(x + width, y + height * 0.34);
    context.lineTo(x + width - bottomNotch, y + height);
    context.lineTo(x + bottomNotch, y + height);
    context.lineTo(x, y + height * 0.34);
  }

  context.closePath();
}

function getPanelHorizontalBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  side: "left" | "right",
  sampleY: number,
) {
  const notch = Math.min(28, width * 0.22);
  const topTransitionY = y + height * 0.26;
  const bottomTransitionY = y + height * 0.74;
  const bottomY = y + height;

  if (side === "left") {
    let leftEdge = x;

    if (sampleY < topTransitionY) {
      const progress = clamp((sampleY - y) / (topTransitionY - y), 0, 1);
      leftEdge = x + notch * (1 - progress);
    } else if (sampleY > bottomTransitionY) {
      const progress = clamp((sampleY - bottomTransitionY) / (bottomY - bottomTransitionY), 0, 1);
      leftEdge = x + notch * progress;
    }

    return {
      left: leftEdge,
      right: x + width,
    };
  }

  let rightEdge = x + width;

  if (sampleY < topTransitionY) {
    const progress = clamp((sampleY - y) / (topTransitionY - y), 0, 1);
    rightEdge = x + width - notch * (1 - progress);
  } else if (sampleY > bottomTransitionY) {
    const progress = clamp((sampleY - bottomTransitionY) / (bottomY - bottomTransitionY), 0, 1);
    rightEdge = x + width - notch * progress;
  }

  return {
    left: x,
    right: rightEdge,
  };
}

function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const sideGradient = context.createLinearGradient(0, 0, width, 0);
  sideGradient.addColorStop(0, "rgba(6, 28, 44, 0.2)");
  sideGradient.addColorStop(0.14, "rgba(6, 28, 44, 0.04)");
  sideGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
  sideGradient.addColorStop(0.86, "rgba(6, 28, 44, 0.04)");
  sideGradient.addColorStop(1, "rgba(6, 28, 44, 0.2)");
  context.fillStyle = sideGradient;
  context.fillRect(0, 0, width, height);

  const floorGradient = context.createLinearGradient(0, height, 0, height * 0.54);
  floorGradient.addColorStop(0, "rgba(4, 20, 33, 0.28)");
  floorGradient.addColorStop(1, "rgba(4, 20, 33, 0)");
  context.fillStyle = floorGradient;
  context.fillRect(0, height * 0.54, width, height * 0.46);

  for (let y = 12; y < height; y += 18) {
    const alpha = 0.02 + 0.01 * (Math.sin(time * 0.0021 + y * 0.07) + 1);
    context.fillStyle = `rgba(137, 243, 255, ${alpha.toFixed(3)})`;
    context.fillRect(0, y, width, 1);
  }

  const sweepX = ((time * 0.34) % (width + 320)) - 160;
  const sweep = context.createLinearGradient(sweepX - 90, 0, sweepX + 90, 0);
  sweep.addColorStop(0, "rgba(0, 0, 0, 0)");
  sweep.addColorStop(0.5, "rgba(125, 240, 255, 0.08)");
  sweep.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = sweep;
  context.fillRect(Math.max(0, sweepX - 90), 0, 180, height);
}

function drawCenterReticle(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const centerX = width / 2;
  const centerY = height * 0.42;
  const radius = Math.min(width, height) * 0.078;
  const ringPulse = 1 + Math.sin(time * 0.0042) * 0.045;
  const outerRadius = radius * 1.58 * ringPulse;

  context.save();
  context.strokeStyle = "rgba(143, 250, 255, 0.52)";
  context.lineWidth = 2;
  context.setLineDash([12, 10]);
  context.beginPath();
  context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = "rgba(255, 181, 94, 0.38)";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(147, 245, 255, 0.62)";
  context.beginPath();
  context.moveTo(centerX - radius * 1.8, centerY);
  context.lineTo(centerX - radius * 0.76, centerY);
  context.moveTo(centerX + radius * 0.76, centerY);
  context.lineTo(centerX + radius * 1.8, centerY);
  context.moveTo(centerX, centerY - radius * 1.8);
  context.lineTo(centerX, centerY - radius * 0.76);
  context.moveTo(centerX, centerY + radius * 0.76);
  context.lineTo(centerX, centerY + radius * 1.8);
  context.stroke();

  context.fillStyle = "rgba(165, 252, 255, 0.86)";
  context.beginPath();
  context.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function getMeterDisplayValue(meter: MeterState, time: number) {
  return clamp(meter.value + Math.sin(time * 0.0015 + meter.phase) * 0.018, 0.04, 1);
}

function drawMeter(
  context: CanvasRenderingContext2D,
  meter: MeterState,
  x: number,
  y: number,
  width: number,
  height: number,
  side: "left" | "right",
  time: number,
) {
  const displayValue = getMeterDisplayValue(meter, time);
  const alertState = displayValue >= 0.94;
  const textAlign = side === "left" ? "left" : "right";
  const topInset = 96;
  const bottomInset = 26;
  const innerPadding = 14;
  const textPadding = innerPadding + 6;
  const segmentGap = 6;
  const segmentHeight =
    (height - topInset - bottomInset - segmentGap * (METER_SEGMENTS - 1)) /
    METER_SEGMENTS;
  const headerBounds = getPanelHorizontalBounds(x, y, width, height, side, y + 28);
  const valueBounds = getPanelHorizontalBounds(x, y, width, height, side, y + 72);
  const footerBounds = getPanelHorizontalBounds(
    x,
    y,
    width,
    height,
    side,
    y + height - 28,
  );
  const labelX =
    side === "left"
      ? headerBounds.left + textPadding
      : headerBounds.right - textPadding;
  const valueX =
    side === "left" ? valueBounds.left + textPadding : valueBounds.right - textPadding;
  const footerX =
    side === "left"
      ? footerBounds.left + textPadding
      : footerBounds.right - textPadding;

  drawPanelShape(context, x, y, width, height, side);
  context.fillStyle = "rgba(8, 22, 34, 0.16)";
  context.fill();
  context.strokeStyle = "rgba(117, 239, 255, 0.56)";
  context.lineWidth = 2;
  context.stroke();

  drawHudText(context, meter.label, labelX, y + 27, {
    font: `700 13px ${HUD_FONT}`,
    fillStyle: "rgba(166, 252, 255, 0.9)",
    strokeStyle: "rgba(7, 18, 29, 0.9)",
    strokeWidth: 3,
    shadowColor: "rgba(110, 244, 255, 0.18)",
    shadowBlur: 10,
    tracking: 1.8,
    textAlign,
  });

  drawHudText(
    context,
    `${String(Math.round(displayValue * 100)).padStart(3, "0")}`,
    valueX,
    y + 71,
    {
      font: `700 33px ${HUD_NUMERIC_FONT}`,
      fillStyle: alertState
        ? `rgba(255, 112, 126, ${(0.82 + Math.sin(time * 0.02) * 0.12).toFixed(3)})`
        : "rgba(237, 251, 255, 0.94)",
      strokeStyle: "rgba(7, 18, 29, 0.94)",
      strokeWidth: 5,
      shadowColor: alertState
        ? "rgba(255, 88, 106, 0.3)"
        : "rgba(110, 244, 255, 0.22)",
      shadowBlur: 14,
      tracking: 1.1,
      textAlign,
    },
  );

  drawHudText(context, alertState ? "MAX LOAD" : "STABLE", footerX, y + height - 24, {
    font: `700 10px ${HUD_FONT}`,
    fillStyle: alertState
      ? "rgba(255, 142, 154, 0.92)"
      : "rgba(255, 198, 118, 0.84)",
    strokeStyle: "rgba(7, 18, 29, 0.88)",
    strokeWidth: 3,
    shadowColor: "rgba(255, 196, 110, 0.16)",
    shadowBlur: 8,
    tracking: 2.4,
    textAlign,
  });

  context.save();
  drawPanelShape(context, x, y, width, height, side);
  context.clip();

  for (let index = 0; index < METER_SEGMENTS; index += 1) {
    const levelRatio = (index + 1) / METER_SEGMENTS;
    const isActive = levelRatio <= displayValue;
    const barY =
      y + height - bottomInset - (index + 1) * segmentHeight - index * segmentGap;
    const barCenterY = barY + segmentHeight / 2;
    const bounds = getPanelHorizontalBounds(x, y, width, height, side, barCenterY);
    const barX = bounds.left + innerPadding;
    const barWidth = Math.max(0, bounds.right - bounds.left - innerPadding * 2);
    let fillStyle = "rgba(76, 106, 118, 0.16)";

    if (isActive) {
      if (alertState || levelRatio > 0.84) {
        fillStyle = `rgba(255, 82, 95, ${(0.52 + Math.sin(time * 0.018 + index) * 0.14).toFixed(3)})`;
      } else if (levelRatio > 0.64) {
        fillStyle = "rgba(255, 186, 82, 0.72)";
      } else {
        fillStyle = "rgba(105, 247, 255, 0.78)";
      }
    }

    context.fillStyle = fillStyle;
    context.fillRect(barX, barY, barWidth, segmentHeight);

    if (isActive) {
      context.fillStyle = "rgba(242, 255, 255, 0.28)";
      context.fillRect(barX, barY, barWidth, Math.min(2, segmentHeight));
    }
  }

  context.restore();
}

function getBarDisplayValue(bar: BarState, time: number) {
  return clamp(bar.value + Math.sin(time * 0.0028 + bar.phase) * 0.05, 0.05, 1);
}

function getGaugeDisplayValue(gauge: GaugeState, time: number) {
  return clamp(gauge.value + Math.sin(time * 0.0022 + gauge.phase) * 0.03, 0.05, 1);
}

function getBottomGraphLayout(width: number, height: number): BottomGraphLayout {
  const panelWidth = Math.min(width * 0.64, 980);
  const panelHeight = Math.min(height * 0.2, 170);
  const panelX = (width - panelWidth) / 2;
  const panelY = height - panelHeight - 34;

  return {
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    innerX: panelX + 34,
    innerY: panelY + 42,
    innerWidth: panelWidth - 68,
    innerHeight: panelHeight - 62,
  };
}

function getPolarPoint(angle: number, radius: number) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function drawOctagon(
  context: CanvasRenderingContext2D,
  radius: number,
  cornerInset: number,
) {
  context.beginPath();
  context.moveTo(-radius + cornerInset, -radius);
  context.lineTo(radius - cornerInset, -radius);
  context.lineTo(radius, -radius + cornerInset);
  context.lineTo(radius, radius - cornerInset);
  context.lineTo(radius - cornerInset, radius);
  context.lineTo(-radius + cornerInset, radius);
  context.lineTo(-radius, radius - cornerInset);
  context.lineTo(-radius, -radius + cornerInset);
  context.closePath();
}

function drawGaugeSegment(
  context: CanvasRenderingContext2D,
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
) {
  const outerStart = getPolarPoint(startAngle, outerRadius);
  const outerEnd = getPolarPoint(endAngle, outerRadius);
  const innerEnd = getPolarPoint(endAngle, innerRadius);
  const innerStart = getPolarPoint(startAngle, innerRadius);

  context.beginPath();
  context.moveTo(outerStart.x, outerStart.y);
  context.lineTo(outerEnd.x, outerEnd.y);
  context.lineTo(innerEnd.x, innerEnd.y);
  context.lineTo(innerStart.x, innerStart.y);
  context.closePath();
}

function drawAlienSprite(
  context: CanvasRenderingContext2D,
  frame: AlienPixelRect[],
  offsetX: number,
  offsetY: number,
  scale: number,
) {
  for (const rect of frame) {
    context.fillStyle = rect.color;
    context.fillRect(
      offsetX + rect.x * scale,
      offsetY + rect.y * scale,
      rect.w * scale,
      rect.h * scale,
    );
  }
}

function drawBottomGraph(
  context: CanvasRenderingContext2D,
  bars: BarState[],
  width: number,
  height: number,
  time: number,
) {
  const { panelWidth, panelHeight, panelX, panelY, innerX, innerY, innerWidth, innerHeight } =
    getBottomGraphLayout(width, height);
  const barGap = 6;
  const barWidth = (innerWidth - barGap * (bars.length - 1)) / bars.length;
  const segmentGap = 3;
  const segmentHeight =
    (innerHeight - segmentGap * (GRAPH_SEGMENTS - 1)) / GRAPH_SEGMENTS;
  const labelInset = Math.max(58, panelWidth * 0.09);
  const labelY = panelY + 35;

  drawPanelShape(context, panelX, panelY, panelWidth, panelHeight, "bottom");
  context.fillStyle = "rgba(8, 20, 31, 0.2)";
  context.fill();
  context.strokeStyle = "rgba(111, 239, 255, 0.54)";
  context.lineWidth = 2;
  context.stroke();

  drawHudText(context, "VECTOR INTAKE", panelX + labelInset, labelY, {
    font: `700 13px ${HUD_FONT}`,
    fillStyle: "rgba(167, 252, 255, 0.92)",
    strokeStyle: "rgba(8, 18, 28, 0.88)",
    strokeWidth: 3,
    shadowColor: "rgba(111, 244, 255, 0.16)",
    shadowBlur: 8,
    tracking: 1.7,
  });

  drawHudText(context, "RANDOMIZED FEED", panelX + panelWidth - labelInset, labelY, {
    font: `700 12px ${HUD_FONT}`,
    fillStyle: "rgba(255, 192, 108, 0.9)",
    strokeStyle: "rgba(8, 18, 28, 0.88)",
    strokeWidth: 3,
    shadowColor: "rgba(255, 193, 112, 0.14)",
    shadowBlur: 8,
    tracking: 1.5,
    textAlign: "right",
  });

  for (let index = 0; index < bars.length; index += 1) {
    const displayValue = getBarDisplayValue(bars[index], time);
    const activeSegments = Math.max(1, Math.round(displayValue * GRAPH_SEGMENTS));
    const x = innerX + index * (barWidth + barGap);

    for (let segment = 0; segment < GRAPH_SEGMENTS; segment += 1) {
      const y =
        innerY + innerHeight - (segment + 1) * segmentHeight - segment * segmentGap;
      let fillStyle = "rgba(72, 96, 104, 0.16)";

      if (segment < activeSegments) {
        const levelRatio = (segment + 1) / GRAPH_SEGMENTS;
        if (levelRatio > 0.9) {
          fillStyle = "rgba(255, 92, 105, 0.78)";
        } else if (levelRatio > 0.7) {
          fillStyle = "rgba(255, 190, 98, 0.76)";
        } else if ((index + segment) % 4 === 0) {
          fillStyle = "rgba(126, 247, 255, 0.82)";
        } else {
          fillStyle = "rgba(82, 218, 255, 0.72)";
        }
      }

      context.fillStyle = fillStyle;
      context.fillRect(x, y, barWidth, segmentHeight);
    }
  }

  context.strokeStyle = "rgba(164, 250, 255, 0.36)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(innerX, innerY + innerHeight + 9);
  context.lineTo(innerX + innerWidth, innerY + innerHeight + 9);
  context.stroke();
}

function drawAngularGauge(
  context: CanvasRenderingContext2D,
  gauge: GaugeState,
  width: number,
  height: number,
  time: number,
) {
  const graphLayout = getBottomGraphLayout(width, height);
  const gap = Math.max(12, width * 0.012);
  const availableWidth =
    width - (graphLayout.panelX + graphLayout.panelWidth) - gap * 2;
  const size = Math.min(250, width * 0.16, height * 0.28, availableWidth);

  if (size < 120) {
    return;
  }

  const x = clamp(
    width - size - gap,
    graphLayout.panelX + graphLayout.panelWidth + gap,
    width - size - gap,
  );
  const y = clamp(
    graphLayout.panelY + graphLayout.panelHeight * 0.5 - size * 0.58,
    Math.max(84, height * 0.16),
    height - size - 14,
  );
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const span = endAngle - startAngle;
  const displayValue = getGaugeDisplayValue(gauge, time);
  const alertState = displayValue >= 0.88;
  const activeAngle = startAngle + span * displayValue;
  const segmentCount = 18;
  const angularGap = span / segmentCount / 5.8;

  context.save();
  context.translate(centerX, centerY);

  drawOctagon(context, radius * 0.98, radius * 0.28);
  context.fillStyle = "rgba(7, 18, 29, 0.16)";
  context.fill();
  context.strokeStyle = "rgba(116, 240, 255, 0.42)";
  context.lineWidth = 2;
  context.stroke();

  drawOctagon(context, radius * 0.74, radius * 0.2);
  context.fillStyle = "rgba(8, 18, 29, 0.18)";
  context.fill();
  context.strokeStyle = "rgba(108, 242, 255, 0.24)";
  context.lineWidth = 1.4;
  context.stroke();

  for (let index = 0; index < segmentCount; index += 1) {
    const segmentStartRatio = index / segmentCount;
    const segmentEndRatio = (index + 1) / segmentCount;
    const segmentMidRatio = (segmentStartRatio + segmentEndRatio) / 2;
    const segmentStartAngle = startAngle + span * segmentStartRatio + angularGap;
    const segmentEndAngle = startAngle + span * segmentEndRatio - angularGap;
    const isActive = segmentMidRatio <= displayValue;

    let fillStyle = "rgba(67, 95, 108, 0.2)";
    if (isActive) {
      if (segmentMidRatio >= 0.82 || alertState) {
        fillStyle = `rgba(255, 94, 112, ${(0.68 + Math.sin(time * 0.022 + index) * 0.12).toFixed(3)})`;
      } else if (segmentMidRatio >= 0.62) {
        fillStyle = "rgba(255, 189, 102, 0.8)";
      } else {
        fillStyle = "rgba(107, 246, 255, 0.86)";
      }
    }

    drawGaugeSegment(
      context,
      segmentStartAngle,
      segmentEndAngle,
      radius * 0.6,
      radius * 0.84,
    );
    context.fillStyle = fillStyle;
    context.fill();
  }

  for (let tick = 0; tick <= 10; tick += 1) {
    const ratio = tick / 10;
    const angle = startAngle + span * ratio;
    const isMajor = tick % 2 === 0;
    const innerRadius = radius * (isMajor ? 0.44 : 0.5);
    const outerRadius = radius * 0.56;

    context.strokeStyle =
      ratio >= 0.82 ? "rgba(255, 109, 126, 0.88)" : "rgba(174, 250, 255, 0.72)";
    context.lineWidth = isMajor ? 3 : 1.4;
    context.beginPath();
    context.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    context.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
    context.stroke();

    if (isMajor) {
      const labelRadius = radius * 0.33;
      drawHudText(
        context,
        String(tick),
        Math.cos(angle) * labelRadius,
        Math.sin(angle) * labelRadius,
        {
          font: `700 ${Math.max(12, radius * 0.14)}px ${HUD_NUMERIC_FONT}`,
          fillStyle:
            ratio >= 0.82
              ? "rgba(255, 145, 155, 0.9)"
              : "rgba(200, 252, 255, 0.86)",
          strokeStyle: "rgba(7, 18, 29, 0.9)",
          strokeWidth: 3,
          shadowColor: "rgba(108, 243, 255, 0.14)",
          shadowBlur: 6,
          textAlign: "center",
          textBaseline: "middle",
        },
      );
    }
  }

  context.save();
  context.rotate(activeAngle);
  context.fillStyle = alertState
    ? "rgba(255, 111, 128, 0.94)"
    : "rgba(255, 192, 96, 0.9)";
  context.beginPath();
  context.moveTo(-radius * 0.16, -radius * 0.045);
  context.lineTo(radius * 0.68, 0);
  context.lineTo(-radius * 0.02, radius * 0.045);
  context.lineTo(-radius * 0.12, 0);
  context.closePath();
  context.fill();
  context.restore();

  drawOctagon(context, radius * 0.12, radius * 0.045);
  context.fillStyle = "rgba(232, 248, 255, 0.9)";
  context.fill();
  context.strokeStyle = "rgba(8, 18, 29, 0.9)";
  context.lineWidth = 2;
  context.stroke();

  drawHudText(context, gauge.label, 0, -radius * 0.18, {
    font: `700 ${Math.max(14, radius * 0.14)}px ${HUD_FONT}`,
    fillStyle: "rgba(165, 252, 255, 0.9)",
    strokeStyle: "rgba(7, 18, 29, 0.9)",
    strokeWidth: 3,
    shadowColor: "rgba(110, 244, 255, 0.16)",
    shadowBlur: 10,
    tracking: 1.6,
    textAlign: "center",
  });

  drawHudText(context, gauge.unit, 0, radius * 0.34, {
    font: `700 ${Math.max(11, radius * 0.105)}px ${HUD_FONT}`,
    fillStyle: "rgba(255, 194, 108, 0.86)",
    strokeStyle: "rgba(7, 18, 29, 0.86)",
    strokeWidth: 3,
    shadowColor: "rgba(255, 193, 112, 0.12)",
    shadowBlur: 8,
    tracking: 1.2,
    textAlign: "center",
  });
  drawHudText(context, alertState ? "RED LINE" : "BOOST", 0, radius * 0.54, {
    font: `700 ${Math.max(11, radius * 0.105)}px ${HUD_FONT}`,
    fillStyle: alertState
      ? "rgba(255, 139, 152, 0.92)"
      : "rgba(118, 247, 255, 0.82)",
    strokeStyle: "rgba(7, 18, 29, 0.86)",
    strokeWidth: 3,
    shadowColor: "rgba(110, 244, 255, 0.14)",
    shadowBlur: 8,
    tracking: 2.1,
    textAlign: "center",
  });

  context.restore();
}

function drawAlienComponent(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  alienBedrock: AlienBedrockModel,
) {
  const graphLayout = getBottomGraphLayout(width, height);
  const gap = Math.max(12, width * 0.012);
  const availableWidth = graphLayout.panelX - gap * 2;
  const panelWidth = Math.min(240, width * 0.17, availableWidth);

  if (panelWidth < 132) {
    return;
  }

  const messageText = getAlienMessageText(alienBedrock);
  const messageBoxHeight = alienBedrock.enabled ? 58 : 0;
  const panelHeight = alienBedrock.enabled
    ? Math.min(282, height * 0.36)
    : Math.min(236, height * 0.3);
  const panelX = gap;
  const panelY = clamp(
    graphLayout.panelY + graphLayout.panelHeight * 0.5 - panelHeight * 0.54,
    Math.max(84, height * 0.16),
    height - panelHeight - 14,
  );
  const displayX = panelX + 18;
  const displayY = panelY + 42;
  const displayWidth = panelWidth - 36;
  const displayHeight = panelHeight - 78;
  const spriteAreaHeight = displayHeight - (messageBoxHeight > 0 ? messageBoxHeight + 12 : 0);
  const spriteScale = Math.max(
    2,
    Math.floor(Math.min(displayWidth / 30, spriteAreaHeight / 26)),
  );
  const spriteWidth = 32 * spriteScale;
  const spriteHeight = 24 * spriteScale;
  const frameIndex = Math.floor(time / ALIEN_FRAME_DURATION_MS) % alienFrames.length;
  const bobOffset = Math.round(Math.sin(time * ALIEN_FLOAT_SPEED) * ALIEN_FLOAT_AMPLITUDE);
  const spriteX = displayX + Math.floor((displayWidth - spriteWidth) / 2);
  const spriteY = displayY + Math.floor((spriteAreaHeight - spriteHeight) / 2) + bobOffset;

  drawPanelShape(context, panelX, panelY, panelWidth, panelHeight, "left");
  context.fillStyle = "rgba(8, 21, 34, 0.18)";
  context.fill();
  context.strokeStyle = "rgba(112, 239, 255, 0.56)";
  context.lineWidth = 2;
  context.stroke();

  drawHudText(context, "ALIEN CORE", panelX + 24, panelY + 26, {
    font: `700 13px ${HUD_FONT}`,
    fillStyle: "rgba(166, 252, 255, 0.9)",
    strokeStyle: "rgba(7, 18, 29, 0.9)",
    strokeWidth: 3,
    shadowColor: "rgba(110, 244, 255, 0.16)",
    shadowBlur: 8,
    tracking: 1.7,
  });

  drawHudText(context, getAlienFooterText(alienBedrock), panelX + 24, panelY + panelHeight - 22, {
    font: `700 10px ${HUD_FONT}`,
    fillStyle: "rgba(255, 198, 118, 0.84)",
    strokeStyle: "rgba(7, 18, 29, 0.88)",
    strokeWidth: 3,
    shadowColor: "rgba(255, 196, 110, 0.12)",
    shadowBlur: 6,
    tracking: 1.7,
  });

  context.save();
  context.beginPath();
  context.rect(displayX, displayY, displayWidth, displayHeight);
  context.clip();

  context.fillStyle = "rgba(9, 23, 36, 0.42)";
  context.fillRect(displayX, displayY, displayWidth, displayHeight);

  const verticalGlow = context.createLinearGradient(
    displayX,
    displayY,
    displayX,
    displayY + displayHeight,
  );
  verticalGlow.addColorStop(0, "rgba(100, 246, 255, 0.08)");
  verticalGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = verticalGlow;
  context.fillRect(displayX, displayY, displayWidth, displayHeight);

  for (let scanY = displayY + 6; scanY < displayY + displayHeight; scanY += 12) {
    context.fillStyle = "rgba(121, 241, 255, 0.05)";
    context.fillRect(displayX, scanY, displayWidth, 1);
  }

  context.fillStyle = "rgba(15, 31, 52, 0.18)";
  context.fillRect(
    displayX + displayWidth / 2 - spriteScale * 18,
    displayY + spriteAreaHeight - spriteScale * 4,
    spriteScale * 36,
    spriteScale * 3,
  );

  drawAlienSprite(context, alienFrames[frameIndex], spriteX, spriteY, spriteScale);

  if (messageText) {
    const messageBoxX = displayX + 8;
    const messageBoxY = displayY + displayHeight - messageBoxHeight - 8;
    const messageBoxWidth = displayWidth - 16;

    context.fillStyle = "rgba(7, 19, 29, 0.74)";
    context.fillRect(messageBoxX, messageBoxY, messageBoxWidth, messageBoxHeight);
    context.strokeStyle = "rgba(111, 239, 255, 0.2)";
    context.lineWidth = 1;
    context.strokeRect(messageBoxX, messageBoxY, messageBoxWidth, messageBoxHeight);

    drawHudText(context, "BEDROCK REPLY", messageBoxX + 10, messageBoxY + 14, {
      font: `700 9px ${HUD_FONT}`,
      fillStyle: "rgba(167, 252, 255, 0.88)",
      strokeStyle: "rgba(7, 18, 29, 0.88)",
      strokeWidth: 2,
      shadowColor: "rgba(110, 244, 255, 0.12)",
      shadowBlur: 6,
      tracking: 1.1,
    });

    context.save();
    context.font = `600 11px ${HUD_FONT}`;
    context.fillStyle = "rgba(230, 248, 255, 0.92)";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.shadowColor = "rgba(110, 244, 255, 0.08)";
    context.shadowBlur = 4;

    const messageLines = wrapTextLines(
      context,
      messageText,
      messageBoxWidth - 20,
      3,
    );

    messageLines.forEach((line, index) => {
      context.fillText(line, messageBoxX + 10, messageBoxY + 22 + index * 12);
    });
    context.restore();
  }

  context.restore();
}

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  alertActive: boolean,
) {
  const sideInset = Math.max(26, width * 0.028);
  const topInset = 36;
  const upperWing = width * 0.24;
  const bottomInset = Math.min(190, height * 0.24);
  const highlight = alertActive
    ? "rgba(255, 94, 111, 0.78)"
    : "rgba(122, 243, 255, 0.7)";

  context.strokeStyle = highlight;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(sideInset, topInset + 42);
  context.lineTo(sideInset, topInset);
  context.lineTo(sideInset + upperWing, topInset);
  context.lineTo(sideInset + upperWing + 38, topInset + 42);
  context.moveTo(width - sideInset, topInset + 42);
  context.lineTo(width - sideInset, topInset);
  context.lineTo(width - sideInset - upperWing, topInset);
  context.lineTo(width - sideInset - upperWing - 38, topInset + 42);
  context.moveTo(width * 0.18, height - bottomInset);
  context.lineTo(width * 0.32, height - bottomInset - 26);
  context.moveTo(width * 0.82, height - bottomInset);
  context.lineTo(width * 0.68, height - bottomInset - 26);
  context.stroke();
}

function drawHeader(
  context: CanvasRenderingContext2D,
  width: number,
  meters: MeterState[],
  bars: BarState[],
  time: number,
) {
  const averageMeter =
    meters.reduce((sum, meter) => sum + meter.value, 0) / meters.length;
  const averageBars =
    bars.reduce((sum, bar) => sum + bar.value, 0) / bars.length;
  const alertActive = averageMeter > 0.84;

  context.save();
  context.strokeStyle = alertActive
    ? "rgba(255, 118, 133, 0.2)"
    : "rgba(118, 243, 255, 0.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(width / 2 - 248, 43);
  context.lineTo(width / 2 - 88, 43);
  context.moveTo(width / 2 + 88, 43);
  context.lineTo(width / 2 + 248, 43);
  context.stroke();
  context.restore();

  drawHudText(context, "COCKPIT OVERLAY", width / 2, 33, {
    font: `700 23px ${HUD_FONT}`,
    fillStyle: alertActive
      ? "rgba(255, 135, 148, 0.94)"
      : "rgba(171, 252, 255, 0.92)",
    strokeStyle: "rgba(7, 18, 29, 0.94)",
    strokeWidth: 4,
    shadowColor: alertActive
      ? "rgba(255, 88, 106, 0.18)"
      : "rgba(110, 244, 255, 0.22)",
    shadowBlur: 12,
    tracking: 3.1,
    textAlign: "center",
  });

  drawHudText(context, "PASSIVE MODE // SYNTHETIC TELEMETRY", width / 2, 54, {
    font: `700 10px ${HUD_FONT}`,
    fillStyle: "rgba(255, 198, 122, 0.88)",
    strokeStyle: "rgba(7, 18, 29, 0.86)",
    strokeWidth: 3,
    shadowColor: "rgba(255, 193, 112, 0.14)",
    shadowBlur: 8,
    tracking: 2.7,
    textAlign: "center",
  });

  drawHudText(
    context,
    `CORE ${Math.round(averageMeter * 100)}  |  FLOW ${Math.round(averageBars * 100)}  |  PHASE ${Math.round((Math.sin(time * 0.0018) + 1) * 49)}`,
    width / 2,
    72,
    {
      font: `700 11px ${HUD_NUMERIC_FONT}`,
      fillStyle: "rgba(180, 245, 255, 0.82)",
      strokeStyle: "rgba(7, 18, 29, 0.82)",
      strokeWidth: 3,
      shadowColor: "rgba(110, 244, 255, 0.12)",
      shadowBlur: 8,
      tracking: 1,
      textAlign: "center",
    },
  );
}

function updateMeter(meter: MeterState, dt: number) {
  meter.cooldownMs -= dt;

  if (meter.cooldownMs <= 0) {
    meter.target = pickMeterTarget();
    meter.cooldownMs = randomRange(260, 920);
  }

  const easing = 1 - Math.exp(-dt / 320);
  meter.value = lerp(meter.value, meter.target, easing);
}

function updateBar(bar: BarState, index: number, dt: number, time: number) {
  bar.cooldownMs -= dt;

  if (bar.cooldownMs <= 0) {
    bar.target = pickBarTarget(index, time);
    bar.cooldownMs = randomRange(90, 420);
  }

  const easing = 1 - Math.exp(-dt / 180);
  bar.value = lerp(bar.value, bar.target, easing);
}

function updateGauge(gauge: GaugeState, dt: number) {
  gauge.cooldownMs -= dt;

  if (gauge.cooldownMs <= 0) {
    gauge.target = pickGaugeTarget();
    gauge.cooldownMs = randomRange(220, 760);
  }

  const easing = 1 - Math.exp(-dt / 240);
  gauge.value = lerp(gauge.value, gauge.target, easing);
}

function startHudAnimation(
  canvasState: HudCanvasState,
  alienBedrock: AlienBedrockModel,
) {
  const leftMeter = createMeter("CORE LOAD", 0.1);
  const rightMeter = createMeter("AUX FLUX", 1.4);
  const circularGauge = createGauge("TURBINE", "x1000 RPM", 0.7);
  const bars = createBars();
  let lastTimestamp = 0;

  const render = (timestamp: number) => {
    const deltaMs = lastTimestamp === 0 ? 16 : Math.min(timestamp - lastTimestamp, 80);
    lastTimestamp = timestamp;

    updateMeter(leftMeter, deltaMs);
    updateMeter(rightMeter, deltaMs);
    updateGauge(circularGauge, deltaMs);
    bars.forEach((bar, index) => {
      updateBar(bar, index, deltaMs, timestamp);
    });

    const context = canvasState.context;
    const width = canvasState.getWidth();
    const height = canvasState.getHeight();
    const alertActive =
      getMeterDisplayValue(leftMeter, timestamp) >= 0.94 ||
      getMeterDisplayValue(rightMeter, timestamp) >= 0.94 ||
      getGaugeDisplayValue(circularGauge, timestamp) >= 0.88;

    context.clearRect(0, 0, width, height);

    drawBackdrop(context, width, height, timestamp);
    drawFrame(context, width, height, alertActive);
    drawHeader(context, width, [leftMeter, rightMeter], bars, timestamp);
    drawMeter(
      context,
      leftMeter,
      width * 0.035,
      height * 0.14,
      Math.min(250, width * 0.18),
      Math.min(520, height * 0.62),
      "left",
      timestamp,
    );
    drawMeter(
      context,
      rightMeter,
      width - Math.min(250, width * 0.18) - width * 0.035,
      height * 0.14,
      Math.min(250, width * 0.18),
      Math.min(520, height * 0.62),
      "right",
      timestamp,
    );
    drawCenterReticle(context, width, height, timestamp);
    drawBottomGraph(context, bars, width, height, timestamp);
    drawAlienComponent(context, width, height, timestamp, alienBedrock);
    drawAngularGauge(context, circularGauge, width, height, timestamp);

    window.requestAnimationFrame(render);
  };

  window.requestAnimationFrame(render);
}

function main() {
  const canvas = document.getElementById("hudCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("HUD canvas element was not found.");
  }

  const canvasState = setupCanvas(canvas);
  const alienBedrock = createAlienBedrockModel();
  void setupAlienBedrock(alienBedrock);
  window.addEventListener("resize", canvasState.resize);
  startHudAnimation(canvasState, alienBedrock);
}

window.addEventListener("DOMContentLoaded", main);
