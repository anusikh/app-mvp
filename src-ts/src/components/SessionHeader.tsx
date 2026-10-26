import type { SessionStatus } from '../types/chat';
import { StopCircleIcon } from './Icons';

type SessionHeaderProps = {
  status: SessionStatus;
  title: string;
  onStop: () => void;
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  connecting: 'Connecting',
  running: 'Running',
  stopped: 'Stopped',
  error: 'Error',
};

export function SessionHeader({ status, title, onStop }: SessionHeaderProps) {
  return (
    <section className='session-header'>
      <div className='session-heading'>
        <div className={`session-status status-${status}`}>
          <span className='status-dot' aria-hidden='true' />
          <span>{STATUS_LABELS[status]}</span>
        </div>
        <h1 className='session-title'>{title}</h1>
      </div>

      <button
        className='stop-button'
        disabled={status === 'stopped'}
        onClick={onStop}
        type='button'
      >
        <StopCircleIcon size={18} />
        <span>Stop Pi</span>
      </button>
    </section>
  );
}
