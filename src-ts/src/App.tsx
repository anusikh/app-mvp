import { useEffect, useState } from 'react';
import './App.css';
import { useMicRecorder } from './hooks/useMicRecorder';

declare global {
  interface Window {
    testCppToJs?: (data: { output: string }) => void;
    testJsToCpp?: (data: unknown) => Promise<unknown>;
    stt?: (data: unknown) => Promise<unknown>;
  }
}

function App() {
  const { start, stop, sendAudioData } = useMicRecorder();
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string>('');

  // const callJsToCpp = async () => {
  //   const payload = JSON.stringify({ test: '123' });
  //   const res = await window?.testJsToCpp?.(payload);
  //   console.log(res);
  // };

  useEffect(() => {
    window.testCppToJs = (data: { output: string }) => {
      setText(data['output']);
      setError('');
    };

    return () => {
      window.testCppToJs = undefined;
    };
  }, []);

  return (
    <div>
      <button
        onClick={async () => {
          try {
            setError('');
            await start();
          } catch (caughtError) {
            setError(
              caughtError instanceof Error ? caughtError.message : 'Failed to start microphone.'
            );
          }
        }}
      >
        start
      </button>
      <button
        onClick={() => {
          setError('');
          stop();
        }}
      >
        stop
      </button>
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
        transcribe
      </button>

      <p>{text}</p>
      <p>{error}</p>
    </div>
  );
}

export default App;
