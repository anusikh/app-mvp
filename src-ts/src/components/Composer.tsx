import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea';
import { AudioWaveIcon, MicIcon, SendIcon } from './Icons';

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => Promise<void>;
  error: string;
  transcript: string;
  isRecording: boolean;
  isTranscribing: boolean;
  onStartMic: () => void;
  onStopMic: () => void;
  onTranscribe: () => void;
  onDismissError: () => void;
  onDismissTranscript: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  error,
  transcript,
  isRecording,
  isTranscribing,
  onStartMic,
  onStopMic,
  onTranscribe,
  onDismissError,
  onDismissTranscript,
}: ComposerProps) {
  const textareaRef = useAutoResizeTextarea(value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;

    event.preventDefault();
    void handleSubmit();
  };

  return (
    <div className='composer-wrap'>
      {error && (
        <div className='notice notice-error' role='alert'>
          <span>{error}</span>
          <button aria-label='Dismiss error' onClick={onDismissError} type='button'>
            Dismiss
          </button>
        </div>
      )}

      {transcript && (
        <div className='notice notice-transcript'>
          <span>
            <strong>Heard:</strong> {transcript}
          </span>
          <button aria-label='Dismiss transcript' onClick={onDismissTranscript} type='button'>
            Dismiss
          </button>
        </div>
      )}

      <form className='composer' onSubmit={handleFormSubmit}>
        <div className='composer-box'>
          <textarea
            ref={textareaRef}
            aria-label='Ask Pi to make a change'
            className='composer-input'
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask Pi to make a change...'
            rows={1}
            value={value}
          />

          <div className='composer-toolbar'>
            <div className='composer-actions'>
              <button
                aria-pressed={isRecording}
                className={`composer-tool${isRecording ? ' is-recording' : ''}`}
                onClick={isRecording ? onStopMic : onStartMic}
                title={isRecording ? 'Stop microphone' : 'Start microphone'}
                type='button'
              >
                <MicIcon size={16} />
                <span>{isRecording ? 'Stop mic' : 'Start mic'}</span>
              </button>

              <button
                className='composer-tool'
                disabled={isTranscribing}
                onClick={onTranscribe}
                title='Transcribe recorded audio and ask Pi'
                type='button'
              >
                <AudioWaveIcon size={16} />
                <span>{isTranscribing ? 'Transcribing...' : 'Transcribe + ask'}</span>
              </button>

              <button
                aria-label='Send message'
                className='send-button'
                disabled={!value.trim() || isSubmitting}
                type='submit'
              >
                <SendIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className='composer-hints'>
          <span>Enter to send</span>
          <span>Shift + Enter for new line</span>
        </div>
      </form>
    </div>
  );
}
