import { useEffect } from 'react';

type DebugPanelProps = {
  open: boolean;
  events: string[];
  onClose: () => void;
};

export function DebugPanel({ open, events, onClose }: DebugPanelProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className='debug-overlay' onClick={onClose} role='presentation'>
      <aside
        aria-labelledby='debug-title'
        aria-modal='true'
        className='debug-panel'
        onClick={(event) => event.stopPropagation()}
        role='dialog'
      >
        <header className='debug-header'>
          <div>
            <span className='debug-kicker'>Diagnostics</span>
            <h2 id='debug-title'>Raw Pi events</h2>
          </div>
          <button className='debug-close' onClick={onClose} type='button'>
            Close
          </button>
        </header>

        <pre className='debug-output'>
          {events.length > 0 ? events.join('\n') : 'No events yet.'}
        </pre>
      </aside>
    </div>
  );
}
