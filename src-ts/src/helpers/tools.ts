import type { PiEvent } from '../types/pi';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return undefined;
};

const compactPath = (path?: string) => {
  if (!path) return undefined;

  const normalized = path.replace(/^\.\//, '');
  if (normalized.length <= 56) return normalized;

  const segments = normalized.split('/').filter(Boolean);
  return `.../${segments.slice(-2).join('/')}`;
};

export type ToolLabel = {
  label: string;
  detail?: string;
};

export const buildToolLabel = (toolName: string, args: unknown, event: PiEvent): ToolLabel => {
  const name = toolName.toLowerCase();
  const argsRecord = asRecord(args);
  const eventRecord = asRecord(event);

  const path = compactPath(
    firstString(
      argsRecord?.path,
      argsRecord?.file_path,
      argsRecord?.file,
      argsRecord?.filename,
      eventRecord?.title,
      eventRecord?.message
    )
  );
  const command = firstString(argsRecord?.command, argsRecord?.cmd);
  const pattern = firstString(argsRecord?.pattern, argsRecord?.query, argsRecord?.search);
  const url = firstString(argsRecord?.url, argsRecord?.href);

  switch (name) {
    case 'read':
    case 'view':
      return { label: path ? `Reading ${path}` : 'Reading file' };
    case 'write':
    case 'edit':
    case 'apply_patch':
      return { label: path ? `Editing ${path}` : 'Editing file' };
    case 'bash':
    case 'shell':
      return { label: 'Running command', detail: command ?? path };
    case 'grep':
    case 'glob':
    case 'find':
      return { label: pattern ? `Searching ${pattern}` : 'Searching files', detail: path };
    case 'web_fetch':
    case 'fetch':
      return { label: url ? `Fetching ${url}` : 'Fetching page' };
    default:
      return {
        label: `Using ${toolName}`,
        detail: firstString(argsRecord?.description, argsRecord?.query, eventRecord?.message),
      };
  }
};

export const formatToolDuration = (durationMs?: number) => {
  if (!durationMs || durationMs < 0) return '';
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
};

const TOOL_START_PATTERN = /(tool|function).*(start|call|use)|(start|call|use).*(tool|function)/i;
const TOOL_END_PATTERN =
  /(execution|result).*(end|complete|finish|error|fail)|(end|complete|finish|error|fail).*(execution|result)/i;

export const isToolStartEvent = (type: string) =>
  TOOL_START_PATTERN.test(type) && !TOOL_END_PATTERN.test(type);

export const isToolEndEvent = (type: string) =>
  /(tool|function)/i.test(type) && TOOL_END_PATTERN.test(type);

export const resolveToolName = (event: PiEvent) =>
  firstString(
    event.assistantMessageEvent?.toolName,
    event.assistantMessageEvent?.toolCall?.name,
    event.toolName
  );

export const resolveToolCallId = (event: PiEvent) =>
  firstString(
    event.assistantMessageEvent?.toolCallId,
    event.assistantMessageEvent?.id,
    event.assistantMessageEvent?.toolCall?.id,
    event.toolCallId
  );

export const resolveToolArgs = (event: PiEvent) =>
  event.assistantMessageEvent?.args ??
  event.assistantMessageEvent?.input ??
  event.assistantMessageEvent?.toolCall?.arguments ??
  event.args ??
  event.input;

export const resolveToolError = (event: PiEvent) =>
  firstString(event.assistantMessageEvent?.error, event.error) ??
  (event.isError ? 'Tool execution failed' : undefined);

export const resolveToolDuration = (event: PiEvent) =>
  event.assistantMessageEvent?.durationMs ?? event.durationMs;
