const fs   = require('fs')
const path = require('path')

const RATE      = 44100
const DUR       = 0.92
const N         = Math.floor(RATE * DUR)
const SLASH_END = 0.32
const SLASH_N   = Math.floor(RATE * SLASH_END)

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
      sinw/2, 0, -sinw/2,
      1+alpha, -2*cosw, 1-alpha
    )
  }
}

// Slash phase filters
const slash1a = new Biquad()
const slash1b = new Biquad()
// Impact crack filters
const crack1a = new Biquad()
const crack1b = new Biquad()
// Reverb shimmer filters
const shim1a  = new Biquad()
const shim1b  = new Biquad()

const raw = new Float32Array(N)

for (let i = 0; i < N; i++) {
  const t = i / RATE

  let sample = 0

  if (t < SLASH_END) {
    // ── PHASE 1: SLASH ──────────────────────────────────────────────
    const p = t / SLASH_END  // 0..1 through slash phase

    // Layer 1 — Slash noise sweep (blade cutting air)
    const slashFreq = 600 + (9500 - 600) * Math.pow(p, 0.6)
    const noise     = Math.random()*2 - 1
    const slashNoise = slash1b.bandpass(slash1a.bandpass(noise, slashFreq, 1.4), slashFreq, 1.4) * 8.0

    // Layer 2 — Tone cut (musical pitch element)
    const f0 = 180, f1 = 2400
    const tonePh = 2*Math.PI * (f0*t + (f1-f0) * t*t / (2*SLASH_END))
    const slashTone = Math.sin(tonePh) * 0.6

    // Slash envelope: linear ramp 0→1 over slash phase
    const slashEnv = p

    sample = (slashNoise + slashTone) * slashEnv

  } else {
    // ── PHASE 2: IMPACT ─────────────────────────────────────────────
    const dt = t - SLASH_END

    // Layer 3 — Sub thud (floor shaking)
    const sub = Math.sin(2*Math.PI * 48 * t) * Math.exp(-dt * 16) * 2.2

    // Layer 4 — Impact crack (very short)
    const crackFreq = 1800 + (5500 - 1800) * Math.min(dt / 0.04, 1)
    const crackN    = Math.random()*2 - 1
    const crack     = crack1b.bandpass(crack1a.bandpass(crackN, crackFreq, 1.5), crackFreq, 1.5)
                      * Math.exp(-dt * 22) * 6.0

    // Layer 5 — Reverb shimmer tail (room ringing)
    const shimFreq  = 3200 + (6800 - 3200) * Math.min(dt / 0.1, 1)
    const shimN     = Math.random()*2 - 1
    const shimmer   = shim1b.bandpass(shim1a.bandpass(shimN, shimFreq, 1.8), shimFreq, 1.8)
                      * Math.exp(-dt * 5.5) * 2.8

    // Impact envelope: full at hit, decays
    const impactEnv = Math.exp(-dt * 4.2)

    sample = (sub + crack + shimmer) * impactEnv
  }

  raw[i] = sample
}

// Normalize to 88% peak
let peak = 0
for (let i = 0; i < N; i++) if (Math.abs(raw[i]) > peak) peak = Math.abs(raw[i])
const gain = peak > 0 ? 0.88 / peak : 1

const pcm = new Int16Array(N)
for (let i = 0; i < N; i++) {
  pcm[i] = Math.round(Math.max(-1, Math.min(1, raw[i] * gain)) * 32767)
}

const dataSize = N * 2
const fileSize = 36 + dataSize
const header   = Buffer.alloc(44)

header.write('RIFF', 0)
header.writeUInt32LE(fileSize, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(1, 22)
header.writeUInt32LE(RATE, 24)
header.writeUInt32LE(RATE * 2, 28)
header.writeUInt16LE(2, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(dataSize, 40)

const outPath = path.resolve(__dirname, '../public/sounds/mega-transition.wav')
fs.writeFileSync(outPath, Buffer.concat([header, Buffer.from(pcm.buffer)]))

const kb = ((fileSize + 8) / 1024).toFixed(1)
console.log(`✓ mega-transition.wav written (${kb} KB, ${DUR}s, 44100Hz mono 16-bit)`)
