import type { ConversationItem } from '../types/chat';

const MAX_TITLE_LENGTH = 68;
const NEW_SESSION_TITLE = 'New session';

export const getSessionTitle = (items: ConversationItem[]) => {
  const firstUserMessage = items.find((item) => item.kind === 'message' && item.role === 'user');

  if (!firstUserMessage || firstUserMessage.kind !== 'message') return NEW_SESSION_TITLE;

  const title = firstUserMessage.content.replace(/\s+/g, ' ').trim();
  if (title.length <= MAX_TITLE_LENGTH) return title;

  return `${title.slice(0, MAX_TITLE_LENGTH - 3)}...`;
};
