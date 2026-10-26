const BASE64_CHUNK_SIZE = 0x8000;
const TARGET_SAMPLE_RATE = 16000;

export const arrayBufferToBase64 = (buffer: ArrayBufferLike) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

export const mergeBuffers = (buffers: Float32Array[]) => {
  const total = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const result = new Float32Array(total);

  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }

  return result;
};

export const downSample = (
  buffer: Float32Array,
  inputRate: number,
  targetRate: number = TARGET_SAMPLE_RATE
): Float32Array => {
  if (inputRate === targetRate) return buffer;

  const ratio = inputRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let index = 0; index < newLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.floor((index + 1) * ratio);

    let sum = 0;
    let count = 0;

    for (let sample = start; sample < end && sample < buffer.length; sample += 1) {
      sum += buffer[sample];
      count += 1;
    }

    result[index] = sum / count;
  }

  return result;
};
