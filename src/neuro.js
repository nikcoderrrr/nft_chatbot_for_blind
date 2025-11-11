// Tiny hand-coded MLP: 1 hidden (GELU) -> sigmoid probability in [0,1]

function gelu(x) {
  const a = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(a * (x + 0.044715 * x * x * x)));
}
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function vectorize(f = {}) {
  return [
    clamp01(f.keyHoldMean ?? 0.35),
    clamp01(f.keyHoldStd ?? 0.12),
    clamp01(f.interKeyMean ?? 0.28),
    clamp01(f.interKeyStd ?? 0.15),
    clamp01(f.pointerJitter ?? 0.42),
    clamp01(f.scrollGranularity ?? 0.4),
    clamp01(f.focusSwitchRate ?? 0.2),
    clamp01(f.tabNavRatio ?? 0.7),
    clamp01(f.retryCount ?? 0),
    clamp01(f.timeOnTaskNorm ?? 0.5)
  ];
}

// demo weights (replace with trained ones later)
const W1 = [
  [ 1.2, -0.8,  0.6, -0.4, 0.9, -0.5, 0.7, -0.7,  0.5, -0.3],
  [-0.7,  1.1, -0.9,  0.8, 0.2,  0.6, -0.4, 0.5, -0.6,  0.9],
  [ 0.5,  0.4,  1.0, -0.3, 1.1, -0.8, 0.1, 0.7,  0.2, -0.5],
  [-0.6,  0.3, -0.2,  0.9, 0.8,  0.4, 0.6, -0.2, 0.4,  0.3]
];
const b1 = [0.1, -0.05, 0.08, -0.02];
const W2 = [0.9, -1.1, 0.7, 0.8];
const b2 = -0.2;

export function botProbability(features) {
  const x = vectorize(features);
  const h = new Array(4).fill(0).map((_, i) => {
    let s = b1[i];
    for (let j = 0; j < x.length; j++) s += W1[i][j] * x[j];
    return gelu(s);
  });
  let o = b2;
  for (let i = 0; i < h.length; i++) o += W2[i] * h[i];
  return clamp01(sigmoid(o));
}
