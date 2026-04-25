// Generates public/sounds/explosion.wav
// Two phases: rocket build (0→0.18s) then burst + decay (0.18s→1.1s)
const fs = require('fs')
const path = require('path')

const SAMPLE_RATE = 44100
const DURATION = 1.1
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION)
const BURST_T = 0.18

const buf = new Float32Array(NUM_SAMPLES)

for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE
  const dt = t - BURST_T

  // --- Envelope ---
  const env = t < BURST_T
    ? 0.3 + (t / BURST_T) * 0.7           // linear ramp 0.3→1.0
    : Math.exp(-dt * 3.8)                  // burst decay

  // --- Layer 1: Rocket rumble sweep 28→95Hz ---
  const rumbleFreq = t < BURST_T
    ? 28 + (t / BURST_T) * (95 - 28)
    : 95 * Math.exp(-dt * 4)
  const rumblePhase = (i / SAMPLE_RATE) * 2 * Math.PI * (t < BURST_T ? (28 + rumbleFreq) / 2 : rumbleFreq)
  const layer1 = 1.6 * Math.sin(rumblePhase)

  // --- Layer 2: Burst thud 42Hz starting at BURST_T ---
  const layer2 = t >= BURST_T
    ? 2.0 * Math.sin(2 * Math.PI * 42 * dt) * Math.exp(-dt * 18)
    : 0

  // --- Layer 3: Rocket roar — white noise bandpass 120→900Hz ---
  const noise3 = (Math.random() * 2 - 1)
  const bpCenter3 = 120 + (t / DURATION) * (900 - 120)
  const q3 = 0.7
  const roarAmp = t < 0.5 ? 1.0 : 1.0 - ((t - 0.5) / 0.6) * 0.7
  // Simple resonant bandpass approximation: mix noise with sin at center freq
  const layer3 = 7.0 * roarAmp * (noise3 * 0.6 + Math.sin(2 * Math.PI * bpCenter3 * t) * 0.4)

  // --- Layer 4: Burst shimmer 2200→6000Hz ---
  const layer4 = t >= BURST_T
    ? (() => {
        const shimmerFreq = 2200 + (dt / (DURATION - BURST_T)) * (6000 - 2200)
        const noise4 = (Math.random() * 2 - 1)
        const shimmerEnv = Math.exp(-dt * 9)
        return 4.0 * shimmerEnv * (noise4 * 0.5 + Math.sin(2 * Math.PI * shimmerFreq * dt) * 0.5)
      })()
    : 0

  // --- Layer 5: Tone burst 55→320Hz whomp ---
  const toneFreq = 55 + (t / DURATION) * (320 - 55)
  const layer5 = 0.8 * Math.sin(2 * Math.PI * toneFreq * t)

  buf[i] = env * (layer1 + layer2 + layer3 + layer4 + layer5)
}

// Normalize to 90% peak
let peak = 0
for (let i = 0; i < NUM_SAMPLES; i++) peak = Math.max(peak, Math.abs(buf[i]))
const scale = (peak > 0) ? (0.9 / peak) : 1
for (let i = 0; i < NUM_SAMPLES; i++) buf[i] *= scale

// --- Write WAV ---
function writeWav(filepath, samples, sampleRate) {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const dataSize = samples.length * blockAlign
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const buffer = Buffer.alloc(totalSize)
  let offset = 0

  buffer.write('RIFF', offset); offset += 4
  buffer.writeUInt32LE(totalSize - 8, offset); offset += 4
  buffer.write('WAVE', offset); offset += 4
  buffer.write('fmt ', offset); offset += 4
  buffer.writeUInt32LE(16, offset); offset += 4
  buffer.writeUInt16LE(1, offset); offset += 2
  buffer.writeUInt16LE(numChannels, offset); offset += 2
  buffer.writeUInt32LE(sampleRate, offset); offset += 4
  buffer.writeUInt32LE(byteRate, offset); offset += 4
  buffer.writeUInt16LE(blockAlign, offset); offset += 2
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2
  buffer.write('data', offset); offset += 4
  buffer.writeUInt32LE(dataSize, offset); offset += 4

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(s * 32767), offset)
    offset += 2
  }

  fs.writeFileSync(filepath, buffer)
}

const outPath = path.join(__dirname, '..', 'public', 'sounds', 'explosion.wav')
writeWav(outPath, buf, SAMPLE_RATE)
console.log('explosion.wav written to', outPath)
