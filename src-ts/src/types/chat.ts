export type MessageRole = 'user' | 'assistant' | 'system';

export type SessionStatus = 'connecting' | 'running' | 'stopped' | 'error';

export type ChatMessage = {
  kind: 'message';
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
};

export type ToolCallStatus = 'pending' | 'running' | 'done' | 'error';

export type ToolCall = {
  kind: 'tool';
  id: string;
  toolCallId?: string;
  toolName: string;
  label: string;
  detail?: string;
  status: ToolCallStatus;
  startedAt: number;
  durationMs?: number;
};

export type ConversationItem = ChatMessage | ToolCall;
