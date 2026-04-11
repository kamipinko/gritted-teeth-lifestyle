/**
 * gen-camera-swoosh.js
 *
 * Generates an epic cinematic camera-swoosh WAV for the Gritted Teeth
 * muscle-selector screen. Layers:
 *   1. Sub thud   — deep 55 Hz sine, 150ms punchy hit
 *   2. Mid whoosh — bandpass-filtered noise sweeping 180→1400 Hz
 *   3. Shimmer    — high bandpass noise 2800→5500 Hz
 *   4. Tone sweep — sine sweeping 90→480 Hz, gives the "sci-fi rush"
 *
 * Duration: 0.72s (matches CameraRig SPEED=1.4 → ~0.71s travel time)
 * Output:   public/sounds/camera-swoosh.wav  (mono, 44100Hz, 16-bit PCM)
 */

const fs   = require('fs')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────────
const RATE = 44100
const DUR  = 0.72
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
const mid1  = new Biquad()
const mid2  = new Biquad()   // 2-pass for steeper bandpass
const hi1   = new Biquad()
const hi2   = new Biquad()

const raw = new Float32Array(N)

for (let i = 0; i < N; i++) {
  const t = i / RATE
  const p = t / DUR  // 0..1 through the sound

  // ── Envelope
  const ATTACK = 0.018
  const env = t < ATTACK
    ? t / ATTACK                       // 18ms linear attack
    : Math.exp(-(t - ATTACK) * 5.8)   // exponential decay

  // ── Layer 1: Sub thud (55 Hz sine, 150ms hard gate)
  const sub = Math.sin(2*Math.PI * 55 * t) * Math.exp(-t * 14) * 1.1

  // ── Layer 2: Tone sweep (90 → 480 Hz sine — the sci-fi rush)
  // Use instantaneous phase so the sweep is accurate
  const f0 = 90, f1 = 480
  const tonePh = 2*Math.PI * (f0*t + (f1-f0) * t*t / (2*DUR))
  const tone = Math.sin(tonePh) * 0.55

  // ── Layer 3: Mid bandpass noise sweep (180 → 1400 Hz)
  const mFreq  = 180 + 1220 * Math.pow(p, 0.55)
  const noise  = Math.random()*2 - 1
  // Two-pass bandpass for more punch
  const mid    = mid2.bandpass(mid1.bandpass(noise, mFreq, 1.4), mFreq, 1.4) * 5.5

  // ── Layer 4: High shimmer (2800 → 5500 Hz)
  const hFreq  = 2800 + 2700 * p
  const hiN    = Math.random()*2 - 1
  const hi     = hi2.bandpass(hi1.bandpass(hiN, hFreq, 1.8), hFreq, 1.8) * 8.0

  // ── Mix and apply envelope
  //    Sub: punchy at start, mid: main body, tone: cinematic sweep, hi: air
  raw[i] = env * (sub + tone + mid * 0.55 + hi * 0.28)
}

// ── Normalise to ~85% peak ───────────────────────────────────────────
let peak = 0
for (let i = 0; i < N; i++) if (Math.abs(raw[i]) > peak) peak = Math.abs(raw[i])
const gain = peak > 0 ? 0.85 / peak : 1

// ── Convert to 16-bit PCM ────────────────────────────────────────────
const pcm = new Int16Array(N)
for (let i = 0; i < N; i++) {
  pcm[i] = Math.round(Math.max(-1, Math.min(1, raw[i] * gain)) * 32767)
}

// ── Write WAV ────────────────────────────────────────────────────────
const dataSize   = N * 2
const fileSize   = 36 + dataSize
const header     = Buffer.alloc(44)

header.write('RIFF', 0)
header.writeUInt32LE(fileSize, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)          // PCM chunk size
header.writeUInt16LE(1, 20)           // PCM format
header.writeUInt16LE(1, 22)           // mono
header.writeUInt32LE(RATE, 24)        // sample rate
header.writeUInt32LE(RATE * 2, 28)   // byte rate
header.writeUInt16LE(2, 32)           // block align
header.writeUInt16LE(16, 34)          // bits per sample
header.write('data', 36)
header.writeUInt32LE(dataSize, 40)

const outPath = path.resolve(__dirname, '../public/sounds/camera-swoosh.wav')
const pcmBuf  = Buffer.from(pcm.buffer)
fs.writeFileSync(outPath, Buffer.concat([header, pcmBuf]))

const kb = ((fileSize + 8) / 1024).toFixed(1)
console.log(`✓ camera-swoosh.wav written (${kb} KB, ${DUR}s, 44100Hz mono 16-bit)`)
