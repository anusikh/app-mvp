import { useCallback, useMemo, useState } from 'react';
import './App.css';
import { AppHeader } from './components/AppHeader';
import { Composer } from './components/Composer';
import { Conversation } from './components/Conversation';
import { DebugPanel } from './components/DebugPanel';
import { SessionHeader } from './components/SessionHeader';
import { getErrorMessage } from './helpers/errors';
import { getSessionTitle } from './helpers/session';
import { useMicRecorder } from './hooks/useMicRecorder';
import { usePiChat } from './hooks/usePiChat';

function App() {
  const {
    items,
    status,
    error,
    transcript,
    rawEvents,
    sendPrompt,
    abort,
    reportError,
    clearError,
    clearTranscript,
    setSendAfterTranscription,
  } = usePiChat();

  const { start, stop, sendAudioData, isRecording, isTranscribing } = useMicRecorder();

  const [input, setInput] = useState('');
  const [debugOpen, setDebugOpen] = useState(false);

  const title = useMemo(() => getSessionTitle(items), [items]);

  const handleSend = useCallback(
    async (message: string) => {
      try {
        clearError();
        await sendPrompt(message);
        setInput('');
      } catch (caughtError) {
        reportError(getErrorMessage(caughtError, 'Failed to send prompt.'));
      }
    },
    [clearError, reportError, sendPrompt]
  );

  const handleStartMic = useCallback(() => {
    clearError();
    void start().catch((caughtError) => {
      reportError(getErrorMessage(caughtError, 'Failed to start the microphone.'));
    });
  }, [clearError, reportError, start]);

  const handleStopMic = useCallback(() => {
    void stop().catch((caughtError) => {
      reportError(getErrorMessage(caughtError, 'Failed to stop the microphone.'));
    });
  }, [reportError, stop]);

  const handleTranscribe = useCallback(() => {
    clearError();
    setSendAfterTranscription(true);

    void sendAudioData().catch((caughtError) => {
      setSendAfterTranscription(false);
      reportError(getErrorMessage(caughtError, 'Failed to transcribe audio.'));
    });
  }, [clearError, reportError, sendAudioData, setSendAfterTranscription]);

  return (
    <div className='app-shell'>
      <AppHeader onOpenDebug={() => setDebugOpen(true)} />

      <SessionHeader onStop={() => void abort()} status={status} title={title} />

      <Conversation items={items} />

      <Composer
        error={error}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        onChange={setInput}
        onDismissError={clearError}
        onDismissTranscript={clearTranscript}
        onStartMic={handleStartMic}
        onStopMic={handleStopMic}
        onSubmit={handleSend}
        onTranscribe={handleTranscribe}
        transcript={transcript}
        value={input}
      />

      <DebugPanel events={rawEvents} onClose={() => setDebugOpen(false)} open={debugOpen} />
    </div>
  );
}

export default App;
