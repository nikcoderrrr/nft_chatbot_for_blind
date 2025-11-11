const pool = [
  { prompt: "Type the spoken word: zebra",  answer: "zebra",  hint: "lowercase" },
  { prompt: "Type the spoken word: mango",  answer: "mango",  hint: "lowercase" },
  { prompt: "Type the two-digit number: forty two", answer: "42", hint: "digits" },
  { prompt: "Type the color name: purple",  answer: "purple", hint: "lowercase" },
  { prompt: "Type the weekday: monday",     answer: "monday", hint: "lowercase" }
];

export function getAudioPhrase() {
  return pool[(Math.random() * pool.length) | 0];
}
