export type PiAssistantEvent = {
  type?: string;
  delta?: string;
  toolName?: string;
  toolCallId?: string;
  id?: string;
  toolCall?: {
    id?: string;
    name?: string;
    arguments?: unknown;
  };
  args?: unknown;
  input?: unknown;
  title?: string;
  error?: string;
  durationMs?: number;
};

export type PiEvent = {
  type?: string;
  line?: string;
  status?: string;
  error?: string;
  message?: string;
  title?: string;
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
  input?: unknown;
  isError?: boolean;
  durationMs?: number;
  assistantMessageEvent?: PiAssistantEvent;
};

declare global {
  interface Window {
    testCppToJs?: (data: { output: string }) => void;
    onPiEvent?: (event: PiEvent) => void;
    testJsToCpp?: (data: unknown) => Promise<unknown>;
    stt?: (data: unknown) => Promise<unknown>;
    piPrompt?: (message: string) => Promise<unknown>;
    piAbort?: () => Promise<unknown>;
  }
}
