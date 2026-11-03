const fs = require('fs');
const path = require('path');

function createWavHeader(numSamples, sampleRate = 44100, numChannels = 1) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * 2, 28);
  buffer.writeUInt16LE(numChannels * 2, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  return buffer;
}

function writeWav(filePath, samples, sampleRate = 44100) {
  const header = createWavHeader(samples.length, sampleRate);
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.floor(s < 0 ? s * 32768 : s * 32767), i * 2);
  }
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
  console.log(`Generated: ${filePath} (${samples.length} samples, ${(samples.length / sampleRate * 1000).toFixed(1)}ms)`);
}

const outDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sampleRate = 44100;

// 1. click-switch.wav: clique seco de switch mecânico tátil (1800Hz decaindo em 45ms com ruído de impacto)
{
  const durationSec = 0.045;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 95);
    const impact = (Math.random() * 2 - 1) * Math.exp(-t * 260);
    const tone = Math.sin(2 * Math.PI * 1800 * t);
    const subBody = Math.sin(2 * Math.PI * 340 * t) * 0.4;
    samples[i] = (tone * 0.5 + impact * 0.4 + subBody) * env;
  }
  writeWav(path.join(outDir, 'click-switch.wav'), samples);
}

// 2. whoosh-air.wav: varredura de ar pressurizado / vácuo (ruído branco filtrado com curva exponencial de volume em 220ms)
{
  const durationSec = 0.22;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples; // 0 to 1
    const env = Math.sin(t * Math.PI) * Math.pow(Math.sin(t * Math.PI), 0.7);
    const noise = (Math.random() * 2 - 1);
    const sweep = Math.sin(2 * Math.PI * (160 + 520 * t) * (i / sampleRate));
    samples[i] = (noise * 0.65 + sweep * 0.35) * env * 0.85;
  }
  writeWav(path.join(outDir, 'whoosh-air.wav'), samples);
}

// 3. mouse-tap.wav: clique mecânico nítido de mouse corporativo (3200Hz, transiente rápido de 25ms)
{
  const durationSec = 0.025;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 180);
    const transient = (Math.random() * 2 - 1) * Math.exp(-t * 400);
    const highClick = Math.sin(2 * Math.PI * 3200 * t) * 0.7;
    const punch = Math.sin(2 * Math.PI * 240 * t) * 0.3;
    samples[i] = (highClick + transient + punch) * env * 0.9;
  }
  writeWav(path.join(outDir, 'mouse-tap.wav'), samples);
}

// 4. sub-bass-drop.wav: grave 808 cinematográfico profundo (inicia em 90Hz, desce para 38Hz com decaimento de 800ms)
{
  const durationSec = 0.8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 38 + (90 - 38) * Math.exp(-t * 5.5);
    const env = Math.exp(-t * 2.8);
    // Adiciona harmônico quente sutil (segundo harmônico)
    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const warmHarmonic = Math.sin(4 * Math.PI * freq * t) * 0.22;
    samples[i] = (fundamental + warmHarmonic) * env * 0.95;
  }
  writeWav(path.join(outDir, 'sub-bass-drop.wav'), samples);
}

// 5. notification-chime.wav: pop/sino sutil de interface moderno (880Hz e 1760Hz com envelope suave de 150ms)
{
  const durationSec = 0.15;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 22);
    const tone1 = Math.sin(2 * Math.PI * 880 * t) * 0.6;
    const tone2 = Math.sin(2 * Math.PI * 1760 * t) * 0.4;
    samples[i] = (tone1 + tone2) * env * 0.85;
  }
  writeWav(path.join(outDir, 'notification-chime.wav'), samples);
}

// 6. ambient-tech-loop.wav: textura harmônica minimalista contínua em tom azul escuro para trilha de fundo (15.5s)
{
  const durationSec = 15.5;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  const beatLen = 0.5; // 120 BPM pulse

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let masterEnv = 1;
    if (t < 0.4) masterEnv = t / 0.4;
    if (t > 14.8) masterEnv = Math.max(0, (15.5 - t) / 0.7);

    // Drone profundo em Ré menor (D1 = 36.7Hz, A1 = 55.0Hz, D2 = 73.4Hz, F2 = 87.3Hz)
    const d1 = Math.sin(2 * Math.PI * 36.7 * t) * 0.35;
    const a1 = Math.sin(2 * Math.PI * 55.0 * t) * 0.25;
    const d2 = Math.sin(2 * Math.PI * 73.4 * t + 0.3) * 0.2;
    const f2 = Math.sin(2 * Math.PI * 87.3 * t + 0.6) * 0.15;
    const shimmer = Math.sin(2 * Math.PI * (146.8 + Math.sin(t * 1.8) * 3) * t) * 0.08;
    const chord = (d1 + a1 + d2 + f2 + shimmer) * 0.7;

    // Pulso tátil de sidechain a cada 0.5s
    const beatPhase = (t % beatLen) / beatLen;
    const kickEnv = Math.exp(-beatPhase * 18);
    const kickFreq = 110 * Math.exp(-beatPhase * 26) + 40;
    const pulse = Math.sin(2 * Math.PI * kickFreq * (beatPhase * beatLen)) * kickEnv * 0.45;

    // Arpejo estéreo cristalino sutil
    const arpNotes = [293.66, 349.23, 440.0, 523.25]; // D4, F4, A4, C5
    const arpIndex = Math.floor(t * 4) % arpNotes.length;
    const arpPhase = (t % 0.25) / 0.25;
    const arpEnv = Math.exp(-arpPhase * 12);
    const arp = Math.sin(2 * Math.PI * arpNotes[arpIndex] * t) * arpEnv * 0.12;

    const mix = (chord + pulse + arp) * masterEnv * 0.65;
    samples[i] = Math.max(-1, Math.min(1, mix));
  }
  writeWav(path.join(outDir, 'ambient-tech-loop.wav'), samples);
}

console.log('All 6 sound assets successfully generated in public/sounds/!');

