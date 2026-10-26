import type { ChatMessage } from '../types/chat';
import { MarkdownMessage } from './MarkdownMessage';

type MessageRowProps = {
  message: ChatMessage;
};

const META_LABELS: Record<ChatMessage['role'], string> = {
  user: 'YOU',
  assistant: 'PI',
  system: 'SYS',
};

export function MessageRow({ message }: MessageRowProps) {
  return (
    <article className={`message-row message-${message.role}`}>
      <div className='message-meta'>
        {message.role === 'assistant' && (
          <span className='message-meta-prompt' aria-hidden='true'>
            &gt;_
          </span>
        )}
        <span>{META_LABELS[message.role]}</span>
      </div>

      <div className='message-content'>
        <MarkdownMessage content={message.content} />
      </div>
    </article>
  );
}
