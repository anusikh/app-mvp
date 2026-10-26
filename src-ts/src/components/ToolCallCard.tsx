import type { ReactNode } from 'react';
import { formatToolDuration } from '../helpers/tools';
import type { ToolCall } from '../types/chat';
import { EditIcon, FileIcon, GlobeIcon, SearchIcon, TerminalPromptIcon, ToolIcon } from './Icons';

type ToolCallCardProps = {
  tool: ToolCall;
};

const STATUS_LABELS: Record<ToolCall['status'], string> = {
  pending: 'queued',
  running: 'running',
  done: 'done',
  error: 'failed',
};

const getToolIcon = (toolName: string): ReactNode => {
  const name = toolName.toLowerCase();

  if (name === 'bash' || name === 'shell') return <TerminalPromptIcon size={17} />;
  if (name === 'grep' || name === 'glob' || name === 'find') return <SearchIcon size={17} />;
  if (name === 'edit' || name === 'write' || name === 'apply_patch') return <EditIcon size={17} />;
  if (name === 'web_fetch' || name === 'fetch') return <GlobeIcon size={17} />;
  if (name === 'read' || name === 'view') return <FileIcon size={17} />;

  return <ToolIcon size={17} />;
};

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const duration = formatToolDuration(tool.durationMs);

  return (
    <div
      className={`tool-card tool-${tool.status}`}
      title={duration ? `Tool duration: ${duration}` : undefined}
    >
      <span className='tool-card-icon'>{getToolIcon(tool.toolName)}</span>

      <div className='tool-card-copy'>
        <span className='tool-card-label'>{tool.label}</span>
        {tool.detail && <span className='tool-card-detail'>{tool.detail}</span>}
      </div>

      <span className='tool-card-status'>{STATUS_LABELS[tool.status]}</span>
    </div>
  );
}
