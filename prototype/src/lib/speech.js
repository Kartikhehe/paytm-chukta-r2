// Web Speech API wrapper. Prefers a hi-IN voice; falls back to en-IN, then the default voice.
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export function getVoices() {
  if (!speechSupported()) return Promise.resolve([])
  const now = window.speechSynthesis.getVoices()
  if (now.length) return Promise.resolve(now)
  return new Promise((res) => {
    const done = () => res(window.speechSynthesis.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
}

export function pickVoice(voices) {
  return voices.find((v) => /^hi[-_]IN/i.test(v.lang))
    || voices.find((v) => /^hi/i.test(v.lang))
    || voices.find((v) => /^en[-_]IN/i.test(v.lang))
    || null
}

export function speak({ hindi, roman }, voice, onEnd) {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
  const isHi = voice && /^hi/i.test(voice.lang)
  const u = new SpeechSynthesisUtterance(isHi ? hindi : roman)
  if (voice) u.voice = voice
  u.lang = isHi ? 'hi-IN' : voice?.lang || 'en-IN'
  u.rate = 0.92
  u.onend = onEnd
  u.onerror = onEnd
  window.speechSynthesis.speak(u)
}
