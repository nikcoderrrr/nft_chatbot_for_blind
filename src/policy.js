import { fuzzyInfer } from "./fuzzy.js";

export function inferPolicy({ B, A, U, retries }) {
  const fuzz = fuzzyInfer({ B, A, U });

  // gentle escalation with retries
  let choice = fuzz.choice;
  if (retries >= 2 && choice === 0) choice = 1; // force light after repeated fails
  if (retries >= 3 && choice <= 1) choice = 2;  // escalate to audio
  if (retries >= 5) choice = 3;                 // human

  const map = ["none", "light", "audio", "human"];
  return { action: map[choice], ruleScores: fuzz.scores };
}
