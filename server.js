import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

import { botProbability } from "./src/neuro.js";
import { inferPolicy } from "./src/policy.js";
import { getAudioPhrase } from "./src/phrases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "200kb" }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map(); // sessionId -> { retries, createdAt, passed, expectedAudio, expectedLogic }

// --- helpers ---
function getSession(req, res) {
  let sid = req.headers["x-session-id"];
  if (!sid || !sessions.has(sid)) {
    sid = nanoid(12);
    sessions.set(sid, { retries: 0, createdAt: Date.now(), passed: false });
  }
  res.setHeader("X-Session-Id", sid);
  return { sid, data: sessions.get(sid) };
}

// normalize: lowercase, strip punctuation, collapse spaces, keep letters/numbers
function normalize(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ") // remove punctuation/symbols, keep letters & digits
    .trim()
    .replace(/\s+/g, " ");
}
function answersEqual(expected, provided) {
  return normalize(expected) === normalize(provided);
}

// --- routes ---
app.post("/api/evaluate", (req, res) => {
  const { sid, data } = getSession(req, res);
  const { features, accessibility, usability } = req.body || {};

  const B = botProbability(features || {});
  const A = typeof accessibility?.score === "number" ? accessibility.score : 0;
  const U = typeof usability?.load === "number" ? usability.load : 0;

  const decision = inferPolicy({ B, A, U, retries: data.retries });

  res.json({ session: sid, scores: { B, A, U }, decision });
});

app.get("/api/audio-challenge", (req, res) => {
  const { sid } = getSession(req, res);
  const phrase = getAudioPhrase();
  const s = sessions.get(sid);
  s.expectedAudio = String(phrase.answer);
  sessions.set(sid, s);
  res.json({ phrase: phrase.prompt, hint: phrase.hint });
});

app.get("/api/logic-challenge", (req, res) => {
  const { sid } = getSession(req, res);
  const n = 3 + Math.floor(Math.random() * 97);
  const expected = n % 2 === 1 ? "odd" : "even";
  const s = sessions.get(sid);
  s.expectedLogic = expected;
  s.logicNumber = n;
  sessions.set(sid, s);
  res.json({ number: n });
});

app.post("/api/verify", (req, res) => {
  const { sid } = getSession(req, res);
  const s = sessions.get(sid);
  const { kind, answer } = req.body || {};

  let ok = false;
  if (kind === "audio") {
    ok = !!s.expectedAudio && answersEqual(s.expectedAudio, answer);
  } else if (kind === "logic") {
    ok = !!s.expectedLogic && answersEqual(s.expectedLogic, answer);
  }

  if (!ok) {
    s.retries = (s.retries || 0) + 1;
    sessions.set(sid, s);
    return res.status(400).json({ ok: false, retries: s.retries });
  }

  s.passed = true;
  sessions.set(sid, s);
  res.json({ ok: true });
});

app.post("/api/submit-form", (req, res) => {
  const { sid } = getSession(req, res);
  const s = sessions.get(sid);
  if (!s?.passed) return res.status(403).json({ error: "Complete verification first." });
  res.json({ ok: true, message: "Form accepted. You are verified human." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
