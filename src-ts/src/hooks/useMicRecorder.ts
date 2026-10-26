import { useCallback, useRef, useState } from 'react';
import { arrayBufferToBase64, downSample, mergeBuffers } from '../helpers/audio';

const DEFAULT_SAMPLE_RATE = 48000;

export const useMicRecorder = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(DEFAULT_SAMPLE_RATE);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const start = useCallback(async () => {
    if (audioContextRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    sampleRateRef.current = audioContext.sampleRate;

    try {
      await audioContext.audioWorklet.addModule('./audioProcessor.js');
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        chunksRef.current.push(event.data);
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      streamRef.current = stream;
      sourceNodeRef.current = source;
      workletNodeRef.current = workletNode;
      audioContextRef.current = audioContext;
      setIsRecording(true);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      await audioContext.close();
      throw error;
    }
  }, []);

  const stop = useCallback(async () => {
    workletNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    const audioContext = audioContextRef.current;

    audioContextRef.current = null;
    streamRef.current = null;
    sourceNodeRef.current = null;
    workletNodeRef.current = null;
    setIsRecording(false);

    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }, []);

  const sendAudioData = useCallback(async () => {
    if (!window.stt) {
      throw new Error('Speech-to-text bridge is unavailable.');
    }

    if (chunksRef.current.length === 0) {
      throw new Error('No recorded audio available to transcribe.');
    }

    const merged = mergeBuffers(chunksRef.current);
    if (merged.length === 0) {
      chunksRef.current = [];
      throw new Error('Recorded audio was empty.');
    }

    const downsampled = downSample(merged, sampleRateRef.current, 16000);
    chunksRef.current = [];
    const base64 = arrayBufferToBase64(downsampled.buffer);

    setIsTranscribing(true);
    try {
      await window.stt(base64);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return { start, stop, sendAudioData, isRecording, isTranscribing };
};
