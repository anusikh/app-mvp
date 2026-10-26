import { useAutoScroll } from '../hooks/useAutoScroll';
import type { ConversationItem } from '../types/chat';
import { TerminalPromptIcon } from './Icons';
import { MessageRow } from './MessageRow';
import { ToolCallCard } from './ToolCallCard';

type ConversationProps = {
  items: ConversationItem[];
};

export function Conversation({ items }: ConversationProps) {
  const scrollRef = useAutoScroll<HTMLDivElement>(items);

  return (
    <section className='conversation' ref={scrollRef} aria-live='polite'>
      {items.length === 0 ? (
        <div className='empty-state'>
          <span className='empty-mark' aria-hidden='true'>
            <TerminalPromptIcon size={30} />
          </span>
          <h2>Start a conversation</h2>
          <p>Type a message or record your voice, then ask Pi.</p>
        </div>
      ) : (
        <div className='timeline'>
          {items.map((item) =>
            item.kind === 'tool' ? (
              <ToolCallCard key={item.id} tool={item} />
            ) : (
              <MessageRow key={item.id} message={item} />
            )
          )}
        </div>
      )}
    </section>
  );
}
