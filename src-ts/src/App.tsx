import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { MarkdownMessage } from './components/MarkdownMessage';
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
  const askPiAfterTranscriptionRef = useRef(false);

  const sendPrompt = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!window.piPrompt) throw new Error('Pi bridge is unavailable.');

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setInput('');
    await window.piPrompt(trimmed);
  }, []);

  useEffect(() => {
    window.testCppToJs = (data: { output: string }) => {
      const transcribedMessage = data.output ?? '';
      setTranscript(transcribedMessage);
      setError('');

      if (!askPiAfterTranscriptionRef.current) return;
      askPiAfterTranscriptionRef.current = false;

      void sendPrompt(transcribedMessage).catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to send prompt.');
      });
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
  }, [sendPrompt]);

  const hasMessages = messages.length > 0;

  return (
    <main className='chat-shell'>
      <section className='chat-card' aria-label='Pi chat'>
        <header className='chat-header'>
          <div>
            <p className='eyebrow'>voice chat</p>
            <h1>Talk with Pi</h1>
          </div>
          <button className='button button-ghost' type='button' onClick={() => window.piAbort?.()}>
            Stop Pi
          </button>
        </header>

        <div className='chat-messages' aria-live='polite'>
          {!hasMessages && (
            <div className='empty-state'>
              <span className='empty-icon' aria-hidden='true'>
                ✦
              </span>
              <h2>Start a conversation</h2>
              <p>Type a message or record your voice, then ask Pi.</p>
            </div>
          )}

          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`message message-${message.role}`}>
              <div className='message-meta'>{message.role}</div>
              <div className='message-bubble'>
                <MarkdownMessage content={message.content} />
              </div>
            </article>
          ))}
        </div>

        {error && <p className='status status-error'>{error}</p>}
        {transcript && <p className='status status-transcript'>Transcript: {transcript}</p>}

        <form
          className='composer'
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              setError('');
              await sendPrompt(input);
            } catch (caughtError) {
              setError(
                caughtError instanceof Error ? caughtError.message : 'Failed to send prompt.'
              );
            }
          }}
        >
          <input
            className='composer-input'
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Message Pi...'
            aria-label='Message Pi'
          />
          <button className='button button-primary' type='submit' disabled={!input.trim()}>
            Send
          </button>
        </form>

        <div className='voice-controls' aria-label='Voice controls'>
          <button className='button button-secondary' type='button' onClick={start}>
            Start mic
          </button>
          <button className='button button-secondary' type='button' onClick={stop}>
            Stop mic
          </button>
          <button
            className='button button-accent'
            type='button'
            onClick={async () => {
              try {
                setError('');
                askPiAfterTranscriptionRef.current = true;
                await sendAudioData();
              } catch (caughtError) {
                askPiAfterTranscriptionRef.current = false;
                setError(
                  caughtError instanceof Error ? caughtError.message : 'Failed to transcribe audio.'
                );
              }
            }}
          >
            Transcribe + ask Pi
          </button>
        </div>
      </section>

      <details className='debug-panel'>
        <summary>Raw Pi JSON events ({rawEvents.length})</summary>
        <pre>{rawEvents.join('\n')}</pre>
      </details>
    </main>
  );
}

export default App;
