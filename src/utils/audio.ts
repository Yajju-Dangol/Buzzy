export async function convertWebmToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Decode the generic audio (webm, etc.) into an AudioBuffer
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Encode it as WAV
  const wavArrayBuffer = encodeWAV(audioBuffer);
  
  return new Blob([wavArrayBuffer], { type: 'audio/wav' });
}

function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let resultBuffer: Float32Array;
  if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    resultBuffer = new Float32Array(left.length * 2);
    for (let i = 0; i < left.length; i++) {
      resultBuffer[i * 2] = left[i];
      resultBuffer[i * 2 + 1] = right[i];
    }
  } else {
    resultBuffer = audioBuffer.getChannelData(0);
  }
  
  const buffer = new ArrayBuffer(44 + resultBuffer.length * 2);
  const view = new DataView(buffer);
  
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + resultBuffer.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, resultBuffer.length * 2, true);
  
  // Write the PCM samples
  let offset = 44;
  for (let i = 0; i < resultBuffer.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, resultBuffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
