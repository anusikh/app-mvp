import { useEffect, useState } from 'react';
import './App.css';
import { useMicRecorder } from './hooks/useMicRecorder';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type PiEvent = {
  type?: string;
  line?: string;
  status?: string;
  error?: string;
  assistantMessageEvent?: {
    type?: string;
    delta?: string;
    toolName?: string;
  };
};

declare global {
  interface Window {
    testCppToJs?: (data: { output: string }) => void;
    onPiEvent?: (event: PiEvent) => void;
    testJsToCpp?: (data: unknown) => Promise<unknown>;
    stt?: (data: unknown) => Promise<unknown>;
    piPrompt?: (message: string) => Promise<unknown>;
    piAbort?: () => Promise<unknown>;
  }
}

function App() {
  const { start, stop, sendAudioData } = useMicRecorder();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [rawEvents, setRawEvents] = useState<string[]>([]);

  const sendPrompt = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!window.piPrompt) throw new Error('Pi bridge is unavailable.');

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setInput('');
    await window.piPrompt(trimmed);
  };

  useEffect(() => {
    window.testCppToJs = (data: { output: string }) => {
      setTranscript(data.output);
      setError('');
    };

    window.onPiEvent = (event: PiEvent) => {
      const raw = JSON.stringify(event);
      console.log('[pi event]', event);
      setRawEvents((current) => [...current.slice(-199), raw]);

      if (event.type === 'system') {
        setMessages((current) => [
          ...current,
          { role: 'system', content: `pi ${event.status ?? ''}`.trim() },
        ]);
        return;
      }

      if (event.type === 'system_error') {
        setError(event.error ?? 'Pi failed.');
        return;
      }

      if (event.type === 'stderr' || event.type === 'raw') {
        console.debug('pi:', event.line);
        return;
      }

      if (event.type === 'message_start') {
        return;
      }

      if (event.type !== 'message_update') return;

      const assistantEvent = event.assistantMessageEvent;
      if (assistantEvent?.type === 'text_delta') {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];

          if (!last || last.role !== 'assistant') {
            next.push({ role: 'assistant', content: assistantEvent.delta ?? '' });
          } else {
            next[next.length - 1] = {
              ...last,
              content: last.content + (assistantEvent.delta ?? ''),
            };
          }

          return next;
        });
      }
    };

    return () => {
      window.testCppToJs = undefined;
      window.onPiEvent = undefined;
    };
  }, []);

  return (
    <div>
      <div>
        {messages.map((message, index) => (
          <p key={index}>
            <b>{message.role}: </b>
            {message.content}
          </p>
        ))}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            setError('');
            await sendPrompt(input);
          } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Failed to send prompt.');
          }
        }}
      >
        <input value={input} onChange={(event) => setInput(event.target.value)} />
        <button type="submit">send</button>
        <button type="button" onClick={() => window.piAbort?.()}>
          stop pi
        </button>
      </form>

      <button onClick={start}>start mic</button>
      <button onClick={stop}>stop mic</button>
      <button
        onClick={async () => {
          try {
            setError('');
            await sendAudioData();
          } catch (caughtError) {
            setError(
              caughtError instanceof Error ? caughtError.message : 'Failed to transcribe audio.'
            );
          }
        }}
      >
        transcribe + ask pi
      </button>

      {transcript && <p>transcript: {transcript}</p>}
      {error && <p>{error}</p>}

      <details open style={{ marginTop: 16 }}>
        <summary>Raw Pi JSON events ({rawEvents.length})</summary>
        <pre
          style={{
            maxHeight: 260,
            overflow: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            background: '#111',
            color: '#0f0',
            padding: 8,
            fontSize: 11,
          }}
        >
          {rawEvents.join('\n')}
        </pre>
      </details>
    </div>
  );
}

export default App;
