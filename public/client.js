// ---- session helpers ----
function getSessionId() { return localStorage.getItem("sessionId") || ""; }
function setSessionId(id) { if (id) localStorage.setItem("sessionId", id); }

// ---- behavior capture (privacy-light) ----
const state = {
  keystrokes: [],
  pointer: { lastX: null, lastY: null, jitter: 0, moves: 0 },
  focusSwitches: 0,
  tabNavCount: 0,
  startTime: performance.now(),
  retries: 0
};

document.addEventListener("keydown", (e) => {
  const t = performance.now();
  state.keystrokes.push({ type: "down", t, key: e.key });
  if (e.key === "Tab") state.tabNavCount++;
});
document.addEventListener("keyup", (e) => {
  const t = performance.now();
  state.keystrokes.push({ type: "up", t, key: e.key });
});
document.addEventListener("mousemove", (e) => {
  if (state.pointer.lastX != null) {
    const dx = e.clientX - state.pointer.lastX;
    const dy = e.clientY - state.pointer.lastY;
    const d = Math.sqrt(dx*dx + dy*dy);
    state.pointer.jitter += Math.abs(d - 7);
  }
  state.pointer.lastX = e.clientX;
  state.pointer.lastY = e.clientY;
  state.pointer.moves++;
});
window.addEventListener("blur", () => state.focusSwitches++);
window.addEventListener("focus", () => state.focusSwitches++);

// ---- feature extraction ----
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function extractFeatures() {
  const K = state.keystrokes, downs = new Map(), holds = [], intervals = [];
  for (let i = 1; i < K.length; i++) intervals.push(K[i].t - K[i-1].t);
  for (const ev of K) {
    if (ev.type === "down") downs.set(ev.key + ":" + ev.t, ev.t);
    if (ev.type === "up") {
      let match=null, best=Infinity;
      for (const [k,t0] of downs.entries()) if (k.startsWith(ev.key + ":")) {
        const dt = ev.t - t0;
        if (dt >= 0 && dt < best) { best = dt; match = k; }
      }
      if (match) { holds.push(best); downs.delete(match); }
    }
  }
  const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
  const std  = a => { const m=mean(a); return a.length ? Math.sqrt(mean(a.map(x=>(x-m)**2))) : 0; };

  const keyHoldMean = mean(holds);
  const keyHoldStd  = std(holds);
  const interKeyMean = mean(intervals);
  const interKeyStd  = std(intervals);

  const duration = (performance.now() - state.startTime)/1000;
  const timeOnTaskNorm = Math.min(1, duration / 30);
  const pointerJitter = Math.min(1, state.pointer.jitter / 500);
  const scrollGranularity = Math.min(1, (window.scrollY % 100) / 100);
  const focusSwitchRate = Math.min(1, state.focusSwitches / 20);
  const tabNavRatio = Math.min(1, state.tabNavCount / Math.max(1, state.keystrokes.length));

  return {
    keyHoldMean: clamp01(keyHoldMean / 250),
    keyHoldStd: clamp01(keyHoldStd / 150),
    interKeyMean: clamp01(interKeyMean / 300),
    interKeyStd: clamp01(interKeyStd / 200),
    pointerJitter,
    scrollGranularity,
    focusSwitchRate,
    tabNavRatio,
    retryCount: clamp01(state.retries / 6),
    timeOnTaskNorm
  };
}
function getAccessibilityScore() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : 0;
  const zoomApprox = (window.devicePixelRatio || 1);
  const highZoom = zoomApprox > 1.25 ? 0.3 : 0;
  const keyboardHeavy = Math.min(0.4, (state.tabNavCount / Math.max(1, state.keystrokes.length)) * 0.8);
  return clamp01(prefersReduced + highZoom + keyboardHeavy);
}
function getUsabilityLoad() {
  const duration = (performance.now() - state.startTime) / 1000;
  return clamp01((duration / 45) + (state.retries * 0.15));
}

// ---- UI refs ----
const statusEl = document.getElementById("status");
const btnEval = document.getElementById("btn-evaluate");
const lightBox = document.getElementById("challenge-light");
const logicNum = document.getElementById("logic-number");
const logicAns = document.getElementById("logic-answer");
const btnVerifyLogic = document.getElementById("btn-verify-logic");
const audioBox = document.getElementById("challenge-audio");
const audioPromptEl = document.getElementById("audio-prompt");
const audioHintEl = document.getElementById("audio-hint");
const btnPlay = document.getElementById("btn-play-audio");
const btnSlow = document.getElementById("btn-slow-audio");
const btnReplay = document.getElementById("btn-replay");
const audioAns = document.getElementById("audio-answer");
const btnVerifyAudio = document.getElementById("btn-verify-audio");
const humanBox = document.getElementById("challenge-human");
const formSection = document.getElementById("form-section");
const form = document.getElementById("demo-form");
const resultEl = document.getElementById("form-result");

// local gated state
let verified = false;

// Voice capture refs
const recStatus = document.getElementById("rec-status");
const btnRecord = document.getElementById("btn-record");
const btnStop = document.getElementById("btn-stop");

// ---- Evaluate flow ----
btnEval.addEventListener("click", async () => {
  hideAll();
  const features = extractFeatures();
  const accessibility = { score: getAccessibilityScore() };
  const usability = { load: getUsabilityLoad() };

  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
    body: JSON.stringify({ features, accessibility, usability })
  });
  setSessionId(res.headers.get("X-Session-Id"));
  const data = await res.json();

  const { B, A, U } = data.scores;
  statusEl.className = "";
  statusEl.textContent = `Risk: ${(B*100).toFixed(1)}% | Accessibility: ${(A*100).toFixed(0)}% | Load: ${(U*100).toFixed(0)}% → ${data.decision.action.toUpperCase()}`;

  if (data.decision.action === "none") {
    statusEl.classList.add("ok");
    // No challenge required — allow the user to proceed
    showForm();
  } else if (data.decision.action === "light") {
    await lightChallenge();
  } else if (data.decision.action === "audio") {
    await audioChallenge();
  } else {
    humanBox.hidden = false;
    statusEl.classList.add("bad");
  }
});

function hideAll() { 
  lightBox.hidden = true; 
  audioBox.hidden = true; 
  humanBox.hidden = true; 
  if (formSection) formSection.hidden = true;
}

function showForm() {
  hideAll();
  verified = true;
  if (formSection) {
    formSection.hidden = false;
    const nameInput = document.getElementById("name");
    if (nameInput) nameInput.focus();
  }
}

// ---- Light challenge ----
async function lightChallenge() {
  hideAll();
  const res = await fetch("/api/logic-challenge", { headers: { "X-Session-Id": getSessionId() } });
  const { number } = await res.json();
  logicNum.textContent = String(number);
  lightBox.hidden = false;
  logicAns.value = "";
  logicAns.focus();
}
btnVerifyLogic.addEventListener("click", async () => {
  const answer = (logicAns.value || "").trim().toLowerCase();
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
    body: JSON.stringify({ kind: "logic", answer })
  });
  if (res.ok) {
    statusEl.textContent = "Light challenge passed ✅";
    statusEl.className = "ok";
    showForm();
  } else {
    state.retries++;
    statusEl.textContent = "Light challenge failed. Try again or evaluate risk once more.";
    statusEl.className = "bad";
  }
});

// ---- Audio challenge (TTS + optional voice input) ----
async function audioChallenge() {
  hideAll();
  audioBox.hidden = false;
  audioAns.value = "";

  // pull phrase (includes nonce)
  const res = await fetch("/api/audio-challenge", { headers: { "X-Session-Id": getSessionId() } });
  const { phrase, hint } = await res.json();
  audioPromptEl.textContent = phrase;
  audioHintEl.textContent = `Hint: ${hint}`;
  audioAns.focus();

  // init voice recognition once
  if (!recognition) initRecognition();
}

function speak(text, rate=1.0) {
  if (!("speechSynthesis" in window)) {
    alert("SpeechSynthesis not supported; read the prompt in the Challenge section and type it.");
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
btnPlay.addEventListener("click", () => speak(audioPromptEl.textContent, 1.0));
btnSlow.addEventListener("click", () => speak(audioPromptEl.textContent, 0.8));
btnReplay.addEventListener("click", () => speak(audioPromptEl.textContent, 1.0));

btnVerifyAudio.addEventListener("click", async () => {
  const answer = audioAns.value;
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
    body: JSON.stringify({ kind: "audio", answer })
  });
  if (res.ok) {
    statusEl.textContent = "Audio challenge passed ✅";
    statusEl.className = "ok";
    showForm();
  } else {
    state.retries++;
    statusEl.textContent = "Audio challenge failed. Replay or evaluate again.";
    statusEl.className = "bad";
  }
});

// ---- Speech Recognition (voice input) ----
let recognition = null;
let recognizing = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

function initRecognition() {
  if (!SR) {
    recStatus.textContent = "Voice input not supported in this browser.";
    btnRecord.disabled = true;
    btnStop.disabled = true;
    return;
  }
  recognition = new SR();
  recognition.lang = "en-US";          // set to match your prompts
  recognition.interimResults = true;   // show partials
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recognizing = true;
    btnRecord.setAttribute("aria-pressed", "true");
    btnRecord.disabled = true;
    btnStop.disabled = false;
    audioAns.classList.add("recording");
    recStatus.textContent = "Listening… speak now.";
  };

  recognition.onresult = (event) => {
    const i = event.resultIndex;
    const res = event.results[i];
    if (res && res[0]) {
      const transcript = res[0].transcript;
      audioAns.value = transcript; // autofill transcript
    }
    if (res && res.isFinal) {
      recStatus.textContent = "Got it. Review and press Verify.";
    } else {
      recStatus.textContent = "Listening…";
    }
  };

  recognition.onerror = (e) => {
    recStatus.textContent = `Voice error: ${e.error}`;
  };

  recognition.onend = () => {
    recognizing = false;
    btnRecord.setAttribute("aria-pressed", "false");
    btnRecord.disabled = false;
    btnStop.disabled = true;
    audioAns.classList.remove("recording");
    if (!audioAns.value) {
      recStatus.textContent = "No speech detected. Try again or type the answer.";
    } else {
      recStatus.textContent = "Ready to verify.";
    }
  };
}

btnRecord.addEventListener("click", () => {
  if (!recognition) initRecognition();
  if (!recognition) return; // unsupported
  // stop TTS so mic doesn't pick it up
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  try { recognition.start(); } catch { /* ignore double-start */ }
});

btnStop.addEventListener("click", () => {
  if (recognition && recognizing) recognition.stop();
});

// ---- Protected form ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!verified) {
    resultEl.textContent = "Please complete verification first.";
    return;
  }
  const res = await fetch("/api/submit-form", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value
    })
  });
  const data = await res.json();
  if (res.ok) {
    resultEl.textContent = data.message + " 🎉";
  } else {
    resultEl.textContent = "Verification required first.";
  }
});
