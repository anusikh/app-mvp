import { useCallback, useEffect, useRef, useState } from 'react';
import { createChatMessage, initialPiChatState, applyPiEvent } from '../helpers/piEvents';
import { getErrorMessage } from '../helpers/errors';
import type { PiEvent } from '../types/pi';

export const usePiChat = () => {
  const [chatState, setChatState] = useState(initialPiChatState);
  const [transcript, setTranscript] = useState('');
  const [rawEvents, setRawEvents] = useState<string[]>([]);
  const askPiAfterTranscriptionRef = useRef(false);

  const reportError = useCallback((message: string) => {
    setChatState((current) => ({ ...current, error: message }));
  }, []);

  const clearError = useCallback(() => {
    setChatState((current) => (current.error ? { ...current, error: '' } : current));
  }, []);

  const clearTranscript = useCallback(() => setTranscript(''), []);

  const setSendAfterTranscription = useCallback((value: boolean) => {
    askPiAfterTranscriptionRef.current = value;
  }, []);

  const sendPrompt = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!window.piPrompt) throw new Error('Pi bridge is unavailable.');

    setChatState((current) => ({
      ...current,
      items: [...current.items, createChatMessage('user', trimmed)],
      status: 'running',
      error: '',
    }));

    await window.piPrompt(trimmed);
  }, []);

  const handleTranscript = useCallback(
    (data: { output: string }) => {
      const transcribedMessage = data.output ?? '';
      setTranscript(transcribedMessage);
      clearError();

      if (!askPiAfterTranscriptionRef.current) return;
      askPiAfterTranscriptionRef.current = false;

      void sendPrompt(transcribedMessage).catch((caughtError) => {
        reportError(getErrorMessage(caughtError, 'Failed to send prompt.'));
      });
    },
    [clearError, reportError, sendPrompt]
  );

  const handlePiEvent = useCallback((event: PiEvent) => {
    console.log('[pi event]', event);
    setRawEvents((current) => [...current.slice(-199), JSON.stringify(event)]);
    setChatState((current) => applyPiEvent(current, event));
  }, []);

  const abort = useCallback(async () => {
    try {
      await window.piAbort?.();
      setChatState((current) => ({ ...current, status: 'stopped' }));
    } catch (caughtError) {
      setChatState((current) => ({
        ...current,
        status: 'error',
        error: getErrorMessage(caughtError, 'Failed to stop Pi.'),
      }));
    }
  }, []);

  useEffect(() => {
    window.testCppToJs = handleTranscript;
    window.onPiEvent = handlePiEvent;

    return () => {
      window.testCppToJs = undefined;
      window.onPiEvent = undefined;
    };
  }, [handlePiEvent, handleTranscript]);

  return {
    items: chatState.items,
    status: chatState.status,
    error: chatState.error,
    transcript,
    rawEvents,
    sendPrompt,
    abort,
    reportError,
    clearError,
    clearTranscript,
    setSendAfterTranscription,
  };
};
