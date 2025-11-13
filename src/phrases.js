const pool = [
  { prompt: "Type the spoken word: zebra",  answer: "zebra",  hint: "lowercase" },
  { prompt: "Type the spoken word: mango",  answer: "mango",  hint: "lowercase" },
  { prompt: "Type the two-digit number: forty two", answer: "42", hint: "digits" },
  { prompt: "Type the color name: purple",  answer: "purple", hint: "lowercase" },
  { prompt: "Type the weekday: monday",     answer: "monday", hint: "lowercase" },
  { prompt: "Type the animal name: elephant", answer: "elephant", hint: "lowercase" },
  { prompt: "Type the three-digit number: one hundred five", answer: "105", hint: "digits" },
  { prompt: "Type the spoken word: computer", answer: "computer", hint: "lowercase" },
  { prompt: "Type the spoken word: security", answer: "security", hint: "lowercase" },
  { prompt: "Type the shape name: triangle",  answer: "triangle", hint: "lowercase" },
  { prompt: "Type the four-digit number: nine eight seven six", answer: "9876", hint: "digits" },
  { prompt: "Type the season: winter",       answer: "winter",   hint: "lowercase" },
  { prompt: "Type the spoken word: accessible", answer: "accessible", hint: "lowercase" },
  { prompt: "Type the two-digit number: eighty eight", answer: "88", hint: "digits" },
  { prompt: "Type the month: july",         answer: "july",     hint: "lowercase" },
  { prompt: "Type the spoken phrase: hello world", answer: "hello world", hint: "lowercase" },
  { prompt: "Type the color name: orange",   answer: "orange",   hint: "lowercase" },
  { prompt: "Type the number: zero",        answer: "0",        hint: "digit" },
  { prompt: "Type the direction: left",     answer: "left",     hint: "lowercase" },
  { prompt: "Type the punctuation: question mark", answer: "?", hint: "symbol" }
];

export function getAudioPhrase() {
  return pool[(Math.random() * pool.length) | 0];
}
