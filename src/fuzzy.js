function gauss(x, c, sigma) {
  const z = (x - c) / (sigma || 1e-6);
  return Math.exp(-0.5 * z * z);
}

// trapezoid membership: a ≤ b ≤ c ≤ d
function trap(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

export function memberships({ B, A, U }) {
  // Bot probability B (slightly sharper separation)
  const BL = gauss(B, 0.10, 0.10);
  const BM = gauss(B, 0.50, 0.12);
  const BH = gauss(B, 0.90, 0.10);

  // Accessibility A (edges are trapezoids for robust endpoints)
  const AN = trap(A, 0.00, 0.00, 0.15, 0.40); // none
  const AS = gauss(A, 0.50, 0.18);            // some
  const AH = trap(A, 0.60, 0.85, 1.00, 1.00); // high

  // Usability load U
  const UL = gauss(U, 0.2, 0.15);
  const UM = gauss(U, 0.5, 0.15);
  const UH = gauss(U, 0.8, 0.15);

  return { BL, BM, BH, AN, AS, AH, UL, UM, UH };
}

// Choices: 0=None, 1=Light, 2=Audio, 3=Human
export function fuzzyInfer({ B, A, U }) {
  const m = memberships({ B, A, U });

  const rules = [
    { w: m.BL * m.AH, out: [1, 0, 0, 0] },             // low risk + high A -> None
    { w: m.BM * m.AH, out: [0, 0, 1, 0] },             // med risk + high A -> Audio
    { w: m.BH * m.AH * m.UH, out: [0, 0, 0, 1] },      // high all -> Human
    { w: m.BM * m.AN, out: [0, 1, 0, 0] },             // med risk + no A -> Light
    { w: m.BH * m.AN, out: [0, 0, 1, 0] },             // high risk + no A -> Audio
    { w: m.UH * m.BL, out: [1, 0, 0, 0] },             // reduce friction when struggling
    { w: m.UH * m.BM * m.AS, out: [0, 0, 1, 0] }       // med risk + load -> Audio
  ];

  const agg = [0, 0, 0, 0];
  let W = 0;
  for (const r of rules) {
    W += r.w;
    for (let i = 0; i < 4; i++) agg[i] += r.w * r.out[i];
  }
  if (W <= 1e-9) return { choice: 0, scores: [1, 0, 0, 0] };
  const scores = agg.map(x => x / W);
  const choice = scores.indexOf(Math.max(...scores));
  return { choice, scores };
}
