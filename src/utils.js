export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(from, to, alpha) {
  return from + (to - from) * alpha;
}

export function approach(current, target, delta) {
  if (current < target) {
    return Math.min(current + delta, target);
  }
  return Math.max(current - delta, target);
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function distanceSquared(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function distance(ax, ay, bx, by) {
  return Math.sqrt(distanceSquared(ax, ay, bx, by));
}

export function length(x, y) {
  return Math.sqrt(x * x + y * y);
}

export function normalize(x, y) {
  const len = length(x, y);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / len, y: y / len };
}

export function vectorFromAngle(angle, magnitude = 1) {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude
  };
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function wrapAngle(angle) {
  let wrapped = angle;
  while (wrapped > Math.PI) wrapped -= Math.PI * 2;
  while (wrapped < -Math.PI) wrapped += Math.PI * 2;
  return wrapped;
}

export function chance(probability) {
  return Math.random() < probability;
}
