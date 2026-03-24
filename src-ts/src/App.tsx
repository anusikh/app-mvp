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

  // const callJsToCpp = async () => {
  //   const payload = JSON.stringify({ test: '123' });
  //   const res = await window?.testJsToCpp?.(payload);
  //   console.log(res);
  // };

  useEffect(() => {
    window.testCppToJs = (data: { output: string }) => {
      setText(data['output']);
    };

    return () => {
      window.testCppToJs = undefined;
    };
  }, []);

  return (
    <div>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
      <button onClick={sendAudioData}>transcribe</button>

      <p>{text}</p>
    </div>
  );
}

export default App;
