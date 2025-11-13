# Neuro-Fuzzy Accessible Bot Prevention System  
**Balancing Security & Accessibility Using Behavioral Biometrics, Fuzzy Logic, and Voice-Enabled CAPTCHA**

This project implements a **bot-prevention / verification system** that maintains strong security **without excluding blind or motor-impaired users**.  
Instead of depending on distorted text or image CAPTCHAs, it uses:

- **Neural Network (Behavioral Risk Scoring)**
- **Fuzzy Logic (Adaptive Accessibility-Aware Decision Making)**
- **Voice-Enabled Audio Challenges (Screen-Reader Friendly + Speech Input)**

This ensures **real humans are not frustrated**, while automated scripts and bots are effectively blocked.

---

## Features

| Feature | Description |
|--------|-------------|
| **Behavior-based Bot Detection** | Uses keystroke rhythm, pointer dynamics, attention patterns, etc. |
| **Neuro Layer (MLP)** | Computes Bot Likelihood Score (B) using GELU → Sigmoid activations. |
| **Fuzzy Logic Layer** | Converts (B, Accessibility Score A, Usability Load U) → Challenge Type. |
| **Accessibility-Aware UI** | Auto-reduces friction for screen-reader/keyboard users. |
| **Voice Input Support** | Users can *speak* their answer instead of typing. |
| **Replay-Safe Audio Challenges** | Audio prompt includes a random **nonce**, defeating replay attacks. |
| **Retry-Based Escalation** | Gradually escalates from *none → light → audio → human*. |

---

## System Architecture
User Interaction
↓
Behavior Collection (Keystrokes, Pointer, Time, Focus Switching)
↓
Neural Model (botProbability) → Outputs Risk Score B
↓
Fuzzy Inference (fuzzyInfer) → Maps B, A, U → Challenge Decision
↓
Policy Escalation (inferPolicy)
↓
Challenge Type:

None

Light Text Challenge (odd/even)

Audio Challenge (Speak or Type)

Human Handoff


---

## Folder Structure



project/
├─ server.js # Express backend + session validation
├─ src/
│ ├─ neuro.js # Tiny neural net for bot scoring
│ ├─ fuzzy.js # Fuzzy membership + inference rules
│ ├─ policy.js # Retry-based escalation logic
│ └─ phrases.js # Audio challenge phrases + nonce
├─ public/
│ ├─ index.html # UI (Accessible Layout)
│ ├─ styles.css # Dark, high-contrast accessible theme
│ └─ client.js # Front-end behavior capture + voice input
├─ package.json
└─ .gitignore


---

## Installation & Running

git clone (https://github.com/nikcoderrrr/nft_chatbot_for_blind.git)
cd neuro-fuzzy-accessible-captcha
npm install
npm start


Open in browser:

http://localhost:3000

How Voice Input Works (Client Side)

Web Speech API (SpeechRecognition) listens to user speech.

Transcribed text is inserted into the answer field.

Server compares normalized text (case-insensitive, punctuation removed).

Example:

User speaks: "Monday."
Expected: "monday"
→ Match is accepted ✅

Use Cases
Domain	Usage
Government Portals	Accessible login / form verification
Banking / FinTech	Fraud-resistant login & KYC verification
Online Exams / LMS	Fair verification for visually-impaired students
E-Commerce	Anti-bot checkout during flash sales
Healthcare Appointment Systems	Senior-friendly verification flow
Accessibility Compliance

Screen-reader compatible

Voice input enabled

Keyboard-only navigation supported

High contrast UI

Respects prefers-reduced-motion

Future Enhancements (Optional)

Train the neural model using real datasets

Add multilingual speech recognition (recognition.lang)

Enable challenge difficulty scaling per attack patterns

Add dashboard visualization for fuzzy membership outputs




