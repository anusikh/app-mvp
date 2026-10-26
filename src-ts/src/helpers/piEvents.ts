import type {
  ChatMessage,
  ConversationItem,
  MessageRole,
  SessionStatus,
  ToolCall,
} from '../types/chat';
import type { PiEvent } from '../types/pi';
import { createId } from './id';
import {
  buildToolLabel,
  isToolEndEvent,
  isToolStartEvent,
  resolveToolArgs,
  resolveToolCallId,
  resolveToolDuration,
  resolveToolError,
  resolveToolName,
} from './tools';

export type PiChatState = {
  items: ConversationItem[];
  status: SessionStatus;
  error: string;
};

export const initialPiChatState: PiChatState = {
  items: [],
  status: 'connecting',
  error: '',
};

export const createChatMessage = (role: MessageRole, content: string): ChatMessage => ({
  kind: 'message',
  id: createId('message'),
  role,
  content,
  createdAt: Date.now(),
});

const appendAssistantText = (items: ConversationItem[], delta: string) => {
  if (!delta) return items;

  const lastItem = items[items.length - 1];
  if (lastItem?.kind === 'message' && lastItem.role === 'assistant') {
    const nextItems = items.slice();
    nextItems[nextItems.length - 1] = { ...lastItem, content: lastItem.content + delta };
    return nextItems;
  }

  return [...items, createChatMessage('assistant', delta)];
};

const startTool = (items: ConversationItem[], event: PiEvent) => {
  const toolName = resolveToolName(event);
  if (!toolName) return items;

  const toolCallId = resolveToolCallId(event);
  const args = resolveToolArgs(event);
  const { label, detail } = buildToolLabel(toolName, args, event);

  if (toolCallId) {
    const existingIndex = items.findIndex(
      (item) => item.kind === 'tool' && item.toolCallId === toolCallId
    );

    if (existingIndex !== -1) {
      const existing = items[existingIndex] as ToolCall;
      const nextItems = items.slice();
      nextItems[existingIndex] = {
        ...existing,
        toolName,
        label: args !== undefined ? label : existing.label,
        detail: args !== undefined ? detail : existing.detail,
        status: 'running',
      };

      return nextItems;
    }
  }

  const tool: ToolCall = {
    kind: 'tool',
    id: createId('tool'),
    toolCallId,
    toolName,
    label,
    detail,
    status: 'running',
    startedAt: Date.now(),
  };

  return [...items, tool];
};

const finishTool = (items: ConversationItem[], event: PiEvent) => {
  const toolName = resolveToolName(event);
  const toolCallId = resolveToolCallId(event);
  const error = resolveToolError(event);
  const durationMs = resolveToolDuration(event);

  let matchIndex = -1;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.kind !== 'tool' || item.status !== 'running') continue;

    const matchesCallId = Boolean(toolCallId && item.toolCallId === toolCallId);
    const matchesName = Boolean(toolName && item.toolName === toolName);
    if (matchesCallId || matchesName || (!toolCallId && !toolName)) {
      matchIndex = index;
      break;
    }
  }

  if (matchIndex === -1) {
    if (!toolName) return items;

    const { label, detail } = buildToolLabel(toolName, resolveToolArgs(event), event);
    const finishedTool: ToolCall = {
      kind: 'tool',
      id: createId('tool'),
      toolCallId,
      toolName,
      label,
      detail,
      status: error ? 'error' : 'done',
      startedAt: Date.now(),
      durationMs,
    };

    return [...items, finishedTool];
  }

  const tool = items[matchIndex] as ToolCall;
  const nextItems = items.slice();
  nextItems[matchIndex] = {
    ...tool,
    status: error ? 'error' : 'done',
    durationMs: durationMs ?? Math.max(0, Date.now() - tool.startedAt),
  };

  return nextItems;
};

const normalizeStatus = (value: string | undefined, fallback: SessionStatus): SessionStatus => {
  if (!value) return fallback;

  const normalized = value.toLowerCase();
  if (normalized.includes('error') || normalized.includes('fail')) return 'error';
  if (
    normalized.includes('stop') ||
    normalized.includes('exit') ||
    normalized.includes('end') ||
    normalized.includes('complete') ||
    normalized.includes('idle') ||
    normalized.includes('ready')
  ) {
    return 'stopped';
  }
  if (
    normalized.includes('run') ||
    normalized.includes('start') ||
    normalized.includes('stream') ||
    normalized.includes('busy')
  ) {
    return 'running';
  }

  return fallback;
};

export const applyPiEvent = (state: PiChatState, event: PiEvent): PiChatState => {
  const type = event.type ?? '';

  switch (type) {
    case 'system': {
      const status = normalizeStatus(event.status, state.status);
      if (status === state.status) return state;
      return { ...state, status };
    }

    case 'system_error':
      return { ...state, status: 'error', error: event.error ?? 'Pi failed.' };

    case 'stderr':
    case 'raw':
      return state;

    case 'message_start':
      return state.status === 'running' ? state : { ...state, status: 'running' };

    case 'message_update': {
      const assistantEvent = event.assistantMessageEvent;
      const assistantType = assistantEvent?.type ?? '';

      if (isToolStartEvent(assistantType)) {
        return { ...state, items: startTool(state.items, event), status: 'running' };
      }

      if (isToolEndEvent(assistantType)) {
        return { ...state, items: finishTool(state.items, event), status: 'running' };
      }

      if (assistantType === 'text_delta') {
        return {
          ...state,
          items: appendAssistantText(state.items, assistantEvent?.delta ?? ''),
          status: 'running',
        };
      }

      if (assistantType === 'error') {
        return {
          ...state,
          error: assistantEvent?.error ?? event.error ?? 'Pi failed.',
          status: 'error',
        };
      }

      return { ...state, status: 'running' };
    }

    default: {
      if (isToolStartEvent(type)) {
        return { ...state, items: startTool(state.items, event), status: 'running' };
      }

      if (isToolEndEvent(type)) {
        return { ...state, items: finishTool(state.items, event), status: 'running' };
      }

      return state;
    }
  }
};
