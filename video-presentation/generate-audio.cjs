// Trilha instrumental original, sintetizada localmente e sem amostras externas.
const fs = require('node:fs');
const path = require('node:path');

const rate = 44100;
const seconds = 82;
const samples = rate * seconds;
const data = Buffer.alloc(samples * 2);
const notes = [110, 164.81, 220, 293.66, 329.63, 440, 293.66, 220];

for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const beat = t * 2;
  const step = Math.floor(beat) % notes.length;
  const phase = beat % 1;
  const note = notes[step];
  const pluck = Math.sin(2 * Math.PI * note * t) * Math.exp(-phase * 5.6) * 0.16;
  const high = Math.sin(2 * Math.PI * note * 2 * t) * Math.exp(-phase * 9) * 0.035;
  const bass = Math.sin(2 * Math.PI * 55 * t) * (0.1 + 0.035 * Math.sin(2 * Math.PI * 0.13 * t));
  const kickPhase = (t * 2) % 2;
  const kick = Math.sin(2 * Math.PI * (58 + 80 * Math.exp(-kickPhase * 20)) * kickPhase) * Math.exp(-kickPhase * 18) * 0.16;
  const shimmer = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-((t * 4) % 4) * 12) * 0.01;
  const envelope = Math.min(1, t / 3, (seconds - t) / 4);
  const value = Math.max(-1, Math.min(1, (pluck + high + bass + kick + shimmer) * envelope));
  data.writeInt16LE(Math.round(value * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
fs.writeFileSync(path.join(__dirname, 'public', 'audio', 'trilha-original.wav'), Buffer.concat([header, data]));
