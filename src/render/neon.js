function resetShadow(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

export function drawNeonCircle(ctx, {
  x,
  y,
  radius,
  color,
  glowColor = color,
  glow = 10,
  alpha = 1,
  strokeColor = null,
  lineWidth = 0
}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowBlur = glow;
  ctx.shadowColor = glowColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (strokeColor && lineWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  resetShadow(ctx);
  ctx.restore();
}

export function drawNeonLine(ctx, {
  x1,
  y1,
  x2,
  y2,
  color,
  width = 2,
  glow = 8,
  alpha = 1,
  cap = "round"
}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  resetShadow(ctx);
  ctx.restore();
}

function drawSpacedText(ctx, text, x, y, align, spacing) {
  if (spacing <= 0 || text.length <= 1) {
    ctx.fillText(text, x, y);
    return;
  }

  const glyphWidths = [];
  let total = 0;
  for (const char of text) {
    const width = ctx.measureText(char).width;
    glyphWidths.push(width);
    total += width;
  }
  total += spacing * (text.length - 1);

  let startX = x;
  if (align === "center") {
    startX = x - total / 2;
  } else if (align === "right") {
    startX = x - total;
  }

  let cursor = startX;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    ctx.fillText(char, cursor, y);
    cursor += glyphWidths[i] + spacing;
  }
}

export function drawNeonText(ctx, {
  text,
  x,
  y,
  color,
  font,
  align = "left",
  baseline = "alphabetic",
  glow = 8,
  alpha = 1,
  letterSpacing = 0,
  uppercase = true
}) {
  const content = uppercase ? String(text).toUpperCase() : String(text);

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  drawSpacedText(ctx, content, x, y, align, letterSpacing);
  resetShadow(ctx);
  ctx.restore();
}

export function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
