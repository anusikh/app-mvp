import { useRef } from 'react';

export const useMicRecorder = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(48000); // 48000 is the default in browser

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    sampleRateRef.current = audioContext.sampleRate;

    await audioContext.audioWorklet.addModule('./audioProcessor.js');
    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

    workletNode.port.onmessage = (event) => {
      const data = event.data;
      chunksRef.current.push(data);
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    workletNodeRef.current = workletNode;
  };

  const stop = () => {
    audioContextRef.current?.close();
  };

  const mergeBuffers = (buffers: Float32Array[]) => {
    const total = buffers.reduce((sum, b) => sum + b.length, 0);
    const result = new Float32Array(total);

    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }

    return result;
  };

  const downSample = (
    buffer: Float32Array,
    inputRate: number,
    targetRate: number = 16000
  ): Float32Array => {
    if (inputRate === targetRate) return buffer;

    const ratio = inputRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);

      let sum = 0;
      let count = 0;

      for (let j = start; j < end && j < buffer.length; j++) {
        sum += buffer[j];
        count++;
      }

      result[i] = sum / count;
    }

    return result;
  };

  const sendAudioData = async () => {
    const merged = mergeBuffers(chunksRef.current);
    const downsampled = downSample(merged, sampleRateRef.current, 16000);
    chunksRef.current = [];

    console.log(downsampled.buffer);

    const base64 = btoa(String.fromCharCode(...new Uint8Array(downsampled.buffer)));
    await window.stt?.(base64);
  };

  return { start, stop, sendAudioData };
};
