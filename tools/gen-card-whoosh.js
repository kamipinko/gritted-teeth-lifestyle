/**
 * gen-card-whoosh.js
 *
 * Generates a quick rising whoosh for card-confirm UI events.
 * Reference analysis: 1532Hz pitch, 4125Hz spectral centroid, 68% harmonic.
 * Layers:
 *   1. Tonal sweep — sine 380→2800 Hz (power curve, accelerating)
 *   2. Noise body  — bandpass noise 600→5200 Hz (air texture)
 *   3. Shimmer     — high bandpass noise 3000→6500 Hz (brightness at peak)
 *
 * Duration: 0.55s
 * Output:   public/sounds/card-confirm.wav (mono, 44100Hz, 16-bit PCM)
 */

const fs   = require('fs')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────────
const RATE = 44100
const DUR  = 0.55
const N    = Math.floor(RATE * DUR)

// ── Biquad filter (stateful, per-instance) ───────────────────────────
class Biquad {
  constructor() { this.x1=0; this.x2=0; this.y1=0; this.y2=0 }

  _run(x, b0, b1, b2, a0, a1, a2) {
    const y = (b0*x + b1*this.x1 + b2*this.x2 - a1*this.y1 - a2*this.y2) / a0
    this.x2=this.x1; this.x1=x; this.y2=this.y1; this.y1=y
    return y
  }

  bandpass(x, freq, Q) {
    const w0    = 2*Math.PI * Math.min(freq, RATE*0.49) / RATE
    const sinw  = Math.sin(w0)
    const cosw  = Math.cos(w0)
    const alpha = sinw / (2 * Q)
    return this._run(x,
      sinw/2,   0, -sinw/2,
      1+alpha, -2*cosw, 1-alpha
    )
  }
}

// ── Synthesis ────────────────────────────────────────────────────────
const mid1 = new Biquad()
const mid2 = new Biquad()
const hi1  = new Biquad()
const hi2  = new Biquad()

const raw = new Float32Array(N)

// Precompute tonal sweep phase (instantaneous phase integration)
let tonePhase = 0

for (let i = 0; i < N; i++) {
  const t = i / RATE
  const p = t / DUR  // 0..1

  // ── Envelope: linear rise to 0.22s, then fast exp decay
  const PEAK_T = 0.22
  const env = t < PEAK_T
    ? t / PEAK_T
    : Math.exp(-(t - PEAK_T) * 7.5)

  // ── Layer 1: Tonal sweep 380→2800 Hz (power curve, 68% harmonic component)
  const f_tone = 380 + (2800 - 380) * Math.pow(p, 0.55)
  tonePhase += 2 * Math.PI * f_tone / RATE
  const tone = Math.sin(tonePhase) * 0.55

  // ── Layer 2: Noise body 600→5200 Hz (32% noise component, air texture)
  const mFreq = 600 + (5200 - 600) * p
  const noise = Math.random() * 2 - 1
  const mid   = mid2.bandpass(mid1.bandpass(noise, mFreq, 1.6), mFreq, 1.6) * 5.5

  // ── Layer 3: Shimmer 3000→6500 Hz (brightness targeting 4125Hz centroid)
  const hFreq = 3000 + (6500 - 3000) * p
  const hiN   = Math.random() * 2 - 1
  const hi    = hi2.bandpass(hi1.bandpass(hiN, hFreq, 1.8), hFreq, 1.8) * 3.2

  raw[i] = env * (tone + mid * 0.55 + hi * 0.35)
}

// ── Normalise to 82% peak ────────────────────────────────────────────
let peak = 0
for (let i = 0; i < N; i++) if (Math.abs(raw[i]) > peak) peak = Math.abs(raw[i])
const gain = peak > 0 ? 0.82 / peak : 1

// ── Convert to 16-bit PCM ────────────────────────────────────────────
const pcm = new Int16Array(N)
for (let i = 0; i < N; i++) {
  pcm[i] = Math.round(Math.max(-1, Math.min(1, raw[i] * gain)) * 32767)
}

// ── Write WAV ────────────────────────────────────────────────────────
const dataSize = N * 2
const fileSize = 36 + dataSize
const header   = Buffer.alloc(44)

header.write('RIFF', 0)
header.writeUInt32LE(fileSize, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)           // PCM format
header.writeUInt16LE(1, 22)           // mono
header.writeUInt32LE(RATE, 24)
header.writeUInt32LE(RATE * 2, 28)
header.writeUInt16LE(2, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(dataSize, 40)

const outPath = path.resolve(__dirname, '../public/sounds/card-confirm.wav')
const pcmBuf  = Buffer.from(pcm.buffer)
fs.writeFileSync(outPath, Buffer.concat([header, pcmBuf]))

const kb = ((fileSize + 8) / 1024).toFixed(1)
console.log(`✓ card-confirm.wav written (${kb} KB, ${DUR}s, 44100Hz mono 16-bit)`)
